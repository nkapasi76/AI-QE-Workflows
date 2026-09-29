# API Test Coverage Report

**Domain**: offers  
**Generated**: 2026-02-12 14:30:22  
**API Filter**: All  
**Version Filter**: All

---

## Executive Summary

- **Total Endpoints Analyzed**: 45
- **Endpoints with Tests**: 38 (84.4%)
- **Endpoints without Tests**: 7 (15.6%)
- **Average Request Field Coverage**: 72.3%
- **Average Response Field Coverage**: 65.8%

---

## Coverage Details

### 1. POST /api/2.0/offers/management/create

**API Version**: 2.0  
**Tags**: OffersManagement  
**Description**: Create a new offer with specified configuration

#### Coverage Status: ✅ COVERED

#### Test Files

- [tests/integration/offers/v2/management/offer-management-crud.test.ts](../../../../tests/integration/offers/v2/management/offer-management-crud.test.ts) - 5 test cases
  - `tc-C1234567`: Create offer with fixed amount discount
  - `tc-C1234568`: Create offer with percentage discount
  - `tc-C1234569`: Create offer with BOGO configuration
  - `tc-C1234570`: Create offer with item restrictions
  - `tc-C1234571`: Validate required fields on creation

#### Request Field Coverage (85.7%)

| Field Name                         | Type    | Required | Coverage Status | Notes                        |
| ---------------------------------- | ------- | -------- | --------------- | ---------------------------- |
| `common_config.name`               | string  | Yes      | ✅ Covered      | Tested in all create tests   |
| `common_config.description`        | string  | No       | ✅ Covered      | Tested in tc-C1234567        |
| `common_config.start_date`         | string  | Yes      | ✅ Covered      | Factory default validated    |
| `common_config.end_date`           | string  | No       | ⚠️ Partial      | Set but not validated        |
| `offer_config.type`                | string  | Yes      | ✅ Covered      | Multiple types tested        |
| `offer_config.amount`              | number  | No       | ✅ Covered      | Tested for fixed_amount type |
| `offer_config.percentage`          | number  | No       | ✅ Covered      | Tested for percentage type   |
| `offer_config.max_discount`        | number  | No       | ❌ Not Covered  | Never used in tests          |
| `publish`                          | boolean | No       | ⚠️ Partial      | Factory default only         |
| `restrictions.user_segment_ids`    | array   | No       | ❌ Not Covered  | Never set in tests           |
| `restrictions.min_purchase_amount` | number  | No       | ⚠️ Partial      | Set once in tc-C1234570      |
| `all_items_eligible`               | boolean | No       | ✅ Covered      | Tested in multiple scenarios |
| `item_ids`                         | array   | No       | ✅ Covered      | Tested in tc-C1234570        |

#### Response Field Coverage (78.6%)

| Field Name                  | Type   | Coverage Status | Notes                                   |
| --------------------------- | ------ | --------------- | --------------------------------------- |
| `offer_id`                  | string | ✅ Covered      | Validated in all tests via getOfferId() |
| `status`                    | string | ✅ Covered      | Checked in multiple tests               |
| `common_config.name`        | string | ✅ Covered      | Validated against input                 |
| `common_config.description` | string | ⚠️ Partial      | Accessed but not validated              |
| `common_config.start_date`  | string | ⚠️ Partial      | Not explicitly validated                |
| `common_config.end_date`    | string | ❌ Not Covered  | Never checked                           |
| `offer_config`              | object | ✅ Covered      | Type-specific validation                |
| `created_at`                | string | ❌ Not Covered  | Never validated                         |
| `updated_at`                | string | ❌ Not Covered  | Never validated                         |
| `created_by`                | string | ❌ Not Covered  | Never validated                         |
| `version`                   | number | ❌ Not Covered  | Never validated                         |
| `metadata`                  | object | ❌ Not Covered  | Never accessed                          |

#### Scenario Coverage

- ✅ **Positive Tests**: Multiple happy path scenarios covered
- ✅ **Negative Tests**: Required field validation tested
- ⚠️ **Edge Cases**: Limited boundary testing (max values, empty arrays)

#### Identified Gaps

- Missing validation for optional fields: `max_discount`, `user_segment_ids`
- No tests for end_date boundary conditions
- Response metadata fields not validated
- No tests for audit fields (created_by, updated_at)
- Limited negative testing for invalid configurations

---

### 2. PUT /api/2.0/offers/management/update/{offer_id}

**API Version**: 2.0  
**Tags**: OffersManagement  
**Description**: Update an existing offer configuration

#### Coverage Status: ⚠️ PARTIAL

#### Test Files

- [tests/integration/offers/v2/management/offer-update.test.ts](../../../../tests/integration/offers/v2/management/offer-update.test.ts) - 2 test cases
  - `tc-C1234580`: Update offer name and description
  - `tc-C1234581`: Update offer dates

#### Request Field Coverage (42.9%)

| Field Name                  | Type   | Required | Coverage Status | Notes                            |
| --------------------------- | ------ | -------- | --------------- | -------------------------------- |
| `offer_id`                  | string | Yes      | ✅ Covered      | Path parameter used in all tests |
| `common_config.name`        | string | No       | ✅ Covered      | Tested in tc-C1234580            |
| `common_config.description` | string | No       | ✅ Covered      | Tested in tc-C1234580            |
| `common_config.start_date`  | string | No       | ✅ Covered      | Tested in tc-C1234581            |
| `common_config.end_date`    | string | No       | ✅ Covered      | Tested in tc-C1234581            |
| `offer_config`              | object | No       | ❌ Not Covered  | Never updated in tests           |
| `restrictions`              | object | No       | ❌ Not Covered  | Never updated in tests           |

#### Response Field Coverage (35.7%)

| Field Name      | Type   | Coverage Status | Notes                           |
| --------------- | ------ | --------------- | ------------------------------- |
| `offer_id`      | string | ✅ Covered      | Validated via getOfferId()      |
| `status`        | string | ⚠️ Partial      | Checked but not validated       |
| `common_config` | object | ⚠️ Partial      | Only name/description validated |
| `offer_config`  | object | ❌ Not Covered  | Never validated after update    |
| `updated_at`    | string | ❌ Not Covered  | Never validated                 |
| `version`       | number | ❌ Not Covered  | Never validated                 |

#### Scenario Coverage

- ⚠️ **Positive Tests**: Limited to name/description and date updates
- ❌ **Negative Tests**: No validation error testing
- ❌ **Edge Cases**: No boundary or special character testing

#### Identified Gaps

- No tests for updating offer_config
- No tests for updating restrictions
- Missing negative tests (invalid dates, wrong offer_id)
- No validation of version increment
- No tests for partial updates
- Missing edge cases (empty strings, special characters)

---

### 3. DELETE /api/2.0/offers/management/deactivate

**API Version**: 2.0  
**Tags**: OffersManagement  
**Description**: Deactivate an active offer

#### Coverage Status: ✅ COVERED

#### Test Files

- [tests/integration/offers/v2/management/offer-management-crud.test.ts](../../../../tests/integration/offers/v2/management/offer-management-crud.test.ts) - 1 test case
  - `tc-C1234585`: Deactivate an active offer
- Used in `afterAll()` cleanup in 15+ test files

#### Request Field Coverage (100%)

| Field Name | Type   | Required | Coverage Status | Notes                                  |
| ---------- | ------ | -------- | --------------- | -------------------------------------- |
| `offer_id` | string | Yes      | ✅ Covered      | Used in dedicated test and all cleanup |

#### Response Field Coverage (60.0%)

| Field Name       | Type   | Coverage Status | Notes                  |
| ---------------- | ------ | --------------- | ---------------------- |
| `offer_id`       | string | ✅ Covered      | Validated in test      |
| `status`         | string | ✅ Covered      | Verified as 'inactive' |
| `deactivated_at` | string | ❌ Not Covered  | Never validated        |
| `deactivated_by` | string | ❌ Not Covered  | Never validated        |
| `version`        | number | ❌ Not Covered  | Never validated        |

#### Scenario Coverage

- ✅ **Positive Tests**: Happy path covered
- ⚠️ **Negative Tests**: Limited to invalid offer_id
- ❌ **Edge Cases**: No testing of already inactive offers

#### Identified Gaps

- Missing validation of deactivation audit fields
- No test for deactivating already inactive offer
- No test for deactivating with active redemptions

---

## Untested Endpoints

The following endpoints have NO test coverage:

### POST /api/1.0/brokerconfig/configure_implementation_for_domain

**Version**: 1.0  
**Description**: Configure broker implementation for domain  
**Impact**: HIGH - Critical for environment setup

### GET /api/2.0/offers/reporting/redemption_stats

**Version**: 2.0  
**Description**: Retrieve offer redemption statistics  
**Impact**: MEDIUM - Reporting functionality

### POST /api/2.0/offers/management/bulk_create

**Version**: 2.0  
**Description**: Create multiple offers in a single request  
**Impact**: MEDIUM - Efficiency feature

### PUT /api/2.0/offers/management/bulk_update

**Version**: 2.0  
**Description**: Update multiple offers in a single request  
**Impact**: MEDIUM - Efficiency feature

### GET /api/2.0/offers/management/search

**Version**: 2.0  
**Description**: Search offers by various criteria  
**Impact**: HIGH - Core search functionality

### POST /api/2.0/offers/offers/issue_to_user_group

**Version**: 2.0  
**Description**: Issue offer to a group of users  
**Impact**: HIGH - Key distribution method

### DELETE /api/2.0/offers/offers/revoke_from_user

**Version**: 2.0  
**Description**: Revoke an issued offer from a user  
**Impact**: MEDIUM - Offer lifecycle management

---

## Recommendations

### High Priority

1. **Create tests for uncovered critical endpoints**
   - `POST /api/2.0/offers/management/bulk_create` - Bulk operations are commonly used
   - `GET /api/2.0/offers/management/search` - Search is a core feature
   - `POST /api/2.0/offers/offers/issue_to_user_group` - Key for offer distribution

2. **Improve field validation coverage**
   - `POST /api/2.0/offers/management/create`: Test `max_discount`, `user_segment_ids` fields
   - `PUT /api/2.0/offers/management/update/{offer_id}`: Add tests for `offer_config` and `restrictions` updates
   - All endpoints: Validate response audit fields (`created_by`, `updated_at`, etc.)

3. **Add missing negative test scenarios**
   - Test invalid request formats
   - Test authorization failures
   - Test validation error responses
   - Test business rule violations

### Medium Priority

4. **Add edge case testing**
   - Test boundary values (min/max amounts, dates)
   - Test with optional fields omitted
   - Test with empty arrays and objects
   - Test with special characters in strings
   - Test concurrent updates

5. **Enhance response validation**
   - Validate all returned fields, not just IDs and status
   - Check field types match schema
   - Validate nested object structures
   - Verify array item structures

6. **Test cross-domain integrations**
   - Offers with user segments (user-service integration)
   - Offers with item restrictions (catalog integration)
   - Offer redemption flows (cloudpos integration)

### Low Priority

7. **Improve test documentation**
   - Add more detailed Gherkin scenarios
   - Document test data requirements
   - Link to related TestRail test plans

8. **Add performance tests**
   - Test bulk operations with large datasets
   - Test search with various filter combinations
   - Test concurrent offer operations

---

## Appendix

### Test File Locations

Integration tests:

- `tests/integration/offers/`

Legacy integration tests:

- `tests/integration-domain-split/offers/`

### API Documentation Source

- `docs/API/offers-swagger.json`

### Analysis Criteria

- **Covered**: Field is set in request or validated in response
- **Partial**: Field is used but not thoroughly tested
- **Not Covered**: Field never appears in test code

### Coverage Calculation

- **Endpoint Coverage**: (Endpoints with at least 1 test) / (Total endpoints) × 100
- **Request Field Coverage**: (Fields explicitly set or tested) / (Total request fields) × 100
- **Response Field Coverage**: (Fields validated in assertions) / (Total response fields) × 100
- **Scenario Coverage**: Boolean indicators for positive/negative/edge case coverage

---

_Report generated by API Coverage Checker agent skill_  
_For questions or issues, refer to `.github/skills/api-coverage-checker/SKILL.md`_
