# TestRail API Reference

> Complete API reference for sessionm.testrail.com (TestRail v9.8.1)

## Authentication

All requests require HTTP Basic Authentication:

```bash
curl -u "email:api_key" \
  -H "Content-Type: application/json" \
  "https://sessionm.testrail.com/index.php?/api/v2/get_projects"
```

## Base URL

```
https://sessionm.testrail.com/index.php?/api/v2/
```

---

## Projects

### get_project

Returns an existing project.

```
GET /api/v2/get_project/{project_id}
```

**Response:**

```json
{
  "id": 1,
  "name": "Project X",
  "announcement": "Welcome to project X",
  "is_completed": false,
  "suite_mode": 1,
  "url": "https://sessionm.testrail.com/index.php?/projects/overview/1"
}
```

### get_projects

Returns all projects.

```
GET /api/v2/get_projects
GET /api/v2/get_projects&is_completed=0
```

---

## Suites

### get_suite

```
GET /api/v2/get_suite/{suite_id}
```

**Response:**

```json
{
  "id": 1,
  "name": "Setup & Installation",
  "description": "..",
  "project_id": 1,
  "is_master": true,
  "is_baseline": false,
  "is_completed": false,
  "url": "https://sessionm.testrail.com/index.php?/suites/view/1"
}
```

### get_suites

```
GET /api/v2/get_suites/{project_id}
```

---

## Sections

### get_section

```
GET /api/v2/get_section/{section_id}
```

**Response:**

```json
{
  "id": 1,
  "name": "Prerequisites",
  "description": null,
  "suite_id": 1,
  "parent_id": null,
  "depth": 0,
  "display_order": 1
}
```

### get_sections

```
GET /api/v2/get_sections/{project_id}&suite_id={suite_id}
```

---

## Cases

### get_case

Returns a test case with all details.

```
GET /api/v2/get_case/{case_id}
```

**Response:**

```json
{
  "id": 1,
  "title": "Print document history and attributes",
  "section_id": 1,
  "suite_id": 1,
  "template_id": 1,
  "type_id": 2,
  "priority_id": 2,
  "milestone_id": null,
  "refs": "JIRA-123",
  "created_by": 1,
  "created_on": 1646317844,
  "updated_by": 1,
  "updated_on": 1646317844,
  "estimate": "5m",
  "estimate_forecast": "8m 40s",
  "custom_automation_type": 0,
  "custom_preconds": "User is logged in",
  "custom_steps": "1. Navigate to page\n2. Click button",
  "custom_expected": "Page loads successfully",
  "custom_steps_separated": [
    {
      "content": "Navigate to page",
      "expected": "Page is displayed"
    },
    {
      "content": "Click button",
      "expected": "Action is performed"
    }
  ]
}
```

### get_cases

List cases with filtering.

```
GET /api/v2/get_cases/{project_id}&suite_id={suite_id}
GET /api/v2/get_cases/{project_id}&suite_id={suite_id}&section_id={section_id}
GET /api/v2/get_cases/{project_id}&suite_id={suite_id}&filter=login
GET /api/v2/get_cases/{project_id}&suite_id={suite_id}&priority_id=3,4
GET /api/v2/get_cases/{project_id}&suite_id={suite_id}&type_id=1,3
GET /api/v2/get_cases/{project_id}&suite_id={suite_id}&limit=10&offset=0
```

**Response:**

```json
{
  "offset": 0,
  "limit": 250,
  "size": 250,
  "_links": {
    "next": "/api/v2/get_cases/1&limit=250&offset=250",
    "prev": null
  },
  "cases": [
    { "id": 1, "title": "..." },
    { "id": 2, "title": "..." }
  ]
}
```

### add_case

Create a new test case.

```
POST /api/v2/add_case/{section_id}
```

**Request:**

```json
{
  "title": "New test case",
  "type_id": 1,
  "priority_id": 3,
  "estimate": "3m",
  "refs": "JIRA-456",
  "custom_preconds": "Preconditions text",
  "custom_steps_separated": [
    { "content": "Step 1", "expected": "Expected 1" },
    { "content": "Step 2", "expected": "Expected 2" }
  ]
}
```

### update_case

```
POST /api/v2/update_case/{case_id}
```

Supports same fields as add_case.

---

## Runs

### get_run

```
GET /api/v2/get_run/{run_id}
```

**Response:**

```json
{
  "id": 81,
  "name": "Regression Tests",
  "description": null,
  "suite_id": 4,
  "project_id": 1,
  "plan_id": 80,
  "milestone_id": 7,
  "assignedto_id": 6,
  "include_all": false,
  "is_completed": false,
  "completed_on": null,
  "created_by": 1,
  "created_on": 1393845644,
  "passed_count": 2,
  "failed_count": 2,
  "blocked_count": 0,
  "retest_count": 1,
  "untested_count": 3,
  "url": "https://sessionm.testrail.com/index.php?/runs/view/81"
}
```

### get_runs

```
GET /api/v2/get_runs/{project_id}
GET /api/v2/get_runs/{project_id}&is_completed=0
GET /api/v2/get_runs/{project_id}&suite_id=1
GET /api/v2/get_runs/{project_id}&milestone_id=5
```

### add_run

```
POST /api/v2/add_run/{project_id}
```

**Request:**

```json
{
  "suite_id": 1,
  "name": "New Test Run",
  "description": "Run description",
  "assignedto_id": 5,
  "include_all": false,
  "case_ids": [1, 2, 3, 4, 7, 8]
}
```

### close_run

```
POST /api/v2/close_run/{run_id}
```

⚠️ Cannot be undone.

---

## Results

### get_results

```
GET /api/v2/get_results/{test_id}
GET /api/v2/get_results/{test_id}&limit=10
GET /api/v2/get_results/{test_id}&status_id=4,5
```

### get_results_for_case

```
GET /api/v2/get_results_for_case/{run_id}/{case_id}
```

### get_results_for_run

```
GET /api/v2/get_results_for_run/{run_id}
GET /api/v2/get_results_for_run/{run_id}&status_id=5&limit=50
```

### add_result

Add result to a test.

```
POST /api/v2/add_result/{test_id}
```

**Request:**

```json
{
  "status_id": 1,
  "comment": "Test passed successfully",
  "version": "1.0.0",
  "elapsed": "30s",
  "defects": "JIRA-789"
}
```

**Status IDs:**
| ID | Status |
|----|--------|
| 1 | Passed |
| 2 | Blocked |
| 3 | Untested (read-only) |
| 4 | Retest |
| 5 | Failed |

### add_result_for_case

Add result using case ID (preferred for automation).

```
POST /api/v2/add_result_for_case/{run_id}/{case_id}
```

Same request body as add_result.

### add_results_for_cases

Bulk add results (recommended for automation).

```
POST /api/v2/add_results_for_cases/{run_id}
```

**Request:**

```json
{
  "results": [
    {
      "case_id": 1,
      "status_id": 1,
      "comment": "Passed"
    },
    {
      "case_id": 2,
      "status_id": 5,
      "comment": "Failed: assertion error",
      "elapsed": "5m"
    }
  ]
}
```

---

## Pagination

All list endpoints return paginated results:

```json
{
  "offset": 0,
  "limit": 250,
  "size": 250,
  "_links": {
    "next": "/api/v2/get_cases/1&limit=250&offset=250",
    "prev": null
  }
}
```

- Default limit: 250
- Maximum limit: 250
- Use `offset` parameter to paginate

---

## Rate Limits

- **Professional Cloud:** 180 requests/minute
- **Enterprise Cloud:** 300 requests/minute

Handle 429 responses:

- Check `Retry-After` header
- Implement exponential backoff

---

## Common Field Types

### Timespan

Format: `"30s"`, `"1m"`, `"1m 30s"`, `"2h 30m"`

### Timestamp

UNIX timestamp (seconds since epoch): `1646317844`

### Custom Fields

All custom fields use `custom_` prefix:

- `custom_preconds` - Preconditions
- `custom_steps` - Plain text steps
- `custom_steps_separated` - Structured steps array
- `custom_expected` - Expected result
- `custom_automation_type` - Automation status

---

## Error Responses

```json
{
  "error": "Field :project is not a valid project."
}
```

| Code | Meaning                            |
| ---- | ---------------------------------- |
| 400  | Invalid request / Bad parameters   |
| 401  | Unauthorized / Invalid credentials |
| 403  | Forbidden / No access              |
| 404  | Not found                          |
| 429  | Rate limit exceeded                |
