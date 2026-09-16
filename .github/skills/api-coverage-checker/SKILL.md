---
name: api-coverage-checker
description: 'Analyzes API test coverage by comparing swagger/openapi documentation against integration tests in sm-peeves. Use when asked to check API coverage, identify untested endpoints, analyze field-level test coverage, or find gaps between API documentation and test files. Filters by domain (catalog/incentives/offers/transactions), specific endpoints, or API versions. Generates detailed coverage reports.'
---

# API Coverage Checker

A specialized agent skill for analyzing API test coverage by comparing swagger/openapi documentation against actual integration test files. This skill identifies coverage gaps at both endpoint and field levels.

## When to Use This Skill

- User asks to check API test coverage for a specific domain
- Need to identify untested API endpoints
- Analyzing what fields in API requests/responses are covered by tests
- Comparing swagger/openapi documentation with actual test files
- Finding gaps between documented APIs and integration tests
- Generating API coverage reports for QA gap analysis
- Planning test automation for new or existing APIs

## Prerequisites

- Access to the sm-peeves repository
- API documentation files in `docs/API/` directory:
  - `catalog-swagger.json`
  - `incentives-swagger.json`
  - `offers-swagger.json`
  - `transactions-swagger.json`
- Test directories:
  - `tests/integration/` - Current integration tests
  - `tests/integration-domain-split/` - Legacy integration tests
- Understanding of swagger 2.0 and openapi 3.0 formats

## Required Parameters

### Domain (Required)

The API domain to analyze. Must be one of:

- `catalog`
- `incentives`
- `offers`
- `transactions`

### Optional Filters

#### Specific API Endpoint

Filter to analyze only a specific endpoint or set of endpoints:

- Example: `/api/2.0/offers/management/create`
- Example: `/api/1.0/points/account`
- Supports partial matching: `/api/2.0/offers/` (all v2.0 offers endpoints)

#### API Version

Filter to analyze only a specific API version:

- Example: `1.0`, `2.0`, `3.0`
- Matches version in the API path (e.g., `/api/2.0/...`)

## Analysis Workflow

### Step 1: Validate Input Parameters

1. Confirm the domain is specified and valid
2. Verify the corresponding swagger/openapi file exists: `docs/API/{domain}-swagger.json`
3. If specific API filter provided, note it for later filtering
4. If version filter provided, note it for later filtering
5. Validate that test directories exist

### Step 2: Load and Parse API Documentation

1. Read the swagger/openapi JSON file for the specified domain: `docs/API/{domain}-swagger.json`
2. Parse the JSON structure (handle both swagger 2.0 and openapi 3.0 formats)
3. Extract all API endpoints from `paths` object
4. Apply filters if specified:
   - If specific API provided: Filter to matching paths only
   - If version provided: Filter to paths containing `/api/{version}/`
5. For each endpoint, extract:
   - HTTP method (GET, POST, PUT, DELETE, PATCH)
   - Full path
   - API version (from path)
   - Request parameters (query, path, body)
   - Request body schema (if applicable)
   - Response schemas (for different status codes)
   - Tags/categories
   - Summary/description

### Step 3: Analyze Request Body Schemas

For each endpoint with a request body:

1. Resolve schema references (`$ref` to `#/components/schemas/...`)
2. Extract all fields from the schema:
   - Field names
   - Field types
   - Required vs optional fields
   - Nested objects and their fields
   - Array item types
3. Build a complete field inventory for the request
4. Note validation rules (min, max, pattern, enum values)

### Step 4: Analyze Response Schemas

For each endpoint with response schemas:

1. Focus on success responses (200, 201, etc.)
2. Resolve schema references
3. Extract all response fields:
   - Field names
   - Field types
   - Nested structures
   - Array items
4. Build a complete field inventory for responses

### Step 5: Search for Test Files

Search in both test directories for files related to the domain:

```
tests/integration/{domain}/**/*.test.ts
tests/integration-domain-split/{domain}/**/*.test.ts
```

For each test file found:

1. Read the entire file content
2. Extract test structure:
   - `describe` blocks (test suites)
   - `test` or `it` blocks (test cases)
   - Test names and descriptions
3. Note any TestRail case IDs (format: `tc-C1234567`)

### Step 6: Analyze Test Coverage for Each Endpoint

For each API endpoint identified in Step 2:

1. **Search for API path references** in test files:
   - Look for the exact path string
   - Look for path segments (e.g., `/offers/management/create`)
   - Look for method names matching the endpoint
   - Look for factory method calls related to the endpoint

2. **Identify covered test cases**:
   - Which test files reference this endpoint?
   - What are the test case names?
   - What scenarios are being tested?
   - Are there TestRail case IDs?

3. **Analyze request field coverage**:
   - For each field in the request schema, check if test files:
     - Set the field explicitly
     - Use factory methods that set the field
     - Test different values for the field
     - Test validation for the field
   - Categorize fields as:
     - **Covered**: Field is set/tested in at least one test
     - **Partially covered**: Field is set but not thoroughly tested
     - **Not covered**: Field never appears in tests

4. **Analyze response field coverage**:
   - For each field in the response schema, check if test files:
     - Assert on the field value
     - Use getter methods for the field
     - Validate the field type or format
     - Test different response scenarios
   - Categorize fields as:
     - **Covered**: Field is validated in tests
     - **Partially covered**: Field is accessed but not fully validated
     - **Not covered**: Field is never checked

5. **Identify scenario coverage**:
   - **Positive tests**: Happy path scenarios
   - **Negative tests**: Error handling, validation failures
   - **Edge cases**: Boundary values, optional fields, null handling
   - **Integration**: Cross-domain interactions

### Step 7: Calculate Coverage Metrics

For the analyzed domain/endpoints:

1. **Endpoint coverage**:
   - Total endpoints: Count of endpoints after filters
   - Covered endpoints: Endpoints with at least one test
   - Uncovered endpoints: Endpoints with no tests
   - Coverage percentage: (Covered / Total) \* 100

2. **Field coverage** (per endpoint):
   - Total request fields: Count of all request schema fields
   - Covered request fields: Fields set/tested in tests
   - Request field coverage: (Covered / Total) \* 100
   - Total response fields: Count of all response schema fields
   - Covered response fields: Fields validated in tests
   - Response field coverage: (Covered / Total) \* 100

3. **Scenario coverage** (per endpoint):
   - Has positive tests: YES/NO
   - Has negative tests: YES/NO
   - Has edge case tests: YES/NO

### Step 8: Generate Coverage Report

Create a markdown report in: `reports/report-api-coverage-{domain}-{timestamp}.md`

Format: `report-api-coverage-offers-20260212-143022.md`

#### Report Structure

```markdown
# API Test Coverage Report

**Domain**: {domain}
**Generated**: {timestamp}
**API Filter**: {specific API if provided, otherwise "All"}
**Version Filter**: {version if provided, otherwise "All"}

---

## Executive Summary

- **Total Endpoints Analyzed**: {count}
- **Endpoints with Tests**: {count} ({percentage}%)
- **Endpoints without Tests**: {count} ({percentage}%)
- **Average Request Field Coverage**: {percentage}%
- **Average Response Field Coverage**: {percentage}%

---

## Coverage Details

### 1. {HTTP Method} {API Path}

**API Version**: {version}
**Tags**: {tags}
**Description**: {summary from swagger}

#### Coverage Status: ✅ COVERED | ⚠️ PARTIAL | ❌ NOT COVERED

#### Test Files

- [{filepath}]({filepath}) - {test count} test cases
  - `tc-C1234567`: {test name}
  - `tc-C1234568`: {test name}

#### Request Field Coverage ({percentage}%)

| Field Name       | Type    | Required | Coverage Status | Notes                 |
| ---------------- | ------- | -------- | --------------- | --------------------- |
| `field_name`     | string  | Yes      | ✅ Covered      | Tested in tc-C1234567 |
| `nested.field`   | number  | No       | ⚠️ Partial      | Set but not validated |
| `optional_field` | boolean | No       | ❌ Not Covered  | Never used in tests   |

#### Response Field Coverage ({percentage}%)

| Field Name      | Type   | Coverage Status | Notes                     |
| --------------- | ------ | --------------- | ------------------------- |
| `response_id`   | string | ✅ Covered      | Validated in tc-C1234567  |
| `status`        | string | ✅ Covered      | Checked in multiple tests |
| `metadata.info` | object | ❌ Not Covered  | Never validated           |

#### Scenario Coverage

- ✅ **Positive Tests**: Happy path covered
- ⚠️ **Negative Tests**: Some error cases missing
- ❌ **Edge Cases**: No boundary testing found

#### Identified Gaps

- Missing validation for optional fields
- No tests for error response {status code}
- Nested object fields not validated
- No tests for array item validation

---

### 2. {Next API endpoint}

...

---

## Untested Endpoints

The following endpoints have NO test coverage:

### {HTTP Method} {API Path}

**Version**: {version}
**Description**: {summary}
**Impact**: {HIGH/MEDIUM/LOW based on importance}

---

## Recommendations

### High Priority

1. **Create tests for uncovered critical endpoints**
   - {HTTP Method} {API Path} - {reason why critical}
   - {HTTP Method} {API Path} - {reason why critical}

2. **Improve field validation coverage**
   - {Endpoint}: Validate response fields {list fields}
   - {Endpoint}: Test all required request fields

### Medium Priority

3. **Add negative test scenarios**
   - {Endpoint}: Test error case {scenario}
   - {Endpoint}: Validate error responses

4. **Test edge cases**
   - {Endpoint}: Test with optional fields omitted
   - {Endpoint}: Test boundary values for {field}

### Low Priority

5. **Enhance existing tests**
   - {Endpoint}: Add assertions for {field}
   - {Endpoint}: Test nested object validation

---

## Appendix

### Test File Locations

Integration tests:

- `tests/integration/{domain}/`

Legacy integration tests:

- `tests/integration-domain-split/{domain}/`

### API Documentation Source

- `docs/API/{domain}-swagger.json`

### Analysis Criteria

- **Covered**: Field is set in request or validated in response
- **Partial**: Field is used but not thoroughly tested
- **Not Covered**: Field never appears in test code
```

### Step 9: Provide Summary to User

After generating the report, provide a concise summary:

1. Report file location
2. Key statistics (total endpoints, coverage percentage)
3. Number of critical gaps identified
4. Top 3-5 recommendations
5. Suggest next steps for improving coverage

## Tips for Effective Analysis

### Identifying Test Coverage

When searching for test coverage, look for:

- **Direct API path strings**: `"/api/2.0/offers/management/create"`
- **Factory method calls**: `offersFactory.createOffer()`, `offersFactory.deactivateOffer()`
- **Service layer calls**: `offersManagementService.create()`
- **HTTP client calls**: `.post()`, `.get()`, `.put()`, `.delete()` with path segments
- **Variable names**: `createOfferRequest`, `offerResponse`, `deactivatePayload`
- **Test descriptions**: Keywords from API summary/description
- **Model classes**: `CreateOfferRequestModel`, `OfferResponseModel`

### Understanding Schema References

Swagger/OpenAPI uses `$ref` to reference shared schemas:

```json
{
  "$ref": "#/components/schemas/CreateOfferRequest"
}
```

Always resolve these references by:

1. Extracting the schema name
2. Looking up in `components.schemas` or `definitions`
3. Recursively resolving nested references

### Handling Different Formats

**OpenAPI 3.0**:

- Schemas in: `components.schemas`
- Request body in: `requestBody.content.application/json.schema`

**Swagger 2.0**:

- Schemas in: `definitions`
- Request body in: `parameters` array with `in: "body"`

### Field Coverage Heuristics

**Request Field Covered if**:

- Field name appears in test file (exact match or camelCase/snake_case variant)
- Field is in test data objects
- Field is in factory override objects: `DeepPartial<Request>`
- Field is mentioned in test descriptions

**Response Field Covered if**:

- Field is used in assertions: `expect(response.field)`
- Field is accessed via getter: `model.getFieldName()`
- Field is compared against expected values
- Field is extracted and used in subsequent logic

## Common Patterns in sm-peeves Tests

### Factory Pattern

Tests use OpenAPI factories from `src/clients/{domain}/factory/`:

```typescript
const factory = new V2OffersManagementFactory();
await factory.createOffer(overrides);
const offer = factory.getCreatedOffer();
const offerId = offer.getOfferId();
```

Look for:

- Factory class imports
- Factory method calls (e.g., `createOffer`, `updateOffer`)
- Override objects with field names
- Getter method calls on models

### API Service Layer

Tests may call service layer from `src/clients/{domain}/routes/`:

```typescript
const service = new V2OffersManagementService();
const response = await service.create(payload);
```

### Direct API Calls

Some tests make direct HTTP calls:

```typescript
await axiosClient.post('/api/2.0/offers/management/create', payload);
```

## Troubleshooting

| Issue                             | Solution                                                                  |
| --------------------------------- | ------------------------------------------------------------------------- |
| Swagger file not found            | Check `docs/API/` for correct filename: `{domain}-swagger.json`           |
| No test files found               | Verify domain name matches folder in `tests/integration/`                 |
| Cannot parse $ref                 | Resolve references by looking up in `components.schemas` or `definitions` |
| Test file doesn't import endpoint | Search for path segments, factory methods, or related keywords            |
| Too many endpoints                | Apply version or specific API filters to narrow scope                     |
| Mixed swagger/openapi versions    | Handle both formats - check for `openapi` vs `swagger` field              |

## Example Usage

### Example 1: Full Domain Coverage

**User Request**: "Check API coverage for offers domain"

**Steps**:

1. Load `docs/API/offers-swagger.json`
2. Parse all endpoints (no filters)
3. Search tests in `tests/integration/offers/` and `tests/integration-domain-split/offers/`
4. Analyze coverage for all endpoints
5. Generate report: `reports/report-api-coverage-offers-20260212-143022.md`

### Example 2: Specific Version

**User Request**: "Check API coverage for catalog domain version 2.0"

**Steps**:

1. Load `docs/API/catalog-swagger.json`
2. Filter endpoints: Only paths containing `/api/2.0/`
3. Search tests related to v2.0 catalog APIs
4. Analyze coverage for v2.0 endpoints only
5. Generate report: `reports/report-api-coverage-catalog-20260212-143530.md`

### Example 3: Specific Endpoint

**User Request**: "Check coverage for incentives points account APIs"

**Steps**:

1. Load `docs/API/incentives-swagger.json`
2. Filter endpoints: Paths containing `/points/account`
3. Search tests for points account functionality
4. Analyze coverage for matched endpoints only
5. Generate report: `reports/report-api-coverage-incentives-20260212-144015.md`

## References

### Project Documentation

- [AGENTS.md](../../../AGENTS.md) - Project overview and structure
- [test-creation.instructions.md](../../instructions/test-creation.instructions.md) - Test creation guidelines

### Related Skills

- [test-coverage-analyzer](../test-coverage-analyzer/SKILL.md) - General test coverage analysis

### API Documentation

- OpenAPI Specification: https://spec.openapis.org/oas/v3.0.0
- Swagger 2.0 Specification: https://swagger.io/specification/v2/
