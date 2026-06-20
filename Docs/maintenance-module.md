# Maintenance Management Module — Documentation

## Overview
The Maintenance Management Module allows university administrators and maintenance staff to log, track, assign, and resolve facility repair requests.

---

## Architecture

```
Frontend:   app/maintenance/page.tsx          ← Admin dashboard (ticket list, create, status update, export)
            app/maintenance/request/page.tsx  ← User-facing submission form
            app/maintenance/assign/page.tsx   ← Staff assignment form
            app/maintenance/timeline/page.tsx ← Timeline component preview
            components/MaintenanceTimeline.tsx← Reusable timeline UI

Backend:    routes/maintenanceTicketRoutes.ts ← Express router
            controllers/maintenanceTicketCtrl.ts ← CRUD + status + export handlers
            models/maintenanceTicket.model.ts ← Supabase data-access layer
            services/pdfReportService.ts      ← PDF generation (PDFKit)
            services/exportService.ts         ← Excel generation (xlsx)
```

---

## Database Schema

**Table:** `maintenance_tickets`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | Auto-generated |
| `resource_id` | uuid FK | → `resources(id)` ON DELETE CASCADE |
| `title` | text NOT NULL | Brief title |
| `description` | text | Detailed description |
| `priority` | text | `Low` / `Medium` / `High` |
| `status` | text | `OPEN` / `IN_PROGRESS` / `COMPLETED` |
| `created_by` | text NOT NULL | Firebase UID |
| `assigned_to` | text | Firebase UID of technician |
| `created_at` | timestamptz | Default: now() |
| `completed_at` | timestamptz | Set when status → COMPLETED |
| `outcome` | text | `Fixed` / `Faulty` / `Decommissioned` |

---

## API Reference

Base path: `/api/maintenance-tickets`  
All routes require: `Authorization: Bearer <firebase-jwt>`

| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| `GET` | `/` | Any authenticated | List tickets (filtered by role) |
| `POST` | `/` | Any authenticated | Create new ticket |
| `GET` | `/:id` | Owner or admin | Get ticket by ID |
| `PUT` | `/:id` | Admin / maintenance | Update ticket fields |
| `DELETE` | `/:id` | Admin / maintenance | Delete ticket |
| `PUT` | `/:id/status` | Admin / maintenance | Advance status with validation |
| `GET` | `/report/pdf` | Admin / maintenance | Download PDF report |
| `GET` | `/report/excel` | Admin / maintenance | Download Excel report |

### Status Workflow

```
OPEN → IN_PROGRESS → COMPLETED
```
- Admin can skip any step.
- Maintenance staff follow the linear progression only.
- On `COMPLETED`, `completed_at` is set automatically.
- Resource `availability_status` is automatically updated based on `outcome`.

### Query Parameters (GET `/`)

| Param | Description |
|-------|-------------|
| `status` | Filter by `OPEN`, `IN_PROGRESS`, `COMPLETED` |
| `priority` | Filter by `Low`, `Medium`, `High` |
| `resourceId` | Filter by resource UUID |
| `createdBy` | Admin only — filter by Firebase UID |

---

## Role-Based Access Control

| Role | Create | View All | Update Status | Delete | Export |
|------|--------|----------|---------------|--------|--------|
| Student/Lecturer | ✅ | Own only | ❌ | ❌ | ❌ |
| Maintenance Staff | ✅ | Assigned | ✅ (linear) | ❌ | ✅ |
| Admin | ✅ | All | ✅ (any) | ✅ | ✅ |

---

## Known Limitations

1. **Request form** (`/maintenance/request`) uses a static resource dropdown — should fetch live resources from `/api/resources`.
2. **Assign form** (`/maintenance/assign`) uses hardcoded ticket and staff lists — needs backend integration.
3. **Resource names** in the dashboard show truncated UUIDs — a batch resource name lookup would improve UX.
4. **No server-side pagination** — all tickets are loaded at once. For large datasets (>500 tickets), add `?page=&limit=` params.

---

## Performance Considerations

- `MaintenanceTicketModel.findAll` fetches all matching rows in one query.
- PDF generation is synchronous via PDFKit streaming — acceptable for <100 tickets.
- For large reports, consider streaming with `res.write()` chunks.

---

## Security Considerations

- All routes protected by `verifyToken` middleware (Firebase JWT validation).
- RLS policies in Supabase provide a second layer of protection.
- Input fields (`title`, `description`) are not currently sanitized — add `express-validator` before production.
- Remove the `dev-user` UID bypass in `isStaffOrAdmin()` before go-live.

---

## Deployment Notes

- Ensure `SUPABASE_SERVICE_KEY` has INSERT/UPDATE/DELETE privileges on `maintenance_tickets`.
- PDF export uses `PDFKit` (no external dependency on headless Chrome).
- Excel export uses `xlsx` (pure Node.js, no system dependencies).
