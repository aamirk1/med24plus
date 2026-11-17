# Med24Plus — Phase 7: Shopping Cart & Checkout Preparation Architecture

## 1. Executive Summary

Phase 7 implements the **Shopping Cart & Checkout Preparation System** for **Med24Plus**, a single-pharmacy online medicine delivery platform in India. This phase integrates:
- **Phase 4**: Customer Authentication, RBAC, and secure session management.
- **Phase 5**: Product Catalog, Drug Schedules (OTC, Schedule H, H1, X), and FEFO sellable inventory calculation.
- **Phase 6**: Registered Pharmacist Prescription review workflows under Rule 65 of the Drugs and Cosmetics Rules, 1945.

Phase 7 acts as the **source of truth** for pricing, sellable inventory checks, prescription gating, and postal serviceability geofencing. It produces authoritative, time-limited **Checkout Validation Quotes** without performing payment processing, order creation, or stock deductions (which are reserved for Phase 8).

---

## 2. Key Architectural Principles

1. **Server-Side Authoritative Source of Truth**:
   - The frontend never dictates unit price, MRP, discounts, tax rates, or prescription eligibility.
   - All monetary calculations are performed in the backend using Python `Decimal` and PostgreSQL `Numeric(10, 2)` to eliminate floating-point rounding errors.

2. **No Cart Stock Reservation**:
   - Adding an item to the shopping cart does **not** lock or reserve inventory. Stock reservations occur exclusively upon order placement (Phase 8).
   - Real-time sellable inventory is checked on every cart retrieval and checkout validation.

3. **Rule 65 Compliance & Clinical Prescription Gating**:
   - Items classified under Schedule H, Schedule H1, or Schedule X cannot proceed through checkout without an active, non-expired, pharmacist-approved prescription belonging to the customer.
   - Unapproved or missing prescriptions transition the checkout validation state to `blocked` or `valid_with_warnings` with actionable guidance for the customer.

4. **15-Minute Expiry Window for Validation Quotes**:
   - Checkout validation records (`checkout_validations`) store an authoritative price, tax, and stock snapshot valid for exactly 15 minutes (`calculated_at` to `expires_at`).
   - If stock or prices change after expiry, re-validation is strictly enforced before order generation.

5. **Single-Pharmacy Geofenced Delivery**:
   - Pincode serviceability checks enforce that customer addresses belong to active delivery zones (e.g. Bengaluru urban areas) with estimated dispatch turnarounds (e.g. 4 hours).

---

## 3. Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                    |
|   +------------------------------------+   +--------------------------------+   |
|   |    Next.js 14 Customer Web App     |   |    Next.js 14 Admin Panel      |   |
|   |  - /cart                           |   |  - /settings/delivery          |   |
|   |  - /checkout                       |   |    (Fee Matrix & PIN Geofence) |   |
|   |  - /account/addresses              |   |                                |   |
|   +-----------------+------------------+   +---------------+----------------+   |
|                     |                                      |                    |
+---------------------|--------------------------------------|--------------------+
                      | HTTPS / REST                         | HTTPS / REST
                      v                                      v
+---------------------------------------------------------------------------------+
|                                FASTAPI BACKEND                                  |
|                                                                                 |
|   +--------------------+  +----------------------+  +-----------------------+   |
|   |    /api/v1/cart    |  |  /api/v1/checkout    |  |  /api/v1/addresses    |   |
|   +---------+----------+  +----------+-----------+  +-----------+-----------+   |
|             |                        |                          |               |
|             v                        v                          v               |
|   +--------------------+  +----------------------+  +-----------------------+   |
|   |    CartService     |  |   CheckoutService    |  |    AddressService     |   |
|   +---------+----------+  +----------+-----------+  +-----------+-----------+   |
|             |                        |                          |               |
|             +--------+---------------+                          |               |
|                      |                                          |               |
|                      v                                          v               |
|   +---------------------------------------+   +-----------------------------+   |
|   |           CORE SERVICES               |   |     REPOSITORIES            |   |
|   |  - PricingService (Decimal GST/DPCO)  |   |  - CartRepository           |   |
|   |  - PrescriptionEligibilityService     |   |  - CheckoutRepository       |   |
|   |  - ServiceabilityService (PIN Geofence|   |  - AddressRepository        |   |
|   |  - ProductRepository (FEFO Sellable)  |   |  - ServiceabilityRepository |   |
|   +-------------------+-------------------+   +--------------+--------------+   |
|                       |                                      |                  |
+-----------------------|--------------------------------------|------------------+
                        |                                      |
                        +------------------+-------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------+
|                             POSTGRESQL DATABASE                                 |
|   - carts (customer_id, status, partial unique index where status='active')     |
|   - cart_items (cart_id, product_id, quantity, unit_price_snapshot)              |
|   - checkout_validations (id, cart_id, customer_id, totals, expires_at)          |
|   - user_addresses (user_id, recipient_name, phone, pincode, is_default)        |
|   - serviceable_pincodes (pincode, area_name, city, estimated_delivery_hours)   |
|   - checkout_settings (standard_delivery_fee, free_delivery_threshold, etc.)   |
+---------------------------------------------------------------------------------+
```

---

## 4. Module Structure

```
backend/app/
├── models/
│   ├── cart.py                 # Cart and CartItem models
│   ├── checkout.py             # CheckoutValidation, ServiceablePincode, CheckoutSetting
│   └── address.py              # UserAddress model with Indian phone/country extensions
├── schemas/
│   ├── cart.py                 # CartItemCreate, CartItemUpdate, CartResponse
│   ├── checkout.py             # CheckoutValidateRequest, CheckoutValidationResponse
│   ├── address.py              # AddressCreate, AddressUpdate, AddressResponse
│   └── serviceability.py       # Pincode and CheckoutSettings schemas
├── repositories/
│   ├── cart_repository.py      # Transactional cart queries & row locks
│   ├── checkout_repository.py  # Validation session quote persistence
│   ├── address_repository.py   # Customer address CRUD & default management
│   └── serviceability_repository.py # Geofence & settings lookups
├── services/
│   ├── cart_service.py         # Cart management & stock validation
│   ├── checkout_service.py     # Multi-factor validation pipeline
│   ├── pricing_service.py      # Centralized Decimal calculations & GST breakdown
│   ├── serviceability_service.py # Pincode validation & delivery settings
│   ├── address_service.py      # User address management
│   └── prescription_eligibility_service.py # Rule 65 evaluation
├── api/v1/endpoints/
│   ├── cart.py                 # /cart, /cart/items, /cart/validate
│   ├── checkout.py             # /checkout/validate, /checkout/summary
│   ├── addresses.py            # /addresses, /addresses/{id}/set-default
│   └── admin_checkout.py       # /admin/checkout-settings, /admin/serviceability
└── modules/
    ├── cart/                   # Backward-compatible modular bridges
    └── checkout/               # Backward-compatible modular bridges
```

---

## 5. Security & Isolation Controls

1. **Strict Customer Authorization**:
   - `customer_id` is never accepted in request bodies; it is derived strictly from the authenticated JWT token (`current_user.id`).
   - Cross-customer access to carts or addresses returns `404 Not Found` or `403 Forbidden`.

2. **Price Snapshot Change Detection**:
   - When an item is added to the cart, the server stores `unit_price_snapshot`.
   - If the manufacturer or DPCO ceiling price changes in the product catalog, the cart signals `is_price_changed: true` and `has_price_changes: true`.
   - Checkout requires explicit acknowledgement (`acknowledge_price_changes: true`) to ensure transparent patient billing.

3. **Concurrency Protection**:
   - Partial unique indexes (`uq_carts_customer_active`) guarantee at most one active cart per customer.
   - Unique constraint (`uq_cart_items_cart_product`) prevents duplicate rows for the same medicine in one cart.
   - Increment/decrement operations are performed in transactional blocks.
