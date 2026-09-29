# Test Generation Templates

Templates used by `generate-tests-from-testrail.ts` for creating test scaffolds.

## Available Templates

| Template       | Use Case                                |
| -------------- | --------------------------------------- |
| `jest`         | Standard Jest tests                     |
| `jest-openapi` | Jest tests with OpenAPI spec validation |
| `vitest`       | Vitest tests (similar to Jest)          |

---

## Jest Template (Default)

Used for general integration and unit tests.

```typescript
/**
 * Section Name
 *
 * Auto-generated from TestRail test cases.
 * Generated: 2026-01-15T10:00:00.000Z
 *
 * Cases: C12345, C12346, C12347
 */

describe('Section Name', () => {
  beforeAll(async () => {
    // Setup
  });

  afterAll(async () => {
    // Teardown
  });

  /**
   * TestRail Case: C12345 (JIRA-123)
   * @see https://sessionm.testrail.com/index.php?/cases/view/12345
   */
  it('C12345: User can login with valid credentials', async () => {
    // Preconditions:
    // User account exists in the system
    // User is on the login page

    // Step 1: Enter valid username
    // Expected: Username field accepts input

    // Step 2: Enter valid password
    // Expected: Password field accepts input (masked)

    // Step 3: Click login button
    // Expected: User is redirected to dashboard

    // Expected Result:
    // User sees their personalized dashboard

    // TODO: Implement test logic
    expect(true).toBe(true); // Placeholder
  });
});
```

---

## Jest-OpenAPI Template

For API tests with OpenAPI specification validation.

```typescript
/**
 * API Endpoints
 *
 * Auto-generated from TestRail test cases.
 * Generated: 2026-01-15T10:00:00.000Z
 *
 * Cases: C12345, C12346
 */

import jestOpenAPI from 'jest-openapi';
import { api } from '@lib/api';

// Load OpenAPI spec
// jestOpenAPI(path.join(__dirname, '../openapi.yaml'));

describe('API Endpoints', () => {
  beforeAll(async () => {
    // Setup
  });

  afterAll(async () => {
    // Teardown
  });

  /**
   * TestRail Case: C12345 (API-001)
   * @see https://sessionm.testrail.com/index.php?/cases/view/12345
   */
  it('C12345: GET /users returns list of users', async () => {
    // Preconditions:
    // API server is running
    // Authentication token is valid

    // Step 1: Send GET request to /users
    // Expected: Response status is 200

    // TODO: Implement API call
    const response = await api.get('/endpoint');

    expect(response.status).toBe(200);
    expect(response).toSatisfyApiSpec();
  });
});
```

---

## Customizing Templates

You can create custom templates by extending the generator script.

### Template Interface

```typescript
interface TestTemplate {
  name: string;
  imports: string;
  describeWrapper: (sectionName: string, tests: string) => string;
  testWrapper: (testCase: TestRailCase) => string;
}
```

### Creating a Custom Template

Add to `generate-tests-from-testrail.ts`:

```typescript
function generateCustomTemplate(testCase: TestRailCase): string {
  const caseId = testCase.id;
  const title = sanitizeTestName(testCase.title);

  return `
  test('C${caseId}: ${title}', async ({ page }) => {
    // Playwright-style test
    await page.goto('/');
    
    // TODO: Add test steps
  });`;
}
```

---

## Template Variables

Available variables from TestRail test cases:

| Variable                          | Source | Description                      |
| --------------------------------- | ------ | -------------------------------- |
| `testCase.id`                     | System | Unique case ID                   |
| `testCase.title`                  | System | Test case title                  |
| `testCase.refs`                   | Custom | References (JIRA tickets, etc.)  |
| `testCase.custom_preconds`        | Custom | Preconditions text               |
| `testCase.custom_steps`           | Custom | Plain text steps                 |
| `testCase.custom_steps_separated` | Custom | Structured steps array           |
| `testCase.custom_expected`        | Custom | Expected result                  |
| `testCase.priority_id`            | System | Priority (1=Low, 4=Critical)     |
| `testCase.type_id`                | System | Type (3=Automated, 6=Functional) |

---

## Best Practices

### 1. Include Case IDs in Test Names

Always prefix test names with the case ID:

```typescript
// ✅ Good - easily traceable
it('C12345: User can login', ...);

// ❌ Bad - no traceability
it('User can login', ...);
```

### 2. Use Structured Steps

When writing test cases in TestRail, use structured steps instead of plain text:

```json
{
  "custom_steps_separated": [
    { "content": "Step 1", "expected": "Expected 1" },
    { "content": "Step 2", "expected": "Expected 2" }
  ]
}
```

This generates better test scaffolds with individual assertions.

### 3. Add References

Link JIRA tickets or requirements in the `refs` field:

```
JIRA-123, REQ-456
```

These appear in generated test comments for traceability.

### 4. Set Automation Type

Use the `custom_automation_type` field to indicate if a case is:

- 0: None (manual)
- 1: Automated
- 2: Automation Candidate

This helps filter which cases to generate tests for.
