# Med24Plus Database Relationships & Referential Integrity

This document outlines the entity relationships, cascade policies, and foreign key strategies implemented across the 37 PostgreSQL models of Med24Plus.

---

## 1. Core Domain Relationships

### 1.1 Users & Authentication
- **User → UserProfile** (1:1):
  - Foreign Key: `user_profiles.user_id -> users.id`
  - Cascade: `ondelete="CASCADE"`. Deleting a user deletes the user profile.
- **User → UserAddress** (1:N):
  - Foreign Key: `user_addresses.user_id -> users.id`
  - Cascade: `ondelete="CASCADE"`.
- **User → UserSession** (1:N):
  - Foreign Key: `user_sessions.user_id -> users.id`
  - Cascade: `ondelete="CASCADE"`.
- **User ↔ Role** (M:N via `user_roles`):
  - Foreign Keys: `user_roles.user_id -> users.id`, `user_roles.role_id -> roles.id`
  - Cascade: `ondelete="CASCADE"`.
- **Role ↔ Permission** (M:N via `role_permissions`):
  - Foreign Keys: `role_permissions.role_id -> roles.id`, `role_permissions.permission_id -> permissions.id`
  - Cascade: `ondelete="CASCADE"`.

### 1.2 Staff & Clinical Verification
- **User → StaffProfile** (1:1):
  - Foreign Key: `staff_profiles.user_id -> users.id`
  - Cascade: `ondelete="CASCADE"`.
- **User → PharmacistProfile** (1:1):
  - Foreign Key: `pharmacist_profiles.user_id -> users.id`
  - Cascade: `ondelete="CASCADE"`.
- **PharmacistProfile → PharmacistQualification** (1:N):
  - Foreign Key: `pharmacist_qualifications.pharmacist_profile_id -> pharmacist_profiles.id`
  - Cascade: `ondelete="CASCADE"`.
- **PharmacistProfile → PrescriptionReviewLog** (1:N):
  - Foreign Key: `prescription_review_logs.pharmacist_profile_id -> pharmacist_profiles.id`
  - Policy: `ondelete="SET NULL"`. Review audit logs are preserved even if pharmacist profile state alters.

### 1.3 Product Catalog & Categories
- **Category → Category** (Self-referential 1:N hierarchy):
  - Foreign Key: `categories.parent_id -> categories.id`
  - Policy: `ondelete="SET NULL"`. Subcategories are not destroyed if parent is reorganized.
- **Category → Product** (1:N):
  - Foreign Key: `products.category_id -> categories.id`
  - Policy: `ondelete="RESTRICT"`. A category containing active products cannot be dropped.
- **Brand → Product** (1:N):
  - Foreign Key: `products.brand_id -> brands.id`
  - Policy: `ondelete="RESTRICT"`.
- **Product → ProductImage** (1:N):
  - Foreign Key: `product_images.product_id -> products.id`
  - Cascade: `ondelete="CASCADE"`.
- **Product → ProductAttribute** (1:N):
  - Foreign Key: `product_attributes.product_id -> products.id`
  - Cascade: `ondelete="CASCADE"`.

### 1.4 Pharmacy Inventory & Batches
- **Product → Inventory** (1:1 aggregated stock summary):
  - Foreign Key: `inventory.product_id -> products.id`
  - Cascade: `ondelete="CASCADE"`.
- **Product → InventoryBatch** (1:N):
  - Foreign Key: `inventory_batches.product_id -> products.id`
  - Policy: `ondelete="RESTRICT"`. Products with historical batches cannot be deleted; use soft deletion (`is_deleted=True`).
- **InventoryBatch → StockMovement** (1:N):
  - Foreign Key: `stock_movements.batch_id -> inventory_batches.id`
  - Policy: `ondelete="RESTRICT"`. Stock movements are immutable statutory ledgers.
- **StockAdjustment → StockAdjustmentItem** (1:N):
  - Foreign Key: `stock_adjustment_items.adjustment_id -> stock_adjustments.id`
  - Cascade: `ondelete="CASCADE"`.
- **InventoryBatch → StockAlert** (1:N):
  - Foreign Key: `stock_alerts.batch_id -> inventory_batches.id`
  - Cascade: `ondelete="CASCADE"`.

### 1.5 Prescription Lifecycle
- **User (Customer) → Prescription** (1:N):
  - Foreign Key: `prescriptions.customer_id -> users.id`
  - Policy: `ondelete="RESTRICT"`. Medical prescription records must be preserved for statutory audit retention.
- **User (Pharmacist) → Prescription** (1:N reviewer link):
  - Foreign Key: `prescriptions.reviewed_by_id -> users.id`
  - Policy: `ondelete="SET NULL"`.
- **Prescription → PrescriptionItem** (1:N):
  - Foreign Key: `prescription_items.prescription_id -> prescriptions.id`
  - Cascade: `ondelete="CASCADE"`.
- **Prescription → PrescriptionReviewLog** (1:N):
  - Foreign Key: `prescription_review_logs.prescription_id -> prescriptions.id`
  - Cascade: `ondelete="CASCADE"`.

### 1.6 Orders, Billing & Dispensing
- **User (Customer) → Order** (1:N):
  - Foreign Key: `orders.customer_id -> users.id`
  - Policy: `ondelete="RESTRICT"`. Tax invoices and statutory sale records cannot be removed.
- **Prescription → Order** (1:N):
  - Foreign Key: `orders.prescription_id -> prescriptions.id`
  - Policy: `ondelete="SET NULL"`.
- **Order → OrderItem** (1:N):
  - Foreign Key: `order_items.order_id -> orders.id`
  - Cascade: `ondelete="CASCADE"`.
- **Product → OrderItem** (1:N):
  - Foreign Key: `order_items.product_id -> products.id`
  - Policy: `ondelete="RESTRICT"`.
- **InventoryBatch → OrderItem** (1:N statutory batch snapshot):
  - Foreign Key: `order_items.batch_id -> inventory_batches.id`
  - Policy: `ondelete="SET NULL"`. Historical invoices snapshot the batch number as plain text to retain statutory validity even if batch records are archived.
- **Order → OrderStatusHistory** (1:N):
  - Foreign Key: `order_status_history.order_id -> orders.id`
  - Cascade: `ondelete="CASCADE"`.

### 1.7 Payments & Delivery
- **Order → Payment** (1:N):
  - Foreign Key: `payments.order_id -> orders.id`
  - Policy: `ondelete="RESTRICT"`.
- **Payment → Refund** (1:N):
  - Foreign Key: `refunds.payment_id -> payments.id`
  - Policy: `ondelete="RESTRICT"`.
- **Payment → PaymentTransaction** (1:N):
  - Foreign Key: `payment_transactions.payment_id -> payments.id`
  - Cascade: `ondelete="CASCADE"`.
- **Order → Delivery** (1:1):
  - Foreign Key: `deliveries.order_id -> orders.id`
  - Cascade: `ondelete="CASCADE"`.
- **DeliveryPartner → Delivery** (1:N):
  - Foreign Key: `deliveries.delivery_partner_id -> delivery_partners.id`
  - Policy: `ondelete="SET NULL"`.
- **Delivery → DeliveryStatusHistory** (1:N):
  - Foreign Key: `delivery_status_history.delivery_id -> deliveries.id`
  - Cascade: `ondelete="CASCADE"`.

---

## 2. Referential Integrity Matrix Summary

| Parent Entity | Child Entity | Relationship Type | On Delete Strategy | Reason |
| :--- | :--- | :---: | :--- | :--- |
| `users` | `user_profiles` | 1:1 | `CASCADE` | User account lifecycle manages personal profile |
| `users` | `orders` | 1:N | `RESTRICT` | Financial & GST invoices must be retained by law |
| `users` | `prescriptions` | 1:N | `RESTRICT` | Medical records must be retained under Pharmacy Act |
| `products` | `inventory_batches`| 1:N | `RESTRICT` | Physical batch records cannot be orphaned |
| `inventory_batches` | `stock_movements` | 1:N | `RESTRICT` | Statutory inventory ledger must be permanent |
| `orders` | `payments` | 1:N | `RESTRICT` | Financial audit ledger integrity |
| `orders` | `order_items` | 1:N | `CASCADE` | Line items bound to order master lifecycle |

