# API Coverage Analysis Troubleshooting Guide

Common issues and solutions when analyzing API test coverage.

## Issue 1: Cannot Find Test Files for Endpoint

### Symptoms

- No test files found when searching for a specific API endpoint
- Test coverage shows 0% for an endpoint you know is tested

### Possible Causes

1. **Test uses factory methods instead of direct API paths**
   - Tests may call `offersFactory.createOffer()` instead of referencing the path directly
   - Solution: Search for factory method names related to the endpoint

2. **Path is in a different format in tests**
   - Swagger shows: `/api/2.0/offers/management/create`
   - Test uses: `offers/api/2.0/management/create` (with domain prefix)
   - Solution: Search for path segments instead of full path

3. **Test is in legacy location**
   - Check `tests/integration-domain-split/` folder
   - Solution: Search in both `tests/integration/` and `tests/integration-domain-split/`

4. **Test file naming doesn't match API path**
   - API: `/api/2.0/offers/redemption/process`
   - Test file: `offer-processing.test.ts` (no mention of "redemption")
   - Solution: Search for keywords from API description/summary

### Search Strategy

```javascript
// 1. Search for exact path
grep_search: "/api/2.0/offers/management/create"

// 2. Search for path segments
grep_search: "/management/create"

// 3. Search for factory method
grep_search: "createOffer"

// 4. Search for service layer
grep_search: "offersManagementService.create"

// 5. Search by keywords from API description
grep_search: "create.*offer" (regex mode)
```

## Issue 2: Schema Reference Cannot Be Resolved

### Symptoms

- `$ref` points to a schema that doesn't exist
- Error: "Cannot resolve reference..."

### Possible Causes

1. **Wrong reference path format**
   - Swagger 2.0 uses: `#/definitions/SchemaName`
   - OpenAPI 3.0 uses: `#/components/schemas/SchemaName`
   - Solution: Check format version and use correct path

2. **Schema name is case-sensitive**
   - Reference: `#/components/schemas/createOfferRequest`
   - Actual: `CreateOfferRequest`
   - Solution: Match exact case from definitions section

3. **Schema is in a different file**
   - Some APIs split schemas across multiple files
   - Solution: Check if there's a separate schemas file or common definitions file

4. **Circular reference**
   - Schema A references Schema B, which references Schema A
   - Solution: Track visited schemas to prevent infinite loops

### Resolution Strategy

```javascript
function resolveSchema(ref, swagger, visited = new Set()) {
  // Prevent circular references
  if (visited.has(ref)) {
    return { type: 'circular_reference', ref };
  }
  visited.add(ref);

  // Parse reference path
  const parts = ref.replace('#/', '').split('/');
  let current = swagger;

  for (const part of parts) {
    if (!current[part]) {
      console.warn(`Cannot resolve: ${ref} at ${part}`);
      return null;
    }
    current = current[part];
  }

  // Recursively resolve nested refs
  if (current.$ref) {
    return resolveSchema(current.$ref, swagger, visited);
  }

  return current;
}
```

## Issue 3: Field Coverage Incorrectly Reported

### Symptoms

- Field shows as "Not Covered" but you can see it in test files
- Field shows as "Covered" but it's never actually tested

### Possible Causes

1. **Field name format mismatch**
   - Swagger uses: `offer_id` (snake_case)
   - Test uses: `offerId` (camelCase)
   - Factory uses: `offer_id` (snake_case)
   - Solution: Check for both formats when searching

2. **Field is set by factory default**
   - Test doesn't explicitly set the field
   - Factory provides default value
   - Solution: Review factory implementation to see default fields

3. **Field is in nested override**
   - Test sets: `overrides.common_config.name`
   - Search for: `name` (too generic)
   - Solution: Search with context: `common_config.*name` or full path

4. **Field is validated indirectly**
   - Test doesn't access field directly
   - Test uses: `expect(offer.getTotalAmount()).toBe(10)`
   - Field is: `total_amount`
   - Solution: Check model getter implementations

### Detection Strategy

```javascript
// Check multiple field name formats
function isFieldCovered(fieldName, testContent) {
  const variants = [
    fieldName, // exact: offer_id
    camelCase(fieldName), // camelCase: offerId
    pascalCase(fieldName), // PascalCase: OfferId
    `get${pascalCase(fieldName)}()`, // getter: getOfferId()
  ];

  return variants.some((variant) => testContent.includes(variant));
}
```

## Issue 4: Test File Found But Endpoint Appears Uncovered

### Symptoms

- Test file exists for the domain
- Test file is related to the functionality
- But specific endpoint not tested in that file

### Possible Causes

1. **Test covers a different endpoint in same domain**
   - Test file: `offer-management.test.ts`
   - Contains tests for: `/api/2.0/offers/management/update`
   - Looking for: `/api/2.0/offers/management/create`
   - Solution: Check each test case in file individually

2. **Test is commented out or skipped**
   - Test exists but has: `test.skip()` or `xit()`
   - Solution: Check for active vs skipped tests

3. **Test is in different version folder**
   - Looking for v2.0 endpoints
   - Test is in: `tests/integration/offers/v1/`
   - Solution: Check version-specific folders

4. **Test covers endpoint via E2E test, not integration**
   - Integration folder doesn't have it
   - But E2E test in `tests/triggers/` does
   - Solution: Note that coverage analysis focuses on integration tests

### Verification Strategy

```javascript
// Read test file and check each test case
function analyzeTestFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract all test cases
  const testPattern = /(?:test|it)\s*\(['"](.+?)['"]/g;
  const tests = [...content.matchAll(testPattern)];

  // Extract all API calls
  const apiCallPattern = /(?:post|get|put|delete|patch)\s*\(['"](.+?)['"]/g;
  const apiCalls = [...content.matchAll(apiCallPattern)];

  // Extract factory method calls
  const factoryPattern = /\.\s*(\w+)\s*\(/g;
  const factoryMethods = [...content.matchAll(factoryPattern)];

  return { tests, apiCalls, factoryMethods };
}
```

## Issue 5: Response Field Coverage Too Low

### Symptoms

- Most response fields show as "Not Covered"
- Tests exist but don't validate responses

### Possible Causes

1. **Tests use factories that don't expose response fields**
   - Test calls: `await factory.createOffer()`
   - Factory returns: `void` or only stores internally
   - Solution: Check if factory has getter methods

2. **Tests only check status codes**
   - Test asserts: `expect(response.status).toBe(200)`
   - Doesn't validate response body
   - Solution: This is a real gap - recommend adding field validation

3. **Tests use model getters for specific fields only**
   - Test validates: `offer.getOfferId()`, `offer.getStatus()`
   - Ignores: `offer.getCreatedAt()`, `offer.getVersion()`
   - Solution: Correctly mark only validated fields as covered

4. **Response validation is in helper functions**
   - Test calls: `validateOfferResponse(response)`
   - Helper function checks all fields
   - Test file doesn't show field names directly
   - Solution: Check helper function implementations

### Analysis Strategy

```javascript
// Check both direct and indirect field access
function getResponseFieldCoverage(fieldName, testFiles) {
  const coverage = {
    direct: false, // field accessed directly
    getter: false, // accessed via getter
    helper: false, // validated in helper
    assertion: false, // used in assertion
  };

  for (const testFile of testFiles) {
    const content = fs.readFileSync(testFile, 'utf8');

    // Check direct access
    if (content.includes(`.${fieldName}`)) {
      coverage.direct = true;
    }

    // Check getter
    const getter = `get${pascalCase(fieldName)}()`;
    if (content.includes(getter)) {
      coverage.getter = true;
    }

    // Check in assertions
    if (content.match(new RegExp(`expect\\(.+${fieldName}.+\\)`))) {
      coverage.assertion = true;
    }

    // Check helper functions
    if (content.includes('validate') && content.includes(fieldName)) {
      coverage.helper = true;
    }
  }

  return coverage;
}
```

## Issue 6: Version Filter Not Working

### Symptoms

- Filter by version "2.0" returns no results
- Know there are v2.0 APIs in the swagger file

### Possible Causes

1. **Version format mismatch**
   - Search for: `2.0`
   - API path has: `v2` or `v2.0` or `2`
   - Solution: Handle multiple version formats

2. **Version not in path**
   - Some APIs don't include version in path
   - Version might be in header or query param
   - Solution: Check API documentation structure

3. **Version is in different location**
   - Path: `/api/offers/management/create`
   - Version in: `info.version` field (not in path)
   - Solution: Clarify if filtering by path version or API version

### Version Detection Strategy

```javascript
function extractVersion(apiPath) {
  // Try different patterns
  const patterns = [
    /\/api\/v?(\d+(?:\.\d+)?)\//, // /api/v2.0/ or /api/2.0/
    /\/v(\d+(?:\.\d+)?)\//, // /v2.0/
    /\/(\d+\.\d+)\//, // /2.0/
  ];

  for (const pattern of patterns) {
    const match = apiPath.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return 'unknown';
}

function matchesVersion(apiPath, versionFilter) {
  const version = extractVersion(apiPath);

  // Exact match
  if (version === versionFilter) return true;

  // Major version match (2.0 matches 2)
  if (version.split('.')[0] === versionFilter) return true;

  return false;
}
```

## Issue 7: Report Generation Fails

### Symptoms

- Analysis completes but report file not created
- Report file is empty or malformed

### Possible Causes

1. **Invalid timestamp format**
   - Timestamp has characters not allowed in filenames (`:`, `/`)
   - Solution: Use filesystem-safe format: `YYYYMMDD-HHMMSS`

2. **Reports directory doesn't exist**
   - Trying to write to `reports/` folder
   - Folder not created yet
   - Solution: Create directory if it doesn't exist

3. **Insufficient permissions**
   - Cannot write to reports folder
   - Solution: Check file permissions

4. **Markdown syntax errors**
   - Tables not properly formatted
   - Links broken
   - Solution: Validate markdown before writing

### Safe Report Generation

```javascript
function generateReport(domain, data) {
  const fs = require('fs');
  const path = require('path');

  // Create safe timestamp
  const now = new Date();
  const timestamp = now.toISOString().replace(/:/g, '').replace(/\..+/, '').replace('T', '-');

  // Ensure reports directory exists
  const reportsDir = path.join(__dirname, '../../../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Generate filename
  const filename = `report-api-coverage-${domain}-${timestamp}.md`;
  const filepath = path.join(reportsDir, filename);

  // Write report
  try {
    fs.writeFileSync(filepath, data, 'utf8');
    return filepath;
  } catch (error) {
    console.error(`Failed to write report: ${error.message}`);
    return null;
  }
}
```

## Best Practices

### 1. Progressive Analysis

Start with high-level overview, then drill down:

1. Count total endpoints
2. Identify which have test files
3. For covered endpoints, check field coverage
4. For uncovered endpoints, document gaps

### 2. Multiple Search Strategies

Don't rely on a single search approach:

- Try exact path matches
- Try path segments
- Try factory methods
- Try service layer methods
- Try keywords from descriptions

### 3. Context-Aware Coverage

Consider different types of coverage:

- **Explicit**: Field directly accessed/validated
- **Implicit**: Field set by factory defaults
- **Indirect**: Field validated in helper functions
- **Partial**: Field used but not fully validated

### 4. Report Actionable Insights

Don't just list gaps, provide:

- Priority levels (high/medium/low)
- Specific recommendations
- Example test cases to add
- Impact assessment

### 5. Handle Edge Cases

- Circular schema references
- Missing schema definitions
- Test files with no actual tests
- Skipped or commented tests
- Different naming conventions
- Legacy vs new test structure

## Quick Diagnostic Checklist

When analysis seems incorrect, check:

- [ ] Is the swagger file loaded correctly?
- [ ] Is the format detected (swagger 2.0 vs openapi 3.0)?
- [ ] Are schema references resolving?
- [ ] Are test directories accessible?
- [ ] Is the domain name matching folder structure?
- [ ] Are you searching in both test locations?
- [ ] Are you checking multiple name formats?
- [ ] Are factory implementations reviewed?
- [ ] Are model getter methods considered?
- [ ] Is the version filter applied correctly?

## Getting Help

If analysis still doesn't work:

1. Check example reports in `references/example-report.md`
2. Review the main SKILL.md for detailed workflow
3. Test the swagger parser script on the file
4. Manually inspect test files for the domain
5. Compare with existing coverage reports in `reports/` folder
