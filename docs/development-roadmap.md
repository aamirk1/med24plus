# Med24Plus 12-Phase Development Roadmap

| Phase | Title | Scope & Acceptance Criteria | Status |
| :---: | :--- | :--- | :---: |
| **Phase 1** | **Project Initialization** | Monorepo structure, environment audit, customer-web Next.js, admin-panel Next.js, customer-app Flutter BLoC, FastAPI health-check, Docker Compose setup, documentation. | **Current** |
| **Phase 2** | **Database Schema & Migrations** | PostgreSQL tables: users, roles, medicines, batches, prescriptions, orders, items, audit logs; Alembic migrations, test seeds. | Pending |
| **Phase 3** | **Authentication & Role-Based Access** | Mobile OTP (+91 India), JWT session tokens, Pharmacist login, Admin authentication, BLoC auth state in mobile app. | Pending |
| **Phase 4** | **Medicine Catalog & Inventory Management** | Generic salt matching, brand directory, Schedule H flags, batch inventory tracking (FEFO), low-stock/near-expiry alerts. | Pending |
| **Phase 5** | **Customer Web Application Development** | Search & filters, medicine detail pages, salt compositions, responsive layout, cart management. | Pending |
| **Phase 6** | **Prescription Management System** | Private S3 pre-signed upload, image cropping, Rx detail capture, pharmacist verification queue, approval/rejection workflows. | Pending |
| **Phase 7** | **Flutter Mobile App Development** | BLoC feature implementation, native camera prescription capture, order tracking, push notifications, offline cache. | Pending |
| **Phase 8** | **Pharmacist & Admin Dashboard** | High-speed prescription vetting workbench, Schedule H/H1 registers, batch allocation, inventory adjustment. | Pending |
| **Phase 9** | **Order Processing & Indian Payments** | Checkout flow, GST calculation (CGST/SGST), Razorpay/Cashfree integration, COD controls for prescription drugs. | Pending |
| **Phase 10** | **Delivery & Logistics Management** | Pincode serviceability check, delivery agent app/interface, cold-chain temperature packaging confirmation, OTP delivery proof. | Pending |
| **Phase 11** | **Compliance, Audit & Security** | Schedule H1 statutory register export, audit trail validation, GDPR/DPDP patient privacy, rate limiting, pen-testing checks. | Pending |
| **Phase 12** | **Production Deployment & DevOps** | Production Dockerfiles, Nginx reverse proxy with SSL, Vercel frontend deployments, VPS backend setup, CI/CD pipelines. | Pending |

