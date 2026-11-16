# Med24Plus Architecture Overview

## 1. System Philosophy & Indian Pharmacy Model
Med24Plus is engineered specifically for a single licensed retail pharmacy operation in India under the **Drugs and Cosmetics Act, 1940**, and the **Drugs and Cosmetics Rules, 1945**. 

Unlike open marketplaces where arbitrary third-party vendors list goods, Med24Plus operates as a **closed single-pharmacy model**:
- Dispensing occurs strictly from a licensed central retail premises or warehouse.
- A **Registered Pharmacist (RMP / State Pharmacy Council license)** verifies each prescription before Schedule H, H1, or X drugs can be packed or billed.
- Every order produces a statutory retail invoice detailing batch numbers, manufacturer info, and expiry dates.

---

## 2. High-Level System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT APPLICATIONS                               |
|                                                                                   |
|  [Customer Web (Next.js 14)]   [Flutter Mobile App (iOS/Android)]   [Admin Panel] |
|        (Port 3000)                    (BLoC / Dio / GoRouter)        (Port 3001)  |
+-----------------------------------------------------------------------------------+
                                         | (HTTPS / REST / WebSocket)
                                         v
+-----------------------------------------------------------------------------------+
|                               REVERSE PROXY / GATEWAY                             |
|                             Nginx / Cloudflare Edge                               |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                              BACKEND CORE (FastAPI)                               |
|                                    (Port 8000)                                    |
|                                                                                   |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | Auth & RBAC        |  | Prescription Vetting|  | Inventory & Batch Tracker  |  |
|  | (JWT, OTP, Roles)  |  | (S3 Upload, Review)|  | (Schedule H/H1, Expiry, FEFO)| |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | Order Management   |  | Delivery Logistics |  | Audit Trail & Compliance    |  |
|  | & Indian GST Tax   |  | & Cold Chain Pkg   |  | (Tamper-evident logs)       |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
+-----------------------------------------------------------------------------------+
            |                                           |
            v                                           v
+-----------------------------+           +-----------------------------+
|    PostgreSQL 16 Database   |           |    Redis 7 (In-Memory)      |
|  - Users & Roles            |           |  - Session Cache            |
|  - Medicines & Formulations |           |  - OTP Rate Limiting        |
|  - Batches & Stock Units    |           |  - Celery Background Broker |
|  - Prescriptions & Orders   |           +-----------------------------+
|  - Audit Log Ledgers        |                         |
+-----------------------------+                         v
                                          +-----------------------------+
                                          | Background Workers (Celery) |
                                          |  - SMS / WhatsApp OTP alerts|
                                          |  - Expiry alert crons       |
                                          |  - Cold-chain SLA monitoring|
                                          +-----------------------------+
```

---

## 3. Technology Stack Rationale

| Layer | Selected Tech | Justification |
| :--- | :--- | :--- |
| **Frontend Customer Web** | Next.js 14 (App Router) + TypeScript + Tailwind CSS | Fast SSR/SSG for SEO on medicine names and OTC products, responsive mobile-first UI, enterprise TypeScript safety. |
| **Admin & Pharmacist Console** | Next.js 14 + Tailwind CSS + Lucide Icons | Clean, high-density operations UI for rapid prescription verification, inventory management, and batch tracking. |
| **Mobile App** | Flutter + Dart + BLoC | Single codebase for iOS & Android, deterministic state management via BLoC, offline caching, native camera access for prescription scanning. |
| **Backend API** | Python 3.11/3.13 + FastAPI + Pydantic v2 | High asynchronous throughput, native OpenAPI/Swagger auto-generation, strict schema validation, type safety. |
| **Database** | PostgreSQL 16 + SQLAlchemy 2.0 (Async) | ACID compliance for financial/inventory transactions, JSONB support for clinical metadata, Alembic migrations. |
| **Caching & Queue** | Redis 7 + Celery / Arq | Fast session validation, OTP token expiration, asynchronous notification dispatches. |
| **Prescription Storage** | S3-compatible private object store (Encrypted at rest) | Strict ACLs preventing public URL indexing of patient prescriptions. Pre-signed URLs for authenticated pharmacist review. |

---

## 4. Security & Compliance Architecture
1. **Prescription Isolation**: Prescriptions are never stored in public buckets. They reside in an encrypted private S3 bucket accessed only via short-lived (15-minute) pre-signed URLs.
2. **Audit Logging**: Every action by a registered pharmacist (approving/rejecting an Rx, dispensing a Schedule H drug) is logged with timestamp, user ID, IP address, and registration council ID.
3. **Role-Based Access Control (RBAC)**:
   - `CUSTOMER`: Can browse catalog, upload Rx, place orders, view order history.
   - `PHARMACIST`: Can review prescriptions, edit prescribed medicine lines, sign dispensing approvals.
   - `INVENTORY_MANAGER`: Can receive batches, record supplier invoices, manage stock adjustments.
   - `ADMIN`: Full operational oversight, compliance reports, and staff management.
   - `DELIVERY_AGENT`: Restricted access to assigned orders, delivery address, and OTP verification.

