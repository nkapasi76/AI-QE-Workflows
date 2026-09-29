# Gherkin Style Guide and Output Formats (E2E Test Creator v3)

Both E2E Test Creator v3 agents follow this guide. It covers:
- the Gherkin in Appendix A of the test plan;
- `gherkin-scenarios-[RUN-KEY].json`;
- `testrail-cases-[RUN-KEY].json`.

## 1. Test Structure

Each test is one end-to-end journey written as flat Gherkin. **Don't use `Feature:`, `Background:`, `Scenario:`, or `@tag` lines.** The test's ID, title, priority, and references live in the test plan and the JSON, not in the Gherkin.

```
GIVEN <setup>                  ← one GIVEN block: every fixture the test needs
AND <setup>
WHEN <action> [with:]          ← step 1
   <param>
[(retriable)]
THEN <assertion>
AND <assertion>
WHEN <action>                  ← step 2
...
```

## 2. Keywords

- Allowed keywords, in uppercase at the start of a line: `GIVEN`, `WHEN`, `THEN`, `AND`, `BUT`.
- `AND` continues whichever keyword came before it. `AND` after a `WHEN` is a further action in the same step; `AND` after a `THEN` is a further assertion.
- **Step pattern:**
  - The test starts with one `GIVEN` block.
  - Then comes one or more **WHEN blocks**. Each is a `WHEN` line with its `AND` lines, parameters, and optional `(retriable)`, followed by a **THEN block** (a `THEN` line and its `AND`/`BUT` lines).
  - Every WHEN block must have a THEN block.
- **Step numbers:** "step N" means the Nth WHEN block. This is also the Nth TestRail step, e.g. `transaction data matches the transaction sent in step 1`.

## 3. Setup (GIVEN block)

- **Declare every entity once**, with a short symbolic ID and its key properties in parentheses:
  - `GIVEN Offer O1 (poolable, physical_fulfilment, no restrictions)`
  - `AND PointAccount PA1 (poolable, allow_negative, no restrictions)`
  - `AND User U1`
- **Use the sources' own fixture names and values** when they define them (e.g. `Product MUG-RED (ACTIVE, $24.00, stock 5)`, `Sandbox payment token tok_decline`).
- **Relationships and rules** go in nested lines under a line ending in `WITH:`:
  ```
  AND RuleTrees attached to TL1 WITH:
     transaction rule -- if user makes purchase with payment type CARD, award 100 points per 5 dollars spent from PS to PA1
  ```
- **Environment controls** also go in the GIVEN block, when the sources provide them (e.g. `AND the clock is frozen at T0`, `AND stock, orders and promo redemptions are reset`).

## 4. Actions (WHEN blocks)

- Name the exact call or UI action, and who performs it: `WHEN POS send_transaction is called at time T1 with:`, `WHEN /balance is called with:`, `WHEN U1 opens the Offers wallet`.
- **Parameters:** a line ending in `with:` is followed by one parameter per line, indented 3 spaces. Nested lists are indented 3 more.
  ```
  WHEN POS send_transaction is called at time T1 with:
     is_closed: true
     user ID U2
     transaction ID POSID1
     payment type CARD
     subtotal 25
  ```
- **Repeated calls:** use `AND` for several calls in one step, then assert with `THEN for all responses: …`.
- **Retries:** for eventually consistent reads, put `(retriable)` on its own line after the last parameter. The runner polls until a bounded deadline; tests never use fixed waits.
- **Time points:** name them `T1`, `T2`, … and use them for ordering and time-window assertions.

## 5. Assertions (THEN blocks)

- **Exact outcomes:** status codes (`THEN status 200 OK`), payload shape (`AND payload empty`), and field values, balances, counts, and states.
- **Final state, not just the response:** assert persisted state through the calls the sources document, such as balances, audit logs, timelines/events, user offers, orders, payments, and inventory.
- **Captured values:** when a generated value first appears, give it a symbolic name, then refer to it later:
  - `AND transaction has transaction ID TXID1`
  - `AND useroffer UO1 of O1 is returned`
  - `AND for PA1 2 records are returned (PAL1, PAL2)`
- **Record details:** list each record's fields as nested lines:
  ```
  AND PAL1 has:
     audit_type 2
     modification_type "Household Transfer"
     modification -500
  ```
- **Ordered events:** `THEN the following events are returned, chronologically:` followed by one event per nested line.
- **Unknowns:** if the sources don't define an expected value, wrap your best statement of it in `?…?`, e.g. `AND ?status redeemed?`. List each one in Appendix C of the test plan. Never invent values, and never write "X or Y" expectations.

## 6. Scope of One Test

- One test covers one journey. It may span several time points and actors (e.g. earn → pool → auto-purchase → redeem by another member).
- **Boundaries:** give each boundary value its own test, or put one WHEN/THEN block per value in a single test when the values share setup.
- **Concurrency:** name each actor or session (`Session A`, `Session B`), and assert the single allowed outcome plus the final state (e.g. balance never negative, exactly one charge).
- **Cleanup:** needed only if the sources require it. Write it as a final WHEN/THEN block that verifies the reset state.

## 7. Test IDs and Names

- **IDs** follow the test plan:
  - `TC-001`, `TC-002`, …: functional tests, then edge cases, in one sequence;
  - `TC-S001`, …: security tests;
  - `TC-P001`, …: privacy tests.
- **testName** is `<ID>: <Title in Title Case>`, e.g. `TC-003: Redeem Points with Valid Amount`. It must be identical in the test plan heading, the JSON `testName`, and the TestRail `title`.

## 8. Gherkin JSON: `gherkin-scenarios-[RUN-KEY].json`

Write a JSON array with one object per **approved** test (never `Plan-only` items). Use **exactly** these keys:

```json
[
  {
    "testName": "TC-012: Household Points Pooling Triggers Autopurchase",
    "references": ["MLP-118", "TCOE-1844"],
    "gherkin": "GIVEN Offer O1 (poolable, physical_fulfilment, no restrictions)\nAND PointAccount PA1 (poolable, allow_negative, no restrictions)\nAND User U1\nAND User U2\nAND Household HH1 with admin U1 and member U2\nWHEN POS send_transaction is called at time T1 with:\n   is_closed: true\n   user ID U2\n   transaction ID POSID1\n   payment type CARD\n   subtotal 25\nTHEN status 200 OK\nAND payload empty\nWHEN get_transaction is called with:\n   POS transaction key POSID1\n(retriable)\nTHEN status 200 OK\nAND transaction data matches the transaction sent in step 1\nAND transaction has transaction ID TXID1"
  }
]
```

- `gherkin` is the test's full text as one JSON string.
  - Write line breaks as `\n` and quotes as `\"`. Never put raw line breaks inside a string.
  - Keep the 3-space indentation of parameter lines.
- `references` is a non-empty array of source IDs (Jira keys, BRD IDs such as `BR-06` or `NFR-03`, or design doc section IDs). Never invent Jira keys.

## 9. TestRail Payloads: `testrail-cases-[RUN-KEY].json`

Target API: `POST {TESTRAIL_URL}/index.php?/api/v2/add_case/{section_id}`

Write one entry per Gherkin JSON entry, in the same order:

```json
[
  {
    "scenarioId": "TC-012",
    "sectionId": null,
    "payload": {
      "title": "TC-012: Household Points Pooling Triggers Autopurchase",
      "template_id": 2,
      "type_id": 3,
      "priority_id": 4,
      "refs": "MLP-118,TCOE-1844",
      "custom_automation": 3,
      "custom_preconds": "A household member earns points that pool to the household account.\nGIVEN Offer O1 (poolable, physical_fulfilment, no restrictions)\nAND PointAccount PA1 (poolable, allow_negative, no restrictions)\nAND User U1\nAND User U2\nAND Household HH1 with admin U1 and member U2",
      "custom_steps_separated": [
        {
          "content": "WHEN POS send_transaction is called at time T1 with:\n   is_closed: true\n   user ID U2\n   transaction ID POSID1\n   payment type CARD\n   subtotal 25",
          "expected": "THEN status 200 OK\nAND payload empty"
        },
        {
          "content": "WHEN get_transaction is called with:\n   POS transaction key POSID1\n(retriable)",
          "expected": "THEN status 200 OK\nAND transaction data matches the transaction sent in step 1\nAND transaction has transaction ID TXID1"
        }
      ]
    }
  }
]
```

| Field                    | Rule                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `scenarioId`             | The test ID (`TC-012`)                                                                                  |
| `title`                  | Exactly the `testName`                                                                                  |
| `template_id`, `type_id`, `custom_automation` | From the agent's Configuration (defaults `2`, `3`, `3`)                            |
| `priority_id`            | The test plan priority, mapped `P1 → 4`, `P2 → 3`, `P3 → 2` (unless the configuration overrides it)    |
| `refs`                   | `references` joined with `,` (no spaces; 250 characters max)                                           |
| `custom_preconds`        | Line 1: a one-sentence summary of the journey. Then the whole GIVEN block exactly as written, including nested lines. |
| `custom_steps_separated` | One object per WHEN block. `content` runs from the `WHEN` line up to the line before `THEN`, including `AND` actions, parameters, and `(retriable)`. `expected` runs from the `THEN` line up to the line before the next `WHEN`. Lines are joined with `\n`, and indentation is kept. |
| `sectionId`              | `null` in the file. It's supplied at import time with `--section-id`.                                   |

## 10. Validation

Run these checks, and fix any failure before reporting the run as done:

```bash
jq empty reports/[RUN-KEY]/gherkin-scenarios-[RUN-KEY].json
jq empty reports/[RUN-KEY]/testrail-cases-[RUN-KEY].json
.github/skills/testrail/scripts/import-cases.sh reports/[RUN-KEY]/testrail-cases-[RUN-KEY].json --section-id 0   # dry-run
```

The dry-run checks required fields, WHEN/THEN structure, and duplicate titles. It lists any unresolved `?…?` or `[TBD]` markers as warnings. Also confirm that:
- both files have the same number of entries, in the same order;
- each `testName` equals the matching `payload.title`;
- `refs` equals `references` joined with `,`;
- rebuilding the Gherkin from `custom_preconds` (minus line 1) plus the steps reproduces the `gherkin` text;
- every Appendix A test that isn't `Plan-only` has a JSON entry, and no JSON entry lacks an Appendix A test.
