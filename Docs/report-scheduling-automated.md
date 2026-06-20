# Automated Report Scheduling System

## Overview
The Automated Report Scheduling system allows administrators to configure weekly delivery of analytical insights. Reports can be scheduled for specific days and times, delivered via internal notifications or mock email alerts in both PDF and Excel formats.

## Architecture

### 1. Persistence Layer
- **Table**: `report_schedules`
- **Fields**:
  - `report_types`: Array of modules (Overview, Booking, Utilization, Maintenance).
  - `recipients`: Array of User IDs (for notifications) or Email addresses.
  - `delivery_day`: 0-6 (Sunday-Saturday).
  - `delivery_time`: TIME (HH:mm:ss).
  - `format`: 'pdf' or 'excel'.
  - `is_enabled`: Boolean flag.

### 2. Execution Engine (`schedulerService.ts`)
- Runs as a background task initialized in `server.ts`.
- Checks hourly for enabled schedules matching the current day and hour.
- Ensures reports are only generated once per day using `last_run_at`.

### 3. Generation Pipeline
- **Aggregation**: Reuses `analyticsService.ts` to fetch identical data as seen on the dashboard.
- **File Creation**: `exportService.ts` provides `generatePDFBuffer` and `generateExcelBuffer` for headless file generation.
- **Delivery**: 
  - Internal: Inserts records into the `notifications` table.
  - External (Mock): Logs email delivery details to the server console.

## Admin UI
- **Path**: `/admin/analytics/reports`
- **Features**:
  - Visual list of all configured schedules.
  - Instant toggle for enabling/disabling jobs.
  - Modal-based configuration for recipients, timing, and modules.
  - Built with the URMS premium design system (Lucide Icons, Glassmorphism).

## Configuration
To enable SMTP (future):
1. Update `notificationService.ts` to use `nodemailer`.
2. Add SMTP credentials to `.env.local`.

## Testing
1. Log in as Admin.
2. Go to **Analytics & Reports** -> **Schedule Reports**.
3. Create a schedule for the current day and next hour.
4. Check backend logs for "Executing scheduled report" and verify notifications in the user profile.
