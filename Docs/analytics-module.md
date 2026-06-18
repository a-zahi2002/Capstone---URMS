# Reporting & Analytics Module — Documentation

## Overview
The Reporting & Analytics Module provides university administrators with real-time insights into resource utilization, booking trends, and maintenance health. It supports PDF, Excel, and Google Sheets export.

---

## Architecture

```
Frontend:   app/admin/analytics/page.tsx    ← Analytics dashboard (3 tabs)
            components/charts/BookingLineChart.tsx
            components/charts/BookingBarChart.tsx
            components/charts/BookingPieChart.tsx

Backend:    routes/analyticsRoutes.ts              ← Express router (admin-only)
            controllers/analyticsCtrl.ts           ← All analytics handlers + export
            services/analyticsService.ts           ← Shared data aggregation logic
            services/exportService.ts              ← PDF + Excel generation
            services/googleSheetsService.ts        ← Google Sheets API integration
            controllers/reportScheduleCtrl.ts      ← Scheduled report management
            routes/reportScheduleRoutes.ts
```

---

## API Reference

Base path: `/api/admin/analytics`  
All routes require: `Authorization: Bearer <firebase-jwt>` + admin role.

### Overview & Summaries

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/overview` | KPI summary (totals, utilization %) |
| `GET` | `/bookings` | Booking status distribution + trends |
| `GET` | `/resources` | Category distribution + top 5 booked |
| `GET` | `/maintenance` | Maintenance summary + avg resolution time |

### Detailed Reports

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/booking-trends` | Daily/monthly booking counts |
| `GET` | `/booking-status` | Status counts (Pending/Approved/Completed/etc.) |
| `GET` | `/resource-bookings` | Top 10 most booked resources |
| `GET` | `/category-bookings` | Bookings grouped by resource category |
| `GET` | `/resource-utilization` | Per-resource utilization rates |
| `GET` | `/peak-usage` | Peak booking hours and days of week |

### Export

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/export/pdf` | PDF report download |
| `GET` | `/export/excel` | Excel (.xlsx) download |
| `GET` | `/export/google-sheets` | Export to Google Sheets (returns URL) |

### Common Query Parameters

| Param | Values | Description |
|-------|--------|-------------|
| `department` | Faculty name string | Filter all data by department |
| `range` | `7d`, `30d`, `12m` | Relative date range |
| `startDate` | `YYYY-MM-DD` | Custom range start |
| `endDate` | `YYYY-MM-DD` | Custom range end |
| `type` | `overview`, `bookings`, `utilization` | For export endpoints |

---

## Dashboard Tabs

### Overview Tab
- **4 KPI cards:** Total Resources · Active Bookings · Pending Maintenance · Utilization Rate
- **Area Chart:** Recent booking activity (Recharts)
- **Donut Chart:** Booking status mix
- **Horizontal Bar:** Resource category distribution
- **Maintenance summary:** Avg resolution time + top maintained resources

### Bookings Tab
- Line chart: activity trends over selected range
- Pie chart: booking workflow distribution
- Bar chart: top 10 booked resources
- Bar chart: category usage

### Utilization Tab
- Bar chart: peak booking hours (0–23)
- Bar chart: busiest days of week
- Detailed table: per-resource utilization % with animated progress bars

---

## Utilization Calculation

```
availableHoursPerResource = days × 8   (business hours)
utilizationRate = (totalHoursBooked / availableHoursPerResource) × 100
```
Capped at 100%. Uses only `Approved` and `Completed` bookings.

---

## Export Systems

### PDF (PDFKit)
- Generated server-side, streamed directly to HTTP response.
- No browser dependency — pure Node.js.
- Includes: title, subtitle, summary box, data tables, footer with timestamp.

### Excel (xlsx)
- Multi-sheet workbooks — data + metadata tab.
- Sent as `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

### Google Sheets
- Requires `GOOGLE_SERVICE_ACCOUNT_JSON` in backend `.env`.
- Creates a new spreadsheet per export and returns the public URL.
- Will fail gracefully (500) if credentials are not configured.

---

## Report Scheduling

- Managed via `/api/admin/report-schedules`
- Supports daily / weekly / monthly automated delivery.
- Uses `node-cron` in `services/schedulerService.ts`.
- Accessible from the analytics dashboard via the **Schedule** button.

---

## Performance Considerations

- All 4 overview queries run in `Promise.all` — parallel fetch, ~50–100ms typical.
- Resource name lookups use `batchFetchResourceNames()` — single IN query, no N+1.
- Date range filtering applied at query level (not in memory).
- Recharts `ResponsiveContainer` lazy-renders charts only when tab is active.

---

## Security Considerations

- All analytics routes require both `verifyToken` AND `requireAdmin` middleware.
- Department and date parameters are passed directly to Supabase — no raw SQL injection risk (Supabase client parameterizes queries).
- Google Sheets service account credentials must be stored as environment variable, never committed.

---

## Known Limitations

1. **Custom date range UI** — Now visible when `Custom` is selected in the time range picker.
2. **Google Sheets** — Requires valid GCP service account. Export will fail without it.
3. **Departments list** — Hardcoded in frontend. Should be fetched from `/api/resources` for accuracy.
4. **Overview utilization** — Calculated as `(activeBookings / totalResources) * 100`, which may be 0 when no bookings are currently active. A historical utilization rate would be more accurate.

---

## Future Improvements

- Add chart drill-down (click a bar to see individual bookings)
- Add comparison mode (current period vs. previous period)
- Export scheduling with email delivery
- Real-time websocket updates for live dashboard
- CSV export option
- Anomaly detection alerts (e.g., resource with 0% utilization for 30 days)
