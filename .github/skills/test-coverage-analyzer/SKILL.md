---
name: test-coverage-analyzer
description: 'Analyzes test coverage for specific functionality in the sm-peeves project. Use when asked to analyze test coverage, assess what tests exist for a feature, or identify testing gaps. Examines integration tests (tests/integration, tests/integration-domain-split) and e2e tests (tests/e2e, tests/triggers) separately and provides detailed coverage reports.'
---

# Test Coverage Analyzer

A specialized skill for analyzing test coverage of specific functionality within the sm-peeves testing repository. This skill examines integration and end-to-end tests to assess coverage and identify gaps.

## When to Use This Skill

- User asks to analyze test coverage for a specific feature or functionality
- Need to assess what tests exist for a particular component or API
- Identifying gaps in integration or e2e test coverage
- Comparing test coverage across different test types
- Generating detailed coverage reports for specific functionality

## Prerequisites

- Access to the sm-peeves repository
- Understanding of the functionality to be analyzed (from Jira, Confluence, or other context)
- Read access to test directories:
  - `tests/integration/` - Integration tests
  - `tests/integration-domain-split/` - Domain-specific integration tests
  - `tests/e2e/` - End-to-end tests
  - `tests/triggers/` - Trigger-based e2e tests

## Analysis Approach

### Step 1: Understand the Functionality Context

Before analyzing coverage, gather information about the functionality:

- Feature name and description
- API endpoints involved
- Components/modules affected
- Business logic and workflows
- Data models and database interactions
- Expected behaviors and edge cases

### Step 2: Analyze Integration Test Coverage

Search and analyze tests in:

- `tests/integration/`
- `tests/integration-domain-split/`

Look for:

- Test files related to the functionality (by name, imports, or API calls)
- Test cases covering different scenarios
- Positive test cases (happy path)
- Negative test cases (error handling, validation)
- Edge cases and boundary conditions
- Data setup and teardown patterns
- Mock and stub usage
- Database interaction tests
- API contract validation

### Step 3: Analyze E2E Test Coverage

Search and analyze tests in:

- `tests/e2e/`
- `tests/triggers/`

Look for:

- Complete workflow tests
- User journey scenarios
- Cross-component integration
- Real-world use cases
- Performance and load considerations
- Trigger-based workflows
- Event-driven scenarios

### Step 4: Identify Coverage Gaps

For each test category, identify:

- Missing test scenarios
- Untested code paths
- Error handling gaps
- Edge cases not covered
- Integration points not tested
- Missing validation tests
- Documentation gaps in tests

### Step 5: Generate Coverage Report

Structure the report with:

#### Integration Test Coverage

- **Files Found**: List of test files related to the functionality
- **Test Cases**: Summary of test cases and what they cover
- **Coverage Assessment**: What is tested vs. what should be tested
- **Gaps Identified**: Missing tests and scenarios
- **Code Examples**: Snippets of relevant test code
- **Recommendations**: Specific tests that should be added

#### E2E Test Coverage

- **Files Found**: List of e2e test files related to the functionality
- **Test Scenarios**: Summary of end-to-end scenarios covered
- **Coverage Assessment**: What workflows are tested vs. what should be tested
- **Gaps Identified**: Missing workflows and user journeys
- **Code Examples**: Snippets of relevant test code
- **Recommendations**: Specific e2e tests that should be added

## Search Strategies

### Finding Relevant Tests

Use multiple search strategies to find all relevant tests:

1. **Keyword Search**: Search for functionality name, feature flags, API endpoints
2. **File Path Patterns**: Look for test files matching naming conventions
3. **Import Statements**: Find files importing specific helpers or clients
4. **API Endpoint Patterns**: Search for HTTP method calls and route patterns
5. **Database Table References**: Look for tests querying specific tables
6. **Component Names**: Search for references to specific components or services

### Search Examples

```typescript
// Search for API endpoint tests
grep_search: 'POST /api/v1/campaigns';

// Search for specific functionality
grep_search: 'campaign.*creation';

// Search for specific helpers
grep_search: 'import.*CampaignHelper';

// Search for database operations
grep_search: 'INSERT INTO campaigns';
```

## Coverage Metrics

When reporting coverage, include:

- **Test Count**: Number of test files and test cases found
- **Scenario Coverage**: Percentage of expected scenarios covered
- **Code Path Coverage**: Estimate of code paths tested
- **Edge Case Coverage**: Number of edge cases tested
- **Error Handling**: Coverage of error scenarios
- **Priority Assessment**: High/Medium/Low priority gaps

## Reporting Format

Generate a structured report with these sections:

```markdown
## Integration Test Coverage

### Overview

[Summary of integration test coverage for the functionality]

### Test Files Analyzed

- [List of test files found]

### Coverage Details

[Detailed breakdown of what is tested]

### Gaps and Recommendations

[Specific gaps identified with recommendations]

## E2E Test Coverage

### Overview

[Summary of e2e test coverage for the functionality]

### Test Files Analyzed

- [List of e2e test files found]

### Coverage Details

[Detailed breakdown of workflows tested]

### Gaps and Recommendations

[Specific gaps identified with recommendations]

## Summary

### Overall Coverage Assessment

[High-level summary of coverage]

### Priority Recommendations

[Top 3-5 most important tests to add]
```

## Best Practices

1. **Be Thorough**: Search multiple times with different keywords to find all relevant tests
2. **Read Actual Test Code**: Don't rely solely on file names; read test implementations
3. **Consider Test Quality**: Not just whether tests exist, but whether they're comprehensive
4. **Identify Patterns**: Look for testing patterns used in similar features
5. **Be Specific**: Provide concrete examples and specific recommendations
6. **Prioritize**: Rank gaps by importance and risk
7. **Context Matters**: Consider the functionality's criticality and complexity

## Troubleshooting

### No Tests Found

- Broaden search terms (use wildcards, partial matches)
- Search for related functionality that might test the same code paths
- Look for parent/child components or services
- Check different test directories

### Too Many Tests Found

- Narrow search with more specific terms
- Filter by file path patterns
- Focus on most relevant matches
- Group by test type or scenario

### Unclear Coverage

- Read the actual test implementations
- Look for setup and teardown code
- Check test descriptions and comments
- Review assertions to understand what's validated

## References

For test structure and patterns, refer to:

- [test-creation.instructions.md](../../instructions/test-creation.instructions.md)
- Project README for test execution
- Existing test files as examples

## Notes

- This skill is read-only; it analyzes but does not create or modify tests
- Analysis quality depends on understanding the functionality context
- Coverage assessment is qualitative; use judgment based on complexity
- Consider both functional and non-functional testing requirements
