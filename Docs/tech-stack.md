# UniLink – University Resource Management System (URMS) Tech Stack

This document details the complete breakdown of the technology stack, architecture, and database layer used across the **UniLink - University Resource Management System (URMS)** codebase.

---

## 1. Frontend Stack (Next.js Application)
The frontend is built as a modern, type-safe Single Page / Server-Side Rendered Web App.

*   **Core Framework:** **Next.js 16.2.6** (utilizing the App Router under the [app/](file:///d:/URMS/Capstone-Group-15---URMS/app) directory).
*   **Library:** **React 19.2.0** & **React DOM 19.2.0**.
*   **Language:** **TypeScript** (configured in [tsconfig.json](file:///d:/URMS/Capstone-Group-15---URMS/tsconfig.json)).
*   **Styling & Themes:**
    *   **Tailwind CSS v4.2.4** for styling and utility classes.
    *   **Vanilla CSS** variables (`/app/globals.css`) coupled with `next-themes` for full Light & Dark mode support.
    *   **Typography:** Google Fonts (**Inter**).
*   **Animation & UI Visuals:**
    *   **Framer Motion 12.38.0** for micro-animations and page transitions.
    *   **Lucide React 0.577.0** for modern icons.
*   **Data Visualization:**
    *   **Chart.js 4.5.1** & **react-chartjs-2 5.3.1**
    *   **Recharts 3.8.1** (used for visual charts inside administrative analytics).
*   **State & Auth Integration:**
    *   **Firebase Client SDK 12.10.0** (configured in [lib/firebase.ts](file:///d:/URMS/Capstone-Group-15---URMS/lib/firebase.ts)) for user authentication, registration, forgot-password triggers, and JWT session acquisition.
    *   **Supabase Client SDK 2.107.0** (configured in [lib/supabase.ts](file:///d:/URMS/Capstone-Group-15---URMS/lib/supabase.ts)) for client-side Supabase REST querying. It dynamically injects custom auth headers (`x-urms-user-id` and `x-urms-user-role`) to assert context to PostgreSQL RLS policies.
*   **Realtime Communication:** **socket.io-client 4.8.3** for subscription to live notification pushes.
*   **File Exports:** **xlsx (SheetJS) 0.18.5** for client-side spreadsheet generation.

---

## 2. Backend Stack (Express API)
The backend is a decoupled RESTful service located in the [backend/](file:///d:/URMS/Capstone-Group-15---URMS/backend) subdirectory.

*   **Runtime:** **Node.js**
*   **Language:** **TypeScript** (executing via `ts-node` in development and compiled via `tsc` to `/dist` in production).
*   **Server Framework:** **Express.js 5.2.1** (configured in [backend/src/app.ts](file:///d:/URMS/Capstone-Group-15---URMS/backend/src/app.ts) and booted in [backend/src/server.ts](file:///d:/URMS/Capstone-Group-15---URMS/backend/src/server.ts)).
*   **Dev Tooling:** `nodemon` for automatic server reloading on change.
*   **Real-time Services:** **socket.io 4.8.3** (configured via [backend/src/services/socketService.ts](file:///d:/URMS/Capstone-Group-15---URMS/backend/src/services/socketService.ts)) to broadcast booking alerts and status updates.
*   **Auth Verification:** **firebase-admin 13.7.0** (configured in [backend/src/config/firebase.config.ts](file:///d:/URMS/Capstone-Group-15---URMS/backend/src/config/firebase.config.ts)) for decoding Bearer JWT tokens, role authorization (`verifyToken` / `requireAdmin`), and user-profile sync services.
*   **Security & Encryption:** **bcryptjs 3.0.3** for legacy/mock password encryption.

---

## 3. Database & Storage Layer
The application implements a dual-database capability but primarily focuses on Supabase (PostgreSQL) as its main database.

*   **Primary DB:** **Supabase / PostgreSQL**
    *   **Client Driver:** `@supabase/supabase-js 2.105.0` (configured in [backend/src/config/supabaseClient.ts](file:///d:/URMS/Capstone-Group-15---URMS/backend/src/config/supabaseClient.ts)).
    *   **Access Control:** PostgreSQL **Row-Level Security (RLS)** is enabled. The DB context decodes claims from custom client headers using helper functions `get_urms_uid()` and `get_urms_role()`.
    *   **Bypass Mechanism:** Backend operations utilize the Supabase `SERVICE_ROLE_KEY` to act as an administrator bypassing RLS rules.
*   **Secondary/Legacy DB:** **MySQL 8.0**
    *   **Client Driver:** `mysql2 3.22.2` (configured in [backend/src/config/db.config.ts](file:///d:/URMS/Capstone-Group-15---URMS/backend/src/config/db.config.ts)) with a connection pool.
    *   *Note:* The main data layer entrypoint [backend/src/db/db.ts](file:///d:/URMS/Capstone-Group-15---URMS/backend/src/db/db.ts) was refactored to re-export the Supabase client as the default canonical `db` object to seamlessly transition the app from MySQL.
*   **Database Tables (PostgreSQL schema in [supabase-schema.sql](file:///d:/URMS/Capstone-Group-15---URMS/backend/src/db/supabase-schema.sql)):**
    1.  `users`: Stores matching Firebase UIDs, roles (`admin`, `lecturer`, `student`, `maintenance`), names, and department tags.
    2.  `resources`: Tracks reservation assets (lecture halls, labs, equipment), their status, capacities, and JSONB equipment arrays.
    3.  `bookings`: Stores user bookings with custom interval check constraints.
    4.  `maintenance_tickets`: Maintenance logs mapping to `resources` and `users` (assigned specialists).
    5.  `notifications`: Persistent notification schema for in-app alert queries.
    6.  `report_schedules`: Custom scheduler configs for automated analytical reports.
    7.  `user_preferences`: Notification toggle controls for Email & Push services.

---

## 4. Background Services & Third-Party APIs
*   **Mailing Service:** **Nodemailer 8.0.7** (configured in [backend/src/services/emailService.ts](file:///d:/URMS/Capstone-Group-15---URMS/backend/src/services/emailService.ts)) to send email notifications.
*   **Report Exporter (PDF/Excel):**
    *   **PDFKit 0.18.0** is utilized to programmatically generate binary PDF documents on the fly.
    *   **xlsx (SheetJS)** generates native `.xlsx` binary buffers.
*   **Google Integration:** **googleapis 171.4.0** (configured in [backend/src/services/googleSheetsService.ts](file:///d:/URMS/Capstone-Group-15---URMS/backend/src/services/googleSheetsService.ts)) to write and sync report metrics directly to Google Sheets via a Google Service Account Credentials JSON.
*   **Scheduler:** A lightweight intervals daemon (configured in [backend/src/services/schedulerService.ts](file:///d:/URMS/Capstone-Group-15---URMS/backend/src/services/schedulerService.ts)) that executes hourly checks against the database schedules to build and dispatch weekly reports.

---

## 5. File Tree Structure
The overall directory hierarchy of the workspace matches the structure below:

```
Capstone-Group-15---URMS/
├── app/                        # Next.js App Router (frontend)
│   ├── admin/                  # Administrative Controls
│   │   ├── analytics/          # Reporting & Analytics Dashboard
│   │   └── user-management/    # Admin User Console
│   ├── bookings/               # Resource Booking & Scheduling Page
│   ├── dashboard/              # Role-Based Main Dashboards (Admin/Lecturer/Student/Maintenance)
│   ├── explore/                # Resource Catalog Explorer
│   ├── forgot-password/        # Password Recovery Page
│   ├── login/                  # Authentication Sign-In Page
│   ├── maintenance/            # Maintenance Tickets Console
│   ├── notifications/          # Alerts & In-App Notification Center
│   ├── profile/                # User Account Settings
│   ├── register/               # New Account Registration Page
│   ├── resources/              # Resource Registry Page
│   ├── globals.css             # Main styling & CSS variables
│   ├── layout.tsx              # Root HTML wrapper
│   └── page.tsx                # Main home / landing page
├── components/                 # Reusable React UI components
│   ├── charts/                 # Chart.js visualization wrappers
│   ├── dashboard/              # Dashboard sidebar & layouts
│   ├── ui/                     # Generic design-system components (buttons, dropdowns, etc.)
│   ├── BulkImport.tsx          # Excel/CSV resources importer
│   ├── MaintenanceTimeline.tsx # Timeline visualization component
│   ├── Navbar.tsx              # Navigation bar (responsive, auth-integrated)
│   ├── Footer.tsx              # Application footer
│   ├── GlobalSearch.tsx        # Omni search component
│   └── ...                     # Popup Modals (AddResource, EditBooking, etc.)
├── hooks/                      # Custom React hooks
│   └── useIdleTimeout.ts       # Inactivity session monitoring
├── lib/                        # Client-side utility functions & contexts
│   ├── auth-context.tsx        # Firebase Authentication context provider
│   ├── firebase.ts             # Firebase client SDK initialization
│   ├── supabase.ts             # Supabase client SDK initialization & REST helpers
│   ├── apiClient.ts            # Wrapper for Node/Express API requests
│   └── session-utils.ts        # Client session validation helpers
├── backend/                    # Express.js REST API
│   ├── src/                    # Backend Source Files
│   │   ├── config/             # DB configurations & service credentials
│   │   │   ├── db.config.ts       # Legacy MySQL connection pool config
│   │   │   ├── firebase.config.ts # Firebase Admin SDK initialization
│   │   │   └── supabaseClient.ts  # Supabase client initialization (RLS scoped)
│   │   ├── controllers/        # Route logic & controllers (resource, analytics, maintenance)
│   │   ├── db/                 # Database schemas, migrations, & seeding
│   │   │   ├── db.ts              # Canonical DB re-exporter (maps to Supabase)
│   │   │   ├── supabase-schema.sql# PostgreSQL DDL schema definition
│   │   │   └── seed.ts            # Mock data populator script
│   │   ├── middleware/         # Express auth and role validation guards
│   │   ├── models/             # Supabase queries data-access layer
│   │   ├── routes/             # REST route routers
│   │   ├── services/           # Exporters (PDF, Excel, Google Sheets) & Scheduler
│   │   ├── app.ts              # Express application configuration
│   │   └── server.ts           # Server entry point
│   ├── package.json            # Backend dependency configuration
│   └── tsconfig.json           # Backend TypeScript configuration
├── Docs/                       # System module documentation & feature logs
├── public/                     # Static assets (images, logos, etc.)
├── package.json                # Frontend/Root workspace dependencies
└── README.md                   # Project overview & quickstart guide
```

