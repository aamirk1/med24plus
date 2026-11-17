# Med24Plus - Online Pharmacy Platform (Single Pharmacy - India)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black.svg)](https://nextjs.org)
[![Flutter](https://img.shields.io/badge/Mobile-Flutter%203-02569B.svg)](https://flutter.dev)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791.svg)](https://www.postgresql.org)

A complete, production-grade **Single Pharmacy Online Medicine Platform** designed and engineered specifically for the Indian healthcare ecosystem, adhering strictly to the **Drugs and Cosmetics Act, 1940**, and the **Drugs and Cosmetics Rules, 1945**.

---

## 1. Project Overview
- **Brand Name**: Med24Plus (*"Health. Always Within Reach."*)
- **Business Model**: Single Retail Licensed Pharmacy (Central Dispensing Unit)
- **Target Market**: India (All pincodes with metro/tier-1 fulfillment focus)
- **Platforms**:
  1. Customer Web Application (Next.js 14, Tailwind CSS, TypeScript)
  2. Pharmacist & Admin Operations Console (Next.js 14, Tailwind CSS, Lucide)
  3. Customer Mobile Application (Flutter, BLoC, Dio, GoRouter)
  4. Backend REST API & Engine (Python 3.11/3.13, FastAPI, SQLAlchemy 2.0, Pydantic v2)
  5. Infrastructure & Database (PostgreSQL 16, Redis 7, Alembic Migrations)

---

## 2. Technology Stack

### Frontend (Customer Web & Admin Panel)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Architecture**: React Server Components, Modular Client Widgets & Context Providers

### Backend
- **Framework**: FastAPI (Asynchronous Python)
- **ORM**: SQLAlchemy 2.0 (Async + Sync engines)
- **Validation**: Pydantic v2 & Pydantic-Settings
- **Security & Crypto**: Argon2id (`argon2-cffi`), PyJWT, Cryptography
- **Migrations**: Alembic
- **Testing**: Pytest & HTTPX AsyncClient

### Database & Background Services
- **Relational Database**: PostgreSQL 16 (39 domain tables)
- **Inventory Engine**: FEFO (First Expiry, First Out) batch tracking
- **Caching & Broker**: Redis 7
- **Background Tasks**: Celery / Redis Worker Architecture

### Mobile (Customer App)
- **Framework**: Flutter 3.41+
- **Language**: Dart 3.11+
- **State Management**: flutter_bloc & equatable
- **Networking**: Centralized Dio Client with Concurrent Token Refresh Race Prevention
- **Navigation**: GoRouter
- **Security**: flutter_secure_storage (Keychain & EncryptedSharedPreferences)

---

## 3. Architecture

```
[Customer Web]        [Flutter Mobile App]        [Pharmacist & Admin Panel]
  (Port 3000)             (iOS / Android)                (Port 3001)
       \                         |                           /
        \                        |                          /
         +-----------------------+-------------------------+
                                 |
                     [FastAPI Backend Core (Port 8000)]
                      /              |             \
                     /               |              \
           [PostgreSQL 16]       [Redis 7]      [Private S3 Bucket]
           (39 Data Tables)   (Cache & Queue)    (Encrypted Rx)
```

See [`docs/architecture.md`](docs/architecture.md) for full architectural blueprints.

---

## 4. Phase 4: Authentication, Authorization & Security Architecture

Med24Plus Phase 4 delivers an enterprise-grade authentication and authorization foundation:

1. **Dual-Token Lifecycle**:
   - **Access Token**: Short-lived (15 minutes), stateless JWT carrying user identity, roles, and permissions.
   - **Refresh Token**: Long-lived (7 days) with strict rotation, SHA-256 database hashing, and token family replay detection (`family_id`).
   - Replay attacks automatically invalidate the entire compromised token family.
2. **Password Security (Argon2id)**:
   - RFC 9106 parameters (3 passes, 64 MiB memory, 4 parallel threads).
   - Strict complexity enforcement and dictionary blacklist against common passwords.
3. **Role-Based Access Control (RBAC)**:
   - 6 Defined Roles: `super_admin`, `admin`, `pharmacist`, `staff`, `delivery_partner`, `customer`.
   - Granular permission groups for customers, administrators, and pharmacists.
   - **Rule 65 Compliance**: Pharmacist access to clinical operations is strictly gated by verified license records (`require_verified_pharmacist`).
4. **OTP Service**:
   - Cryptographically secure 6-digit OTPs with SHA-256 database hashing and 5-minute expiry.
   - Rate limiting, cooldown windows, attempt caps, and development-only test verification fallback.
5. **Account Lockout & Protection**:
   - 5 failed login attempts trigger an automatic 15-minute account lockout.
   - Sliding-window rate limiting on login, registration, and OTP endpoints.
   - HTTP defense-in-depth security headers (CSP, HSTS, X-Frame-Options, etc.).
6. **Audit Logging**:
   - Immutable `authentication_events` table tracking all logins, failures, lockouts, password resets, and reuse events.
7. **Frontend & Mobile Client Integration**:
   - **Customer Web**: Password and OTP login, registration, password recovery, session persistence via React Context.
   - **Admin Panel**: Role-based access control, dedicated admin login, route guards, dynamic sidebar navigation, and `/unauthorized` fallback.
   - **Flutter Mobile**: Feature-based BLoC architecture (`AuthBloc`), `flutter_secure_storage`, and Dio interceptor with `Completer` locking to eliminate token refresh race conditions.

---

## 5. Phase 5: Product Catalog, Pharmacy Inventory & Stock Management Architecture

Med24Plus Phase 5 delivers an enterprise-grade, statutory-compliant Product Catalog and Pharmacy Inventory Engine:

1. **Separation of Catalog & Stock Ledger**:
   - `Product` defines clinical, pricing (MRP, DPCO compliant), tax (HSN 3004, GST rates), and regulatory classification (Schedule H/H1/X, prescription mandatory).
   - Stock availability is **never** a static boolean. It is dynamically computed at query time from active, unexpired, undamaged, non-quarantined batches:
     $$\text{sellable\_quantity} = \sum (\text{available\_quantity} - \text{reserved\_quantity})$$
2. **Category & Brand Management**:
   - Complete hierarchical category tree with circular-reference detection and product-reference deletion protection.
   - Brand registry supporting manufacturers, logos, and active/inactive status toggling.
3. **Statutory Inventory & Batch Ledger**:
   - Every physical medicine unit belongs to an immutable batch (`InventoryBatch`) recording `batch_number`, `mfg_date`, `expiry_date`, `purchase_price`, `mrp`, and status (`ACTIVE`, `QUARANTINED`, `EXPIRED`, `DAMAGED`, `RECALLED`).
   - Inward stock receiving (`POST /api/v1/admin/inventory/receive-stock`) with automated double-entry ledger logging in `StockMovement`.
   - Audited stock adjustments (`POST /api/v1/admin/inventory/adjustments`) for cycle counts, breakage, shrinkage, or audit corrections with non-negative quantity validation.
4. **FEFO (First Expiry, First Out) Allocation Engine**:
   - Core allocation engine allocating stock strictly in ascending order of `expiry_date`.
   - Prevents allocation of expired, quarantined, or damaged units.
   - Provides dry-run preview simulation (`POST /api/v1/admin/inventory/fefo-preview`) and transactional atomic reservations for orders.
5. **Statutory Expiry & Quarantine Controls (Rule 65 Compliance)**:
   - Expiry surveillance endpoints categorizing stock into critical brackets:
     - 0–30 days: Immediate clearance / return-to-vendor.
     - 31–60 days: Near-expiry warning.
     - 61–90 days: Expiry watch list.
     - Past expiry: Zero sellable stock; auto-flagged for statutory quarantine under Drug Rules.
6. **Product Image Management & Storage Adapter**:
   - Multiple images per product with primary selection and display order.
   - Content-type validation (`image/jpeg`, `image/png`, `image/webp`), 5MB payload limit, filename sanitization with UUID hashing, and filesystem/S3 interoperability.
7. **Frontend & Admin Integration**:
   - **Customer Web**: Dynamic catalog search, category/brand filters, prescription-required badges, stock availability indicators, and interactive product details.
   - **Admin Operations Console**: Live catalog management (products, categories, brands), stock receiving modal, batch quarantine/release actions, expiry surveillance dashboard, and low-stock alerts.

---

## 6. Database Architecture

Med24Plus features a normalized **39-table PostgreSQL schema** designed specifically for Indian pharmacy compliance:

| Domain | Tables | Key Characteristics |
| :--- | :--- | :--- |
| **Auth & Security** | `users`, `user_profiles`, `user_addresses`, `user_sessions`, `otp_verifications`, `authentication_events`, `roles`, `permissions`, `role_permissions`, `user_roles` | Phone-first OTP, token family tracking, Argon2id hashes, immutable audit ledger. |
| **Staff & Pharmacists** | `staff_profiles`, `pharmacist_profiles`, `pharmacist_qualifications` | Explicit `is_verified` flag, State Pharmacy Council registration, Form 20/21 links. |
| **Product Catalog** | `categories`, `brands`, `products`, `product_images`, `product_attributes` | Separation of catalog vs inventory; Schedule H/H1/X flags, HSN `3004`, GST rates. |
| **Pharmacy Inventory** | `inventory`, `inventory_batches`, `stock_movements`, `stock_adjustments`, `stock_adjustment_items`, `stock_alerts` | Batch-level expiry, FEFO index, non-negative quantity constraints, audit ledger. |
| **Prescriptions** | `prescriptions`, `prescription_items`, `prescription_review_logs` | Private S3 object keys (zero public URLs), Rule 65 pharmacist review audit log. |
| **Orders & Invoices** | `orders`, `order_items`, `order_status_history` | Statutory retail tax invoice snapshots, CGST/SGST/IGST breakdown, batch snapshot. |
| **Payments & Refunds** | `payments`, `refunds`, `payment_transactions` | Razorpay/UPI/COD ledger; zero cardholder sensitive data stored. |
| **Delivery Logistics** | `delivery_partners`, `deliveries`, `delivery_status_history` | Cold chain temperature tracking, OTP handover verification. |
| **Notifications & Audit**| `notifications`, `notification_preferences`, `audit_logs` | Immutable statutory compliance audit logs, multi-channel alert preferences. |

Comprehensive design specifications:
- [`docs/authentication-architecture.md`](docs/authentication-architecture.md) - Authentication & JWT token specifications
- [`docs/authorization-rbac.md`](docs/authorization-rbac.md) - Role-based access control & permissions
- [`docs/security-guidelines.md`](docs/security-guidelines.md) - Cryptographic standards, headers & lockout
- [`docs/flutter-authentication.md`](docs/flutter-authentication.md) - Mobile BLoC authentication & token interceptor
- [`docs/session-management.md`](docs/session-management.md) - Session family tracking & reuse detection
- [`docs/api-authentication.md`](docs/api-authentication.md) - REST API authentication endpoints reference
- [`docs/database-design.md`](docs/database-design.md) - Schema dictionary
- [`docs/pharmacy-data-compliance.md`](docs/pharmacy-data-compliance.md) - Drugs and Cosmetics Act compliance
- [`docs/product-catalog-architecture.md`](docs/product-catalog-architecture.md) - Product & Catalog domain architecture
- [`docs/product-api-documentation.md`](docs/product-api-documentation.md) - Product Catalog REST API documentation
- [`docs/inventory-api-documentation.md`](docs/inventory-api-documentation.md) - Pharmacy Inventory REST API documentation
- [`docs/inventory-workflows.md`](docs/inventory-workflows.md) - Inventory & stock lifecycle operations
- [`docs/fefo-allocation.md`](docs/fefo-allocation.md) - FEFO batch allocation engine specification
- [`docs/stock-management.md`](docs/stock-management.md) - Inward receiving, adjustments & valuation
- [`docs/expiry-management.md`](docs/expiry-management.md) - Statutory expiry brackets & quarantine SOPs
- [`docs/storage-architecture.md`](docs/storage-architecture.md) - Storage adapter, validation & image assets

---

## 7. Backend Setup & CLI Tools

```bash
cd backend

# 1. Activate Python virtual environment
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env

# 4. Run database migrations via Alembic
alembic upgrade head

# 5. Check migration status
alembic current

# 6. Seed development accounts & RBAC permissions (Phase 4)
python -m app.utils.seed_phase4_auth

# 7. Seed pharmacy catalog & inventory batches (Phase 3)
python -m app.utils.seed_dev_data

# 8. (Optional) Provision Super-Administrator via CLI
python -m app.utils.create_admin --phone +919999999999 --password SecurePassword@123 --name "Super Admin"

# 9. Run automated backend test suite (25 tests)
pytest tests/ -v

# 10. Start development API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- API Health Check: `http://localhost:8000/api/v1/health`
- Swagger Documentation: `http://localhost:8000/docs`

---

## 8. Frontend Customer Website Setup

```bash
cd frontend/med24plus-web

# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production (22 static screens)
npm run build
```

Visit `http://localhost:3000` to view the Customer Website.

---

## 9. Admin Panel Setup

```bash
cd frontend/admin-panel

# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production (30 static screens)
npm run build
```

Visit `http://localhost:3001` to view the Pharmacist & Operations Console.

---

## 10. Flutter Mobile Setup

```bash
cd mobile/customer-app

# 1. Fetch Flutter packages
flutter pub get

# 2. Run static analysis (0 issues)
flutter analyze

# 3. Run automated tests (33 passing tests)
flutter test

# 4. Launch on connected device or simulator
flutter run
```

---

## 11. Development Roadmap & Status

The platform is developed following a rigorous 12-phase plan:
- **Phase 1: Project Initialization**: COMPLETED
- **Phase 2: UI/UX Design System & Screen Layouts**: COMPLETED
- **Phase 3: Database Architecture, PostgreSQL Models & Pharmacy Inventory Foundation**: COMPLETED
- **Phase 4: Authentication, Authorization, Security & User Management**: COMPLETED
- **Phase 5: Product Catalog, Pharmacy Inventory & Stock Management APIs**: COMPLETED
- **Phase 6: Prescription Management & Pharmacist Verification Workflows**: PENDING APPROVAL

Current progress is tracked in [`PHASE_STATUS.md`](PHASE_STATUS.md).
