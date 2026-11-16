# Med24Plus - Online Pharmacy Platform (Single Pharmacy - India)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black.svg)](https://nextjs.org)
[![Flutter](https://img.shields.io/badge/Mobile-Flutter%203-02569B.svg)](https://flutter.dev)

A complete, production-grade **Single Pharmacy Online Medicine Platform** designed and engineered specifically for the Indian healthcare ecosystem, adhering strictly to the **Drugs and Cosmetics Act, 1940**, and the **Drugs and Cosmetics Rules, 1945**.

---

## 1. Project Overview
- **Brand Name**: Med24Plus (*"Health. Always Within Reach."*)
- **Business Model**: Single Retail Licensed Pharmacy (Central Dispensing Unit)
- **Target Market**: India (All pincodes with initial metro delivery focus)
- **Target Budget**: ₹1–3 Lakh implementation
- **Platforms**:
  1. Customer Web Application (Next.js 14, Tailwind CSS, TypeScript)
  2. Pharmacist & Admin Operations Console (Next.js 14, Tailwind CSS, Lucide)
  3. Customer Mobile Application (Flutter, BLoC, Dio, GoRouter)
  4. Backend REST API & Engine (Python, FastAPI, SQLAlchemy 2, Pydantic)
  5. Infrastructure & Database (PostgreSQL 16, Redis 7, Docker Compose)

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
- **ORM**: SQLAlchemy 2.0 (Async Engine)
- **Validation**: Pydantic v2 & Pydantic-Settings
- **Migrations**: Alembic
- **Testing**: Pytest & HTTPX AsyncClient

### Database & Background Services
- **Relational Database**: PostgreSQL 16
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
           (Data & Batches)    (Cache & Queue)    (Encrypted Rx)
```

See [`docs/architecture.md`](docs/architecture.md) for full architectural blueprints.

---

## 4. Folder Structure

```
online-pharmacy/
├── frontend/
│   ├── customer-web/          # Next.js 14 Customer Website
│   └── admin-panel/           # Next.js 14 Pharmacist & Operations Console
├── mobile/
│   └── customer-app/          # Flutter Customer Application (BLoC)
├── backend/
│   ├── app/
│   │   ├── api/v1/            # API endpoints & routing
│   │   ├── core/              # Config, DB connection, security
│   │   ├── models/            # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/           # Pydantic validation schemas
│   │   ├── crud/              # Database CRUD operations
│   │   ├── services/          # Business logic & compliance services
│   │   ├── repositories/      # Data access layer
│   │   ├── middleware/        # CORS & audit middleware
│   │   ├── workers/           # Background tasks
│   │   ├── utils/             # Helper utilities
│   │   └── main.py            # FastAPI entry point
│   ├── migrations/            # Alembic database migrations
│   ├── tests/                 # Pytest automated test suite
│   ├── requirements.txt       # Python dependencies
│   ├── alembic.ini            # Migration configuration
│   └── .env.example           # Backend environment template
├── infrastructure/
│   ├── docker/                # Production & service Dockerfiles
│   ├── nginx/                 # Reverse proxy configuration
│   ├── scripts/               # Developer automation scripts
│   └── deployment/            # Production compose definitions
├── docs/
│   ├── architecture.md        # Comprehensive system architecture
│   ├── database-design.md     # PostgreSQL schemas & Indian drug models
│   ├── api-documentation.md   # Endpoint contracts & workflows
│   ├── development-roadmap.md # 12-phase delivery roadmap
│   └── compliance-checklist.md# Indian Pharmacy Act & Rules checklist
├── docker-compose.yml         # Local development orchestration
├── .gitignore
├── .editorconfig
├── README.md
└── LICENSE
```

---

## 5. Prerequisites

Before installing the platform, ensure your workstation has:
- **Node.js**: v20.x or higher (`node -v`)
- **npm**: 10.x or higher (`npm -v`)
- **Python**: 3.11 or higher (`python3 --version`)
- **Flutter SDK**: 3.19 or higher (`flutter --version`)
- **Docker & Docker Compose** (Optional for containerized PostgreSQL & Redis, or run native services)
- **Git**: 2.x or higher

---

## 6. Installation Instructions

Clone the repository and enter the project directory:

```bash
cd online-pharmacy
cp .env.example .env
```

---

## 7. Backend Setup

```bash
cd backend

# 1. Create and activate a Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy local environment variables
cp .env.example .env

# 4. Run tests to verify health
pytest tests/ -v

# 5. Start development API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- API Health Check: `http://localhost:8000/api/v1/health`
- Swagger Documentation: `http://localhost:8000/docs`

---

## 8. Customer Website Setup

```bash
cd frontend/customer-web

# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local

# 3. Start development server
npm run dev
```

Visit `http://localhost:3000` to view the Customer Website.

---

## 9. Admin Panel Setup

```bash
cd frontend/admin-panel

# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local

# 3. Start development server
npm run dev
```

Visit `http://localhost:3001` to view the Pharmacist & Operations Console.

---

## 10. Flutter Mobile Setup

```bash
cd mobile/customer-app

# 1. Fetch Flutter packages
flutter pub get

# 2. Run static analysis
flutter analyze

# 3. Run automated tests
flutter test

# 4. Launch on connected device or simulator
flutter run
```

---

## 11. Docker Commands

Run PostgreSQL and Redis containers with persistent volumes and health-checks:

```bash
# Start database and caching services
docker-compose up -d postgres redis

# Check container health status
docker-compose ps

# Start all services including backend
docker-compose up -d

# View container logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

---

## 12. Environment Configuration

The platform uses segregated `.env.example` templates for strict security isolation:
- Root: `online-pharmacy/.env.example`
- Backend: `online-pharmacy/backend/.env.example`
- Customer Web: `online-pharmacy/frontend/customer-web/.env.example`
- Admin Panel: `online-pharmacy/frontend/admin-panel/.env.example`

Never commit `.env` or production credentials to source control.

---

## 13. Git Workflow

- Main branch: `main` (Production-ready releases)
- Development branch: `develop`
- Phase branches: `phase/01-initialization`, `phase/02-database`, etc.
- Commit conventions: Standard Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)

---

## 14. Development Roadmap

The platform is developed following a rigorous 12-phase plan. See [`docs/development-roadmap.md`](docs/development-roadmap.md) for full phase criteria.
Current progress is tracked in [`PHASE_STATUS.md`](PHASE_STATUS.md).

