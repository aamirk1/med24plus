# Med24Plus Pharmacy Inventory Workflows

This document outlines the standard operational workflows for inward stock receiving, physical cycle counting, adjustments, and batch status lifecycle management.

---

## 1. Stock Inward Receiving Workflow

```
[Supplier Invoice / Delivery Received]
                  |
                  v
[Pharmacist / Inventory Manager Physical Inspection]
  - Check seal integrity & cold chain monitor
  - Verify Batch Number, Mfg Date, Expiry Date
                  |
                  v
[POST /api/v1/admin/inventory/receive-stock]
                  |
                  v
    +------------------------------------------+
    | Atomic Transaction:                      |
    | 1. Find or create `inventory_batches`    |
    |    - Increment available_quantity        |
    | 2. Insert `stock_movements` record       |
    |    (type: INWARD_PURCHASE, delta: +N)    |
    | 3. Recalculate `inventory` aggregates    |
    | 4. Auto-resolve existing OUT_OF_STOCK    |
    |    or LOW_STOCK alerts if replenished    |
    +------------------------------------------+
```

---

## 2. Stock Adjustment (Cycle Count Discrepancy) Workflow

When physical counts on warehouse shelves deviate from theoretical database balances:

```
[Physical Warehouse Audit / Count]
                  |
                  v
[Detect Discrepancy (Damaged, Lost, Expired, Found)]
                  |
                  v
[POST /api/v1/admin/inventory/adjustments]
  - Select Adjustment Type:
      * increase (Found inventory)
      * decrease (Stock shortfall)
      * damaged (Crushed blisters / broken ampoules)
      * expired (Passed statutory expiry date)
      * correction (Direct physical count reset)
  - Mandatory audit reason & notes
                  |
                  v
    +------------------------------------------+
    | Atomic Transaction:                      |
    | 1. Validate available_quantity >= delta  |
    |    (Strictly prevent negative stock)     |
    | 2. Mutate batch quantities               |
    | 3. Insert `stock_adjustments` master     |
    | 4. Insert `stock_adjustment_items` line  |
    | 5. Post `stock_movements` audit entry    |
    | 6. Recalculate `inventory` row           |
    | 7. Trigger low-stock alert evaluation    |
    +------------------------------------------+
```

---

## 3. Batch Lifecycle & Quarantine Workflow

```
[Active Batch (Rule 65 FEFO Dispensable)]
        |
        +------> [Temperature Excursion / Recall Notice]
        |               |
        |               v
        |        [PATCH /batches/{id}/status -> "quarantined"]
        |        (Excluded from sellable stock immediately)
        |               |
        |               +---> [Clearance Audit Passed] ---> [Status: "active"]
        |               +---> [Confirmed Defect]     ---> [Status: "recalled"]
        |
        +------> [Expiry Date Reached (<= today)]
                        |
                        v
                 [Status: "expired"]
                 (Barred from order allocation forever)
```

