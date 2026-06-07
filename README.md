# UniLink – University Resource Management System (URMS)

> **Capstone Group 15** — Production-grade university resource management platform.

---

## 🚀 Quick Start

### 1. Frontend (Next.js)
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in NEXT_PUBLIC_API_URL, Firebase config keys

# Start development server
npm run dev
# → http://localhost:3000
```

### 2. Backend (Node.js + Express)
```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, PORT, etc.

# Start backend
npm run dev
# → http://localhost:5000
```

---

## 🏗️ Architecture

```
Capstone-Group-15---URMS/
├── app/                    # Next.js App Router (frontend)
│   ├── admin/analytics/    # Reporting & Analytics Module
│   ├── maintenance/        # Maintenance Management Module
│   ├── dashboard/          # Main dashboard
│   ├── bookings/           # Booking & Scheduling
│   └── resources/          # Resource Management
├── components/             # Shared UI components
│   ├── charts/             # Chart.js wrappers
│   └── MaintenanceTimeline.tsx
├── backend/src/
│   ├── controllers/        # Route handlers
│   ├── models/             # Supabase data-access layer
│   ├── routes/             # Express routers
│   └── services/           # Business logic, PDF/Excel/Sheets export
├── Docs/                   # Module documentation
└── lib/                    # Frontend utilities & auth context
```

**Stack:** Next.js 15 · Node.js + Express · Supabase (PostgreSQL) · Firebase Auth · Recharts · Chart.js

---

## 🔒 Authentication & Access Control

- **Firebase Authentication** handles login, registration, and JWT issuance.
- Every backend API route is protected by `verifyToken` middleware.
- **Role-based access:** `admin` routes additionally require `requireAdmin` middleware.
- Analytics endpoints: admin-only.
- Maintenance tickets: creation open to authenticated users; updates/deletes restricted to admin/maintenance roles.

---

## 📦 Modules

### Maintenance Management
- **URL:** `/maintenance`
- **Admin backend:** `GET/POST/PUT/DELETE /api/maintenance-tickets`
- Status workflow: `OPEN → IN_PROGRESS → COMPLETED`
- PDF & Excel export via `/api/maintenance-tickets/report/pdf|excel`
- See [`Docs/maintenance-module.md`](Docs/maintenance-module.md)

### Reporting & Analytics
- **URL:** `/admin/analytics`
- **Backend:** `GET /api/admin/analytics/*`
- Overview, Booking, Utilization tabs with Recharts & Chart.js visualizations
- Department filter + custom date range
- Export: PDF, Excel, Google Sheets
- See [`Docs/analytics-module.md`](Docs/analytics-module.md)

---

## 🛠️ Key Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js frontend |
| `npm run build` | Production bundle |
| `npm run test` | Run Jest unit tests |
| `cd backend && npm run dev` | Start Express backend |
| `cd backend && npm run build` | Compile TypeScript |

---

## 🌍 Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

### Backend (`backend/.env`)
```
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=...
FIREBASE_PROJECT_ID=...
GOOGLE_SERVICE_ACCOUNT_JSON=...   # For Google Sheets export
```

---

## 🗄️ Database (Supabase / PostgreSQL)

Key tables used by these modules:

| Table | Purpose |
|-------|---------|
| `maintenance_tickets` | Ticket CRUD, status workflow |
| `resources` | Resource registry (FK for tickets) |
| `bookings` | Used for analytics aggregations |
| `users` | Role-based access |
| `report_schedules` | Automated report scheduling |

---

## 🎨 Design System

- **Colors:** Deep Navy (`brand-primary`) · Cerulean (`brand-accent`)
- **Theme:** Full dark/light mode via `next-themes` + CSS variables in `globals.css`
- **Typography:** Inter (Google Fonts)
- **Logo:** `public/urms-logo.png`

---

> [!NOTE]
> **Capstone Group 15** — For support, refer to the [Docs folder](Docs/) or the individual module documentation files.