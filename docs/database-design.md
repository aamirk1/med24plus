# Med24Plus Database Schema & Architecture Design (PostgreSQL 16)

## 1. Architectural Foundations & Principles
Med24Plus operates as an enterprise single-pharmacy dispensing platform designed specifically for the Indian pharmaceutical and healthcare retail market under the **Drugs and Cosmetics Act, 1940**, and the **Drugs and Cosmetics Rules, 1945**.

Key architectural pillars of the data tier:
1. **Strict Relational Normalization**: High degree of normalization to eliminate redundant operational state while preserving legal invoice snapshots.
2. **Deterministic Primary Keys**: UUIDv4 across all operational and medical entities to prevent enumeration attacks and support distributed log collation.
3. **Immutability of Statutory Transactions**: Prescriptions, dispensing records, order items, GST tax breakdowns, and audit trails cannot be destructively altered once committed.
4. **Separation of Catalog vs Inventory Quantities**: Catalog items exist independently of warehouse stock. Zero stock is assumed unless backed by valid, unexpired, non-quarantined batches.
5. **FEFO (First Expiry, First Out)**: Database-enforced indexing and constraints ensuring dispensing occurs chronologically from the earliest expiring available batch.
6. **Financial Integrity**: All monetary values (MRP, Selling Price, Subtotal, CGST, SGST, IGST, Grand Total) use `NUMERIC(12, 2)` or `NUMERIC(5, 2)`. Zero floating-point arithmetic.
7. **Strict Regulatory Isolation**: Schedule X and restricted narcotics are flagged with `is_restricted = True` and blocked from digital fulfillment by default.

---

## 2. Complete Entity-Relationship (ER) Architecture

```
+-----------------------------------------------------------------------------------------------------------------+
|                                                   AUTHENTICATION & RBAC                                         |
|                                                                                                                 |
|   +--------------------+ 1      N +-------------------+                                                         |
|   |       users        |<-------->|     user_roles    |                                                         |
|   +--------------------+          +-------------------+                                                         |
|      | 1        | 1                         ^ N                                                                 |
|      |          |                           | 1                                                                 |
|      v 1        v 1               +-------------------+ 1      N +-------------------+                          |
|   +---------+ +-------------+     |       roles       |<-------->|  role_permissions |                          |
|   | profiles| |addresses (N)|     +-------------------+          +-------------------+                          |
|   +---------+ +-------------+                                              ^ N                                  |
|                                                                            | 1                                  |
|                                                                  +-------------------+                          |
|                                                                  |    permissions    |                          |
|                                                                  +-------------------+                          |
+-----------------------------------------------------------------------------------------------------------------+
                                     | 1
                                     |
               +---------------------+---------------------+
               | N                                         | N
+-------------------------------+           +-------------------------------+
|     PRESCRIPTIONS & AUDIT     |           |        ORDERS & INVOICES      |
|                               |           |                               |
|   +-----------------------+   |           |   +-----------------------+   |
|   |     prescriptions     |   |           |   |        orders         |   |
|   +-----------------------+   |           |   +-----------------------+   |
|      | 1              | 1     |           |      | 1              | 1     |
|      v N              v N     |           |      v N              v 1     |
|   +---------+    +----------+ |           |   +-------------+ +---------+ |
|   | rx_items|    |review_log| |           |   | order_items | |deliveries |
|   +---------+    +----------+ |           |   +-------------+ +---------+ |
+-------------------------------+           +-------------------------------+
                                                           | N
                                                           v 1
+-----------------------------------------------------------------------------------------------------------------+
|                                                INVENTORY & FEFO                                                 |
|                                                                                                                 |
|   +-----------------------+ 1       N +-----------------------+ 1       N +-----------------------+             |
|   |      categories       |<--------->|       products        |<--------->|   inventory_batches   |             |
|   +-----------------------+           +-----------------------+           +-----------------------+             |
|                                           | 1            | 1                 | 1             | 1                |
|   +-----------------------+ 1       N     v 1            v N                 v N             v N                |
|   |        brands         |<--------------+          +--------+          +---------+     +---------+            |
|   +-----------------------+                          | images |          |movements|     | alerts  |            |
|                                                      +--------+          +---------+     +---------+            |
+-----------------------------------------------------------------------------------------------------------------+
```

---

## 3. Data Dictionary: Tables & Constraints

The database consists of **37 domain tables** registered in PostgreSQL:

### 3.1 Authentication, Access & User Domain
1. **`users`**: Base credentials, phone (unique), email (unique), password hash, activation flags, soft deletion.
   - *Index*: `ix_users_phone`, `ix_users_email`, `ix_users_status_active`.
2. **`user_profiles`**: Extended demographic information (DOB, blood group, emergency contact).
3. **`user_addresses`**: Standardized Indian delivery addresses with landmark, city, state, and 6-digit PIN code.
   - *Index*: `ix_user_addresses_user_default`, `ix_user_addresses_pincode`.
4. **`user_sessions`**: Active JWT token hashes, client device fingerprints, expiration timestamps.
5. **`roles`**: System roles (`customer`, `pharmacist`, `inventory_manager`, `admin`, `delivery_agent`).
6. **`permissions`**: Fine-grained capabilities grouped by module (`prescriptions:review`, `inventory:adjust`, etc.).
7. **`role_permissions`**: Many-to-many junction between roles and granular permissions.
8. **`user_roles`**: Many-to-many mapping of assigned roles per user account.

### 3.2 Staff & Clinical Verification Domain
9. **`staff_profiles`**: Employee identification, department, designation, and employment status.
10. **`pharmacist_profiles`**: Mandatory registered pharmacist licensing under Rule 65.
    - Fields: `registration_number`, `state_pharmacy_council`, `registration_valid_upto`, `is_verified` (Boolean, default False), `verified_by_id`, `verified_at`, `drug_license_number`.
    - *Index*: `ix_pharmacist_verification` on `(is_verified, employment_status)`.
11. **`pharmacist_qualifications`**: Degree records (B.Pharm, D.Pharm, Pharm.D) and encrypted document keys.

### 3.3 Product Catalog Domain
12. **`categories`**: Hierarchical category tree with self-referential `parent_id` foreign key.
13. **`brands`**: Pharmaceutical manufacturer brands and certifications.
14. **`products`**: Medication catalog master with clinical parameters.
    - Fields: `generic_name` (composition), `pack_size`, `dosage_form`, `strength`, `storage_temperature`, `is_cold_chain`, `requires_prescription`, `schedule_classification` (OTC, SCHEDULE_H, SCHEDULE_H1, SCHEDULE_X), `is_restricted`, `mrp`, `selling_price`, `hsn_code`, `gst_rate`.
    - *Constraints*: `selling_price <= mrp`, `mrp >= 0`, `selling_price >= 0`, `gst_rate >= 0`.
    - *Index*: `ix_products_schedule_active`, `ix_products_category_brand`, `ix_products_generic_search`.
15. **`product_images`**: S3 CDN paths for packaging and blister pack photography.
16. **`product_attributes`**: Therapeutic indications, contraindications, and patient guidance.

### 3.4 Pharmacy Inventory & FEFO Domain
17. **`inventory`**: Product-level aggregated inventory quantities, reorder thresholds.
    - *Constraints*: Non-negative available, reserved, damaged, and quarantined stock.
18. **`inventory_batches`**: Central batch ledger for statutory Indian pharmacy compliance.
    - Fields: `batch_number`, `manufacturing_date`, `expiry_date`, `received_quantity`, `available_quantity`, `reserved_quantity`, `purchase_price`, `batch_mrp`, `supplier_name`, `batch_status`, `storage_location`.
    - *Constraints*: `expiry_date > manufacturing_date`, `reserved_quantity <= available_quantity`, `available_quantity >= 0`, `purchase_price >= 0`, `batch_mrp >= 0`, Unique on `(product_id, batch_number)`.
    - *Index*: `ix_batches_fefo` on `(product_id, expiry_date, batch_status)`.
19. **`stock_movements`**: Immutable double-entry audit trail for all inward, outward, and damaged units.
20. **`stock_adjustments`**: Formal warehouse audit requests with multi-person authorization.
21. **`stock_adjustment_items`**: Line items comparing physical count against system count.
22. **`stock_alerts`**: Automated alerts for low stock, nearing expiry (90 days), or depleted batches.

### 3.5 Prescription Management Domain
23. **`prescriptions`**: Patient prescription records linked to encrypted private S3 storage.
    - Fields: `prescription_reference`, `storage_object_key` (Private key, zero public URLs), `file_mime_type`, `doctor_name`, `doctor_registration_no`, `prescription_status` (`pending_review`, `under_review`, `approved`, `rejected`, `expired`).
24. **`prescription_items`**: Extracted dosage, frequency, and verified quantity per line.
25. **`prescription_review_logs`**: Tamper-evident ledger of pharmacist review, rejection reasons, and digital stamps.

### 3.6 Order & Invoice Domain
26. **`orders`**: Customer medication orders and statutory retail invoices.
    - Fields: `order_number`, `subtotal`, `discount_amount`, `cgst_amount`, `sgst_amount`, `igst_amount`, `delivery_fee`, `grand_total`, `delivery_address_snapshot` (JSONB), `billing_address_snapshot` (JSONB).
    - *Constraints*: Non-negative financial values (`grand_total >= 0`, `subtotal >= 0`).
27. **`order_items`**: Immutable snapshots of product details, statutory batch numbers, expiry dates, HSN codes, and GST rates.
    - *Constraints*: `quantity > 0`, `unit_price >= 0`.
28. **`order_status_history`**: State transition log tracking order lifecycle.

### 3.7 Payments & Refunds Domain
29. **`payments`**: Transaction records with Indian gateways (Razorpay, UPI Intent, Netbanking, COD).
    - *Security*: No credit card numbers, CVVs, or bank secrets are ever stored in the database.
30. **`refunds`**: Statutory refund tracking for rejected prescriptions or unfulfilled medications.
31. **`payment_transactions`**: Webhook responses and payment provider event audit payloads.

### 3.8 Delivery Logistics Domain
32. **`delivery_partners`**: Fleet configurations (internal couriers, Dunzo, Borzo, Delhivery).
33. **`deliveries`**: Order dispatches, cold-chain temperature handover validation, and OTP verification hashes.
34. **`delivery_status_history`**: Checkpoint transit history.

### 3.9 Notifications & Compliance Audit Domain
35. **`notifications`**: Transactional messaging and clinical review status alerts.
36. **`notification_preferences`**: Opt-in channels (SMS, WhatsApp, Email).
37. **`audit_logs`**: System-wide statutory compliance audit trail for all pharmacist dispensing and batch quarantine actions.
