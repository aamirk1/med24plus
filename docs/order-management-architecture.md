# Med24Plus — Phase 8: Order Management & Order Lifecycle Architecture

## 1. Executive Summary

Phase 8 implements the complete **Order Management, Statutory Dispensing, and Order Lifecycle System** for **Med24Plus**, a single-pharmacy online medicine delivery platform in India. This phase integrates:
- **Phase 4**: Customer Authentication, RBAC, and secure session management.
- **Phase 5**: Product Catalog, Drug Schedules (OTC, Schedule H, H1, X), and FEFO batch inventory management.
- **Phase 6**: Registered Pharmacist Prescription review workflows under Rule 65 of the Drugs and Cosmetics Rules, 1945.
- **Phase 7**: Authoritative Shopping Cart pricing, delivery address snapshotting, and 15-minute checkout validation quotes.

Phase 8 converts a successfully validated checkout into an immutable, statutory order, orchestrating physical inventory reservations, FEFO batch allocations, Rule 65 dispensing approval gates, customer cancellation protocols, and automated Form 20 cash memo / GST tax invoice PDF generation.

---

## 2. Key Architectural Principles

1. **Transactional Order Materialization & Idempotency**:
   - Order creation executes within an atomic database transaction.
   - Client requests must provide an `Idempotency-Key` HTTP header. Repeated submissions with the identical key return the original order payload without re-executing business logic or reserving duplicate stock.
   - Key collisions with modified payloads are rejected with HTTP 409 Conflict.

2. **Immutable Snapshots**:
   - Once placed, an order does not link mutably to current product pricing, SKU definitions, or delivery address records.
   - Products, pack sizes, strengths, unit prices, MRPs, discounts, tax rates, and delivery addresses are frozen as static snapshots on `order_items` and `orders.delivery_address_snapshot`.

3. **Batch-Level FEFO Physical Reservation**:
   - Each line item is allocated to specific inventory batches according to **First-Expiry-First-Out (FEFO)** principles.
   - An atomic inventory reservation (`inventory_reservations`) is locked with row-level locks (`SELECT ... FOR UPDATE`), decrementing available sellable stock and creating audit trail movements (`STOCK_RESERVED`).
   - If an order is cancelled prior to dispatch, reservations are released (`RESERVATION_RELEASED`), returning stock to the sellable pool.
   - When an order is transitioned to `dispatched`, reserved quantities are consumed (`STOCK_DISPATCHED`), permanently decrementing physical stock.

4. **Rule 65 Compliance & Pharmacist Dispensing Gate**:
   - Orders containing prescription medications (Schedule H, H1, X) automatically enter `pharmacist_review` status upon placement.
   - Non-prescription OTC orders transition directly to `processing`.
   - Orders cannot advance to `processing`, `ready_for_dispatch`, or `dispatched` without explicit clinical verification and approval by a Registered Pharmacist (`ORDERS_REVIEW`, `ORDERS_APPROVE`).
   - Pharmacist rejection cancels the order and releases all batch reservations with a mandatory clinical justification.

5. **Strict Payment & Fulfilment Boundary**:
   - Order status is decoupled from payment status.
   - Orders created without immediate payment reside in `pending_payment` or `pharmacist_review`.
   - Orders are strictly barred from advancing to `dispatched` or `delivered` unless `payment_status == 'paid'` or `'authorized'`.
   - Phase 9 gateway integration (Razorpay / UPI / NetBanking) integrates cleanly via the decoupled `IPaymentIntegrationService` interface.

6. **Statutory Form 20 Cash Memo & GST Tax Invoicing**:
   - Every confirmed order generates an immutable invoice record (`invoices`) and a statutory PDF complying with Rule 65(3) of the Drugs and Cosmetics Rules, 1945 and Section 31 of the CGST Act, 2017.
   - Invoices include DL numbers (Form 20/21), GSTIN, FSSAI license, registered pharmacist details, batch numbers, expiry dates, HSN codes, and split CGST/SGST/IGST taxation.

---

## 3. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|   +-------------------------------------+   +---------------------------------+   |
|   |    Next.js 14 Customer Web App      |   |     Next.js 14 Admin Panel      |   |
|   |  - /checkout (Place Order)          |   |  - /orders (Dashboard & Queue)  |   |
|   |  - /account/orders (History)        |   |  - /orders/[id] (Fulfillment)   |   |
|   |  - /account/orders/[id] (Tracking)  |   |  - Rule 65 Review Actions       |   |
|   +------------------+------------------+   +----------------+----------------+   |
|                      |                                       |                    |
+----------------------|---------------------------------------|--------------------+
                       | HTTPS / REST                          | HTTPS / REST
                       v                                       v
+-----------------------------------------------------------------------------------+
|                                 FASTAPI BACKEND                                   |
|                                                                                   |
|   +---------------------+  +------------------------+  +----------------------+   |
|   |  /api/v1/orders     |  |  /api/v1/pharmacist/   |  |  /api/v1/admin/      |   |
|   |  (Customer Orders)  |  |  orders (Rx Review)    |  |  orders (Ops/Mgmt)   |   |
|   +----------+----------+  +-----------+------------+  +----------+-----------+   |
|              |                         |                          |               |
|              +-------------------------+--------------------------+               |
|                                        |                                          |
|                                        v                                          |
|   +---------------------------------------------------------------------------+   |
|   |                          ORDER SERVICES LAYER                             |   |
|   |  +------------------------------+  +-----------------------------------+  |   |
|   |  | OrderCreationService         |  | OrderStateMachine                 |  |   |
|   |  | - 21-step atomic workflow    |  | - Controlled status transitions   |  |   |
|   |  | - Idempotency enforcement    |  | - RBAC & Rule 65 gating           |  |   |
|   |  | - Cart clearing              |  | - Immutable status history        |  |   |
|   |  +--------------+---------------+  +-----------------+-----------------+  |   |
|   |                 |                                    |                    |   |
|   |  +--------------v---------------+  +-----------------v-----------------+  |   |
|   |  | InventoryReservationService  |  | PharmacistReviewService           |  |   |
|   |  | - Row-level locking FEFO     |  | - Clinical approval / rejection   |  |   |
|   |  | - Double-entry stock journal |  | - Clarification audit logs        |  |   |
|   |  +--------------+---------------+  +-----------------+-----------------+  |   |
|   |                 |                                    |                    |   |
|   |  +--------------v---------------+  +-----------------v-----------------+  |   |
|   |  | OrderCancellationService     |  | InvoiceService & PDF Generator    |  |   |
|   |  | - Pre-dispatch safety check  |  | - Form 20 Cash Memo / GST Tax Inv |  |   |
|   |  | - Automatic stock release    |  | - Pure-Python PDF 1.4 binary gen  |  |   |
|   |  +------------------------------+  +-----------------------------------+  |   |
|   +------------------------------------+--------------------------------------+   |
|                                        |                                          |
|                                        v                                          |
|   +---------------------------------------------------------------------------+   |
|   |                          DATABASE LAYER (PostgreSQL)                      |   |
|   |  orders | order_items | order_batch_allocations | inventory_reservations  |   |
|   |  order_status_history | order_cancellations | invoices | idempotency_recs |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## 4. Order Creation: 21-Step Atomic Workflow

When a customer submits `POST /api/v1/orders`, the `OrderCreationService` orchestrates the following transactional workflow:

1. **Authentication**: Authenticate customer identity via JWT bearer token.
2. **Idempotency Verification**: Check `Idempotency-Key` header against `order_idempotency_records`. If key exists and request SHA-256 hash matches, return existing order immediately. If hash differs, abort with 409 Conflict.
3. **Cart Retrieval**: Fetch customer's active shopping cart and active cart items.
4. **Ownership Verification**: Ensure cart belongs exclusively to the calling customer.
5. **Product Status Verification**: Validate all cart items belong to active catalog products.
6. **Price Recalculation**: Recalculate selling price, MRP, discounts, and HSN tax rates independently on the backend.
7. **Address Verification**: Validate customer delivery address ID and ensure address belongs to the customer.
8. **Serviceability Revalidation**: Query `delivery_pincodes` to ensure delivery address pincode is currently serviceable.
9. **Prescription Eligibility Revalidation**: For all prescription products (Schedule H/H1/X), ensure customer has attached a valid, pharmacist-approved, non-expired prescription.
10. **Delivery Fee Calculation**: Determine delivery fee based on active delivery fee rules and cart subtotal.
11. **Total Price Verification**: Verify that calculated line totals, taxes, delivery fee, and grand total match checkout expectations.
12. **Material Price Change Verification**: Reject checkout if prices changed significantly without explicit customer acknowledgement.
13. **FEFO Inventory Batch Allocation**: For each line item, query batches ordered by `expiry_date ASC, id ASC`, excluding expired, recalled, or inactive batches.
14. **Atomic Stock Locking**: Acquire row-level locks on allocated batches (`SELECT FOR UPDATE`) and verify `sellable_stock >= quantity`.
15. **Order Record Creation**: Insert `orders` record with unique order number (`ORD-YYYYMMDD-XXXXXX`), customer ID, pricing totals, and JSON delivery address snapshot.
16. **Order Items Creation**: Insert `order_items` records with frozen product name, SKU, pack size, strength, unit price, tax rate, and line total snapshots.
17. **Batch Allocations Recording**: Insert `order_batch_allocations` records linking items to specific batches.
18. **Inventory Reservations Creation**: Insert `inventory_reservations` records with status `active` and log `StockMovement` as `STOCK_RESERVED`.
19. **Initial Status & History Logging**: Set status to `pharmacist_review` (if prescription required) or `pending_payment` / `processing`. Log initial transition in `order_status_history`.
20. **Active Cart Clearing**: Mark customer's cart status as `converted` or delete active cart items.
21. **Statutory Invoice Generation & Commit**: Generate initial Form 20 invoice record and commit the database transaction atomically.

---

## 5. Controlled State Machine Transition Matrix

The `OrderStateMachine` enforces valid, audited status transitions:

| Current Status | Allowed Next Statuses | Required Role / Gate |
| :--- | :--- | :--- |
| `placed` | `pending_payment`, `pharmacist_review`, `processing`, `cancelled` | System / Customer / Admin |
| `pending_payment` | `payment_confirmed`, `pharmacist_review`, `processing`, `cancelled`, `failed` | Payment Webhook / Admin / Customer |
| `payment_confirmed`| `pharmacist_review`, `processing`, `cancelled` | System / Pharmacist / Admin |
| `pharmacist_review`| `processing`, `rejected`, `cancelled` | Registered Pharmacist (`ORDERS_APPROVE` / `ORDERS_REJECT`) |
| `processing` | `ready_for_dispatch`, `cancelled` | Staff / Admin (`ORDERS_UPDATE_STATUS`) |
| `ready_for_dispatch`| `dispatched`, `cancelled` | Staff / Admin (Requires `payment_status == 'paid'`) |
| `dispatched` | `delivered`, `failed` | Delivery Partner / Admin (Cancellation blocked) |
| `delivered` | *(Terminal state)* | Delivery Partner / Admin |
| `cancelled` | *(Terminal state)* | System / Customer / Pharmacist / Admin |
| `rejected` | *(Terminal state)* | Registered Pharmacist (Rule 65 clinical rejection) |
| `failed` | *(Terminal state)* | System / Payment Failure |

### Critical State Transition Invariants:
1. **Pre-Dispatch Cancellation**: Orders can be cancelled by customers or admins only while in `placed`, `pending_payment`, `payment_confirmed`, `pharmacist_review`, `processing`, or `ready_for_dispatch`. Once `dispatched`, cancellation is permanently blocked.
2. **Stock Restoration**: Every transition to `cancelled` or `rejected` automatically triggers `release_order_reservations()`, updating reservations to `released` and logging `RESERVATION_RELEASED` stock movements.
3. **Dispatch Stock Consumption**: Transition to `dispatched` triggers `consume_order_reservations()`, updating reservations to `consumed`, permanently reducing physical batch stock and logging `STOCK_DISPATCHED`.
4. **Mandatory Payment Gate**: Transition to `dispatched` raises `400 Bad Request` if `payment_status` is not `paid` or `authorized`.

---

## 6. Database Entity Relationships

```
                     +----------------------------+
                     |           orders           |
                     +----------------------------+
                     | id (PK)                    |
                     | order_number (UNIQUE)      |
                     | customer_id (FK -> users)  |
                     | status                     |
                     | payment_status             |
                     | subtotal                   |
                     | discount_amount            |
                     | tax_amount                 |
                     | delivery_fee               |
                     | total_amount               |
                     | currency                   |
                     | delivery_address_snapshot  |
                     | idempotency_key (UNIQUE)   |
                     | placed_at, confirmed_at    |
                     +--------------+-------------+
                                    | 1
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
          v *                       v *                       v *
+--------------------+    +--------------------+    +---------------------+
|    order_items     |    |order_status_history|    | order_cancellations |
+--------------------+    +--------------------+    +---------------------+
| id (PK)            |    | id (PK)            |    | id (PK)             |
| order_id (FK)      |    | order_id (FK)      |    | order_id (FK)       |
| product_id (FK)    |    | previous_status    |    | requested_by (FK)   |
| product_name_snap  |    | new_status         |    | cancellation_reason |
| sku_snapshot       |    | changed_by (FK)    |    | cancellation_type   |
| strength_snapshot  |    | actor_role         |    | approved_by (FK)    |
| pack_size_snapshot |    | reason, notes      |    | cancellation_status |
| quantity           |    | created_at         |    | created_at          |
| unit_price         |    +--------------------+    +---------------------+
| mrp                |
| discount_amount    |
| taxable_amount     |
| tax_rate           |
| tax_amount         |
| line_total         |
| rx_required        |
+---------+----------+
          | 1
          |
          +-----------------------------------------+
          |                                         |
          v *                                       v *
+---------------------------+             +---------------------------+
|  order_batch_allocations  |             |   inventory_reservations  |
+---------------------------+             +---------------------------+
| id (PK)                   |             | id (PK)                   |
| order_id (FK)             |             | order_id (FK)             |
| order_item_id (FK)        |             | order_item_id (FK)        |
| batch_id (FK -> batches)  |             | batch_id (FK -> batches)  |
| allocated_quantity        |             | reserved_quantity         |
| released_quantity         |             | released_quantity         |
| consumed_quantity         |             | consumed_quantity         |
| allocation_status         |             | status                    |
| created_at, updated_at    |             | reserved_at, released_at  |
+---------------------------+             +---------------------------+
```

---

## 7. Auditability & Compliance Summary

1. **Rule 65 Register Maintenance**:
   - Every prescription item dispensed is linked to a registered batch number, manufacturer, expiry date, patient prescription ID, and approving pharmacist registration number.
2. **Form 20 Cash Memo Storage**:
   - Invoices are stored in `private_storage/invoices/` and served via authenticated streaming endpoints.
   - Customers can view and download their invoices at any time from `/account/orders/[id]`.
3. **Double-Entry Stock Audit Trail**:
   - Every reservation and release logs an immutable row in `inventory_stock_movements`, ensuring physical stock matches digital inventory with 100% precision.
