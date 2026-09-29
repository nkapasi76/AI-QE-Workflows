#!/usr/bin/env ts-node
/**
 * analyze-coverage.ts
 *
 * Compares TestRail test cases against existing automated test files
 * to identify coverage gaps and generate reports.
 *
 * Matching strategies:
 * 1. Case ID references: Looks for C12345 patterns in test files
 * 2. Title matching: Fuzzy matches test case titles to describe/it blocks
 * 3. Section mapping: Maps TestRail sections to test directories
 *
 * Usage:
 *   npx ts-node analyze-coverage.ts --project-id 3 --suite-id 42 --test-dir tests-integration
 *   npx ts-node analyze-coverage.ts --project-id 3 --suite-id 42 --test-dir tests --format json
 *
 * Environment Variables:
 *   TESTRAIL_URL      - TestRail instance URL
 *   TESTRAIL_USER     - TestRail username
 *   TESTRAIL_API_KEY  - TestRail API key
 */

import * as fs from 'fs';
import * as path from 'path';
import { createTestRailClient, TestRailSection } from './testrail-client';

// ============================================================================
// Types
// ============================================================================

interface AnalyzeOptions {
  projectId: number;
  suiteId?: number;
  testDir: string;
  format?: 'text' | 'json' | 'markdown';
  output?: string;
  includeManual?: boolean;
}

interface CoverageResult {
  projectId: number;
  suiteId?: number;
  testDirectory: string;
  analyzedAt: string;
  summary: {
    totalCases: number;
    automatedCases: number;
    mappedCases: number;
    unmappedCases: number;
    coveragePercent: number;
  };
  mappedCases: MappedCase[];
  unmappedCases: UnmappedCase[];
  testFilesWithoutMapping: string[];
}

interface MappedCase {
  caseId: number;
  title: string;
  section: string;
  testFile: string;
  matchType: 'case-id' | 'title' | 'section';
  matchConfidence: number;
}

interface UnmappedCase {
  caseId: number;
  title: string;
  section: string;
  priority: string;
  type: string;
  refs?: string;
}

interface TestFileInfo {
  path: string;
  content: string;
  caseIds: number[];
  testNames: string[];
}

// ============================================================================
// Helpers
// ============================================================================

const PRIORITY_MAP: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Critical',
};

const TYPE_MAP: Record<number, string> = {
  1: 'Acceptance',
  2: 'Accessibility',
  3: 'Automated',
  4: 'Compatibility',
  5: 'Destructive',
  6: 'Functional',
  7: 'Other',
  8: 'Performance',
  9: 'Regression',
  10: 'Security',
  11: 'Smoke & Sanity',
  12: 'Usability',
};

const PROJECT_ROOT = path.resolve(__dirname, '../../../../');
const REPORTS_DIR = path.resolve(PROJECT_ROOT, 'reports');
const TEST_DIRECTORY_MAP: Record<string, string> = {
  tests: path.resolve(PROJECT_ROOT, 'tests'),
  'tests-ai': path.resolve(PROJECT_ROOT, 'tests-ai'),
  'tests-client': path.resolve(PROJECT_ROOT, 'tests-client'),
  'tests-integration': path.resolve(PROJECT_ROOT, 'tests/integration'),
  'tests-triggers': path.resolve(PROJECT_ROOT, 'tests/triggers'),
  'tests-smoke': path.resolve(PROJECT_ROOT, 'tests/smoke'),
};

function ensureWithinProjectRoot(resolvedPath: string, label: string): void {
  const normalizedRoot = PROJECT_ROOT.endsWith(path.sep)
    ? PROJECT_ROOT
    : `${PROJECT_ROOT}${path.sep}`;
  if (resolvedPath !== PROJECT_ROOT && !resolvedPath.startsWith(normalizedRoot)) {
    throw new Error(`${label} must be within the repository root.`);
  }
}

function resolveTestDirectorySelection(inputValue: string): string {
  const key = inputValue.trim().toLowerCase();
  if (!key) {
    throw new Error('Test directory selector is required.');
  }

  const selectedDirectory = TEST_DIRECTORY_MAP[key];
  if (!selectedDirectory) {
    throw new Error(
      `Invalid --test-dir value '${inputValue}'. Allowed values: ${Object.keys(TEST_DIRECTORY_MAP).join(', ')}`,
    );
  }

  const realPath = fs.realpathSync(selectedDirectory);
  ensureWithinProjectRoot(realPath, 'Test directory');

  if (!fs.statSync(realPath).isDirectory()) {
    throw new Error(`Configured test directory is not a directory: ${selectedDirectory}`);
  }

  return realPath;
}

function getDefaultOutputExtension(format: AnalyzeOptions['format']): 'txt' | 'json' | 'md' {
  switch (format) {
    case 'json':
      return 'json';
    case 'markdown':
      return 'md';
    default:
      return 'txt';
  }
}

function resolveSafeOutputPath(outputArg: string, format: AnalyzeOptions['format']): string {
  const rawValue = outputArg.trim();
  if (!rawValue) {
    throw new Error('Output file name is required.');
  }

  if (rawValue.includes('/') || rawValue.includes('\\')) {
    throw new Error('Output must be a file name only (no directory separators).');
  }

  const safeName = path.basename(rawValue);
  if (!/^[a-zA-Z0-9._-]+$/.test(safeName)) {
    throw new Error('Output file name contains invalid characters.');
  }

  const extension = path.extname(safeName).toLowerCase();
  const hasAllowedExtension = ['.txt', '.json', '.md'].includes(extension);
  const finalFileName = hasAllowedExtension
    ? safeName
    : `${safeName}.${getDefaultOutputExtension(format)}`;

  return path.join(REPORTS_DIR, finalFileName);
}

function findTestFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and hidden directories
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      findTestFiles(fullPath, files);
    } else if (entry.isFile()) {
      // Match test file patterns
      if (/\.(test|spec)\.(ts|js|tsx|jsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function extractCaseIds(content: string): number[] {
  const caseIds: number[] = [];

  // Pattern 1: C12345 in comments or test names
  const cPattern = /\bC(\d{4,})\b/g;
  let match;
  while ((match = cPattern.exec(content)) !== null) {
    caseIds.push(parseInt(match[1], 10));
  }

  // Pattern 2: case_id: 12345 or caseId: 12345
  const idPattern = /case[_-]?id[:\s]+(\d{4,})/gi;
  while ((match = idPattern.exec(content)) !== null) {
    caseIds.push(parseInt(match[1], 10));
  }

  // Pattern 3: TestRail URL
  const urlPattern = /testrail\.com\/.*cases\/view\/(\d+)/g;
  while ((match = urlPattern.exec(content)) !== null) {
    caseIds.push(parseInt(match[1], 10));
  }

  return [...new Set(caseIds)]; // Deduplicate
}

function extractTestNames(content: string): string[] {
  const names: string[] = [];

  // Match describe() and it() blocks
  const patterns = [
    /describe\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /it\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /test\s*\(\s*['"`]([^'"`]+)['"`]/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      names.push(match[1]);
    }
  }

  return names;
}

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateSimilarity(a: string, b: string): number {
  const aNorm = normalizeForComparison(a);
  const bNorm = normalizeForComparison(b);

  if (aNorm === bNorm) return 1.0;

  // Check for substring containment
  if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) {
    return 0.8;
  }

  // Check word overlap
  const aWords = new Set(aNorm.split(' '));
  const bWords = new Set(bNorm.split(' '));

  let overlap = 0;
  for (const word of aWords) {
    if (bWords.has(word) && word.length > 2) overlap++;
  }

  const similarity = (2 * overlap) / (aWords.size + bWords.size);
  return similarity;
}

// ============================================================================
// Coverage Analysis
// ============================================================================

async function analyzeCoverage(options: AnalyzeOptions): Promise<CoverageResult> {
  const client = createTestRailClient();

  console.log('Fetching TestRail data...');

  // Fetch cases and sections
  const cases = await client.getAllCases(options.projectId, options.suiteId);
  const sections = options.suiteId
    ? await client.getSections(options.projectId, options.suiteId)
    : [];

  const sectionMap = new Map<number, TestRailSection>();
  for (const section of sections) {
    sectionMap.set(section.id, section);
  }

  console.log(`Found ${cases.length} test cases.`);

  // Find and parse test files
  console.log(`Scanning test directory: ${options.testDir}`);
  const testFiles = findTestFiles(options.testDir);
  console.log(`Found ${testFiles.length} test files.`);

  const testFileInfos: TestFileInfo[] = testFiles.map((filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    return {
      path: filePath,
      content,
      caseIds: extractCaseIds(content),
      testNames: extractTestNames(content),
    };
  });

  // Build mapping
  const mappedCases: MappedCase[] = [];
  const unmappedCases: UnmappedCase[] = [];
  const mappedCaseIds = new Set<number>();

  for (const testCase of cases) {
    const sectionName = sectionMap.get(testCase.section_id)?.name || 'Unknown';
    let matched = false;

    // Strategy 1: Exact case ID match
    for (const fileInfo of testFileInfos) {
      if (fileInfo.caseIds.includes(testCase.id)) {
        mappedCases.push({
          caseId: testCase.id,
          title: testCase.title,
          section: sectionName,
          testFile: path.relative(options.testDir, fileInfo.path),
          matchType: 'case-id',
          matchConfidence: 1.0,
        });
        mappedCaseIds.add(testCase.id);
        matched = true;
        break;
      }
    }

    if (matched) continue;

    // Strategy 2: Title similarity matching
    let bestMatch: { file: string; similarity: number } | null = null;

    for (const fileInfo of testFileInfos) {
      for (const testName of fileInfo.testNames) {
        const similarity = calculateSimilarity(testCase.title, testName);
        if (similarity > 0.6 && (!bestMatch || similarity > bestMatch.similarity)) {
          bestMatch = {
            file: path.relative(options.testDir, fileInfo.path),
            similarity,
          };
        }
      }
    }

    if (bestMatch && bestMatch.similarity >= 0.7) {
      mappedCases.push({
        caseId: testCase.id,
        title: testCase.title,
        section: sectionName,
        testFile: bestMatch.file,
        matchType: 'title',
        matchConfidence: bestMatch.similarity,
      });
      mappedCaseIds.add(testCase.id);
    } else {
      unmappedCases.push({
        caseId: testCase.id,
        title: testCase.title,
        section: sectionName,
        priority: PRIORITY_MAP[testCase.priority_id] || 'Unknown',
        type: TYPE_MAP[testCase.type_id] || 'Unknown',
        refs: testCase.refs,
      });
    }
  }

  // Find test files without any case mappings
  const filesWithMappings = new Set(mappedCases.map((m) => m.testFile));
  const testFilesWithoutMapping = testFiles
    .map((f) => path.relative(options.testDir, f))
    .filter((f) => !filesWithMappings.has(f));

  const coveragePercent =
    cases.length > 0 ? Math.round((mappedCases.length / cases.length) * 100) : 0;

  return {
    projectId: options.projectId,
    suiteId: options.suiteId,
    testDirectory: options.testDir,
    analyzedAt: new Date().toISOString(),
    summary: {
      totalCases: cases.length,
      automatedCases: mappedCases.length,
      mappedCases: mappedCases.length,
      unmappedCases: unmappedCases.length,
      coveragePercent,
    },
    mappedCases,
    unmappedCases,
    testFilesWithoutMapping,
  };
}

// ============================================================================
// Output Formatters
// ============================================================================

function formatAsText(result: CoverageResult): string {
  const lines: string[] = [];

  lines.push('═'.repeat(60));
  lines.push('TestRail Coverage Report');
  lines.push('═'.repeat(60));
  lines.push('');
  lines.push(`Project ID:     ${result.projectId}`);
  if (result.suiteId) lines.push(`Suite ID:       ${result.suiteId}`);
  lines.push(`Test Directory: ${result.testDirectory}`);
  lines.push(`Analyzed At:    ${result.analyzedAt}`);
  lines.push('');
  lines.push('─'.repeat(60));
  lines.push('Summary');
  lines.push('─'.repeat(60));
  lines.push(`Total Cases:    ${result.summary.totalCases}`);
  lines.push(`Mapped Cases:   ${result.summary.mappedCases} (${result.summary.coveragePercent}%)`);
  lines.push(`Unmapped Cases: ${result.summary.unmappedCases}`);
  lines.push('');

  if (result.unmappedCases.length > 0) {
    lines.push('─'.repeat(60));
    lines.push('Unmapped Cases (Not Automated)');
    lines.push('─'.repeat(60));
    for (const uc of result.unmappedCases.slice(0, 50)) {
      lines.push(`  C${uc.caseId}: ${uc.title}`);
      lines.push(`    Section: ${uc.section} | Priority: ${uc.priority} | Type: ${uc.type}`);
      if (uc.refs) lines.push(`    Refs: ${uc.refs}`);
    }
    if (result.unmappedCases.length > 50) {
      lines.push(`  ... and ${result.unmappedCases.length - 50} more`);
    }
    lines.push('');
  }

  if (result.testFilesWithoutMapping.length > 0) {
    lines.push('─'.repeat(60));
    lines.push('Test Files Without Case Mappings');
    lines.push('─'.repeat(60));
    for (const f of result.testFilesWithoutMapping.slice(0, 20)) {
      lines.push(`  ${f}`);
    }
    if (result.testFilesWithoutMapping.length > 20) {
      lines.push(`  ... and ${result.testFilesWithoutMapping.length - 20} more`);
    }
    lines.push('');
  }

  lines.push('═'.repeat(60));

  return lines.join('\n');
}

function formatAsMarkdown(result: CoverageResult): string {
  const lines: string[] = [];

  lines.push('# TestRail Coverage Report');
  lines.push('');
  lines.push(`- **Project ID:** ${result.projectId}`);
  if (result.suiteId) lines.push(`- **Suite ID:** ${result.suiteId}`);
  lines.push(`- **Test Directory:** ${result.testDirectory}`);
  lines.push(`- **Analyzed At:** ${result.analyzedAt}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Total Cases | ${result.summary.totalCases} |`);
  lines.push(`| Mapped Cases | ${result.summary.mappedCases} |`);
  lines.push(`| Unmapped Cases | ${result.summary.unmappedCases} |`);
  lines.push(`| Coverage | ${result.summary.coveragePercent}% |`);
  lines.push('');

  if (result.unmappedCases.length > 0) {
    lines.push('## Unmapped Cases');
    lines.push('');
    lines.push('| Case ID | Title | Section | Priority | Refs |');
    lines.push('|---------|-------|---------|----------|------|');
    for (const uc of result.unmappedCases.slice(0, 100)) {
      lines.push(
        `| C${uc.caseId} | ${uc.title.substring(0, 50)}${uc.title.length > 50 ? '...' : ''} | ${uc.section} | ${uc.priority} | ${uc.refs || '-'} |`,
      );
    }
    lines.push('');
  }

  if (result.mappedCases.length > 0) {
    lines.push('## Mapped Cases');
    lines.push('');
    lines.push('| Case ID | Title | Test File | Match Type | Confidence |');
    lines.push('|---------|-------|-----------|------------|------------|');
    for (const mc of result.mappedCases.slice(0, 50)) {
      lines.push(
        `| C${mc.caseId} | ${mc.title.substring(0, 40)}${mc.title.length > 40 ? '...' : ''} | ${mc.testFile} | ${mc.matchType} | ${Math.round(mc.matchConfidence * 100)}% |`,
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const options: AnalyzeOptions = {
    projectId: 0,
    testDir: TEST_DIRECTORY_MAP.tests,
    format: 'text',
  };
  let testDirectorySelector = 'tests';
  let outputFilePath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--project-id':
        options.projectId = parseInt(args[++i], 10);
        break;
      case '--suite-id':
        options.suiteId = parseInt(args[++i], 10);
        break;
      case '--test-dir':
        testDirectorySelector = args[++i];
        break;
      case '--format':
        options.format = args[++i] as 'text' | 'json' | 'markdown';
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--help':
        console.log(`
Usage: analyze-coverage.ts [options]

Options:
  --project-id <id>    TestRail project ID (required)
  --suite-id <id>      TestRail suite ID
  --test-dir <value>   Test directory selector (tests, tests-ai, tests-client, tests-integration, tests-triggers, tests-smoke)
  --format <type>      Output format: text, json, markdown (default: text)
  --output <file>      Write output to file instead of stdout
  --help               Show this help
`);
        process.exit(0);
    }
  }

  if (!options.projectId) {
    console.error('Error: --project-id is required');
    process.exit(1);
  }

  try {
    options.testDir = resolveTestDirectorySelection(testDirectorySelector);
    if (options.output) {
      outputFilePath = resolveSafeOutputPath(options.output, options.format);
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  const result = await analyzeCoverage(options);

  let output: string;
  switch (options.format) {
    case 'json':
      output = JSON.stringify(result, null, 2);
      break;
    case 'markdown':
      output = formatAsMarkdown(result);
      break;
    default:
      output = formatAsText(result);
  }

  if (outputFilePath) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    fs.writeFileSync(outputFilePath, output, { encoding: 'utf-8' });
    console.log(`Coverage report written to: ${outputFilePath}`);
  } else {
    console.log(output);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
