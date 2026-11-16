# Med24Plus Database Schema Design (PostgreSQL 16)

## 1. Domain Entities & ER Overview

```
                      +-------------------+
                      |       users       |
                      +-------------------+
                                | 1
                                |
             +------------------+------------------+
             | N                                   | N
   +-------------------+                 +-------------------+
   |   prescriptions   |                 |      orders       |
   +-------------------+                 +-------------------+
             | 1                                   | 1
             | N                                   | N
   +--------------------+                +-------------------+
   | rx_verified_items  |                |    order_items    |
   +--------------------+                +-------------------+
                                                   | N
                                                   | 1
                                         +-------------------+
                                         | medicine_batches  |
                                         +-------------------+
                                                   | N
                                                   | 1
                                         +-------------------+
                                         |     medicines     |
                                         +-------------------+
                                                   | N
                                                   | 1
                                         +-------------------+
                                         |    categories     |
                                         +-------------------+
```

---

## 2. Table Specifications

### 2.1 `users`
- `id` (UUID, Primary Key)
- `phone` (VARCHAR(15), Unique, Indexed)
- `email` (VARCHAR(255), Unique, Nullable)
- `hashed_password` (VARCHAR(255), Nullable for OTP-only users)
- `full_name` (VARCHAR(100))
- `role` (ENUM: `CUSTOMER`, `PHARMACIST`, `ADMIN`, `DELIVERY`)
- `pharmacist_license_no` (VARCHAR(50), Nullable - Mandatory if role is `PHARMACIST`)
- `is_active` (BOOLEAN, Default: True)
- `created_at` (TIMESTAMPTZ, Default: `NOW()`)
- `updated_at` (TIMESTAMPTZ, Default: `NOW()`)

### 2.2 `medicines`
- `id` (UUID, Primary Key)
- `brand_name` (VARCHAR(200), Indexed) — e.g. "Augmentin 625 Duo"
- `generic_name` (VARCHAR(250), Indexed) — e.g. "Amoxicillin and Potassium Clavulanate"
- `category_id` (UUID, Foreign Key -> `categories.id`)
- `dosage_form` (ENUM: `TABLET`, `CAPSULE`, `SYRUP`, `INJECTION`, `OINTMENT`, `DROPS`)
- `strength` (VARCHAR(50)) — e.g. "625 mg", "500 mg / 5 ml"
- `manufacturer` (VARCHAR(150))
- `schedule_type` (ENUM: `OTC`, `SCHEDULE_H`, `SCHEDULE_H1`, `SCHEDULE_X`, `SCHEDULE_G`)
- `requires_prescription` (BOOLEAN, Default: False)
- `is_cold_chain` (BOOLEAN, Default: False - requires 2-8°C storage)
- `gst_rate_percent` (NUMERIC(5, 2), e.g. 5.00% or 12.00%)
- `hsn_code` (VARCHAR(10), e.g. "3004")
- `created_at`, `updated_at`

### 2.3 `medicine_batches`
*Crucial for Indian Drug Compliance & Expiry Management (FEFO - First Expired First Out)*
- `id` (UUID, Primary Key)
- `medicine_id` (UUID, Foreign Key -> `medicines.id`, Indexed)
- `batch_number` (VARCHAR(50), Indexed)
- `manufacturing_date` (DATE)
- `expiry_date` (DATE, Indexed)
- `mrp_inr` (NUMERIC(10, 2))
- `selling_price_inr` (NUMERIC(10, 2))
- `purchase_cost_inr` (NUMERIC(10, 2))
- `available_quantity` (INTEGER, Default: 0)
- `reserved_quantity` (INTEGER, Default: 0)
- `created_at`, `updated_at`

### 2.4 `prescriptions`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `users.id`, Indexed)
- `storage_path` (VARCHAR(500)) — S3 private key
- `doctor_name` (VARCHAR(150), Nullable)
- `doctor_registration_no` (VARCHAR(100), Nullable)
- `patient_name` (VARCHAR(100), Nullable)
- `prescription_date` (DATE, Nullable)
- `status` (ENUM: `PENDING_REVIEW`, `VERIFIED`, `REJECTED`, `EXPIRED`)
- `pharmacist_id` (UUID, Foreign Key -> `users.id`, Nullable)
- `pharmacist_notes` (TEXT, Nullable)
- `rejection_reason` (TEXT, Nullable)
- `verified_at` (TIMESTAMPTZ, Nullable)
- `created_at`, `updated_at`

### 2.5 `orders` & `order_items`
- Tracks order lifecycle (`PLACED`, `RX_VERIFIED`, `PACKED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`).
- Associates exact batch IDs with each dispensed line for statutory records.
- Records full GST breakup (CGST + SGST for intra-state Indian retail sales).

### 2.6 `dispensing_audit_logs`
- Implements statutory compliance requirements for Schedule H and H1 registers.
- Records order ID, batch number, quantity dispensed, prescribing doctor, and dispensing pharmacist timestamp.

