# Med24Plus Database Indexing & Performance Strategy

This document details the indexing architecture, query patterns, and performance optimizations implemented for PostgreSQL 16 in Med24Plus.

---

## 1. Indexing Philosophy
Indexes are designed to optimize high-traffic read paths (catalog browsing, customer phone lookups, prescription triage, and order status polling) while strictly bounding write overhead on high-velocity tables (`stock_movements`, `audit_logs`).

---

## 2. Key Indexes & Operational Rationale

### 2.1 User Authentication & Identity
- `ix_users_phone` (`phone`, Unique):
  - Primary credential for OTP login in the Indian market. Guarantees sub-millisecond account lookups.
- `ix_users_email` (`email`, Unique, Nullable):
  - Secondary communication channel.
- `ix_users_status_active` (`status`, `is_active`):
  - Composite index used by auth middleware to filter out suspended or deactivated accounts.
- `ix_user_addresses_pincode` (`pincode`):
  - Fast lookup for serviceable Indian delivery pin codes.

### 2.2 Product Catalog & Search
- `ix_products_slug` (`slug`, Unique):
  - Fast SEO route resolution for Customer Web Next.js SSR (`/products/[slug]`).
- `ix_products_sku` (`sku`, Unique):
  - Warehouse barcode scanning and supplier catalog reconciliation.
- `ix_products_schedule_active` (`schedule_classification`, `is_active`):
  - Powers regulatory filters separating OTC medicines from Schedule H, H1, and X drugs.
- `ix_products_category_brand` (`category_id`, `brand_id`):
  - Composite index accelerating faceted category and brand catalog queries.
- `ix_products_generic_search` (`generic_name`, `is_active`):
  - Supports pharmacist substitution queries (finding generic equivalents for prescribed drugs).

### 2.3 Pharmacy Inventory & FEFO Dispatch
- **`ix_batches_fefo` (`product_id`, `expiry_date`, `batch_status`)**:
  - **Most critical query index in the pharmacy engine**.
  - Supports statutory First Expiry, First Out (FEFO) queries:
    ```sql
    SELECT * FROM inventory_batches
    WHERE product_id = :p_id AND batch_status = 'active' AND available_quantity > 0
    ORDER BY expiry_date ASC
    LIMIT 1;
    ```
- `ix_batches_status_expiry` (`batch_status`, `expiry_date`):
  - Powers nightly cron jobs detecting batches nearing expiry (e.g., within 90 days).
- `uq_product_batch_number` (`product_id`, `batch_number`, Unique):
  - Prevents accidental duplicate inward entry of identical batch identifiers.

### 2.4 Prescription Review Workflow
- `ix_prescriptions_customer_status` (`customer_id`, `prescription_status`):
  - Accelerates mobile app prescription list rendering (`My Prescriptions` screen).
- `ix_prescriptions_prescription_reference` (`prescription_reference`, Unique):
  - Clinical identifier referenced on prescription tokens.
- `ix_pharmacist_verification` (`is_verified`, `employment_status`):
  - Used when routing incoming prescriptions to active, legally verified pharmacists only.

### 2.5 Order Management & Tracking
- `ix_orders_order_number` (`order_number`, Unique):
  - Primary customer and invoice reference.
- `ix_orders_customer_status` (`customer_id`, `status`):
  - Supports customer order history queries.
- `ix_orders_created_at_status` (`created_at`, `status`):
  - Powers admin dashboard queues (e.g. Orders awaiting pharmacist review).

### 2.6 Audit Trails & Tamper Evidence
- `ix_audit_logs_entity` (`entity_type`, `entity_id`):
  - Allows instant chronological reconstruction of any medication or user's lifecycle.
- `ix_audit_logs_action_created` (`action`, `created_at`):
  - Accelerates regulatory inspections for statutory registers (Schedule H/H1 registers).
- `ix_stock_movements_prod_time` (`product_id`, `created_at`):
  - Ledger inspection for stock reconciliation.

---

## 3. Index Maintenance & Monitoring
- Periodic `ANALYZE` commands should be scheduled via pg_cron or autovacuum.
- Unused indexes are monitored via `pg_stat_user_indexes`.

