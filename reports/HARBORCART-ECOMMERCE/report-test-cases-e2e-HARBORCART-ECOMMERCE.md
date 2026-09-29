# E2E Test Plan: HarborCart Ecommerce

**Run key:** `HARBORCART-ECOMMERCE` · **Agent:** Test Cases Creation - E2E Test Creator v3 (Docs), v3.1-docs · **Date:** 2026-09-29 · **Phase:** 4 (awaiting scenario approval)

## 1. Executive summary

**Sources:** two local, synthetic documents. The BRD (`specs/Ecommerce_BRD_Sample.md`, 17 business requirements, 5 NFRs, 3 business outcomes, 3 assumptions) and its companion architecture design (`specs/Ecommerce_Architecture_Design_Sample.md`, API contracts, state machines, failure handling, test hooks). Identical-content text exports exist in `docs/input/harborcart-ecommerce/`. The Markdown copies were used.

**Business value:** HarborCart's release 1 is about buying physical goods without overselling stock (BO-02) or charging twice (BO-03). The plan puts its p1 weight on those two outcomes. That means inventory reservation, idempotent order placement, payment decline/timeout recovery, and owner-only order access. Every scenario checks final persisted state (order, payment attempt, reservation, events) through the documented test API and event capture, as well as what the shopper sees. The BRD requires this in section 5.

**Scope:** 37 E2E scenarios (61 TestRail cases once Scenario Outlines are expanded) across guest and registered shoppers and support agents. They cover browse → cart → quote → pay → confirm → history → cancel, plus the alternate paths in BRD section 5. Out-of-scope features in BRD section 1 (subscriptions, gift cards, split tender, international shipping, returns after shipment, stored cards, partial shipments, and so on) get no scenarios. NFR-01 performance and the NFR-02 availability target are excluded as outside E2E scope.

**Headline:** 26 scenarios are free of TBDs and can be approved now. 11 depend on test hooks, fixtures or values the sources don't define (see section 7). The biggest gap is **BR-05 (stale cart)**. Both of its scenarios are blocked because no documented hook changes a catalog price or deactivates a SKU.

## 2. E2E strategy and user-experience context

- **Driving the system:** journeys run through the web app. They use the public `/api/v1` contracts where that is how the step actually happens, or where the sources only define API outcomes (status codes and `code` values such as `OUT_OF_STOCK`). The sources define no UI copy, so UI assertions describe visible state ("sees an order confirmation with an order number and total $61.84") rather than inventing message text.
- **Final-state oracle:** the design doc (section 7) provides authorized test APIs, event capture, a controllable clock, stock seeding/reset, sandbox payment and email providers, and a reconciliation trigger. `Then` steps use only these.
- **Async assertions:** always "eventually, within the configured async deadline". The deadline is an execution parameter, not a sleep, and its value is an open question (Q-01).
- **Money:** every expected amount was recomputed in integer cents with half-up rounding on aggregate discount and on tax (design doc section 3). The BRD oracle (MUG-RED × 2 + GIFT-001 × 1 with SAVE10 → **$61.84**) is asserted exactly in 001.
- **Determinism:** the clock is frozen at `2026-10-01T12:00:00Z` for expiry and ordering tests, matching the design doc's example `expiresAt` of `12:10:00Z`. Each test uses a unique shopper email and idempotency key, except intentional retry tests (BRD section 7).
- **Repo context:** this repository has no HarborCart coverage. `feature/Ecommerce.feature` holds a single rahulshettyacademy order scenario, and `tests/` / `pageobjects*/` target other demo sites, so none of their page objects apply. Their style (one-scenario features, `When → Then` blocks) is kept here.

## 3. Requirements traceability

| Reference | Scenarios (TBD-blocked in *italics*) |
| --- | --- |
| BO-01 | 001 |
| BO-02 | 008, 012, *020* |
| BO-03 | 009, 010 |
| A-01 | 034 |
| A-02 | *032* |
| A-03 | *025* |
| BR-01 | 001, 030 |
| BR-02 | 001, 031 |
| BR-03 | 001, *007*, 026, 027, 028, *029* |
| BR-04 | 002, 006, *007*, 028 |
| BR-05 | *032*, *033* |
| BR-06 | 001, 021, 022, 024, *025* |
| BR-07 | 001, 002, 015, 021, 022, *023* |
| BR-08 | 001, 002, 015, 021, 022, *023* |
| BR-09 | 001, 014, 015 |
| BR-10 | 001, 034, 035 |
| BR-11 | 008, 009, *020*, 036 |
| BR-12 | 001, 002, 009, 010, 011, 037 |
| BR-13 | 001, 008, 009, 012, 013, 017, *020* |
| BR-14 | 001, *016*, 017 |
| BR-15 | 001, 002, 004 |
| BR-16 | 017, *018*, *019* |
| BR-17 | 003, 004, *005*, 037 |
| NFR-02 | 009, *016*, *020* |
| NFR-03 | 003, *005*, 036 |
| NFR-04 | 035 |
| NFR-05 | 002, 012, 036 |
**Not covered as scenarios (with reason):**

| Reference | Part not covered | Reason |
| --- | --- | --- |
| NFR-01 | Search p95 < 500 ms, quote p95 < 800 ms | Performance/load is out of E2E scope. |
| NFR-02 | 99.9% monthly checkout availability; full 24-hour email retry window | Availability is out of E2E scope. Email retry *behavior* is covered in 016, but not the 24-hour duration. |
| NFR-03 | TLS; redaction of email/address in logs; retention policy | Transport and log content aren't user-visible; retention is undefined in the BRD. |
| NFR-05 | Correlation/order ID linking across logs | Needs log inspection, which isn't a documented test hook. The `correlationId` in the error envelope is asserted in 012. |
| BR-10 | "Do not place raw address in logs" | Log inspection isn't a documented test hook. |
| BR-13 | Expiry of an *abandoned* reservation | No public or test path creates an abandoned reservation. A reservation during a timed-out payment is held on purpose (see 020). |
| Design section 6 | Order write fails after authorization | Needs a fault-injection hook that isn't documented. |
| BR-06 | "One code per order" | The quote contract takes a single `promotionCode`, and no UI for multiple codes is described. |

## 4. User workflows and role coverage

| Persona / actor | Scenarios | Covered outcomes |
| --- | --- | --- |
| Registered shopper | 001, 003, 004, 006, 008–017, 021–029, 032–034, 036, 037 | Full purchase, history, cancellation, cart merge, recovery paths |
| Guest shopper | 002, 030, 031, 035 | Session cart checkout, guest order lookup with a one-time code, search, keyboard-only journey |
| Second shopper (attacker/competitor) | 003, 004, 012, 037 | Owner isolation, last-unit race, idempotency-key scoping |
| Customer support agent | 005 | Audited support access *(TBD)* |
| Warehouse service | 018, 019 | Fulfillment start closing cancellation *(TBD hooks)* |
| Payment provider (sandbox) | 008, 009, 010, 020, 036 | `tok_approve`, `tok_decline`, `tok_timeout`, token-only card handling |
| Notification provider (sandbox) | 001, 002, 016, 017 | Confirmation, verification code, and cancellation email; outage recovery |

**Journey map:**

- **Happy path:** 001 (registered), 002 (guest)
- **Alternative paths:** 006 (merge), 015 (requote), 017 (cancel), 032 (price change)
- **Error paths:**
  - 008 decline
  - 011 key conflict
  - 012–013 stock
  - 014 expiry
  - 024 promo
  - 033 unavailable item
  - 034 address
- **Recovery paths:**
  - 009 timeout → reconcile
  - 010 retry/refresh
  - 016 email outage
  - 020 unresolved payment past reservation expiry
- **Concurrency:**
  - 010 double submit
  - 012 last unit
  - 019 cancel vs fulfill
  - 028 cart revision

## 5. Gherkin E2E scenarios

All scenarios are **Draft** until approved at Human Gate #1.

### Primary journey

#### E2E-HARBORCART-ECOMMERCE-001: Registered shopper buys mugs and a gift item with SAVE10 and receives confirmation

**Status:** Draft · **Priority:** p1 · **References:** BR-01, BR-02, BR-03, BR-06, BR-07, BR-08, BR-09, BR-10, BR-12, BR-13, BR-14, BR-15, BO-01

```gherkin
Feature: Registered shopper buys mugs and a gift item with SAVE10 and receives confirmation

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the clock is frozen at "2026-10-01T12:00:00Z"
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5) and GIFT-001 (ACTIVE, $15.00, stock 20)
    And promotion SAVE10 is active
    And registered shopper "S1" with a unique email is signed in with an empty cart

  @E2E-HARBORCART-ECOMMERCE-001 @e2e @p1 @happy-path @user-journey @cross-functional
  Scenario: Registered shopper buys mugs and a gift item with SAVE10 and receives confirmation
    When S1 searches the catalog for "mug-red"
    Then MUG-RED appears in the search results
    When S1 opens the MUG-RED product details
    Then the page shows SKU "MUG-RED", its name, description, price $24.00 and a stock status
    When S1 adds MUG-RED with quantity 2 to the cart
    And S1 searches for "GIFT-001" and adds GIFT-001 with quantity 1 to the cart
    Then the cart shows MUG-RED × 2 and GIFT-001 × 1
    When S1 proceeds to checkout, enters the address "Pat Shopper, 100 Harbor St, Boston, MA 02110" with S1's email, and applies promotion code "SAVE10"
    Then the quote shows merchandise $63.00, discount $4.80, shipping $0.00, tax $3.64 and total $61.84
    And the quote expiresAt is "2026-10-01T12:10:00Z"
    When S1 confirms the quote and pays through the sandbox card widget, which yields token "tok_approve"
    Then S1 sees an order confirmation with an order number and total $61.84
    And the test API shows exactly one CONFIRMED order for S1 with a payment reference
    And the test API shows exactly one payment attempt, AUTHORIZED for 6184 cents
    And the reservation is ALLOCATED and available stock is MUG-RED 3 and GIFT-001 19
    And S1's cart no longer contains MUG-RED or GIFT-001
    And event capture shows exactly one OrderConfirmed event for the order
    And eventually, within the configured async deadline, the sandbox email provider holds exactly one confirmation email to S1's email
    When S1 opens order history
    Then the new order is listed first with total $61.84 and status CONFIRMED
```

#### E2E-HARBORCART-ECOMMERCE-002: Guest buys the last blue bag and later retrieves the order with a verification code

**Status:** Draft · **Priority:** p1 · **References:** BR-04, BR-07, BR-08, BR-12, BR-15, NFR-05

```gherkin
Feature: Guest buys the last blue bag and later retrieves the order with a verification code

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains BAG-BLUE (ACTIVE, $49.99, stock 1)
    And guest shopper "G1" has a new browser session and a unique email

  @E2E-HARBORCART-ECOMMERCE-002 @e2e @p1 @happy-path @user-journey @security
  Scenario: Guest buys the last blue bag and later retrieves the order with a verification code
    When G1 adds BAG-BLUE with quantity 1 to the session cart without signing in
    Then the session cart shows BAG-BLUE × 1
    When G1 checks out with the address "Pat Shopper, 100 Harbor St, Boston, MA 02110", G1's email and no promotion code
    Then the quote shows merchandise $49.99, discount $0.00, shipping $8.00, tax $3.62 and total $61.61
    When G1 pays with sandbox token "tok_approve"
    Then G1 sees an order confirmation with an order number and total $61.61
    And the test API shows one CONFIRMED guest order and BAG-BLUE available stock 0
    When G1, in a new browser session, requests an order lookup with the order number and G1's email
    Then eventually, within the configured async deadline, a one-time verification code is delivered to G1's email in the sandbox email provider
    When G1 submits the order number, G1's email and the verification code
    Then G1 sees the order with BAG-BLUE × 1 and total $61.61
    When G1 submits the same verification code a second time
    Then the order details are not shown
    When a lookup is attempted with the order number, a different email and G1's verification code
    Then the order details are not shown
    When an unauthenticated client requests GET /api/v1/orders
    Then no order list is returned
    And event capture for this journey contains no verification code values
```

### Role / permission

#### E2E-HARBORCART-ECOMMERCE-003: Shopper cannot view or cancel another shopper's order

**Status:** Draft · **Priority:** p1 · **References:** BR-17, NFR-03

```gherkin
Feature: Shopper cannot view or cancel another shopper's order

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" has a CONFIRMED order O1 for MUG-RED × 1 paid with "tok_approve"
    And registered shopper "S2" is signed in

  @E2E-HARBORCART-ECOMMERCE-003 @e2e @p1 @permissions @security @negative
  Scenario: Shopper cannot view or cancel another shopper's order
    When S2 requests GET /api/v1/orders/{O1 id}
    Then the response is 404
    When S2 opens O1's order detail URL in the web app
    Then S2 sees a not-found result and none of O1's details
    When S2 requests POST /api/v1/orders/{O1 id}/cancel
    Then the response is 404
    And the test API shows O1 still CONFIRMED, its payment attempt still AUTHORIZED and MUG-RED available stock 4
    When S2 opens order history
    Then O1 is not listed
```

#### E2E-HARBORCART-ECOMMERCE-004: Order history lists only the shopper's own orders, newest first

**Status:** Draft · **Priority:** p2 · **References:** BR-15, BR-17

```gherkin
Feature: Order history lists only the shopper's own orders, newest first

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the clock is frozen at "2026-10-01T12:00:00Z"
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5) and GIFT-001 (ACTIVE, $15.00, stock 20)
    And registered shoppers "S1" and "S2" each have a unique email

  @E2E-HARBORCART-ECOMMERCE-004 @e2e @p2 @user-role @permissions
  Scenario: Order history lists only the shopper's own orders, newest first
    When S1 places order A for MUG-RED × 1 with "tok_approve"
    And the clock advances 1 minute and S1 places order B for GIFT-001 × 1 with "tok_approve"
    And S2 places order C for GIFT-001 × 1 with "tok_approve"
    Then the test API shows orders A, B and C as CONFIRMED
    When S1 opens order history
    Then S1 sees exactly orders B and A, in that order
    When S2 opens order history
    Then S2 sees exactly order C
```

#### E2E-HARBORCART-ECOMMERCE-005: Support agent views a shopper's order through the audited support role

**Status:** Draft · **Priority:** p2 · **References:** BR-17, NFR-03 · **Open TBDs:** 2

```gherkin
Feature: Support agent views a shopper's order through the audited support role

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And registered shopper "S1" has a CONFIRMED order O1 for MUG-RED × 1 paid with "tok_approve"
    And support agent "A1" is signed in to the support console with <TBD: support role name and account provisioning>
    And registered shopper "S2" without the support role is signed in

  @E2E-HARBORCART-ECOMMERCE-005 @e2e @p2 @user-role @permissions @security
  Scenario: Support agent views a shopper's order through the audited support role
    When A1 looks up O1 in the support console
    Then A1 sees O1's details
    And an audit record of A1's access to O1 is available through <TBD: documented way to read support audit records>
    When S2 requests GET /api/v1/orders/{O1 id}
    Then the response is 404
```

#### E2E-HARBORCART-ECOMMERCE-006: Guest cart merges into the account cart at sign-in, capped at 10 per SKU

**Status:** Draft · **Priority:** p2 · **References:** BR-04

```gherkin
Feature: Guest cart merges into the account cart at sign-in, capped at 10 per SKU

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5) and GIFT-001 (ACTIVE, $15.00, stock 20)
    And registered shopper "S1" has an account cart containing MUG-RED × 7
    And S1 is signed out with an empty guest session cart

  @E2E-HARBORCART-ECOMMERCE-006 @e2e @p2 @user-journey @boundary
  Scenario: Guest cart merges into the account cart at sign-in, capped at 10 per SKU
    When S1, as a guest, adds MUG-RED × 4 and GIFT-001 × 1 to the session cart
    Then the session cart shows MUG-RED × 4 and GIFT-001 × 1
    When S1 signs in
    Then S1's account cart shows MUG-RED × 10 and GIFT-001 × 1
```

#### E2E-HARBORCART-ECOMMERCE-007: Cart merge is rejected when the combined cart would exceed 20 SKUs

**Status:** Draft · **Priority:** p3 · **References:** BR-03, BR-04 · **Open TBDs:** 1

```gherkin
Feature: Cart merge is rejected when the combined cart would exceed 20 SKUs

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains 21 distinct ACTIVE SKUs X1–X21 <TBD: 21 SKU fixtures; the BRD defines only 3 ACTIVE SKUs>
    And registered shopper "S1" has an account cart containing X1–X12, each × 1
    And S1 is signed out with a guest session cart containing X13–X21, each × 1

  @E2E-HARBORCART-ECOMMERCE-007 @e2e @p3 @negative @boundary
  Scenario: Cart merge is rejected when the combined cart would exceed 20 SKUs
    When S1 signs in
    Then the cart merge is rejected with 409
    And S1's account cart still contains exactly X1–X12, each × 1
    And the guest session cart still contains exactly X13–X21, each × 1
```

### Error / recovery

#### E2E-HARBORCART-ECOMMERCE-008: Declined payment releases reserved stock and creates no order

**Status:** Draft · **Priority:** p1 · **References:** BR-11, BR-13, BO-02

```gherkin
Feature: Declined payment releases reserved stock and creates no order

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" is signed in with a cart containing MUG-RED × 2
    And S1 has a valid quote q1 for address "Pat Shopper, 100 Harbor St, Boston, MA 02110" with no promotion and total $59.50

  @E2E-HARBORCART-ECOMMERCE-008 @e2e @p1 @negative @error-handling @recovery
  Scenario: Declined payment releases reserved stock and creates no order
    When S1 submits checkout for q1 with token "tok_decline" and a new Idempotency-Key
    Then the response is 422 with code "PAYMENT_DECLINED"
    And S1 sees that the payment was declined and no order confirmation is shown
    And the test API shows exactly one payment attempt, DECLINED, and no order for S1
    And the reservation is RELEASED and MUG-RED available stock is 5
    And event capture shows no OrderConfirmed event
```

#### E2E-HARBORCART-ECOMMERCE-009: Payment timeout stays pending until reconciliation, without a second charge

**Status:** Draft · **Priority:** p1 · **References:** BR-11, BR-12, BR-13, NFR-02, BO-03

```gherkin
Feature: Payment timeout stays pending until reconciliation, without a second charge

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" is signed in with a cart containing MUG-RED × 2
    And S1 has a valid quote q1 for address "Pat Shopper, 100 Harbor St, Boston, MA 02110" with no promotion and total $59.50

  @E2E-HARBORCART-ECOMMERCE-009 @e2e @p1 @error-handling @recovery
  Scenario: Payment timeout stays pending until reconciliation, without a second charge
    When S1 submits checkout for q1 with token "tok_timeout" and Idempotency-Key K1
    Then the response is 202
    And S1 sees a pending payment state and no order confirmation
    And GET /api/v1/checkout/requests/K1 returns state UNKNOWN
    And the test API shows the payment attempt UNKNOWN and the reservation HELD
    When S1 retries the same request with Idempotency-Key K1
    Then the response is the original 202 response
    And the test API shows exactly one payment attempt for K1
    When the reconciliation trigger runs
    Then eventually, within the configured async deadline, GET /api/v1/checkout/requests/K1 returns CONFIRMED or FAILED
    And if CONFIRMED, exactly one CONFIRMED order exists, the reservation is ALLOCATED, MUG-RED available stock is 3 and exactly one OrderConfirmed event is captured
    And if FAILED, no order exists, the reservation is RELEASED and MUG-RED available stock is 5
    And the test API still shows exactly one payment attempt for K1
```

#### E2E-HARBORCART-ECOMMERCE-010: Double submit and browser refresh create one order and one charge

**Status:** Draft · **Priority:** p1 · **References:** BR-12, BO-03

```gherkin
Feature: Double submit and browser refresh create one order and one charge

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" is signed in with a cart containing MUG-RED × 2
    And S1 has a valid quote q1 for address "Pat Shopper, 100 Harbor St, Boston, MA 02110" with no promotion and total $59.50

  @E2E-HARBORCART-ECOMMERCE-010 @e2e @p1 @concurrency @recovery @edge-case
  Scenario: Double submit and browser refresh create one order and one charge
    When S1 double-clicks Place order, so requests R1 and R2 with the same Idempotency-Key K1, quote q1 and token "tok_approve" are sent concurrently
    Then at most one of R1 and R2 returns 201, and every successful response carries the same order number
    And the test API shows exactly one CONFIRMED order and exactly one payment attempt, AUTHORIZED for 5950 cents
    And MUG-RED available stock is 3
    When S1 refreshes the browser after payment and the client re-sends the checkout request with Idempotency-Key K1
    Then the response is 200 with the same order number as the original response
    And S1 has exactly one order in order history and event capture shows exactly one OrderConfirmed event
```

#### E2E-HARBORCART-ECOMMERCE-011: Reusing an idempotency key with a different order is rejected

**Status:** Draft · **Priority:** p1 · **References:** BR-12

```gherkin
Feature: Reusing an idempotency key with a different order is rejected

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5) and GIFT-001 (ACTIVE, $15.00, stock 20)
    And registered shopper "S1" is signed in and has placed order O1 for MUG-RED × 2 with Idempotency-Key K1 and "tok_approve"
    And S1 has since added GIFT-001 × 1 to the cart and created quote q2 for address "Pat Shopper, 100 Harbor St, Boston, MA 02110" with total $24.44

  @E2E-HARBORCART-ECOMMERCE-011 @e2e @p1 @negative @error-handling
  Scenario: Reusing an idempotency key with a different order is rejected
    When S1 submits checkout for q2 with "tok_approve" and the same Idempotency-Key K1
    Then the response is 409 with code "IDEMPOTENCY_CONFLICT"
    And the test API shows S1 still has only order O1 and one payment attempt
    And GIFT-001 available stock is 20
    When S1 submits checkout for q2 with "tok_approve" and a new Idempotency-Key K2
    Then the response is 201 with an order number different from O1
```

#### E2E-HARBORCART-ECOMMERCE-012: Two shoppers race for the last blue bag and exactly one wins

**Status:** Draft · **Priority:** p1 · **References:** BR-13, BO-02, NFR-05

```gherkin
Feature: Two shoppers race for the last blue bag and exactly one wins

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains BAG-BLUE (ACTIVE, $49.99, stock 1)
    And registered shoppers "S1" and "S2" are signed in, each with a cart containing BAG-BLUE × 1 and a valid quote for address "Pat Shopper, 100 Harbor St, Boston, MA 02110" with total $61.61

  @E2E-HARBORCART-ECOMMERCE-012 @e2e @p1 @concurrency @negative @cross-functional
  Scenario: Two shoppers race for the last blue bag and exactly one wins
    When S1 and S2 submit checkout at the same moment, each with "tok_approve" and their own Idempotency-Key
    Then exactly one response is 201 with an order number
    And the other response is 409 with code "OUT_OF_STOCK", details.sku "BAG-BLUE" and a correlationId
    And the test API shows no payment attempt for the losing shopper
    And BAG-BLUE available stock is 0, never negative, with exactly one ALLOCATED reservation
    And event capture shows exactly one OrderConfirmed event
    When the losing shopper opens order history
    Then no order is listed
```

#### E2E-HARBORCART-ECOMMERCE-013: Ordering more than the available stock fails before any payment

**Status:** Draft · **Priority:** p1 · **References:** BR-13

```gherkin
Feature: Ordering more than the available stock fails before any payment

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" is signed in with a cart containing MUG-RED × 6
    And S1 has a valid quote q1 for address "Pat Shopper, 100 Harbor St, Boston, MA 02110" with no promotion and total $153.00

  @E2E-HARBORCART-ECOMMERCE-013 @e2e @p1 @negative @boundary
  Scenario: Ordering more than the available stock fails before any payment
    When S1 submits checkout for q1 with "tok_approve" and a new Idempotency-Key
    Then the response is 409 with code "OUT_OF_STOCK" and details.sku "MUG-RED"
    And S1 sees that MUG-RED is out of stock and no order confirmation is shown
    And the test API shows no payment attempt and no order for S1
    And MUG-RED available stock is 5
```

#### E2E-HARBORCART-ECOMMERCE-014: Quote is honored until expiry and refused after it without charging

**Status:** Draft · **Priority:** p1 · **References:** BR-09

```gherkin
Feature: Quote is honored until expiry and refused after it without charging

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the clock is frozen at "2026-10-01T12:00:00Z"
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" is signed in with a cart containing MUG-RED × 2

  @E2E-HARBORCART-ECOMMERCE-014 @e2e @p1 @boundary @negative
  Scenario Outline: Quote is honored until expiry and refused after it without charging
    When S1 creates quote q1 for address "Pat Shopper, 100 Harbor St, Boston, MA 02110" with no promotion
    Then q1 shows total $59.50 and expiresAt "2026-10-01T12:10:00Z"
    When the clock advances to "<checkoutTime>" and S1 submits checkout for q1 with "tok_approve"
    Then the response is <status> <outcome>
    And the test API shows <orders> order(s) and <attempts> payment attempt(s) for S1
    And MUG-RED available stock is <stock>

    Examples:
      | checkoutTime | status | outcome | orders | attempts | stock |
      | 2026-10-01T12:09:59Z | 201 | with a CONFIRMED order | 1 | 1 | 3 |
      | 2026-10-01T12:10:01Z | 409 | with code "QUOTE_EXPIRED" | 0 | 0 | 5 |
```

#### E2E-HARBORCART-ECOMMERCE-015: Changing the cart after quoting invalidates the quote

**Status:** Draft · **Priority:** p1 · **References:** BR-09, BR-07, BR-08

```gherkin
Feature: Changing the cart after quoting invalidates the quote

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" is signed in with a cart containing MUG-RED × 2
    And S1 has a valid quote q1 for address "Pat Shopper, 100 Harbor St, Boston, MA 02110" with no promotion and total $59.50

  @E2E-HARBORCART-ECOMMERCE-015 @e2e @p1 @negative @recovery
  Scenario: Changing the cart after quoting invalidates the quote
    When S1 changes the MUG-RED quantity in the cart to 3
    And S1 submits checkout for q1 with "tok_approve" and a new Idempotency-Key
    Then the response is 409 with code "QUOTE_CHANGED"
    And the test API shows no payment attempt and no order for S1, and MUG-RED available stock is 5
    When S1 requests a new quote q2 with the same address and no promotion
    Then q2 shows merchandise $72.00, discount $0.00, shipping $0.00, tax $4.50 and total $76.50
    When S1 submits checkout for q2 with "tok_approve" and a new Idempotency-Key
    Then the response is 201 and S1 sees an order confirmation with total $76.50
```

#### E2E-HARBORCART-ECOMMERCE-016: Email outage does not reverse a confirmed order

**Status:** Draft · **Priority:** p2 · **References:** BR-14, NFR-02 · **Open TBDs:** 1

```gherkin
Feature: Email outage does not reverse a confirmed order

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" is signed in with a cart containing MUG-RED × 2 and a valid quote for address "Pat Shopper, 100 Harbor St, Boston, MA 02110" with total $59.50
    And the sandbox email provider is unavailable via <TBD: test hook to put the sandbox email provider into a failure mode>

  @E2E-HARBORCART-ECOMMERCE-016 @e2e @p2 @error-handling @recovery
  Scenario: Email outage does not reverse a confirmed order
    When S1 submits checkout with "tok_approve"
    Then S1 sees an order confirmation with an order number and total $59.50
    And the test API shows the order CONFIRMED and its confirmation notification in a retryable state
    And no confirmation email has been delivered
    When the sandbox email provider becomes available again
    Then eventually, within the configured async deadline, exactly one confirmation email is delivered to S1
    And the order is still CONFIRMED
```

#### E2E-HARBORCART-ECOMMERCE-017: Cancelling a confirmed order voids payment and releases stock exactly once

**Status:** Draft · **Priority:** p1 · **References:** BR-16, BR-13, BR-14

```gherkin
Feature: Cancelling a confirmed order voids payment and releases stock exactly once

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" is signed in with a CONFIRMED order O1 for MUG-RED × 2 paid with "tok_approve"
    And fulfillment of O1 has not started and MUG-RED available stock is 3

  @E2E-HARBORCART-ECOMMERCE-017 @e2e @p1 @user-journey @recovery @edge-case
  Scenario: Cancelling a confirmed order voids payment and releases stock exactly once
    When S1 cancels O1 from order history
    Then the cancel response is 200 with status CANCELLED, or 202 with status CANCEL_PENDING
    And eventually, within the configured async deadline, O1 status is CANCELLED
    And O1's payment attempt is VOIDED or REFUNDED
    And MUG-RED available stock is 5
    And eventually, within the configured async deadline, S1 receives a cancellation notification in the sandbox email provider
    When S1 submits the cancellation for O1 a second time
    Then O1 remains CANCELLED
    And MUG-RED available stock is still 5
    When S1 opens order history
    Then O1 is shown with status CANCELLED
```

#### E2E-HARBORCART-ECOMMERCE-018: Cancellation is refused once fulfillment has started

**Status:** Draft · **Priority:** p2 · **References:** BR-16 · **Open TBDs:** 1

```gherkin
Feature: Cancellation is refused once fulfillment has started

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" is signed in with a CONFIRMED order O1 for MUG-RED × 2 paid with "tok_approve"

  @E2E-HARBORCART-ECOMMERCE-018 @e2e @p2 @negative
  Scenario Outline: Cancellation is refused once fulfillment has started
    Given O1 has been moved to <orderStatus> via <TBD: test hook to advance fulfillment status>
    When S1 attempts to cancel O1
    Then the response is 409 with code "CANCELLATION_CLOSED"
    And O1 is still <orderStatus> and its payment attempt is still AUTHORIZED
    And MUG-RED available stock is 3

    Examples:
      | orderStatus |
      | FULFILLING |
      | SHIPPED |
```

#### E2E-HARBORCART-ECOMMERCE-019: Cancellation racing fulfillment start has exactly one winner

**Status:** Draft · **Priority:** p2 · **References:** BR-16 · **Open TBDs:** 1

```gherkin
Feature: Cancellation racing fulfillment start has exactly one winner

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" is signed in with a CONFIRMED order O1 for MUG-RED × 2 paid with "tok_approve"

  @E2E-HARBORCART-ECOMMERCE-019 @e2e @p2 @concurrency @edge-case
  Scenario: Cancellation racing fulfillment start has exactly one winner
    When S1 submits cancellation of O1 at the same moment the warehouse service starts fulfillment of O1 via <TBD: test hook to trigger fulfillment start>
    Then exactly one of the two transitions wins
    And if cancellation wins, O1 ends CANCELLED, its payment is VOIDED or REFUNDED, MUG-RED available stock is 5 and O1 is never FULFILLING or SHIPPED
    And if fulfillment wins, S1 receives 409 "CANCELLATION_CLOSED" or O1's authoritative final status, O1 is FULFILLING and MUG-RED available stock is 3
```

#### E2E-HARBORCART-ECOMMERCE-020: Unresolved payment past reservation expiry never confirms an order without stock

**Status:** Draft · **Priority:** p2 · **References:** BR-11, BR-13, BO-02, NFR-02 · **Open TBDs:** 1

```gherkin
Feature: Unresolved payment past reservation expiry never confirms an order without stock

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the clock is frozen at "2026-10-01T12:00:00Z"
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" submitted checkout with "tok_timeout" and Idempotency-Key K1, receiving 202 with the payment attempt UNKNOWN and the reservation HELD

  @E2E-HARBORCART-ECOMMERCE-020 @e2e @p2 @recovery @edge-case
  Scenario: Unresolved payment past reservation expiry never confirms an order without stock
    When the clock advances 15 minutes without reconciliation
    And the reconciliation trigger runs with <TBD: reconciliation SLA and the sandbox inquiry result for tok_timeout>
    Then the test API shows no CONFIRMED order for K1 unless its reservation is ALLOCATED
    And if the payment is AUTHORIZED but the stock is no longer held, the payment attempt is VOIDED and no order is CONFIRMED
    And MUG-RED available stock is never negative
```

### Business rule

#### E2E-HARBORCART-ECOMMERCE-021: SAVE10 discount is capped at $20.00 and the code is case-insensitive

**Status:** Draft · **Priority:** p2 · **References:** BR-06, BR-07, BR-08

```gherkin
Feature: SAVE10 discount is capped at $20.00 and the code is case-insensitive

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00)
    And promotion SAVE10 is active
    And registered shopper "S1" is signed in with an empty cart

  @E2E-HARBORCART-ECOMMERCE-021 @e2e @p2 @boundary
  Scenario Outline: SAVE10 discount is capped at $20.00 and the code is case-insensitive
    When S1 sets MUG-RED quantity <qty> in the cart
    And S1 requests a quote for address "Pat Shopper, 100 Harbor St, Boston, MA 02110" with promotion code "<code>"
    Then the quote shows merchandise <merch>, discount <discount>, shipping $0.00, tax <tax> and total <total>

    Examples:
      | qty | code | merch | discount | tax | total |
      | 8 | SAVE10 | $192.00 | $19.20 | $10.80 | $183.60 |
      | 9 | save10 | $216.00 | $20.00 | $12.25 | $208.25 |
      | 10 | Save10 | $240.00 | $20.00 | $13.75 | $233.75 |
```

#### E2E-HARBORCART-ECOMMERCE-022: Shipping is free only when post-discount merchandise reaches $50.00

**Status:** Draft · **Priority:** p2 · **References:** BR-07, BR-08, BR-06

```gherkin
Feature: Shipping is free only when post-discount merchandise reaches $50.00

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00) and BAG-BLUE (ACTIVE, $49.99)
    And promotion SAVE10 is active
    And registered shopper "S1" is signed in with an empty cart

  @E2E-HARBORCART-ECOMMERCE-022 @e2e @p2 @boundary
  Scenario Outline: Shipping is free only when post-discount merchandise reaches $50.00
    When S1 adds <items> to the cart
    And S1 requests a quote for address "Pat Shopper, 100 Harbor St, Boston, MA 02110" with promotion <promotion>
    Then the quote shows merchandise <merch>, discount <discount>, shipping <shipping>, tax <tax> and total <total>

    Examples:
      | items | promotion | merch | discount | shipping | tax | total |
      | BAG-BLUE × 1 | none | $49.99 | $0.00 | $8.00 | $3.62 | $61.61 |
      | BAG-BLUE × 1 | code "SAVE10" | $49.99 | $5.00 | $8.00 | $3.31 | $56.30 |
      | MUG-RED × 3 | none | $72.00 | $0.00 | $0.00 | $4.50 | $76.50 |
```

#### E2E-HARBORCART-ECOMMERCE-023: Shipping is free at exactly $50.00 post-discount merchandise

**Status:** Draft · **Priority:** p2 · **References:** BR-07, BR-08 · **Open TBDs:** 1

```gherkin
Feature: Shipping is free at exactly $50.00 post-discount merchandise

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And registered shopper "S1" is signed in with a cart whose post-discount merchandise is exactly $50.00 using <TBD: fixture for an exact $50.00 cart; not reachable with the BRD fixtures>

  @E2E-HARBORCART-ECOMMERCE-023 @e2e @p2 @boundary
  Scenario: Shipping is free at exactly $50.00 post-discount merchandise
    When S1 requests a quote for address "Pat Shopper, 100 Harbor St, Boston, MA 02110" with no promotion
    Then the quote shows merchandise $50.00, shipping $0.00, tax $3.13 and total $53.13
```

#### E2E-HARBORCART-ECOMMERCE-024: Invalid, expired or ineligible promotion code leaves totals unchanged

**Status:** Draft · **Priority:** p2 · **References:** BR-06

```gherkin
Feature: Invalid, expired or ineligible promotion code leaves totals unchanged

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00) and GIFT-001 (ACTIVE, $15.00)
    And promotion SAVE10 is active and promotion EXPIRED10 has an end time in the past
    And registered shopper "S1" is signed in with an empty cart

  @E2E-HARBORCART-ECOMMERCE-024 @e2e @p2 @negative
  Scenario Outline: Invalid, expired or ineligible promotion code leaves totals unchanged
    When S1 adds <items> to the cart and requests a quote for address "Pat Shopper, 100 Harbor St, Boston, MA 02110" with no promotion
    Then the quote total is <total>
    When S1 requests a new quote with promotion code "<code>"
    Then the response is 422 with a reason for the rejected code
    And S1's quote still shows discount $0.00 and total <total>

    Examples:
      | items | code | total |
      | MUG-RED × 2 | EXPIRED10 | $59.50 |
      | MUG-RED × 2 | NOTACODE | $59.50 |
      | GIFT-001 × 1 | SAVE10 | $24.44 |
```

#### E2E-HARBORCART-ECOMMERCE-025: SAVE10 applies from its start instant up to, but not including, its end instant

**Status:** Draft · **Priority:** p3 · **References:** BR-06, A-03 · **Open TBDs:** 2

```gherkin
Feature: SAVE10 applies from its start instant up to, but not including, its end instant

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00)
    And promotion SAVE10 has start <TBD: SAVE10 start instant> and end <TBD: SAVE10 end instant>
    And registered shopper "S1" is signed in with a cart containing MUG-RED × 2

  @E2E-HARBORCART-ECOMMERCE-025 @e2e @p3 @boundary
  Scenario Outline: SAVE10 applies from its start instant up to, but not including, its end instant
    When the clock is set to <instant> and S1 requests a quote for address "Pat Shopper, 100 Harbor St, Boston, MA 02110" with promotion code "SAVE10"
    Then <result>

    Examples:
      | instant | result |
      | 1 second before start | the response is 422 with a reason for the rejected code |
      | exactly the start | the quote shows discount $4.80, shipping $8.00, tax $3.20 and total $54.40 |
      | 1 second before end | the quote shows discount $4.80, shipping $8.00, tax $3.20 and total $54.40 |
      | exactly the end | the response is 422 with a reason for the rejected code |
```

#### E2E-HARBORCART-ECOMMERCE-026: Cart line quantity must be a whole number from 1 to 10

**Status:** Draft · **Priority:** p2 · **References:** BR-03

```gherkin
Feature: Cart line quantity must be a whole number from 1 to 10

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" is signed in with a cart containing MUG-RED × 2

  @E2E-HARBORCART-ECOMMERCE-026 @e2e @p2 @boundary @negative
  Scenario Outline: Cart line quantity must be a whole number from 1 to 10
    When S1 sets the MUG-RED quantity to <qty> through PUT /api/v1/cart/lines/MUG-RED with the current expectedRevision
    Then the response is <status>
    And the cart shows MUG-RED × <result>

    Examples:
      | qty | status | result |
      | 0 | 422 | 2 |
      | 1 | 200 | 1 |
      | 10 | 200 | 10 |
      | 11 | 422 | 2 |
      | 1.5 | 422 | 2 |
```

#### E2E-HARBORCART-ECOMMERCE-027: Adding the same product twice merges into one cart line

**Status:** Draft · **Priority:** p3 · **References:** BR-03

```gherkin
Feature: Adding the same product twice merges into one cart line

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" is signed in with an empty cart

  @E2E-HARBORCART-ECOMMERCE-027 @e2e @p3 @edge-case
  Scenario: Adding the same product twice merges into one cart line
    When S1 adds MUG-RED × 2 from the product detail page
    And S1 adds MUG-RED × 3 again from the search results
    Then the cart shows a single MUG-RED line with quantity 5
```

#### E2E-HARBORCART-ECOMMERCE-028: Concurrent cart edits from two tabs do not lose updates

**Status:** Draft · **Priority:** p3 · **References:** BR-03, BR-04

```gherkin
Feature: Concurrent cart edits from two tabs do not lose updates

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" is signed in with a cart containing MUG-RED × 2 at revision r

  @E2E-HARBORCART-ECOMMERCE-028 @e2e @p3 @concurrency @edge-case
  Scenario: Concurrent cart edits from two tabs do not lose updates
    When S1, in tab A, sets MUG-RED quantity to 3 with expectedRevision r
    Then the response is 200 and the cart revision advances
    When S1, in tab B, sets MUG-RED quantity to 4 with the stale expectedRevision r
    Then the response is 409
    And the cart shows MUG-RED × 3
```

#### E2E-HARBORCART-ECOMMERCE-029: Cart is limited to 20 distinct SKUs

**Status:** Draft · **Priority:** p3 · **References:** BR-03 · **Open TBDs:** 2

```gherkin
Feature: Cart is limited to 20 distinct SKUs

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains 21 distinct ACTIVE SKUs X1–X21 <TBD: 21 SKU fixtures; the BRD defines only 3 ACTIVE SKUs>
    And registered shopper "S1" is signed in with a cart containing X1–X20, each × 1

  @E2E-HARBORCART-ECOMMERCE-029 @e2e @p3 @boundary @negative
  Scenario: Cart is limited to 20 distinct SKUs
    When S1 adds X21 × 1 to the cart
    Then the add is rejected with <TBD: status and error code for the 20-SKU limit>
    And the cart still contains exactly X1–X20, each × 1
```

#### E2E-HARBORCART-ECOMMERCE-030: Search finds active products by name or SKU regardless of case

**Status:** Draft · **Priority:** p2 · **References:** BR-01

```gherkin
Feature: Search finds active products by name or SKU regardless of case

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED, BAG-BLUE and GIFT-001 (ACTIVE) and OLD-HAT (INACTIVE)
    And guest shopper "G1" opens the web app

  @E2E-HARBORCART-ECOMMERCE-030 @e2e @p2 @user-journey
  Scenario: Search finds active products by name or SKU regardless of case
    When G1 searches for "mug-red"
    Then the results include MUG-RED
    When G1 searches for MUG-RED's product name, as shown on its detail page, typed in upper case
    Then the results include MUG-RED
    When G1 searches for "OLD-HAT"
    Then no results are returned
    When G1 submits an empty search
    Then the results are paginated, sorted by name then SKU, include MUG-RED, BAG-BLUE and GIFT-001, and do not include OLD-HAT
```

#### E2E-HARBORCART-ECOMMERCE-031: Inactive or unknown product has no detail page

**Status:** Draft · **Priority:** p2 · **References:** BR-02

```gherkin
Feature: Inactive or unknown product has no detail page

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains OLD-HAT (INACTIVE, $12.00)
    And guest shopper "G1" opens the web app

  @E2E-HARBORCART-ECOMMERCE-031 @e2e @p2 @negative
  Scenario: Inactive or unknown product has no detail page
    When G1 requests GET /api/v1/products/OLD-HAT
    Then the response is 404
    When G1 requests GET /api/v1/products/NO-SUCH-SKU
    Then the response is 404
    When G1 opens the product detail URL for OLD-HAT in the web app
    Then no price or add-to-cart control is shown for OLD-HAT
```

#### E2E-HARBORCART-ECOMMERCE-032: Price change after adding to cart is shown for confirmation before payment

**Status:** Draft · **Priority:** p2 · **References:** BR-05, A-02 · **Open TBDs:** 2

```gherkin
Feature: Price change after adding to cart is shown for confirmation before payment

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" is signed in with a cart containing MUG-RED × 2 displayed at $24.00

  @E2E-HARBORCART-ECOMMERCE-032 @e2e @p2 @user-journey @edge-case
  Scenario: Price change after adding to cart is shown for confirmation before payment
    When the MUG-RED price is changed to <TBD: new price> via <TBD: test hook to change a catalog price>
    And S1 requests a quote for address "Pat Shopper, 100 Harbor St, Boston, MA 02110"
    Then the quote uses the new unit price and S1 is shown the price change for confirmation before payment
    When S1 confirms the changed price and pays with "tok_approve"
    Then the order is CONFIRMED at the new unit price
```

#### E2E-HARBORCART-ECOMMERCE-033: Deactivated item in the cart fails the quote as unavailable

**Status:** Draft · **Priority:** p2 · **References:** BR-05 · **Open TBDs:** 1

```gherkin
Feature: Deactivated item in the cart fails the quote as unavailable

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5) and OLD-HAT (INACTIVE, $12.00)
    And registered shopper "S1" has a cart containing MUG-RED × 1 and OLD-HAT × 1, seeded via <TBD: test hook to seed a cart line for a SKU that later became INACTIVE>

  @E2E-HARBORCART-ECOMMERCE-033 @e2e @p2 @negative @edge-case
  Scenario: Deactivated item in the cart fails the quote as unavailable
    When S1 requests a quote for address "Pat Shopper, 100 Harbor St, Boston, MA 02110"
    Then the response is 409 with code "ITEM_UNAVAILABLE"
    And no quote is created and the test API shows no payment attempt for S1
```

#### E2E-HARBORCART-ECOMMERCE-034: Checkout address is validated field by field

**Status:** Draft · **Priority:** p1 · **References:** BR-10, A-01

```gherkin
Feature: Checkout address is validated field by field

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" is signed in with a cart containing MUG-RED × 2
    And the valid address is "Pat Shopper, 100 Harbor St, Boston, MA 02110" with S1's email

  @E2E-HARBORCART-ECOMMERCE-034 @e2e @p1 @negative @boundary
  Scenario Outline: Checkout address is validated field by field
    When S1 requests a quote with the valid address except <field> set to "<value>"
    Then the response is 422 with a field error for <field>
    And no quote is created
    And S1 sees the error next to the <field> field
    When S1 corrects <field> to its valid value and requests the quote again
    Then the quote is created with total $59.50

    Examples:
      | field | value |
      | name |  |
      | address line 1 |  |
      | city |  |
      | state | HI |
      | state | AK |
      | state | Mass |
      | ZIP | 0211 |
      | ZIP | ABCDE |
      | email | pat.example.test |
      | email |  |
```

### Cross-functional

#### E2E-HARBORCART-ECOMMERCE-035: Keyboard-only shopper completes checkout and hears address errors announced

**Status:** Draft · **Priority:** p2 · **References:** NFR-04, BR-10

```gherkin
Feature: Keyboard-only shopper completes checkout and hears address errors announced

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And guest shopper "G1" uses only the keyboard, with a screen reader running

  @E2E-HARBORCART-ECOMMERCE-035 @e2e @p2 @accessibility @user-journey
  Scenario: Keyboard-only shopper completes checkout and hears address errors announced
    When G1 searches for "MUG-RED", opens its details and adds quantity 1 to the cart using only the keyboard
    Then keyboard focus is visible at every step and the cart shows MUG-RED × 1
    When G1 reaches checkout by keyboard and submits the address form with ZIP "ABCDE"
    Then the ZIP field error is announced by the screen reader and G1 can move focus to the ZIP field by keyboard
    When G1 corrects the ZIP to "02110" and requests the quote
    Then the quote shows merchandise $24.00, shipping $8.00, tax $2.00 and total $34.00
    When G1 completes the sandbox card widget, which yields token "tok_approve", and places the order using only the keyboard
    Then G1 reaches the order confirmation with an order number and total $34.00
```

#### E2E-HARBORCART-ECOMMERCE-036: Card details never reach HarborCart APIs or events

**Status:** Draft · **Priority:** p1 · **References:** BR-11, NFR-03, NFR-05

```gherkin
Feature: Card details never reach HarborCart APIs or events

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5)
    And registered shopper "S1" is signed in with a cart containing MUG-RED × 1
    And browser network capture and event capture are enabled

  @E2E-HARBORCART-ECOMMERCE-036 @e2e @p1 @security @cross-functional
  Scenario: Card details never reach HarborCart APIs or events
    When S1 checks out with address "Pat Shopper, 100 Harbor St, Boston, MA 02110", entering card details in the sandbox provider widget, which yields token "tok_approve"
    Then S1 sees an order confirmation with total $34.00
    And no captured request to /api/v1 contains the card number or CVV, and the order request carries only the payment token
    And no /api/v1 response or page shown to S1 contains the card number or CVV
    And event capture for the order contains no card number or CVV
```

#### E2E-HARBORCART-ECOMMERCE-037: Idempotency keys are scoped to the shopper who used them

**Status:** Draft · **Priority:** p3 · **References:** BR-12, BR-17

```gherkin
Feature: Idempotency keys are scoped to the shopper who used them

  Background:
    Given the HarborCart test environment is reset (stock, orders, promotion redemptions, queues, payment sandbox)
    And the catalog contains MUG-RED (ACTIVE, $24.00, stock 5) and GIFT-001 (ACTIVE, $15.00, stock 20)
    And registered shopper "S1" has placed order O1 with Idempotency-Key K1 and "tok_approve"
    And registered shopper "S2" is signed in with quote q2 for GIFT-001 × 1 at address "Pat Shopper, 100 Harbor St, Boston, MA 02110" with total $24.44

  @E2E-HARBORCART-ECOMMERCE-037 @e2e @p3 @security @edge-case
  Scenario: Idempotency keys are scoped to the shopper who used them
    When S2 requests GET /api/v1/checkout/requests/K1
    Then the response does not reveal O1 or any of S1's order data
    When S2 submits checkout for q2 with "tok_approve" and Idempotency-Key K1
    Then the response is 201 with a new order owned by S2
    And S1's order O1 is unchanged
```

## 6. Test data and execution/cleanup guidance

**Fixtures (from BRD section 7; use exactly these):** `MUG-RED` ACTIVE $24.00 stock 5 · `BAG-BLUE` ACTIVE $49.99 stock 1 · `GIFT-001` ACTIVE $15.00 stock 20 · `OLD-HAT` INACTIVE $12.00 · `SAVE10` active, 10% capped at $20, excludes GIFT-001 · `EXPIRED10` ended · tokens `tok_approve`, `tok_decline`, `tok_timeout`.

**Test inputs chosen by this plan (not source facts):**
- Address `Pat Shopper, 100 Harbor St, Boston, MA 02110`
- Invalid values in 034: `HI`, `AK`, `Mass`, `0211`, `ABCDE`, `pat.example.test`, and empty strings
- Unknown SKU `NO-SUCH-SKU` and unknown code `NOTACODE`
- Frozen clock `2026-10-01T12:00:00Z`

**Quote oracles used (integer cents, half-up):**

| Cart | Promotion | Merch | Discount | Shipping | Tax | Total |
| --- | --- | --- | --- | --- | --- | --- |
| MUG-RED × 2 + GIFT-001 × 1 | SAVE10 | 63.00 | 4.80 | 0.00 | 3.64 | **61.84** (BRD oracle) |
| MUG-RED × 1 | — | 24.00 | 0.00 | 8.00 | 2.00 | 34.00 |
| MUG-RED × 2 | — | 48.00 | 0.00 | 8.00 | 3.50 | 59.50 |
| MUG-RED × 2 | SAVE10 | 48.00 | 4.80 | 8.00 | 3.20 | 54.40 |
| MUG-RED × 3 | — | 72.00 | 0.00 | 0.00 | 4.50 | 76.50 |
| MUG-RED × 6 | — | 144.00 | 0.00 | 0.00 | 9.00 | 153.00 |
| MUG-RED × 8 / 9 / 10 | SAVE10 | 192 / 216 / 240 | 19.20 / 20.00 / 20.00 | 0.00 | 10.80 / 12.25 / 13.75 | 183.60 / 208.25 / 233.75 |
| BAG-BLUE × 1 | — | 49.99 | 0.00 | 8.00 | 3.62 | 61.61 |
| BAG-BLUE × 1 | SAVE10 | 49.99 | 5.00 (499.9¢ → 500¢) | 8.00 | 3.31 | 56.30 |
| GIFT-001 × 1 | — | 15.00 | 0.00 | 8.00 | 1.44 | 24.44 |
| exactly $50.00 *(TBD fixture)* | — | 50.00 | 0.00 | 0.00 | 3.13 (3.125 → 3.13) | 53.13 |

**Execution:**
- Before each independent test, reset stock, orders, promo redemptions, queues and payment sandbox state.
- Use a unique shopper email and idempotency key per test, except in 009, 010, 011 and 037, where reuse is the point.
- Freeze the clock for 001, 004, 014, 020 and 025.
- Run concurrency scenarios (010, 012, 019, 028) with truly parallel requests, for example `Promise.all` over two API contexts, and repeat them several times.
- Assert async outcomes by polling to the configured deadline. Never use a fixed sleep as the only check.
- Treat a scenario as passing only after any UNKNOWN payment has been reconciled (BRD section 8).

**Cleanup:**
- Reconcile or void any open payment attempts.
- Reset inventory and orders.
- Drain the event and email capture.
- Discard session cookies for guest sessions.

## 7. Gaps, open questions, assumptions and risks

**Open questions (TBDs blocking approval):**

| # | Question | Blocks |
| --- | --- | --- |
| Q-01 | What async deadline should the suite use for events and emails? (Used as a parameter, not a TBD.) | — |
| Q-02 | What test hook changes a catalog price, and what new price should MUG-RED use? | 032 |
| Q-03 | What test hook seeds a cart line for a SKU that later becomes INACTIVE, or deactivates a SKU? | 033 |
| Q-04 | What test hook moves an order to FULFILLING/SHIPPED or triggers fulfillment start? | 018, 019 |
| Q-05 | How is the sandbox email provider put into a failure mode? | 016 |
| Q-06 | What is the reconciliation SLA, and what does sandbox inquiry return for `tok_timeout`? (Design section 9 lists the SLA as an open decision.) | 020 (009 asserts either outcome) |
| Q-07 | What are SAVE10's start and end instants? | 025 |
| Q-08 | Can the fixture catalog include 21+ ACTIVE SKUs, and what status/code does adding a 21st SKU return? | 007, 029 |
| Q-09 | Can a fixture give exactly $50.00 post-discount merchandise? (Not reachable with BRD fixtures.) | 023 |
| Q-10 | What is the support role name, how are support accounts provisioned, and how are audit records read? | 005 |
| Q-11 | Is a quote at exactly `expiresAt` valid or expired? (014 tests ±1 s only.) | — |
| Q-12 | What does a non-UUID `Idempotency-Key` return? What does a *different* key return while a payment is UNKNOWN? | not generated |

**Assumptions (please confirm at review):**
- A-1: the guest verification code is delivered by email ("verified email/code", design section 2). Used in 002.
- A-2: cancellation notification goes by email. Used in 017.
- A-3: applying SAVE10 to a cart containing only GIFT-001 is "ineligible" and returns 422. Used in 024, row c.
- A-4: available stock reported by the test API drops when a reservation is ALLOCATED and is restored on release.
- A-5: after a reset, the catalog contains only the BRD fixtures. Used in 030.

**Risks:**
- Concurrency scenarios may be flaky if the harness can't issue truly simultaneous requests.
- 009 and 019 have branching oracles until Q-06 and Q-04 are answered.
- The sources define no UI copy, so UI assertions stay structural until UX supplies message text.

## 8. References

- `specs/Ecommerce_BRD_Sample.md` (BRD, v1.0, synthetic)
- `specs/Ecommerce_Architecture_Design_Sample.md` (Design, v1.0, synthetic)
- `docs/input/harborcart-ecommerce/*.md` (plain-text copies with the same content; not used separately)
- Repo patterns: `feature/Ecommerce.feature`, `tests/greenkart-shopping/search-and-add-product.spec.js`

## 9. Status table

| ID | testName | Status | References |
| --- | --- | --- | --- |
| E2E-HARBORCART-ECOMMERCE-001 | Registered shopper buys mugs and a gift item with SAVE10 and receives confirmation | Draft | BR-01, BR-02, BR-03, BR-06, BR-07, BR-08, BR-09, BR-10, BR-12, BR-13, BR-14, BR-15, BO-01 |
| E2E-HARBORCART-ECOMMERCE-002 | Guest buys the last blue bag and later retrieves the order with a verification code | Draft | BR-04, BR-07, BR-08, BR-12, BR-15, NFR-05 |
| E2E-HARBORCART-ECOMMERCE-003 | Shopper cannot view or cancel another shopper's order | Draft | BR-17, NFR-03 |
| E2E-HARBORCART-ECOMMERCE-004 | Order history lists only the shopper's own orders, newest first | Draft | BR-15, BR-17 |
| E2E-HARBORCART-ECOMMERCE-005 | Support agent views a shopper's order through the audited support role | Draft | BR-17, NFR-03 |
| E2E-HARBORCART-ECOMMERCE-006 | Guest cart merges into the account cart at sign-in, capped at 10 per SKU | Draft | BR-04 |
| E2E-HARBORCART-ECOMMERCE-007 | Cart merge is rejected when the combined cart would exceed 20 SKUs | Draft | BR-03, BR-04 |
| E2E-HARBORCART-ECOMMERCE-008 | Declined payment releases reserved stock and creates no order | Draft | BR-11, BR-13, BO-02 |
| E2E-HARBORCART-ECOMMERCE-009 | Payment timeout stays pending until reconciliation, without a second charge | Draft | BR-11, BR-12, BR-13, NFR-02, BO-03 |
| E2E-HARBORCART-ECOMMERCE-010 | Double submit and browser refresh create one order and one charge | Draft | BR-12, BO-03 |
| E2E-HARBORCART-ECOMMERCE-011 | Reusing an idempotency key with a different order is rejected | Draft | BR-12 |
| E2E-HARBORCART-ECOMMERCE-012 | Two shoppers race for the last blue bag and exactly one wins | Draft | BR-13, BO-02, NFR-05 |
| E2E-HARBORCART-ECOMMERCE-013 | Ordering more than the available stock fails before any payment | Draft | BR-13 |
| E2E-HARBORCART-ECOMMERCE-014 | Quote is honored until expiry and refused after it without charging | Draft | BR-09 |
| E2E-HARBORCART-ECOMMERCE-015 | Changing the cart after quoting invalidates the quote | Draft | BR-09, BR-07, BR-08 |
| E2E-HARBORCART-ECOMMERCE-016 | Email outage does not reverse a confirmed order | Draft | BR-14, NFR-02 |
| E2E-HARBORCART-ECOMMERCE-017 | Cancelling a confirmed order voids payment and releases stock exactly once | Draft | BR-16, BR-13, BR-14 |
| E2E-HARBORCART-ECOMMERCE-018 | Cancellation is refused once fulfillment has started | Draft | BR-16 |
| E2E-HARBORCART-ECOMMERCE-019 | Cancellation racing fulfillment start has exactly one winner | Draft | BR-16 |
| E2E-HARBORCART-ECOMMERCE-020 | Unresolved payment past reservation expiry never confirms an order without stock | Draft | BR-11, BR-13, BO-02, NFR-02 |
| E2E-HARBORCART-ECOMMERCE-021 | SAVE10 discount is capped at $20.00 and the code is case-insensitive | Draft | BR-06, BR-07, BR-08 |
| E2E-HARBORCART-ECOMMERCE-022 | Shipping is free only when post-discount merchandise reaches $50.00 | Draft | BR-07, BR-08, BR-06 |
| E2E-HARBORCART-ECOMMERCE-023 | Shipping is free at exactly $50.00 post-discount merchandise | Draft | BR-07, BR-08 |
| E2E-HARBORCART-ECOMMERCE-024 | Invalid, expired or ineligible promotion code leaves totals unchanged | Draft | BR-06 |
| E2E-HARBORCART-ECOMMERCE-025 | SAVE10 applies from its start instant up to, but not including, its end instant | Draft | BR-06, A-03 |
| E2E-HARBORCART-ECOMMERCE-026 | Cart line quantity must be a whole number from 1 to 10 | Draft | BR-03 |
| E2E-HARBORCART-ECOMMERCE-027 | Adding the same product twice merges into one cart line | Draft | BR-03 |
| E2E-HARBORCART-ECOMMERCE-028 | Concurrent cart edits from two tabs do not lose updates | Draft | BR-03, BR-04 |
| E2E-HARBORCART-ECOMMERCE-029 | Cart is limited to 20 distinct SKUs | Draft | BR-03 |
| E2E-HARBORCART-ECOMMERCE-030 | Search finds active products by name or SKU regardless of case | Draft | BR-01 |
| E2E-HARBORCART-ECOMMERCE-031 | Inactive or unknown product has no detail page | Draft | BR-02 |
| E2E-HARBORCART-ECOMMERCE-032 | Price change after adding to cart is shown for confirmation before payment | Draft | BR-05, A-02 |
| E2E-HARBORCART-ECOMMERCE-033 | Deactivated item in the cart fails the quote as unavailable | Draft | BR-05 |
| E2E-HARBORCART-ECOMMERCE-034 | Checkout address is validated field by field | Draft | BR-10, A-01 |
| E2E-HARBORCART-ECOMMERCE-035 | Keyboard-only shopper completes checkout and hears address errors announced | Draft | NFR-04, BR-10 |
| E2E-HARBORCART-ECOMMERCE-036 | Card details never reach HarborCart APIs or events | Draft | BR-11, NFR-03, NFR-05 |
| E2E-HARBORCART-ECOMMERCE-037 | Idempotency keys are scoped to the shopper who used them | Draft | BR-12, BR-17 |
## 10. Metadata

| Category | Count |
| --- | --- |
| Primary journeys | 2 |
| Role / permission | 5 |
| Error / recovery | 13 |
| Business rules | 14 |
| Cross-functional (security, accessibility) | 3 |
| **Total scenarios** | **37** (61 TestRail cases after outline expansion) |
| Priority p1 / p2 / p3 | 14 / 17 / 6 |
| Status Draft / Approved / Rejected | 37 / 0 / 0 |
| Scenarios with open TBDs | 11 |

**Coverage status:** `Partial`. Every BR/NFR maps to at least one scenario or to a documented exclusion, but BR-05 has no TBD-free scenario.

**BRD section 8 definition of done (planned coverage; not yet executed):**

| Criterion | Result |
| --- | --- |
| BR-01–BR-17 each have ≥ 1 scenario | ✅ planned. ⚠️ BR-05 only through TBD-blocked 032/033. |
| BR-09 negative/recovery | ✅ 014, 015 |
| BR-11 negative/recovery | ✅ 008, 009 |
| BR-12 negative/recovery | ✅ 010, 011 |
| BR-13 negative/recovery | ✅ 012, 013 |
| BR-16 negative/recovery | ⚠️ 017 (repeat cancel) is TBD-free; CANCELLATION_CLOSED (018) and the race (019) need Q-04 |
| BR-17 negative/recovery | ✅ 003 |
| Concurrency: last-unit stock | ✅ 012 |
| Concurrency: repeated submission | ✅ 010 |
| Unresolved payments reconciled before success | ✅ built into 009/020 and execution guidance |
| Each test captures inputs, preconditions, steps, expected API/UI and persisted state, cleanup, priority | ✅ |
