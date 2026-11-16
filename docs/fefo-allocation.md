# Med24Plus First Expiry, First Out (FEFO) Allocation Engine

This document specifies the technical design, statutory obligations, and algorithmic execution of the **FEFO (First Expiry, First Out)** allocation service in Med24Plus.

---

## 1. Statutory Mandate: Drugs and Cosmetics Rules, 1945

Under Indian drug compliance regulations:
- Dispensing expired medication is a severe non-bailable statutory offense under the **Drugs and Cosmetics Act, 1940**.
- In retail dispensing, medications with the earliest expiration date must always be dispensed before newer stock.
- The FEFO engine in Med24Plus automates this requirement at the database and service layer.

---

## 2. Allocation Selection Algorithm

When allocating stock for a product $P$ with requested quantity $Q$:

1. **Batch Filtering**:
   Only batches satisfying all of the following conditions are considered:
   $$\text{batch\_status} = \text{'active'}$$
   $$\text{expiry\_date} > \text{CURRENT\_DATE}$$
   $$\text{available\_quantity} - \text{reserved\_quantity} > 0$$
   Expired, quarantined, recalled, depleted, and damaged units are strictly excluded.

2. **Chronological Sorting**:
   Batches are ordered by:
   $$\text{ORDER BY expiry\_date ASC, created\_at ASC}$$

3. **Sequential Quantity Allocation**:
   For each batch $B_i$:
   $$\text{Allocatable} = \min(Q_{\text{remaining}}, B_i.\text{available} - B_i.\text{reserved})$$
   $$Q_{\text{remaining}} \leftarrow Q_{\text{remaining}} - \text{Allocatable}$$
   Add $(B_i, \text{Allocatable})$ to allocation manifest.
   Stop when $Q_{\text{remaining}} = 0$.

4. **Shortfall Detection**:
   If after exhausting all valid batches $Q_{\text{remaining}} > 0$:
   - `is_fully_allocated = False`
   - `shortfall = Q_{\text{remaining}}`
   - If strict validation is requested, raises `InsufficientStockError`.

---

## 3. Python Service Interface (`fefo_allocation_service.py`)

```python
from app.services.fefo_allocation_service import fefo_allocation_service

# Pure memory allocation simulation
result = fefo_allocation_service.calculate_allocation_from_batches(
    product_id=product.id,
    batches=product.batches,
    requested_quantity=20,
)

# Database-backed async query with row-level locking
result = await fefo_allocation_service.allocate_product_stock(
    db=db,
    product_id=product_id,
    requested_quantity=20,
    lock_for_update=True,  # Uses SELECT ... FOR UPDATE
    raise_if_insufficient=True,
)
```

---

## 4. Concurrency & Locking Strategy for Future Order Phase

When actual order reservations are implemented in Phase 7:
- Batches are selected with `with_for_update()` (row-level locking).
- Prevents race conditions where two simultaneous checkouts attempt to claim the last units of the earliest expiring batch.

