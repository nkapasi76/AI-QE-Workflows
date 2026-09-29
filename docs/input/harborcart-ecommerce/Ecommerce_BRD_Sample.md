Business Requirements Document: HarborCart Ecommerce
Version: 1.0 | Status: Synthetic sample for agent testing | Companion: Ecommerce_Architecture_Design_Sample.md
HarborCart, its customers, products, endpoints, and policies are fictional. All amounts are USD. This document specifies expected behavior for test generation; it does not describe a deployed system.

1. Purpose and scope
HarborCart sells physical consumer goods to customers in the contiguous United States. Release 1 supports browsing, product search, registered and guest checkout, one promotion code per order, card payment through a sandbox provider, inventory reservation, order confirmation, cancellation before shipment, and customer order history. The agent should derive positive, negative, boundary, cross-service, and recovery scenarios from the numbered requirements below.
Actors: guest shopper, registered shopper, customer support agent, warehouse service, payment provider, notification provider.
Out of scope: subscriptions, gift cards, split tender, international shipping, tax-exempt customers, returns/refunds after shipment, marketplace sellers, stored cards, and partial shipments.
2. Business outcomes and assumptions
ID    Outcome / assumption    Measure or rule
BO-01    Customers can buy available products    Successful sandbox card checkout creates exactly one confirmed order.
BO-02    Prevent overselling    Confirmed quantity never exceeds available inventory; reservations expire after 15 minutes.
BO-03    Avoid duplicate charges    Retrying the same checkout request with the same idempotency key does not create a second order or payment.
A-01    Currency and region    USD; shipping addresses in the contiguous US only.
A-02    Catalog price    Authoritative unit price is captured by the server when a checkout quote is created; cart-displayed prices are informational.
A-03    Time    Timestamps are UTC; promotion windows are inclusive at start and exclusive at end.


3. Business requirements
Catalog and cart
ID    Requirement    Acceptance criteria
BR-01    Browse and search    Search matches product title or SKU, case-insensitively; only ACTIVE products appear. Empty query returns paginated active products, sorted by name then SKU.
BR-02    Product details    Show SKU, name, description, current price, and stock status. An inactive or unknown SKU gives 404 from detail API.
BR-03    Cart quantity    Quantity per line is an integer 1–10; a cart has at most 20 distinct SKUs. Duplicate additions merge quantities. Invalid quantity gives 422 and leaves cart unchanged.
BR-04    Guest and registered carts    Guests use a session cart. After sign-in, merge guest lines into the account cart, capped at 10 per SKU; preserve distinct SKUs where possible. If merged cart exceeds 20 SKUs, reject merge with 409 and preserve both carts.
BR-05    Stale cart    Checkout requotes using current catalog price and active status; inactive SKU fails quote with ITEM_UNAVAILABLE. A price change is shown for shopper confirmation before payment.


Pricing and checkout
ID    Requirement    Acceptance criteria
BR-06    Promotion    One code per order, case-insensitive. SAVE10 gives 10% off eligible merchandise, max $20, before tax and shipping; excludes SKU GIFT-001. Invalid, expired, or ineligible code returns 422 with a reason and changes no totals.
BR-07    Shipping    Standard shipping is $8.00, or free when post-discount merchandise subtotal is at least $50.00. Shipping is calculated before tax.
BR-08    Tax    Sample jurisdiction uses 6.25% of post-discount merchandise plus shipping, rounded once to the nearest cent using half-up. A production tax service would determine actual jurisdiction.
BR-09    Quote validity    Quote contains item prices, discounts, shipping, tax, total, and expiresAt (10 minutes after creation). Checkout of expired or changed quote returns 409 QUOTE_EXPIRED or QUOTE_CHANGED without charging.
BR-10    Address    Name, address line 1, city, two-letter state, five-digit ZIP, and email required. Reject non-contiguous states, malformed ZIP/email, and empty required fields with 422 and field errors. Do not place raw address in logs.
BR-11    Card authorization    Payment uses provider token, never raw PAN in HarborCart APIs. Provider decline gives PAYMENT_DECLINED, no confirmed order, and releases reservation. Timeout leaves payment attempt UNKNOWN; reconciliation determines result before another attempt may charge.
BR-12    Order placement    Client supplies UUID Idempotency-Key. After payment success, persist one confirmed order and payment reference, clear purchased cart lines, and return order number. Same key and same request payload returns original response; same key with changed payload returns 409 IDEMPOTENCY_CONFLICT.
BR-13    Stock reservation    Reserve stock atomically before payment. Insufficient stock returns 409 OUT_OF_STOCK with affected SKU, no payment call. Release reservation on decline or cancellation; expiration releases abandoned reservations.
BR-14    Confirmation    Confirmed order triggers email asynchronously. Email failure does not reverse the order; record retryable notification state. UI shows confirmed order even if email is pending.


Post-purchase
ID    Requirement    Acceptance criteria
BR-15    Order history    Registered shopper sees only their orders, newest first. Guest retrieves an order using order number and email plus a one-time verification code; no guest list endpoint.
BR-16    Cancellation    Shopper may cancel while status is CONFIRMED and fulfillment has not started. Cancellation makes status CANCELLED, voids or refunds the payment as appropriate, releases allocated stock exactly once, and notifies shopper. Once FULFILLING or SHIPPED, return 409 CANCELLATION_CLOSED.
BR-17    Authorization    An authenticated shopper cannot view or cancel another shopper's order. Return 404 to avoid exposing order existence. Support access requires a separate audited role.


4. Calculation example (oracle)
Cart: SKU MUG-RED × 2 at $24.00, SKU GIFT-001 × 1 at $15.00; code SAVE10. Eligible merchandise $48.00, discount $4.80; post-discount merchandise $58.20; shipping $0.00; tax = round-half-up($58.20 × 0.0625) = $3.64; total $61.84. At exactly $50.00 post-discount merchandise, shipping is free; at $49.99, shipping is $8.00.
5. Primary journey and alternate paths
1. Shopper browses/searches, opens details, and adds items to cart.
2. Shopper enters address and optional promotion; server creates quote and surfaces changed prices.
3. Shopper confirms quote, enters card through payment provider widget, and submits checkout with an idempotency key.
4. System validates quote and address, reserves inventory, authorizes payment, confirms order, and publishes confirmation event.
5. Shopper sees order number and total. Email is delivered eventually; registered shopper sees order in history.
Alternate paths: no stock at reservation; quote expiration; invalid promo; address rejection; provider decline; payment timeout followed by reconciliation; duplicate submit; browser refresh after payment; email outage; cancellation racing fulfillment start. The agent should verify final persisted states, not just UI messages.
6. Nonfunctional requirements
ID    Requirement    Target / verification
NFR-01    Performance    Under the sample load profile (100 concurrent users, 10 checkouts/min), catalog search p95 < 500 ms and quote p95 < 800 ms, excluding third-party provider delay.
NFR-02    Availability and recovery    Checkout availability target 99.9% monthly; queued confirmation email retries for up to 24 hours; unresolved payment outcomes surface for reconciliation.
NFR-03    Security/privacy    TLS in transit; role checks on order access; card token only; redact email/address in logs; retention and deletion policy to be defined before production.
NFR-04    Accessibility    Core purchase journey meets WCAG 2.2 AA target; keyboard navigation and error announcements are tested.
NFR-05    Observability    Correlation ID and order ID (when available) link checkout logs, payment attempt, inventory reservation, and events. No PAN or verification codes in telemetry.


7. Test data and scenario seeds
Fixture    State    Expected use
MUG-RED    ACTIVE, $24.00, stock 5    Successful purchase and quantity boundary.
BAG-BLUE    ACTIVE, $49.99, stock 1    Shipping threshold and last-unit race.
GIFT-001    ACTIVE, $15.00, stock 20    Promotion exclusion.
OLD-HAT    INACTIVE, $12.00    Stale cart or detail 404.
SAVE10    Active sample period; 10% cap $20    Discount, cap, and exclusion.
EXPIRED10    End time in past    Expired promotion.
tok_approve, tok_decline, tok_timeout    Sandbox payment tokens    Provider success, decline, unknown outcome.


Reset stock, orders, promo redemption, queues, and payment sandbox state between independent tests. Use unique shopper emails and idempotency keys per test, except intentional retry tests. Freeze the clock for expiry and boundary tests. Mock or sandbox external providers; no live card details.
8. Traceability and definition of done
A generated suite should attach each test to one or more BR/NFR IDs and capture input, preconditions, steps, expected UI/API response, expected order/payment/inventory/event state, cleanup, and risk priority. Minimum acceptance: all BR-01–BR-17 have at least one passing scenario; BR-09, BR-11–BR-13, BR-16–BR-17 include negative or recovery scenarios; concurrency tests cover last-unit stock and repeated submission. Unresolved payment attempts must be reconciled before a scenario can claim success. Targets above are illustrative and require product approval for real use.
