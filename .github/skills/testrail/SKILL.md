---
name: testrail
description: |
  TestRail API client for sessionm.testrail.com. Use when:
  - User mentions sessionm.testrail.com URLs (test cases, runs, suites, projects)
  - URLs like https://sessionm.testrail.com/index.php?/cases/view/12345
  - URLs like https://sessionm.testrail.com/index.php?/runs/view/789
  - URLs like https://sessionm.testrail.com/index.php?/suites/view/456
  - Fetching test case descriptions to generate integration/unit tests
  - Comparing TestRail test cases with existing automated tests (coverage analysis)
  - Syncing test results back to TestRail
  NOT for: Other TestRail instances or general test documentation.
---

# TestRail API for sessionm.testrail.com

## URL Parsing

Convert TestRail URLs to API endpoints using `scripts/url-to-testrail.sh`:

```bash
scripts/url-to-testrail.sh "https://sessionm.testrail.com/index.php?/cases/view/12345"
# Output: GET /api/v2/get_case/12345
```

### URL Structure

```
https://sessionm.testrail.com/index.php?/cases/view/12345
                                         └─┬──┘ └─┬─┘ └─┬─┘
                                        ENTITY  VIEW   ID
```

| URL Pattern               | API Endpoint                  |
| ------------------------- | ----------------------------- |
| `.../cases/view/12345`    | `GET /api/v2/get_case/12345`  |
| `.../runs/view/789`       | `GET /api/v2/get_run/789`     |
| `.../suites/view/456`     | `GET /api/v2/get_suite/456`   |
| `.../projects/overview/3` | `GET /api/v2/get_project/3`   |
| `.../sections/view/100`   | `GET /api/v2/get_section/100` |

---

## Prerequisites

1. **Set environment variables**:

   ```bash
   export TESTRAIL_URL="https://sessionm.testrail.com"
   export TESTRAIL_USER="your.email@example.com"
   export TESTRAIL_API_KEY="your-api-key"
   ```

2. **Verify setup**:
   ```bash
   ./scripts/testrail-api.sh GET /api/v2/get_projects
   ```

---

## Quick Reference

| Task                  | Command/Script                                                                       |
| --------------------- | ------------------------------------------------------------------------------------ |
| Get project           | `./scripts/testrail-api.sh GET /api/v2/get_project/{id}`                             |
| List projects         | `./scripts/testrail-api.sh GET /api/v2/get_projects`                                 |
| Get test case         | `./scripts/testrail-api.sh GET /api/v2/get_case/{id}`                                |
| List cases in project | `./scripts/testrail-api.sh GET "/api/v2/get_cases/{project_id}&suite_id={suite_id}"` |
| Get suite             | `./scripts/testrail-api.sh GET /api/v2/get_suite/{id}`                               |
| List suites           | `./scripts/testrail-api.sh GET /api/v2/get_suites/{project_id}`                      |
| Get run               | `./scripts/testrail-api.sh GET /api/v2/get_run/{id}`                                 |
| List runs             | `./scripts/testrail-api.sh GET /api/v2/get_runs/{project_id}`                        |
| Add result            | `./scripts/testrail-api.sh POST /api/v2/add_result/{test_id} '{"status_id":1}'`      |

---

## Core Workflows

### 1. Generate Tests from TestRail Cases

Use `scripts/generate-tests-from-testrail.ts` to create test scaffolds:

```bash
# Generate Jest tests from a TestRail suite
npx ts-node scripts/generate-tests-from-testrail.ts \
  --project-id 3 \
  --suite-id 42 \
  --output tests/integration/generated

# Generate from specific test cases
npx ts-node scripts/generate-tests-from-testrail.ts \
  --case-ids 12345,12346,12347 \
  --output tests/integration/specific
```

### 2. Analyze Coverage

Compare TestRail cases against existing test files:

```bash
# Analyze coverage for a suite
npx ts-node scripts/analyze-coverage.ts \
  --project-id 3 \
  --suite-id 42 \
  --test-dir tests/integration

# Output: coverage report showing mapped/unmapped cases
```

### 3. Sync Results to TestRail

Report automated test results back to TestRail:

```bash
# After running Jest tests
npx ts-node scripts/sync-results-to-testrail.ts \
  --run-id 789 \
  --results-file test-results.json
```

---

## API Endpoints

### Projects

```bash
# List all projects
GET /api/v2/get_projects

# Get specific project
GET /api/v2/get_project/{project_id}
```

### Suites

```bash
# List suites for a project
GET /api/v2/get_suites/{project_id}

# Get specific suite
GET /api/v2/get_suite/{suite_id}
```

### Sections

```bash
# List sections in a suite
GET /api/v2/get_sections/{project_id}&suite_id={suite_id}

# Get specific section
GET /api/v2/get_section/{section_id}
```

### Cases

```bash
# List cases in a project/suite
GET /api/v2/get_cases/{project_id}&suite_id={suite_id}

# Get specific case
GET /api/v2/get_case/{case_id}

# Filter by section
GET /api/v2/get_cases/{project_id}&suite_id={suite_id}&section_id={section_id}

# Filter with search
GET /api/v2/get_cases/{project_id}&suite_id={suite_id}&filter=login
```

### Runs & Results

```bash
# List runs for a project
GET /api/v2/get_runs/{project_id}

# Get specific run
GET /api/v2/get_run/{run_id}

# Get results for a test
GET /api/v2/get_results/{test_id}

# Add result for a case in a run
POST /api/v2/add_result_for_case/{run_id}/{case_id}
```

---

## Test Case Structure

TestRail test cases include these key fields for test generation:

| Field                    | Description                     | Use for Test Generation        |
| ------------------------ | ------------------------------- | ------------------------------ |
| `title`                  | Test case name                  | Test description (`it('...')`) |
| `custom_preconds`        | Preconditions                   | `beforeEach()` setup           |
| `custom_steps`           | Plain text steps                | Test implementation comments   |
| `custom_steps_separated` | Structured steps array          | Individual test assertions     |
| `custom_expected`        | Expected result                 | Assertion expectations         |
| `refs`                   | References (e.g., JIRA tickets) | Link to requirements           |
| `priority_id`            | Priority level                  | Test tagging/filtering         |
| `type_id`                | Test type (manual, automated)   | Skip/include logic             |

### Structured Steps Format

```json
{
  "custom_steps_separated": [
    {
      "content": "Step 1: Login with valid credentials",
      "expected": "User is authenticated successfully"
    },
    {
      "content": "Step 2: Navigate to dashboard",
      "expected": "Dashboard is displayed with user info"
    }
  ]
}
```

---

## Coverage Analysis

The coverage analyzer matches TestRail cases to existing tests using:

1. **Case ID references**: Look for `C12345` or `case_id: 12345` in test files
2. **Title matching**: Fuzzy match test case titles to `describe()`/`it()` blocks
3. **Section mapping**: Map TestRail sections to test file directories

### Coverage Report Output

```
TestRail Coverage Report
========================
Project: API Tests (ID: 3)
Suite: Integration Tests (ID: 42)

Total Cases: 150
Automated:   87 (58%)
Manual Only: 63 (42%)

Unmapped Cases:
- C12345: User authentication flow
- C12346: Password reset functionality
- C12347: Session timeout handling
```

---

## Rate Limits

TestRail Cloud API rate limits:

- **Professional**: 180 requests/minute
- **Enterprise**: 300 requests/minute

The scripts include automatic retry with exponential backoff for 429 responses.

---

## Advanced Topics

- **API Reference**: See [references/api-reference.md](references/api-reference.md) for complete endpoint documentation
- **Test Generation Templates**: See [references/test-templates.md](references/test-templates.md) for customizing generated tests
- **Coverage Mapping**: See [references/coverage-mapping.md](references/coverage-mapping.md) for mapping configuration

---

## Troubleshooting

| Issue                   | Cause                  | Solution                             |
| ----------------------- | ---------------------- | ------------------------------------ |
| `401 Unauthorized`      | Invalid API key        | Verify `TESTRAIL_API_KEY` is correct |
| `403 Forbidden`         | No project access      | Check user permissions in TestRail   |
| `429 Too Many Requests` | Rate limit exceeded    | Wait for `Retry-After` seconds       |
| `400 Invalid request`   | Wrong project/suite ID | Verify IDs from TestRail URLs        |
| Empty response          | No cases match filter  | Check filter parameters              |
