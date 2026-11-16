# Med24Plus Pharmacy Inventory Architecture & FEFO Engine

This document defines the inventory management architecture, batch tracking, statutory constraints, and First Expiry, First Out (FEFO) dispensing methodology for Med24Plus.

---

## 1. Separation of Product Catalog vs Inventory

In standard generic e-commerce systems, an "in_stock" boolean or a "quantity" integer is frequently stored directly on the product table. In a licensed pharmaceutical environment governed by the **Drugs and Cosmetics Act, 1940**, this is strictly unacceptable.

In Med24Plus:
- The `products` table represents **therapeutic formulations and catalog metadata**. A product record existing in the catalog does **not** indicate available medication.
- Actual physical units are recorded in `inventory_batches`.
- Each physical pack belongs to a distinct batch with an immutable manufacturer, batch number, manufacturing date, and expiry date.
- The `inventory` table maintains aggregated summary caches, but the single source of truth for sellable units is the sum of `available_quantity - reserved_quantity` across active, unexpired batches in `inventory_batches`.

```
[ Catalog: products ]  (No quantity stored here)
        |
        | 1 : N
        v
[ inventory_batches ]  (Batch ID, Mfg Date, Expiry Date, Available, Reserved, Quarantined)
        |
        | 1 : 1
        v
[ Statutory FEFO Dispatch ] -> (Earliest Expiry First)
```

---

## 2. Stock States & Quantity Integrity

Each batch tracks quantities in distinct mutually exclusive states:

1. **`available_quantity`**: Total physically sound stock units present in warehouse racks.
2. **`reserved_quantity`**: Units currently allocated to pending customer orders awaiting packing or prescription review.
   - *Constraint*: `reserved_quantity <= available_quantity`.
   - *Sellable Capacity*: `available_quantity - reserved_quantity`.
3. **`damaged_quantity`**: Defective, broken, or unsealed units withdrawn from sale.
4. **`quarantined_quantity`**: Units placed on hold pending regulatory inspection, manufacturer recall, or temperature deviation investigations.

### Database Constraints Enforced:
```sql
ALTER TABLE inventory_batches
  ADD CONSTRAINT check_batch_available_non_negative CHECK (available_quantity >= 0),
  ADD CONSTRAINT check_batch_reserved_non_negative CHECK (reserved_quantity >= 0),
  ADD CONSTRAINT check_batch_damaged_non_negative CHECK (damaged_quantity >= 0),
  ADD CONSTRAINT check_batch_quarantined_non_negative CHECK (quarantined_quantity >= 0),
  ADD CONSTRAINT check_batch_reserved_lte_available CHECK (reserved_quantity <= available_quantity),
  ADD CONSTRAINT check_batch_expiry_after_mfg CHECK (expiry_date > manufacturing_date);
```

---

## 3. FEFO (First Expiry, First Out) Strategy

### Rationale
Medicines lose chemical potency and legal validity upon passing their expiration date. Under Indian drug compliance rules, dispensing expired or near-expiry medicine is an offense. The FEFO strategy ensures:
1. Batches with the closest expiration date are allocated first.
2. Batches within 90 days of expiry are automatically placed on clearance or quarantined.
3. Expired batches cannot be reserved or added to customer carts.

### Composite FEFO Index:
```sql
CREATE INDEX ix_batches_fefo ON inventory_batches (product_id, expiry_date, batch_status);
```

### Allocation Query Pattern:
```sql
SELECT id, batch_number, expiry_date, available_quantity, reserved_quantity
FROM inventory_batches
WHERE product_id = :target_product_id
  AND batch_status = 'active'
  AND expiry_date > CURRENT_DATE + INTERVAL '90 days'
  AND (available_quantity - reserved_quantity) > 0
ORDER BY expiry_date ASC, created_at ASC
FOR UPDATE SKIP LOCKED;
```

---

## 4. Immutable Stock Movement Ledger (`stock_movements`)

Every single inventory modification generates a permanent `stock_movements` record. Quantities are never mutated without an accompanying movement event:

- **`INWARD_PURCHASE`**: Receiving supplier deliveries from licensed wholesalers.
- **`ORDER_RESERVED`**: Placing temporary hold during order checkout.
- **`ORDER_RELEASED`**: Releasing reserved hold if payment fails or order cancels.
- **`OUTWARD_DISPENSED`**: Registered pharmacist approving final dispensing and statutory invoice generation.
- **`DAMAGE_WRITEOFF`**: Breakage or cold-chain excursion writeoff.
- **`QUARANTINE`**: Regulatory lock or manufacturer recall.
- **`RETURN_RESTOCK`**: Safe patient return of unsealed, temperature-stable goods.

---

## 5. Physical Inventory Audits & Discrepancies (`stock_adjustments`)

Physical counts occasionally differ from theoretical database ledger counts due to damaged ampoules, handling leakage, or supplier shortfalls.
- Audit adjustments follow a maker-checker workflow:
  1. A warehouse staff member enters counted quantities (`StockAdjustment` in `draft` status).
  2. The system computes `quantity_delta` (`counted_quantity - system_quantity`).
  3. A supervising Pharmacist or Administrator verifies the reason (Breakage, Physical discrepancy) and approves (`status = applied`).
  4. Movement records are automatically posted to update the batch ledger.

