# Supabase Migration Guide — URMS

## 1. Why the Migration Was Done

| Factor | MySQL (AWS RDS) | Supabase (PostgreSQL) |
|---|---|---|
| **Setup complexity** | Requires VPC, security groups, IAM | Hosted + instant project creation |
| **Local dev** | Needs local MySQL server | Works via REST/SDK — no local DB needed |
| **Schema management** | Manual SQL + migrations | Dashboard SQL editor + version-controlled SQL |
| **Real-time** | Not supported | Built-in Realtime channels (future use) |
| **Auth integration** | Separate system | Supabase Auth (optional, Firebase kept) |
| **Cost** | Pay-per-instance | Generous free tier |
| **UUID support** | Requires extra config | Native `gen_random_uuid()` |
| **Alignment with proposal** | Cloud-hosted | Cloud-hosted, PostgreSQL standard |

The migration removes the dependency on a locally-running MySQL server, eliminates the need to manage a connection pool manually, and lays groundwork for future Supabase features (Realtime, Storage).

---

## 2. What Changed (Scope)

Only the **data-access layer** was modified:

| Layer | Changed? | Notes |
|---|---|---|
| API routes | ❌ No | Endpoints identical |
| Request/response format | ❌ No | Same JSON shapes |
| Business logic | ❌ No | RBAC, validation, workflows untouched |
| Firebase Authentication | ❌ No | Fully preserved |
| Frontend (Next.js) | ❌ No | No UI changes |
| Models | ✅ Yes | mysql2 → Supabase client |
| Controllers | ✅ Yes | Direct SQL → model methods |
| DB config | ✅ Yes | `db.config.ts` → `supabaseClient.ts` |
| `server.ts` / `app.ts` | ✅ Yes | Health check updated |
| `seed.ts` / `setup.ts` | ✅ Yes | MySQL DDL → Supabase inserts |

---

## 3. Schema Design

### Tables & Relationships

```
users
  ├── id (TEXT, Firebase UID)
  ├── name, email, role
  └── created_at

resources
  ├── id (UUID, PK)
  ├── name, type, capacity, location
  ├── availability_status, equipment
  └── created_at

bookings
  ├── id (UUID, PK)
  ├── resource_id → resources(id) ON DELETE CASCADE
  ├── user_id (Firebase UID)
  ├── start_time, end_time, status
  └── created_at

maintenance_tickets
  ├── id (UUID, PK)
  ├── resource_id → resources(id) ON DELETE CASCADE
  ├── title, description, priority, status
  ├── created_by, assigned_to (Firebase UIDs)
  ├── created_at, completed_at, outcome
  └── (triggers resource.availability_status update on COMPLETED)

notifications
  ├── id (UUID, PK)
  ├── user_id (Firebase UID)
  ├── message, type, is_read
  └── timestamp

reports
  ├── id (UUID, PK)
  ├── generated_by (Firebase UID)
  ├── report_type, file_path
  └── created_at
```

### Key Design Decisions

1. **UUIDs over auto-increment integers** — PostgreSQL native `gen_random_uuid()` ensures globally unique IDs safe for distributed environments.
2. **`users.id = Firebase UID`** — Maps Firebase Auth UIDs directly to the `users` table, avoiding a separate join table.
3. **`equipment` stored as TEXT (JSON string)** — Preserves backward compatibility with the existing model interface; can be migrated to a `jsonb` column in the future.
4. **`maintenance_tickets.resource_id` → FK** — ON DELETE CASCADE removes orphaned tickets when a resource is deleted.
5. **snake_case columns** — PostgreSQL convention; the model layer maps them to camelCase for backward API compatibility.

---

## 4. File Structure After Migration

```
backend/src/
├── config/
│   ├── supabaseClient.ts    ← NEW  (replaces db.config.ts MySQL pool)
│   └── firebase.config.ts   ← UNCHANGED
├── db/
│   ├── db.ts                ← UPDATED (re-exports supabase client)
│   ├── supabase-schema.sql  ← NEW  (run in Supabase SQL Editor)
│   ├── seed.ts              ← UPDATED (Supabase inserts)
│   └── setup.ts             ← LEGACY (not used; kept for reference)
├── models/
│   ├── resource.model.ts          ← UPDATED
│   └── maintenanceTicket.model.ts ← UPDATED
├── controllers/
│   ├── resourceCtrl.ts            ← UPDATED
│   └── maintenanceTicketCtrl.ts   ← UNCHANGED (uses model API)
├── services/
│   ├── supabaseService.ts   ← NEW  (centralised DB helpers)
│   └── pdfReportService.ts  ← UNCHANGED
├── routes/                  ← UNCHANGED
├── middleware/              ← UNCHANGED
└── cron/                    ← UNCHANGED (mysqldump cron; see §7)
```

---

## 5. Setup Instructions

### Step 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) → **New Project**
2. Note your **Project URL** and **anon/public key** from  
   `Settings → API`

### Step 2 — Run the Schema

1. Open **SQL Editor** in your Supabase Dashboard
2. Paste and run the contents of  
   `backend/src/db/supabase-schema.sql`

### Step 3 — Configure Environment Variables

Edit `backend/.env`:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
```

> **Never commit** real keys. The `.env` file is git-ignored.

### Step 4 — Install Dependencies

```bash
cd backend
npm install
```

`@supabase/supabase-js` is already listed in `package.json`.

### Step 5 — Seed the Database (Optional)

```bash
npm run seed
```

### Step 6 — Start the Backend

```bash
npm run dev
```

Verify health:

```
GET http://localhost:5000/api/health3
```

Expected response:
```json
{
  "status": "success",
  "message": "URMS Backend is fully operational (Supabase)",
  "database": "connected",
  "provider": "supabase"
}
```

---

## 6. Environment Variables Reference

| Variable | Description | Required |
|---|---|---|
| `PORT` | Express server port (default `5000`) | No |
| `NODE_ENV` | `development` or `production` | No |
| `SUPABASE_URL` | Your Supabase project URL | **Yes** |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | **Yes** |
| `FIREBASE_PROJECT_ID` | Firebase project ID | For auth |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK email | For auth |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK private key | For auth |

---

## 7. Limitations & Assumptions

### Known Limitations

1. **Backup cron** (`backup.cron.ts`) uses `mysqldump` — this command will no longer work against a Supabase project. Use Supabase's built-in [Point-in-Time Recovery](https://supabase.com/docs/guides/platform/backups) or a scheduled `pg_dump` against the direct PostgreSQL connection string instead.

2. **`setup.ts`** is now a legacy file. It runs MySQL DDL and is no longer invoked. The schema is managed via `supabase-schema.sql`.

3. **`equipment` column** is stored as a JSON string (`TEXT`). Consider migrating to `jsonb` for native PostgreSQL JSON querying.

4. **Row Level Security (RLS)** — Supabase tables are created **without RLS enabled** in this migration to preserve the existing backend auth flow. If you enable RLS, you will need to either:
   - Use the **service role key** in the backend (not the anon key), or
   - Create appropriate RLS policies matching the existing RBAC logic.

5. **ID type change** — Resource and ticket IDs are now `uuid` strings (e.g. `"abc-123-..."`) instead of integers. Any frontend code hardcoding integer IDs will need updating.

### Assumptions

- Firebase Authentication is the sole auth provider and remains unchanged.
- The anon key is used for all backend operations (suitable for development; production should use the service role key with appropriate RLS policies).
- The `users` table is populated on first Firebase login via the frontend (or manually); it is not automatically synced by this migration.

---

## 8. Migration Author & Date

- **Migration performed:** 2026-04-28  
- **Scope:** Database layer only (models, config, seed)  
- **Firebase:** Preserved  
- **API surface:** Unchanged  
