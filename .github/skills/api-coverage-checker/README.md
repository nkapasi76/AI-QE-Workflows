# API Coverage Checker

Specialized agent skill for analyzing API test coverage by comparing swagger/openapi documentation with integration test files.

## Quick Start

Ask GitHub Copilot to check API coverage for a specific domain:

```
Check API coverage for the offers domain
```

## Usage Examples

### Full Domain Analysis

```
Check API coverage for catalog domain
```

### Specific Version

```
Check API coverage for offers domain version 2.0
```

### Specific Endpoint

```
Check coverage for incentives points account APIs
```

## Parameters

- **Domain** (required): `catalog`, `incentives`, `offers`, `transactions`
- **Version** (optional): `1.0`, `2.0`, `3.0`, etc.
- **Specific API** (optional): Path pattern like `/points/account`

## Output

The agent generates a detailed markdown report in the `reports/` folder:

```
reports/report-api-coverage-{domain}-{timestamp}.md
```

## Report Contents

- Executive summary with coverage statistics
- Detailed analysis per API endpoint
- Request and response field coverage
- Scenario coverage (positive, negative, edge cases)
- List of untested endpoints
- Prioritized recommendations for coverage improvements

## Related Skills

- [test-coverage-analyzer](../test-coverage-analyzer/SKILL.md) - General test coverage analysis for features

## Documentation

See [SKILL.md](SKILL.md) for complete instructions and workflow details.
