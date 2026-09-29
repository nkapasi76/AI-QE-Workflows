# Coverage Mapping Configuration

Configure how TestRail test cases are matched to automated tests.

## Matching Strategies

The coverage analyzer uses three strategies to match TestRail cases to test files:

### 1. Case ID References (Highest Confidence)

Looks for case ID patterns in test files:

| Pattern          | Example                                                        |
| ---------------- | -------------------------------------------------------------- |
| `C12345`         | `it('C12345: User login', ...`                                 |
| `case_id: 12345` | `// case_id: 12345`                                            |
| `caseId: 12345`  | `@caseId: 12345`                                               |
| TestRail URL     | `// https://sessionm.testrail.com/index.php?/cases/view/12345` |

**Confidence: 100%**

### 2. Title Matching (Medium Confidence)

Fuzzy matches test case titles to `describe()` and `it()` blocks:

```typescript
// TestRail: "User can login with valid credentials"
// Matches:
it('User can login with valid credentials', ...);   // 100% match
it('user login with valid credentials', ...);       // 95% match
it('Login with valid credentials', ...);            // 80% match
describe('User login', () => { it('valid credentials', ...) }); // 75% match
```

**Confidence: 60-100%** (threshold: 70%)

### 3. Section Mapping (Lower Confidence)

Maps TestRail sections to test directories:

```
TestRail Section: "Authentication"
→ tests/integration/authentication/
→ tests/e2e/auth/
```

**Confidence: 50-70%**

---

## Configuration File

Create `.testrail-coverage.json` in your project root:

```json
{
  "projectId": 3,
  "suiteId": 42,
  "testDirectories": ["tests/integration", "tests/e2e"],
  "ignorePatterns": ["**/fixtures/**", "**/helpers/**", "**/__mocks__/**"],
  "sectionMapping": {
    "Authentication": "tests/integration/auth",
    "User Management": "tests/integration/users",
    "API Endpoints": "tests/integration/api"
  },
  "typeFilters": {
    "include": [3, 6],
    "exclude": [7]
  },
  "priorityFilters": {
    "include": [3, 4]
  },
  "minimumConfidence": 0.7
}
```

### Configuration Options

| Option                    | Type     | Description                             |
| ------------------------- | -------- | --------------------------------------- |
| `projectId`               | number   | TestRail project ID                     |
| `suiteId`                 | number   | TestRail suite ID                       |
| `testDirectories`         | string[] | Directories to scan for tests           |
| `ignorePatterns`          | string[] | Glob patterns to ignore                 |
| `sectionMapping`          | object   | Map section names to directories        |
| `typeFilters.include`     | number[] | Only include these type IDs             |
| `typeFilters.exclude`     | number[] | Exclude these type IDs                  |
| `priorityFilters.include` | number[] | Only include these priorities           |
| `minimumConfidence`       | number   | Min confidence for title matching (0-1) |

---

## Type IDs Reference

| ID  | Type           |
| --- | -------------- |
| 1   | Acceptance     |
| 2   | Accessibility  |
| 3   | Automated      |
| 4   | Compatibility  |
| 5   | Destructive    |
| 6   | Functional     |
| 7   | Other          |
| 8   | Performance    |
| 9   | Regression     |
| 10  | Security       |
| 11  | Smoke & Sanity |
| 12  | Usability      |

---

## Priority IDs Reference

| ID  | Priority |
| --- | -------- |
| 1   | Low      |
| 2   | Medium   |
| 3   | High     |
| 4   | Critical |

---

## Adding Case IDs to Existing Tests

### Manual Annotation

Add case ID to test names:

```typescript
// Before
it('should authenticate user', async () => { ... });

// After
it('C12345: should authenticate user', async () => { ... });
```

### JSDoc Annotation

```typescript
/**
 * @testrail C12345
 * @see https://sessionm.testrail.com/index.php?/cases/view/12345
 */
it('should authenticate user', async () => { ... });
```

### Comment Annotation

```typescript
// TestRail: C12345, C12346
describe('Authentication', () => {
  it('C12345: login flow', ...);
  it('C12346: logout flow', ...);
});
```

---

## Bulk Annotation Script

Use this script to add case IDs to existing tests based on title matching:

```bash
npx ts-node scripts/annotate-tests.ts \
  --project-id 3 \
  --suite-id 42 \
  --test-dir tests/integration \
  --min-confidence 0.9 \
  --dry-run
```

⚠️ Always use `--dry-run` first to review matches.

---

## Report Interpretation

### Coverage Summary

```
Total Cases:    150
Mapped Cases:   87 (58%)
Unmapped Cases: 63 (42%)
```

- **Mapped**: Cases with corresponding automated tests
- **Unmapped**: Cases without automation (gaps to fill)

### Match Types

| Type      | Meaning                         |
| --------- | ------------------------------- |
| `case-id` | Explicit C##### reference found |
| `title`   | Title similarity match          |
| `section` | Section-to-directory mapping    |

### Confidence Scores

| Score  | Reliability                      |
| ------ | -------------------------------- |
| 100%   | Exact match (case ID)            |
| 90-99% | Very high (near-identical title) |
| 70-89% | Good (similar title/keywords)    |
| < 70%  | Low (may be false positive)      |

---

## CI Integration

Add coverage check to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Check TestRail Coverage
  run: |
    npx ts-node scripts/analyze-coverage.ts \
      --project-id ${{ secrets.TESTRAIL_PROJECT_ID }} \
      --suite-id ${{ secrets.TESTRAIL_SUITE_ID }} \
      --test-dir tests \
      --format json \
      --output coverage-report.json

    # Fail if coverage drops below threshold
    COVERAGE=$(jq '.summary.coveragePercent' coverage-report.json)
    if [ "$COVERAGE" -lt 60 ]; then
      echo "Coverage ($COVERAGE%) is below threshold (60%)"
      exit 1
    fi
```
