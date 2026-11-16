# Med24Plus Stock & Movement Management

Comprehensive guide to quantity states, non-negative constraints, and the immutable stock movements ledger.

---

## 1. Stock Quantity States

Every physical batch maintains distinct counters:

| State Field | Description | Constraint |
| :--- | :--- | :--- |
| `available_quantity` | Physically present, sound units on warehouse racks. | `available_quantity >= 0` |
| `reserved_quantity` | Units held for confirmed customer orders awaiting packaging or Rx review. | `reserved_quantity <= available_quantity` |
| `damaged_quantity` | Units defective, broken, or unsealed withdrawn from sale. | `damaged_quantity >= 0` |
| `quarantined_quantity` | Units suspended from sale pending inspection. | `quarantined_quantity >= 0` |
| **Sellable Capacity** | Available sound units not committed to any reservation: $(\text{available} - \text{reserved})$. | Must be $> 0$ for active listing. |

---

## 2. Immutable Movement Ledger (`stock_movements`)

Med24Plus operates a double-entry style immutable movement ledger. Physical stock is never altered without an accompanying row in `stock_movements`:

### Standard Movement Types:
- `INWARD_PURCHASE`: Initial supplier delivery.
- `ORDER_RESERVED`: Held during checkout.
- `ORDER_RELEASED`: Reservation cancellation.
- `OUTWARD_DISPENSED`: Rule 65 dispensing confirmation.
- `DAMAGE_WRITEOFF`: Physical breakage.
- `QUARANTINE`: Suspending batch from public sale.
- `stock_adjusted`: Positive/negative audit adjustment.
- `stock_expired`: Writeoff of expired medication.
- `stock_correction`: Direct count discrepancy resolution.

### Immutability:
- No `UPDATE` or `DELETE` API endpoints exist for `stock_movements`.
- Every entry records `performed_by_id`, `created_at`, `balance_after`, `reference_type`, and `reference_id`.

