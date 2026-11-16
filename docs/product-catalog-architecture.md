# Med24Plus Product Catalog Architecture

This document describes the architectural principles, domain models, regulatory classifications, and query strategies for the Med24Plus Product Catalog.

---

## 1. Architectural Philosophy: Separation of Catalog vs Inventory

In standard retail e-commerce systems, an "in_stock" boolean flag or stock counter is frequently stored directly on the `products` table. In a licensed Indian retail pharmacy governed by the **Drugs and Cosmetics Act, 1940**, and the **Drugs and Cosmetics Rules, 1945**, this pattern is strictly invalid.

In Med24Plus:
- The **`products`** table is a pure master catalog containing therapeutic composition, dosage form, packaging, and regulatory parameters. It has zero awareness of warehouse quantities.
- Physical units are recorded in **`inventory_batches`**.
- Available sellable stock is **dynamically computed** from active, unexpired, undamaged, and non-quarantined batches:
  $$\text{Sellable Stock} = \sum (\text{available\_quantity} - \text{reserved\_quantity})$$
- A product is only presented as `is_in_stock = True` when at least one valid, unexpired batch with positive sellable capacity exists in the warehouse.

---

## 2. Statutory Drug Classifications & Pricing

Med24Plus enforces statutory Indian pharmaceutical regulations at the schema and API layer:

| Schedule / Flag | Statutory Reference | Verification & Dispensing Requirement |
| :--- | :--- | :--- |
| **OTC** | General Sales Rules | Over-the-counter sales without mandatory medical prescription. |
| **SCHEDULE_H** | Rule 65, Schedule H | Sold strictly against the prescription of a Registered Medical Practitioner (RMP). |
| **SCHEDULE_H1** | Rule 65(9), Schedule H1 | High-risk antibiotics, narcotics; logged in separate Schedule H1 audit registers with doctor details for 3 years. |
| **SCHEDULE_X** | Schedule X Narcotics | Barred from general digital fulfillment by default (`is_restricted = True`). |

### Financial Constraints:
- `selling_price <= mrp` (Maximum Retail Price under Drugs Prices Control Order - DPCO).
- `discount_percent = ((mrp - selling_price) / mrp) * 100`.
- Indian HSN Classification (e.g. `3004` for medicaments).
- GST Rate (`12.00%` standard, `5.00%` life-saving formulations).

---

## 3. Master Catalog Entity Relationships

```
+--------------------+ 1      N +--------------------+ 1      N +---------------------+
|     categories     |<-------->|      products      |<-------->|  inventory_batches  |
+--------------------+          +--------------------+          +---------------------+
                                   | 1            | 1
+--------------------+ 1      N    v N            v N
|       brands       |<------------+              |
+--------------------+          +--------+     +------------+
                                | images |     | attributes |
                                +--------+     +------------+
```

### Hierarchy & Safety:
- **Hierarchical Categories**: Parent-child relationship with circular loop protection (`has_circular_parent`).
- **Referential Integrity**: Categories and brands with active products cannot be deleted.
- **Soft Deletion**: Products, categories, and brands implement `SoftDeleteMixin` (`is_deleted = True`, `is_active = False`) to prevent breaking historical prescription or invoice snapshots.

---

## 4. Query & Search Optimization

1. **Composite Database Indexes**:
   - `ix_products_schedule_active` on `(schedule_classification, is_active)`
   - `ix_products_category_brand` on `(category_id, brand_id)`
   - `ix_products_generic_search` on `(generic_name, is_active)`
2. **Eager Loading**:
   - Category, Brand, Images, and Attributes are loaded with `selectinload(...)` to eliminate N+1 query overhead.
3. **Dynamic Inventory Aggregation**:
   - Product list queries execute a single grouped aggregation query over `inventory_batches` matching candidate IDs, returning sellable counts in a single round-trip.

