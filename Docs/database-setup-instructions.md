# UniLink URMS — Database Migration Setup Instructions

This document provides instructions for deploying, updating, and rolling back the database schema for the UniLink URMS application.

---

## 1. Overview of the Migration System

The URMS database schema and RLS security model are structured as a series of versioned SQL files under `backend/src/db/migrations/`:
- `0001_initial_schema.up.sql` / `0001_initial_schema.down.sql`
- `0002_rls_policies.up.sql` / `0002_rls_policies.down.sql`
- `0003_search_indexing.up.sql` / `0003_search_indexing.down.sql`
- `0004_seed_data.up.sql` / `0004_seed_data.down.sql`

Migrations are executed programmatically via a custom TypeScript runner (`backend/src/db/migrate.ts`) which maintains a `schema_migrations` table in the database to prevent duplicate runs.

---

## 2. Prerequisites

To execute migrations programmatically, you need the direct PostgreSQL connection string for your Supabase project.

1. Log in to the [Supabase Dashboard](https://supabase.com).
2. Go to **Settings** (gear icon) → **Database**.
3. Under **Connection string**, select **URI**.
4. Copy the connection URI. It will look like:
   `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres`
5. Replace `[YOUR-PASSWORD]` with your actual database password.

---

## 3. Configuration

Add the connection string to the root `.env.local` file (or the backend-specific `backend/.env` file):

```env
# Database Connection String
DATABASE_URL=postgresql://postgres:your-db-password@db.fmgtehlowfqzuxaklyeg.supabase.co:5432/postgres
```

---

## 4. Execution Commands

All commands can be run from either the root directory or the `backend` directory.

### A. Run Pending Migrations
Applies all unapplied SQL migration scripts in order.
```bash
# From root directory
npm run db:migrate

# From backend directory
npm run db:migrate
```

### B. Rollback Last Migration
Reverts the last applied migration step using its corresponding `.down.sql` file.
```bash
# From root directory
npm run db:migrate:rollback

# From backend directory
npm run db:migrate:rollback
```

### C. Seed Mock Data
Seeds the database with test profiles, rooms, bookings, and notifications.
```bash
# From root directory
npm run seed

# From backend directory
npm run seed
```

---

## 5. Manual Execution Fallback

If you do not have direct connection access or wish to execute migrations manually:
1. Open the **SQL Editor** in your Supabase Dashboard.
2. Open and copy the contents of the desired script under `backend/src/db/migrations/` (e.g. `0001_initial_schema.up.sql`).
3. Paste the contents into the SQL Editor and click **Run**.
4. Repeat sequentially for all migrations.
