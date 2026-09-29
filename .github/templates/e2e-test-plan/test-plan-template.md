# Test Plan Template (E2E Test Creator v3)

Both E2E Test Creator v3 agents write `reports/[RUN-KEY]/test-plan-[RUN-KEY].md` using this template.

## Rules

- **Structure:**
  - Keep the section numbers, headings, and order exactly as shown below.
  - Leave out a subsection only when the sources give nothing for it. In that case, keep the heading and write `Not specified in sources`.
- **Content:**
  - Fill every section from the sources and the worker outputs only.
  - If something is unknown, mark it `[TBD]` in the text and add it to Appendix C. Never invent clients, users, environments, rates, or dates.
- **Header:** `Document Date` is the generation date. `Status` is `Draft - pending review` until the Phase 4 approval, then `Approved for import`.
- **Test cases (section 3.2):**
  - Every test case listed in 3.2, 3.5, or 3.6 has one full Gherkin test in Appendix A, with the same ID and title. The only exceptions are items marked `Plan-only`.
  - A test case can be `Plan-only` when it can't run as an E2E journey, e.g. a DB permission check, a retention policy, or a load test. It is listed with a reason, gets no Gherkin, and isn't included in the JSON or TestRail files.
  - Each test case has a single, deterministic expected result. If a source allows more than one outcome (e.g. "error or fallback"), write the expectation as `?…?` and add it to Appendix C. Never write "X or Y".
- **Counts:** section 4.2 is computed from the test cases actually listed, never estimated.

## Template

~~~~markdown
# [Product/Client] - Comprehensive Test Plan

**Document Date:** [YYYY-MM-DD]
**Feature:** [Feature name]
**Version:** 1.0
**Status:** Draft - pending review
**Sources:** [BRD / design docs / Jira keys used]

## Executive Summary

[2–4 sentences: what the feature does, who it serves, and what this plan covers.]

## 1. Functional Understanding

### 1.1 What is the Feature Trying to Achieve?

[Problem today → what the solution delivers, as bullets.]

### 1.2 Business Value

- **[Value driver]:** [explanation]

### 1.3 Primary Users/Customers

**Internal Users:**
- [role]

**External Users:**
- [role / client type]

### 1.4 Primary Use Cases

**[Use case name]**
- [step or behaviour]

### 1.5 Edge Cases

- **[Edge case]:** [one-line description]

## 2. Technical Understanding

### 2.1 Components Involved

| Component | Responsibility | Status |
| --------- | -------------- | ------ |
| [name]    | [what it does] | Existing / NEW / Modified |

### 2.2 Dependencies

- [dependency; data stores/tables as nested bullets]

### 2.3 Integration Points

**[Source] → [Target]**
- Inbound: [payload/fields]
- Outbound: [response/fields]

### 2.4 Data Flows

**Happy Path: [name]**
```
1. [step]
   ↓
2. [step]
```

**Error Path: [name]**
```
1. [step]
```

**[Return / Recovery] Path: [name]**
```
1. [step]
```

### 2.5 APIs Being Modified/Created

**NEW / MODIFIED: [API name]**
Endpoint: `[METHOD /path]`

Request:
```json
{ }
```
Response:
```json
{ }
```

## 3. Testing Considerations

### 3.1 Acceptance Criteria

**[Capability group]**
- [criterion] ([reference IDs])

### 3.2 Scenarios That Must Pass

#### Functional Test Scenarios

**TC-001: [Title]**
- **Priority:** P1 | **References:** [IDs] | **Type:** Functional
- **Prerequisites:** [state and fixtures]
- **Steps:**
  1. [one line per WHEN block in the Gherkin]
- **Expected:**
  - [one line per key THEN assertion]

#### Edge Case Test Scenarios

**TC-0NN: [Title]**
- **Priority:** P2 | **References:** [IDs] | **Type:** Edge case
- ...

### 3.3 What Could Break?

**[Risk area]**
- [failure mode]

### 3.4 Rollback Scenarios

| Scenario | Rollback Action | Success Criteria |
| -------- | --------------- | ---------------- |

### 3.5 Security Implications

**Potential Vulnerabilities:**

**[Vulnerability]**
- Exploit: [how]
- Mitigation: [expected control]

**Security Test Cases:**

**TC-S001: [Title]**
- **Priority:** P1 | **References:** [IDs] | **Type:** Security
- **Prerequisites / Steps / Expected:** as in 3.2, or `Plan-only: [reason]`

### 3.6 Data Privacy Concerns

**Data Collected:**
- `[field]` - [sensitivity]

**Compliance Requirements:**
- [requirement, or [TBD]]

**Privacy Test Cases:**

**TC-P001: [Title]**
- **Priority:** P2 | **References:** [IDs] | **Type:** Privacy
- **Prerequisites / Steps / Expected:** as in 3.2, or `Plan-only: [reason]`

## 4. Test Execution Strategy

### 4.1 Test Environment

| Environment | Purpose | Data | Status |
| ----------- | ------- | ---- | ------ |

### 4.2 Test Coverage

- **Functional:** [n] core scenarios + [n] edge cases = [n] tests
- **Security:** [n] ([n] with Gherkin, [n] plan-only)
- **Privacy/Compliance:** [n] ([n] with Gherkin, [n] plan-only)
- **Performance:** [Plan-only / TBD, with reason]
- **Regression:** [scope]

### 4.3 Test Data Requirements

**Users for Testing:**
- [fixture]

**[Other fixture group]:**
- [fixture]

### 4.4 Exit Criteria

- [ ] [criterion]

## 5. Risk Assessment

| Risk | Probability | Impact | Mitigation |
| ---- | ----------- | ------ | ---------- |

## 6. Sign-off

**Feature Owner:** [TBD] **QA Lead:** [TBD]
**Test Date Range:** [TBD]
**Test Artifacts:** `reports/[RUN-KEY]/` (gherkin-scenarios, testrail-cases, sync-manifest)

## Appendix A: Gherkin Test Cases

### TC-001: [Title]

**References:** [IDs] | **Status:** Draft

```gherkin
GIVEN ...
WHEN ...
THEN ...
```

## Appendix B: Traceability and Status

| Reference | Requirement | Test cases | Coverage |
| --------- | ----------- | ---------- | -------- |

| ID | testName | Priority | Status | TestRail case | Jira ticket |
| -- | -------- | -------- | ------ | ------------- | ----------- |

## Appendix C: Open Questions and Assumptions

| # | Question / assumption | Affects | Owner |
| - | --------------------- | ------- | ----- |

*End of Test Plan*
~~~~
