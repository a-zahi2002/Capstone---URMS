# Technical Documentation: Notification Preferences UI & Data Flow

This document details the architecture, database design, Row-Level Security (RLS) policies, and frontend styling implementations for the **Notification Preferences** feature in UniLink.

---

## 1. System Architecture Overview

The Notification Preferences feature operates on a direct-to-database PostgREST query architecture via the Supabase client:
1. **RLS Headers Security**: The frontend Supabase client injects `x-urms-user-id` and `x-urms-user-role` headers representing the logged-in Firebase user (handled dynamically by `auth-context.tsx` and `setSupabaseAuthHeaders`).
2. **Supabase Database Query**: The profile settings tab queries the `user_preferences` table directly using the user's UID.
3. **Local Storage Fallback (Fail-safe)**: If the Supabase database request fails (e.g. database schema is pending migration or the network is offline), the system automatically loads/saves preferences using browser `localStorage` keyed by user ID (`urms-prefs-{uid}`).

```
                               ┌────────────────────────┐
                               │  Profile Page Tabs UI  │
                               └───────────┬────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
            [ Supabase API Query ]                [ LocalStorage Fallback ]
            (Uses x-urms-user-id header)           (Keyed: urms-prefs-{uid})
                        │                                     │
         ┌──────────────┴──────────────┐                      │
         ▼                             ▼                      │
  [ DB Upsert Success ]       [ DB Query Fails ] ─────────────┘
  (Saved to Postgres)         (Saves/Reads Offline)
```

---

## 2. Database Schema Design

The preferences are tracked in the database inside the `user_preferences` table. Each user has exactly one preferences row, keyed by their Firebase UID.

### SQL Schema (`supabase-schema.sql`)
```sql
-- USER PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id           TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_bookings    BOOLEAN DEFAULT TRUE,
    email_maintenance BOOLEAN DEFAULT TRUE,
    email_system      BOOLEAN DEFAULT TRUE,
    push_bookings     BOOLEAN DEFAULT TRUE,
    push_maintenance  BOOLEAN DEFAULT TRUE,
    push_system       BOOLEAN DEFAULT TRUE,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ENABLE ROW-LEVEL SECURITY
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
```

### Row-Level Security (RLS) Policies
Row-level security ensures that no user can query or edit another user's preference states.

1. **Select Policy (`select_user_preferences`)**:
   - Allows users to retrieve their own preferences row.
   - SQL Rule: `get_urms_uid() = user_id`
2. **Upsert Policy (`upsert_user_preferences`)**:
   - Allows users to save/overwrite their own preferences.
   - SQL Rule: `get_urms_uid() = user_id` with checker validation.

```sql
CREATE POLICY select_user_preferences ON user_preferences
    FOR SELECT TO public
    USING (get_urms_uid() = user_id);

CREATE POLICY upsert_user_preferences ON user_preferences
    FOR ALL TO public
    USING (get_urms_uid() = user_id)
    WITH CHECK (get_urms_uid() = user_id);
```

---

## 3. Frontend Implementation Details

The preferences controls are integrated into [app/profile/page.tsx](file:///d:/SUSL/sem%2004%20/Capstone%202/Capstone-Group-15---URMS/app/profile/page.tsx) as a tab panel.

### A. Switch Component (`ToggleSwitch`)
We implemented a high-performance, lightweight toggle component in pure Tailwind and standard React hooks:
- Uses a `button` base with absolute rounded slide knob (`span`).
- Listens to active boolean states and slides the toggle handle smoothly with CSS transitions:
```typescript
function ToggleSwitch({ checked, onChange, disabled }: SwitchProps) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary/25 ${
                checked ? "bg-brand-primary" : "bg-slate-200 dark:bg-white/10"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
            <span
                className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-md ring-0 transition duration-250 ease-in-out ${
                    checked ? "translate-x-5.5" : "translate-x-0"
                }`}
            />
        </button>
    );
}
```

### B. Client Sync Logic
When the page loads:
1. Fetches current UID from active Firebase context.
2. Performs a query to Supabase:
   ```typescript
   const { data } = await supabase
       .from("user_preferences")
       .select("*")
       .eq("user_id", user.uid)
       .single();
   ```
3. If data exists, it updates toggle states.
4. If missing, it checks `localStorage.getItem("urms-prefs-{uid}")`.

When clicking **"Save Preferences"**:
1. Initiates an `upsert` call to Supabase.
2. If successful, displays a success banner: `"Notification settings saved to account!"`.
3. If error (offline or missing table), saves a stringified object to local storage and displays: `"Settings saved successfully (saved locally)!"`.
