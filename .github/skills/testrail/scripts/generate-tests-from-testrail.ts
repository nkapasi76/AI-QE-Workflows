#!/usr/bin/env ts-node
/**
 * generate-tests-from-testrail.ts
 *
 * Generates Jest test scaffolds from TestRail test cases.
 * Uses test case titles, preconditions, steps, and expected results
 * to create well-structured test files.
 *
 * Usage:
 *   npx ts-node generate-tests-from-testrail.ts --project-id 3 --suite-id 42 --output tests/integration
 *   npx ts-node generate-tests-from-testrail.ts --case-ids 12345,12346 --output tests/specific
 *
 * Environment Variables:
 *   TESTRAIL_URL      - TestRail instance URL
 *   TESTRAIL_USER     - TestRail username
 *   TESTRAIL_API_KEY  - TestRail API key
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  createTestRailClient,
  TestRailCase,
  TestRailSection,
  TestRailStep,
} from './testrail-client';

// ============================================================================
// Types
// ============================================================================

interface GenerateOptions {
  projectId?: number;
  suiteId?: number;
  sectionId?: number;
  caseIds?: number[];
  output: string;
  template?: 'jest' | 'jest-openapi' | 'vitest';
  dryRun?: boolean;
  overwrite?: boolean;
}

interface SectionWithCases {
  section: TestRailSection;
  cases: TestRailCase[];
}

const PROJECT_ROOT = path.resolve(__dirname, '../../../../');
const GENERATED_TESTS_BASE_DIR = path.resolve(PROJECT_ROOT, 'tests/generated');
const MAX_CLI_ARGS = 32;
const MAX_CASE_IDS = 200;

function ensureWithinProjectRoot(resolvedPath: string, label: string): void {
  const normalizedRoot = PROJECT_ROOT.endsWith(path.sep)
    ? PROJECT_ROOT
    : `${PROJECT_ROOT}${path.sep}`;
  if (resolvedPath !== PROJECT_ROOT && !resolvedPath.startsWith(normalizedRoot)) {
    throw new Error(`${label} must be within the repository root.`);
  }
}

function resolveSafeOutputDirectory(outputArg: string): string {
  const rawValue = outputArg.trim();
  if (!rawValue) {
    throw new Error('Output directory value is required.');
  }

  if (rawValue.includes('/') || rawValue.includes('\\')) {
    throw new Error('Output must be a directory name only (no path separators).');
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(rawValue)) {
    throw new Error('Output directory contains invalid characters.');
  }

  const outputDirectory = path.join(GENERATED_TESTS_BASE_DIR, path.basename(rawValue));
  ensureWithinProjectRoot(outputDirectory, 'Output directory');
  return outputDirectory;
}

function parseCaseIds(inputValue: string): number[] {
  const parsedIds = inputValue
    .split(',')
    .map((id: string) => parseInt(id.trim(), 10))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (!parsedIds.length) {
    throw new Error('No valid case IDs were provided.');
  }

  if (parsedIds.length > MAX_CASE_IDS) {
    throw new Error(`Too many case IDs provided. Maximum allowed is ${MAX_CASE_IDS}.`);
  }

  return parsedIds;
}

// ============================================================================
// Helpers
// ============================================================================

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

function sanitizeTestName(name: string): string {
  // Escape single quotes and special characters for test names
  return name.replace(/'/g, "\\'").replace(/\\/g, '\\\\');
}

function formatStepsAsComments(steps: TestRailStep[]): string {
  return steps
    .map((step, i) => {
      const lines = [`    // Step ${i + 1}: ${step.content.replace(/\n/g, ' ')}`];
      if (step.expected) {
        lines.push(`    // Expected: ${step.expected.replace(/\n/g, ' ')}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');
}

function formatPreconditions(preconds: string | undefined): string {
  if (!preconds) return '';
  const lines = preconds.split('\n').map((line) => `  // ${line}`);
  return `  // Preconditions:\n${lines.join('\n')}\n`;
}

// ============================================================================
// Test Generation Templates
// ============================================================================

function generateJestTest(testCase: TestRailCase): string {
  const caseId = testCase.id;
  const title = sanitizeTestName(testCase.title);
  const refs = testCase.refs ? ` (${testCase.refs})` : '';

  let testBody = '';

  // Add preconditions as comments
  if (testCase.custom_preconds) {
    testBody += formatPreconditions(testCase.custom_preconds);
    testBody += '\n';
  }

  // Add steps as comments
  if (testCase.custom_steps_separated?.length) {
    testBody += formatStepsAsComments(testCase.custom_steps_separated);
    testBody += '\n\n';
  } else if (testCase.custom_steps) {
    testBody += `    // Steps:\n`;
    testBody += testCase.custom_steps
      .split('\n')
      .map((l) => `    // ${l}`)
      .join('\n');
    testBody += '\n\n';
  }

  // Add expected result
  if (testCase.custom_expected) {
    testBody += `    // Expected Result:\n`;
    testBody += testCase.custom_expected
      .split('\n')
      .map((l) => `    // ${l}`)
      .join('\n');
    testBody += '\n\n';
  }

  testBody += `    // TODO: Implement test logic\n`;
  testBody += `    expect(true).toBe(true); // Placeholder\n`;

  return `  /**
   * TestRail Case: C${caseId}${refs}
   * @see https://sessionm.testrail.com/index.php?/cases/view/${caseId}
   */
  it('C${caseId}: ${title}', async () => {
${testBody}  });`;
}

function generateJestOpenApiTest(testCase: TestRailCase): string {
  const caseId = testCase.id;
  const title = sanitizeTestName(testCase.title);
  const refs = testCase.refs ? ` (${testCase.refs})` : '';

  let testBody = '';

  if (testCase.custom_preconds) {
    testBody += formatPreconditions(testCase.custom_preconds);
    testBody += '\n';
  }

  if (testCase.custom_steps_separated?.length) {
    testBody += formatStepsAsComments(testCase.custom_steps_separated);
    testBody += '\n\n';
  }

  testBody += `    // TODO: Implement API call\n`;
  testBody += `    const response = await api.get('/endpoint');\n\n`;
  testBody += `    expect(response.status).toBe(200);\n`;
  testBody += `    expect(response).toSatisfyApiSpec();\n`;

  return `  /**
   * TestRail Case: C${caseId}${refs}
   * @see https://sessionm.testrail.com/index.php?/cases/view/${caseId}
   */
  it('C${caseId}: ${title}', async () => {
${testBody}  });`;
}

// ============================================================================
// File Generation
// ============================================================================

function generateTestFile(
  sectionName: string,
  cases: TestRailCase[],
  template: 'jest' | 'jest-openapi' | 'vitest',
): string {
  const testGenerator = template === 'jest-openapi' ? generateJestOpenApiTest : generateJestTest;

  const tests = cases.map(testGenerator).join('\n\n');

  const imports =
    template === 'jest-openapi'
      ? `import jestOpenAPI from 'jest-openapi';
import { api } from '@lib/api';

// Load OpenAPI spec
// jestOpenAPI(path.join(__dirname, '../openapi.yaml'));
`
      : '';

  return `/**
 * ${sectionName}
 * 
 * Auto-generated from TestRail test cases.
 * Generated: ${new Date().toISOString()}
 * 
 * Cases: ${cases.map((c) => `C${c.id}`).join(', ')}
 */

${imports}describe('${sanitizeTestName(sectionName)}', () => {
  beforeAll(async () => {
    // Setup
  });

  afterAll(async () => {
    // Teardown
  });

${tests}
});
`;
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
  const options: GenerateOptions = {
    output: 'generated',
    template: 'jest',
    dryRun: false,
    overwrite: false,
  };
  let outputDirectoryPath = '';

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--project-id':
        options.projectId = parseInt(args[++i], 10);
        break;
      case '--suite-id':
        options.suiteId = parseInt(args[++i], 10);
        break;
      case '--section-id':
        options.sectionId = parseInt(args[++i], 10);
        break;
      case '--case-ids':
        options.caseIds = parseCaseIds(args[++i]);
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--template':
        options.template = args[++i] as 'jest' | 'jest-openapi' | 'vitest';
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--overwrite':
        options.overwrite = true;
        break;
      case '--help':
        console.log(`
Usage: generate-tests-from-testrail.ts [options]

Options:
  --project-id <id>     TestRail project ID (required unless --case-ids)
  --suite-id <id>       TestRail suite ID
  --section-id <id>     TestRail section ID (filter)
  --case-ids <ids>      Comma-separated list of case IDs
  --output <name>       Output subdirectory name under tests/generated (default: generated)
  --template <type>     Template: jest, jest-openapi, vitest (default: jest)
  --dry-run             Print what would be generated without writing
  --overwrite           Overwrite existing files
  --help                Show this help
`);
        process.exit(0);
    }
  }

  if (!options.projectId && !options.caseIds?.length) {
    console.error('Error: Either --project-id or --case-ids is required');
    process.exit(1);
  }

  try {
    outputDirectoryPath = resolveSafeOutputDirectory(options.output);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  const client = createTestRailClient();

  console.log('Fetching test cases from TestRail...');

  let cases: TestRailCase[] = [];
  let sections: TestRailSection[] = [];

  if (options.caseIds?.length) {
    // Fetch specific cases
    for (const id of options.caseIds) {
      const tc = await client.getCase(id);
      cases.push(tc);
    }
    // Create a pseudo-section for these cases
    sections = [{ id: 0, name: 'Selected Cases', suite_id: 0, depth: 0, display_order: 0 }];
  } else if (options.projectId) {
    // Fetch all cases from project/suite
    cases = await client.getAllCases(options.projectId, options.suiteId);

    if (options.sectionId) {
      cases = cases.filter((c) => c.section_id === options.sectionId);
    }

    if (options.suiteId) {
      sections = await client.getSections(options.projectId, options.suiteId);
    }
  }

  if (!cases.length) {
    console.log('No test cases found.');
    process.exit(0);
  }

  console.log(`Found ${cases.length} test cases in ${sections.length || 1} sections.`);

  // Group cases by section
  const sectionMap = new Map<number, SectionWithCases>();

  for (const section of sections) {
    sectionMap.set(section.id, { section, cases: [] });
  }

  // Add a default section for ungrouped cases
  if (!sectionMap.has(0)) {
    sectionMap.set(0, {
      section: { id: 0, name: 'General', suite_id: 0, depth: 0, display_order: 0 },
      cases: [],
    });
  }

  for (const tc of cases) {
    const sectionData = sectionMap.get(tc.section_id) || sectionMap.get(0)!;
    sectionData.cases.push(tc);
  }

  // Create output directory
  if (!options.dryRun) {
    fs.mkdirSync(outputDirectoryPath, { recursive: true });
  }

  // Generate files
  for (const [sectionId, { section, cases: sectionCases }] of sectionMap) {
    if (!sectionCases.length) continue;

    const filename = `${sanitizeFilename(section.name)}.test.ts`;
    const filepath = path.join(outputDirectoryPath, filename);
    const content = generateTestFile(section.name, sectionCases, options.template!);

    if (options.dryRun) {
      console.log(`\n--- Would create: ${filepath} ---`);
      console.log(content.substring(0, 500) + (content.length > 500 ? '\n...' : ''));
    } else {
      if (fs.existsSync(filepath) && !options.overwrite) {
        console.log(`Skipping existing file: ${filepath}`);
        continue;
      }
      fs.writeFileSync(filepath, content);
      console.log(`Created: ${filepath} (${sectionCases.length} tests)`);
    }
  }

  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
