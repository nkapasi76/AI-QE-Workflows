#!/usr/bin/env ts-node
/**
 * sync-results-to-testrail.ts
 *
 * Syncs Jest/Vitest test results back to TestRail.
 * Parses test output files and adds results to a TestRail run.
 *
 * Usage:
 *   npx ts-node sync-results-to-testrail.ts --run-id 789 --results-file jest-json
 *   npx ts-node sync-results-to-testrail.ts --run-id 789 --results-file junit-xml --format junit
 *
 * Environment Variables:
 *   TESTRAIL_URL      - TestRail instance URL
 *   TESTRAIL_USER     - TestRail username
 *   TESTRAIL_API_KEY  - TestRail API key
 */

import * as fs from 'fs';
import * as path from 'path';
import { createTestRailClient, AddResultPayload } from './testrail-client';

// ============================================================================
// Types
// ============================================================================

interface SyncOptions {
  runId: number;
  resultsFile: string;
  format: 'jest' | 'junit';
  dryRun?: boolean;
  skipUnmapped?: boolean;
}

interface TestResult {
  caseId: number;
  status: 'passed' | 'failed' | 'blocked' | 'retest' | 'skipped';
  elapsed?: string;
  comment?: string;
  defects?: string;
}

interface JestResult {
  testResults: Array<{
    assertionResults: Array<{
      ancestorTitles: string[];
      title: string;
      status: 'passed' | 'failed' | 'pending' | 'skipped';
      duration?: number;
      failureMessages?: string[];
    }>;
    name: string;
  }>;
}

// ============================================================================
// Status Mapping
// ============================================================================

const STATUS_MAP: Record<string, number> = {
  passed: 1,
  blocked: 2,
  // untested: 3, // Not valid for adding results
  retest: 4,
  failed: 5,
  skipped: 4, // Map skipped to retest
  pending: 4, // Map pending to retest
};

const PROJECT_ROOT = path.resolve(__dirname, '../../../../');
const RESULTS_FILE_MAP: Record<string, string> = {
  'jest-json': path.resolve(PROJECT_ROOT, 'results.json'),
  'junit-xml': path.resolve(PROJECT_ROOT, 'junit.xml'),
};
const MAX_CLI_ARGS = 20;
const MAX_RESULTS_FILE_BYTES = 5 * 1024 * 1024;
const MAX_PARSED_TEST_CASES = 5000;

function ensureWithinProjectRoot(resolvedPath: string, label: string): void {
  const normalizedRoot = PROJECT_ROOT.endsWith(path.sep)
    ? PROJECT_ROOT
    : `${PROJECT_ROOT}${path.sep}`;
  if (resolvedPath !== PROJECT_ROOT && !resolvedPath.startsWith(normalizedRoot)) {
    throw new Error(`${label} must be within the repository root.`);
  }
}

function resolveResultsFileSelection(selection: string): string {
  const key = selection.trim().toLowerCase();
  if (!key) {
    throw new Error('Results file selector is required.');
  }

  const selectedPath = RESULTS_FILE_MAP[key];
  if (!selectedPath) {
    throw new Error(
      `Invalid --results-file value '${selection}'. Allowed values: ${Object.keys(RESULTS_FILE_MAP).join(', ')}`,
    );
  }

  ensureWithinProjectRoot(selectedPath, 'Results file path');

  if (!fs.existsSync(selectedPath)) {
    throw new Error(`Results file not found at expected location: ${selectedPath}`);
  }

  const fileStats = fs.statSync(selectedPath);
  if (fileStats.size > MAX_RESULTS_FILE_BYTES) {
    throw new Error(
      `Results file is too large (${fileStats.size} bytes). Maximum allowed is ${MAX_RESULTS_FILE_BYTES} bytes.`,
    );
  }

  const realPath = fs.realpathSync(selectedPath);
  ensureWithinProjectRoot(realPath, 'Results file path');

  return realPath;
}

// ============================================================================
// Parsers
// ============================================================================

function extractCaseIdFromTitle(title: string): number | null {
  // Match C12345 pattern
  const match = title.match(/\bC(\d{4,})\b/);
  if (match) {
    return parseInt(match[1], 10);
  }

  // Match case_id: 12345 pattern
  const idMatch = title.match(/case[_-]?id[:\s]+(\d{4,})/i);
  if (idMatch) {
    return parseInt(idMatch[1], 10);
  }

  return null;
}

function parseJestResults(content: string): TestResult[] {
  const results: TestResult[] = [];
  const json: JestResult = JSON.parse(content);
  let parsedAssertions = 0;

  for (const testFile of json.testResults) {
    for (const assertion of testFile.assertionResults) {
      if (parsedAssertions >= MAX_PARSED_TEST_CASES) {
        return results;
      }
      parsedAssertions++;

      // Combine ancestor titles with test title
      const fullTitle = [...assertion.ancestorTitles, assertion.title].join(' > ');

      const caseId = extractCaseIdFromTitle(fullTitle);
      if (!caseId) {
        // console.warn(`No case ID found in: ${fullTitle}`);
        continue;
      }

      let comment = '';
      if (assertion.failureMessages?.length) {
        comment = assertion.failureMessages.slice(0, 3).join('\n\n').substring(0, 4000);
      }

      let elapsed: string | undefined;
      if (assertion.duration) {
        const seconds = Math.round(assertion.duration / 1000);
        if (seconds >= 60) {
          elapsed = `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        } else {
          elapsed = `${seconds}s`;
        }
      }

      results.push({
        caseId,
        status: assertion.status as any,
        elapsed,
        comment: comment || undefined,
      });
    }
  }

  return results;
}

function parseJUnitResults(content: string): TestResult[] {
  const results: TestResult[] = [];

  // Simple XML parsing for JUnit format
  // For production, consider using a proper XML parser
  const testCasePattern =
    /<testcase[^>]*name="([^"]*)"[^>]*time="([^"]*)"[^>]*>([\s\S]*?)<\/testcase>/g;
  const failurePattern = /<failure[^>]*>([\s\S]*?)<\/failure>/;
  const skippedPattern = /<skipped/;
  let parsedCases = 0;

  let match;
  while ((match = testCasePattern.exec(content)) !== null) {
    if (parsedCases >= MAX_PARSED_TEST_CASES) {
      break;
    }
    parsedCases++;

    const [, name, time, body] = match;

    const caseId = extractCaseIdFromTitle(name);
    if (!caseId) continue;

    let status: TestResult['status'] = 'passed';
    let comment: string | undefined;

    const failureMatch = body.match(failurePattern);
    if (failureMatch) {
      status = 'failed';
      comment = failureMatch[1].substring(0, 4000);
    } else if (skippedPattern.test(body)) {
      status = 'skipped';
    }

    const seconds = parseFloat(time);
    let elapsed: string | undefined;
    if (seconds >= 60) {
      elapsed = `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    } else if (seconds >= 1) {
      elapsed = `${Math.round(seconds)}s`;
    }

    results.push({
      caseId,
      status,
      elapsed,
      comment,
    });
  }

  return results;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.length > MAX_CLI_ARGS) {
    console.error(`Error: Too many CLI arguments. Maximum allowed is ${MAX_CLI_ARGS}.`);
    process.exit(1);
  }

  const args = rawArgs;
  const options: SyncOptions = {
    runId: 0,
    resultsFile: '',
    format: 'jest',
    dryRun: false,
    skipUnmapped: true,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--run-id':
        options.runId = parseInt(args[++i], 10);
        break;
      case '--results-file':
        options.resultsFile = args[++i];
        break;
      case '--format':
        options.format = args[++i] as 'jest' | 'junit';
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--include-unmapped':
        options.skipUnmapped = false;
        break;
      case '--help':
        console.log(`
Usage: sync-results-to-testrail.ts [options]

Options:
  --run-id <id>           TestRail run ID to add results to (required)
  --results-file <value>  Results file selector: jest-json, junit-xml (required)
  --format <type>         Results format: jest, junit (default: jest)
  --dry-run               Print what would be synced without submitting
  --include-unmapped      Fail if tests without case IDs are found
  --help                  Show this help

Examples:
  # Sync Jest JSON results
  npx jest --json --outputFile=results.json
  npx ts-node sync-results-to-testrail.ts --run-id 789 --results-file jest-json

  # Sync JUnit XML results
  npx ts-node sync-results-to-testrail.ts --run-id 789 --results-file junit-xml --format junit
`);
        process.exit(0);
    }
  }

  if (!options.runId) {
    console.error('Error: --run-id is required');
    process.exit(1);
  }

  if (!options.resultsFile) {
    console.error('Error: --results-file is required');
    process.exit(1);
  }

  let safeResultsFilePath = '';
  try {
    safeResultsFilePath = resolveResultsFileSelection(options.resultsFile);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  const content = fs.readFileSync(safeResultsFilePath, 'utf-8');

  console.log(`Parsing ${options.format} results from: ${safeResultsFilePath}`);

  let testResults: TestResult[];
  switch (options.format) {
    case 'junit':
      testResults = parseJUnitResults(content);
      break;
    default:
      testResults = parseJestResults(content);
  }

  console.log(`Found ${testResults.length} test results with case IDs.`);

  if (!testResults.length) {
    console.log(
      'No results to sync. Ensure test names include case IDs (e.g., "C12345: test name")',
    );
    process.exit(0);
  }

  // Group by status for summary
  const byStatus = testResults.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log('\nResults summary:');
  for (const [status, count] of Object.entries(byStatus)) {
    console.log(`  ${status}: ${count}`);
  }
  console.log('');

  if (options.dryRun) {
    console.log('Dry run - would sync the following results:');
    for (const result of testResults.slice(0, 20)) {
      console.log(
        `  C${result.caseId}: ${result.status}${result.elapsed ? ` (${result.elapsed})` : ''}`,
      );
    }
    if (testResults.length > 20) {
      console.log(`  ... and ${testResults.length - 20} more`);
    }
    process.exit(0);
  }

  const client = createTestRailClient();

  // Verify run exists
  console.log(`Verifying run ${options.runId}...`);
  const run = await client.getRun(options.runId);
  console.log(`Adding results to run: "${run.name}"`);

  // Build bulk results payload
  const bulkResults = testResults.map((result) => ({
    case_id: result.caseId,
    status_id: STATUS_MAP[result.status] || 4,
    comment: result.comment,
    elapsed: result.elapsed,
    defects: result.defects,
  }));

  // Submit in batches of 50
  const batchSize = 50;
  let submitted = 0;

  for (let i = 0; i < bulkResults.length; i += batchSize) {
    const batch = bulkResults.slice(i, i + batchSize);
    console.log(
      `Submitting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(bulkResults.length / batchSize)}...`,
    );

    try {
      await client.addResultsForCases(options.runId, batch as any);
      submitted += batch.length;
    } catch (error: any) {
      console.error(`Error submitting batch: ${error.message}`);
      if (error.response?.data) {
        console.error('Details:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }

  console.log(`\nSuccessfully submitted ${submitted}/${testResults.length} results.`);
  console.log(`View run: ${run.url}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
