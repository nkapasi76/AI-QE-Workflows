---
description: 'Guidelines for Creating New Jest Test Cases for Integration and E2E Testing'
applyTo: '**/*.test.ts, **/*.spec.ts'
---

# Test Creation Guidelines (Canonical Policy)

## Purpose

This document is the **single source of truth** for mandatory test-authoring standards in this repository.

For non-normative examples and recipes, use:

- `docs/testing/test-authoring-cookbook.md`

---

## Scope

These rules apply to:

- New and updated integration tests
- New and updated trigger-based E2E tests
- AI-generated tests and human-authored tests

---

## Test Locations

### AI-generated tests (required)

All new AI-generated tests must be created under `tests-ai/`.

### Integration tests

Path format:
`tests-ai/integration/{domain}/{version}/{feature-area}/{feature-name}.test.ts`

Supported domains:

- `catalog`
- `cloudpos`
- `composer`
- `incentives`
- `offers`
- `transactions`
- `user-service`

### Trigger-based E2E tests

Path format:
`tests-ai/triggers/{trigger-type}/{scenario-description}-e2e.test.ts`

Trigger types:

- `points`
- `transactions`
- `offers`
- `webhooks`

---

## Core Principles

1. **Prefer OpenAPI framework code in `src/` over `lib/`**
2. **Use TypeScript 5.x and ES2022 patterns**
3. **Use async/await and arrow functions**
4. **Use `undefined`, never `null`**
5. **Write maintainable, cleanup-safe, independently runnable tests**

---

## Source Priority (Required)

Use this reuse order whenever possible:

1. `src/clients/{domain}/factory/*Factory.ts`
2. `src/clients/{domain}/routes/*Service.ts`
3. `src/gen/clients/{domain}-gen/types/*.ts`
4. `src/clients/{domain}/data/*.ts`
5. `src/clients/{domain}/helpers/*.ts`
6. `src/clients/{domain}/types/*Model.ts`
7. `lib/**` only when no viable `src/` alternative exists (document why)

---

## Allowed vs Disallowed Changes

### Allowed

- `*.test.ts` / `*.spec.ts` files
- Test fixtures/data strictly needed for test scenarios
- Test documentation in test files

### Disallowed

- Creating new framework components in `src/clients/**`
- Creating new generic framework helpers as part of test authoring
- Pulling from `lib/**` when equivalent `src/**` implementation exists

---

## Required Coding Standards

- Use async/await; do not use `.then()` chains
- Use arrow functions
- Use explicit typing; avoid `any`
- Prefer `DeepPartial<T>` for request overrides
- Use model getters instead of direct response property access
- No auxiliary utility function definitions inside test files

For TypeScript specifics, follow:

- `.github/instructions/typescript-5-es2022.instructions.md`

---

## Hook Placement and Order (Required)

Within each `describe()` block:

1. `beforeAll()`
2. `beforeEach()`
3. `afterEach()`
4. `afterAll()`

Additional rules:

- Hooks must appear near the top of the suite before tests
- Move repeated setup/cleanup into `beforeEach`/`afterEach`
- Repeated non-hook logic must be extracted outside test files

---

## Catalog Ingestion Constraint (Required)

`V3EnqueueCatalogJobsFactory.ingestDefaultProductCatalog()` is expensive.

Use it only when the scenario explicitly requires catalog ingestion behavior or cannot rely on existing catalog state.

---

## Tagging Rules

Top-level `describe()` must include structured tags:

- `tgt-{target}` (**required**)
- `feat-{feature}` (when applicable)
- `splat-{downstream}` (when applicable)

Examples:

- `describe('tgt-offers', () => {})`
- `describe('tgt-core feat-multiorg', () => {})`
- `describe('tgt-cloud-pos splat-incentives', () => {})`
- `describe('tgt-core feat-multiorg && feat-location-management', () => {})`

---

## Test Name and TestRail Rules

Each test must follow:
`test('tc-C{TestRailID} {Clear Description}', async () => {})`

Required:

- Include `tc-C{ID}` in every test name
- Use clear, action-oriented, present-tense descriptions
- Do not put the case ID again in the `describe` block name

---

## Required Documentation in Test Files

### Suite-level (`describe`)

Every `describe()` block must include an objective comment:

```typescript
/**
 * Objective: {Description of what this suite validates}
 */
```

### Test-level (`test`)

Every `test()` must include these tags:

- `@testcase`
- `@scenario`
- `@expected`

Required structure:

```typescript
/**
 * @testcase tc-C{TestRailID}
 * @scenario {High-level description — what, not how, one concise sentence, active voice}
 * @expected {Success criteria — start with HTTP status if applicable, describe final system state}
 *
 * Test Flow:
 * 1. {Step one}
 * 2. {Step two}
 * 3. {Step three}
 *
 * Prerequisites:
 * - {Optional — required setup state}
 *
 * Dependencies:
 * - {Optional — external systems or APIs}
 *
 * Notes:
 * - {Optional — known limitations or environment constraints}
 */
```

---

## Cleanup Requirements

Tests must clean up all created resources.

Use:

- `afterEach()` for per-test resources
- `afterAll()` for suite-level resources

No test should leave persistent artifacts that can affect later runs.

---

## Environment and Conditional Execution

- Use environment variables for environment-specific values
- Avoid hardcoded IDs, tenant values, or endpoint assumptions
- Use conditional skip behavior only when scenario requirements justify it

---

## Running Tests (Canonical Commands)

```bash
# Run all AI-generated integration tests
npm test -- tests-ai/integration/

# Run all AI-generated trigger tests
npm test -- tests-ai/triggers/

# Run a specific test file
npm test -- tests-ai/integration/offers/v2/management/offer-management-crud.test.ts

# Run by TestRail case ID
npm test -- --testNamePattern="tc-C1234567"

# Run in-band when needed
npm test -- --runInBand tests-ai/integration/
```

---

## Quality Checklist (Release Gate)

Before submitting a test change, verify:

- [ ] Test file is in correct `tests-ai/` location
- [ ] Naming follows required path and file conventions
- [ ] Imports favor `src/` (not `lib/`, unless documented exception)
- [ ] Uses OpenAPI factories/services/types where available
- [ ] Includes suite objective comments on each `describe()`
- [ ] Includes `@testcase`, `@scenario`, `@expected` for each `test()`
- [ ] Includes TestRail case IDs in test names
- [ ] Uses `DeepPartial<T>` for request overrides where applicable
- [ ] Uses model getters for response validation
- [ ] Hook order is `beforeAll` → `beforeEach` → `afterEach` → `afterAll`
- [ ] Hooks are declared at top of suite
- [ ] Repeated setup/cleanup moved to hooks
- [ ] No auxiliary utility functions defined in test files
- [ ] Catalog ingestion is used only when explicitly needed
- [ ] Uses async/await (no `.then()`)
- [ ] Uses arrow functions
- [ ] Never uses `null` (use `undefined`)
- [ ] Assertions are clear and meaningful
- [ ] Uses environment variables instead of hardcoded environment values
- [ ] Test runs independently
- [ ] Test cleans up all created resources

---

## Related Documents

- Router: `AGENTS.md`
- Cookbook: `docs/testing/test-authoring-cookbook.md`
- TypeScript standards: `.github/instructions/typescript-5-es2022.instructions.md`

---

**Last Updated:** February 26, 2026  
**Maintained By:** Platform QA Team
