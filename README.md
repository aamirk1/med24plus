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
- **Architecture**: React Server Components & Modular Client Widgets

### Backend
- **Framework**: FastAPI (Asynchronous Python)
- **ORM**: SQLAlchemy 2.0 (Async + Sync engines)
- **Validation**: Pydantic v2 & Pydantic-Settings
- **Migrations**: Alembic
- **Testing**: Pytest & HTTPX AsyncClient

### Database & Background Services
- **Relational Database**: PostgreSQL 16 (37 domain tables)
- **Inventory Engine**: FEFO (First Expiry, First Out) batch tracking
- **Caching & Broker**: Redis 7
- **Background Tasks**: Celery / Redis Worker Architecture

### Mobile (Customer App)
- **Framework**: Flutter 3.41+
- **Language**: Dart 3.11+
- **State Management**: flutter_bloc & equatable
- **Networking**: Dio
- **Navigation**: GoRouter
- **Security**: flutter_secure_storage

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
           (37 Data Tables)   (Cache & Queue)    (Encrypted Rx)
```

See [`docs/architecture.md`](docs/architecture.md) for full architectural blueprints.

---

## 4. Database Architecture (Phase 3 Foundation)

Med24Plus features a normalized **37-table PostgreSQL schema** designed specifically for Indian pharmacy compliance:

| Domain | Tables | Key Characteristics |
| :--- | :--- | :--- |
| **Auth & Users** | `users`, `user_profiles`, `user_addresses`, `user_sessions`, `roles`, `permissions`, `role_permissions`, `user_roles` | Phone-first OTP support, unique Indian mobile index, soft deletion, RBAC. |
| **Staff & Pharmacists** | `staff_profiles`, `pharmacist_profiles`, `pharmacist_qualifications` | Explicit `is_verified` flag, State Pharmacy Council registration, Form 20/21 links. |
| **Product Catalog** | `categories`, `brands`, `products`, `product_images`, `product_attributes` | Separation of catalog vs inventory; Schedule H/H1/X flags, HSN `3004`, GST rates. |
| **Pharmacy Inventory** | `inventory`, `inventory_batches`, `stock_movements`, `stock_adjustments`, `stock_adjustment_items`, `stock_alerts` | Batch-level expiry, FEFO index, non-negative quantity constraints, audit ledger. |
| **Prescriptions** | `prescriptions`, `prescription_items`, `prescription_review_logs` | Private S3 object keys (zero public URLs), Rule 65 pharmacist review audit log. |
| **Orders & Invoices** | `orders`, `order_items`, `order_status_history` | Statutory retail tax invoice snapshots, CGST/SGST/IGST breakdown, batch snapshot. |
| **Payments & Refunds** | `payments`, `refunds`, `payment_transactions` | Razorpay/UPI/COD ledger; zero cardholder sensitive data stored. |
| **Delivery Logistics** | `delivery_partners`, `deliveries`, `delivery_status_history` | Cold chain temperature tracking, OTP handover verification. |
| **Notifications & Audit**| `notifications`, `notification_preferences`, `audit_logs` | Immutable statutory compliance audit logs, multi-channel alert preferences. |

Comprehensive design specifications:
- [`docs/database-design.md`](docs/database-design.md) - Full 37-table schema & column dictionary
- [`docs/database-relationships.md`](docs/database-relationships.md) - Entity relationships & cascade rules
- [`docs/database-indexing.md`](docs/database-indexing.md) - Indexing strategy & query patterns
- [`docs/inventory-architecture.md`](docs/inventory-architecture.md) - Inventory & FEFO allocation engine
- [`docs/pharmacy-data-compliance.md`](docs/pharmacy-data-compliance.md) - Drugs and Cosmetics Act compliance

---

## 5. Backend Setup & Database Migrations

```bash
cd backend

# 1. Activate Python virtual environment
source .venv/bin/activate

# 2. Install dependencies (if not already installed)
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env

# 4. Run database migrations via Alembic
alembic upgrade head

# 5. Check migration status
alembic current

# 6. Seed development demonstration records (Categories, Brands, Products, Batches)
python -m app.utils.seed_dev_data

# 7. Run full backend & database test suite
pytest tests/ -v

# 8. Start development API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- API Health Check: `http://localhost:8000/api/v1/health`
- Swagger Documentation: `http://localhost:8000/docs`

---

## 6. Frontend Customer Website Setup

```bash
cd frontend/customer-web

# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production (22 static screens)
npm run build
```

Visit `http://localhost:3000` to view the Customer Website.

---

## 7. Admin Panel Setup

```bash
cd frontend/admin-panel

# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production (29 static screens)
npm run build
```

Visit `http://localhost:3001` to view the Pharmacist & Operations Console.

---

## 8. Flutter Mobile Setup

```bash
cd mobile/customer-app

# 1. Fetch Flutter packages
flutter pub get

# 2. Run static analysis (0 issues)
flutter analyze

# 3. Run automated tests (25 passing tests)
flutter test

# 4. Launch on connected device or simulator
flutter run
```

---

## 9. Development Roadmap & Status

The platform is developed following a rigorous 12-phase plan:
- **Phase 1: Project Initialization**: COMPLETED
- **Phase 2: UI/UX Design System & Screen Layouts**: COMPLETED
- **Phase 3: Database Architecture, PostgreSQL Models & Pharmacy Inventory Foundation**: COMPLETED

Current progress is tracked in [`PHASE_STATUS.md`](PHASE_STATUS.md).
