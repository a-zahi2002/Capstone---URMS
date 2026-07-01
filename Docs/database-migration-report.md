# UniLink URMS — Database Schema & Migration Validation Report

This report documents the analysis and validation of the UniLink URMS database schema, referential integrity, security controls, and compatibility with Supabase PostgreSQL.

---

## 1. Executive Summary

The database layer of UniLink URMS has been verified and modularized into structured, repeatable migrations. Key database rules, security configurations, and search parameters have been analyzed to ensure data safety, referential integrity, and query performance in a production Supabase environment.

---

## 2. Schema Analysis & Integrity Constraints

The schema enforces strict domain rules at the database engine level to maintain data quality and prevent invalid entries:

| Table | Constraint | Enforced Values / Rule | Rationale |
|---|---|---|---|
| `users` | `valid_users_role` | `student`, `lecturer`, `admin`, `maintenance` | Restricts roles to defined user classes. |
| `resources` | `valid_resources_type` | `Lecture Halls`, `Labs`, `Rooms`, `Vehicles`, `Equipment` | Ensures standard resource category categorization. |
| `resources` | `valid_resources_capacity` | `capacity >= 0` | Prevents negative room/resource capacities. |
| `resources` | `valid_resources_status` | `Available`, `Booked`, `Under Maintenance`, `Inactive`, `Maintenance` | Standardizes statuses for front-end analytics and logic filters. |
| `bookings` | `valid_booking_status` | `Pending`, `Approved`, `Completed`, `Cancelled`, `Rejected` | Restricts booking transitions to permitted states. |
| `bookings` | `valid_time_range` | `end_time > start_time` | Prevents negative or zero-duration booking reservations. |
| `maintenance_tickets` | `valid_maint_priority` | `Low`, `Medium`, `High` | Limits priorities to standard levels. |
| `maintenance_tickets` | `valid_maint_status` | `OPEN`, `IN_PROGRESS`, `COMPLETED` | Models the lifecycle states of repair tickets. |
| `maintenance_tickets` | `valid_maint_outcome` | `Fixed`, `Faulty`, `Decommissioned` (or NULL) | Restricts final resolution values of maintenance events. |
| `notifications` | `valid_notification_type` | `info`, `success`, `warning`, `error`, `alert` | Categorizes notifications for matching UI alert styling. |
| `reports` | `valid_report_type` | `maintenance`, `usage`, `booking`, `overview` | Prevents invalid report category designations. |
| `report_schedules` | `valid_schedule_format` | `pdf`, `excel` | Limits output formats to supported options. |
| `report_schedules` | `valid_schedule_delivery_day` | `delivery_day BETWEEN 0 AND 6` | Validates days of the week (Sunday to Saturday). |

### Referential Integrity (Foreign Keys)
- `bookings.resource_id` → `resources(id) ON DELETE CASCADE`
  - *Behavior:* If a resource is deleted, all historical and active bookings are removed to prevent orphan references.
- `bookings.user_id` → `users(id) ON DELETE SET NULL`
  - *Behavior:* If a user account is deleted, their booking history is preserved (with user info set to NULL) for statistical and audit logging.
- `maintenance_tickets.resource_id` → `resources(id) ON DELETE CASCADE`
  - *Behavior:* Ensures ticket histories are cleared when physical assets are retired.
- `user_preferences.user_id` → `users(id) ON DELETE CASCADE`
  - *Behavior:* Automatically cleans up settings preferences when a user is removed.

---

## 3. Indexes & Performance Optimization

To handle heavy analytical queries and search requests, the following indexes are deployed:

1. **Foreign Key Performance Optimization**:
   - `idx_bookings_resource_id` on `bookings(resource_id)`
   - `idx_bookings_user_id` on `bookings(user_id)`
   - `idx_maint_resource_id` on `maintenance_tickets(resource_id)`
   - *Purpose:* Speeds up nested lookup joins.
2. **Filtering Optimization**:
   - `idx_users_department` on `users(department)`
   - `idx_resources_department` on `resources(department)`
   - `idx_bookings_status` on `bookings(status)`
   - `idx_bookings_time` on `bookings(start_time, end_time)`
   - `idx_resources_availability` on `resources(availability_status)`
   - *Purpose:* Improves execution time of dashboard charts, metric filters, and availability checks.
3. **Partial Indexes**:
   - `idx_notifications_user_unread` on `notifications(user_id) WHERE is_read = FALSE`
   - *Purpose:* Significantly reduces index size and retrieval latency for rendering unread counters.
4. **Full-Text Search Indexing**:
   - GIN indexes: `resources_fts_idx`, `maintenance_tickets_fts_idx`, `users_fts_idx`
   - *Purpose:* Powers rapid multi-column text searching.

---

## 4. Row Level Security (RLS) & RBAC Validation

RLS has been configured to secure user data without breaking system functionality. Policies resolve user role and identity via JWT claims or custom backend headers (`x-urms-user-id` / `x-urms-user-role`):

- **Users**: Read access is available for all authenticated users to facilitate joint queries (e.g., viewing user names on booking schedules). Account modifications are locked to self-ownership (`get_urms_uid() = id`).
- **Resources**: Viewable by any authenticated user. Asset edits (INSERT/UPDATE/DELETE) require admin role (`get_urms_role() = 'admin'`).
- **Bookings**: Read access is open to all authenticated users so schedules can be checked for conflicts. Creation and cancellations require record ownership (`get_urms_uid() = user_id`).
- **Maintenance Tickets**: Read access is limited to administrators, maintenance staff, and the user who created the ticket. Updates can only be completed by technicians or administrators.
- **Notifications & Preferences**: Access is isolated to the record owner.
- **Reports & Schedules**: Limited to the admin role.

---

## 5. Rollback & Safety Principles

1. **Non-Destructive Seed Down**:
   - Rollback scripts for mock seeds delete *only* the specific IDs registered during the seeding step. They do not delete real user data.
2. **Reverse Dependency Drop**:
   - Table rollbacks are organized so that tables containing foreign keys are dropped *before* the tables they reference, preventing execution errors.
3. **Idempotent Operations**:
   - Script uses `IF EXISTS` / `IF NOT EXISTS` / `ON CONFLICT DO NOTHING` statements to guarantee repeatable execution without errors.

---

## 6. Supabase PostgreSQL Compatibility

All migration scripts are 100% compatible with Supabase PostgreSQL:
- Native `UUID` primary keys with `gen_random_uuid()` from standard postgres core.
- Compatibility with PostgREST header extraction settings (`current_setting`).
- Correct usage of GIN index methods (`USING GIN`) for `tsvector` columns.
- Uses PG-compliant array syntax for weekly delivery recipients.
