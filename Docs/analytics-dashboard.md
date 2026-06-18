# Usage Analytics Dashboard

## Feature Overview
The Usage Analytics Dashboard provides university administrators with high-level insights into resource utilization, booking trends, and maintenance operations. It centralizes key performance indicators (KPIs) and visualizes data through interactive charts and summary cards.

## Features
- **Overview Metrics**: Total resources, active bookings, completed bookings, resources under maintenance, and resource utilization percentage.
- **Booking Analytics**: Trends over the last 7 days, booking status distribution (Pending, Approved, Completed, Cancelled), and identification of most booked resources.
- **Resource Analytics**: Distribution of resources by category (Labs, Lecture Halls, Rooms, etc.).
- **Maintenance Analytics**: Status distribution of maintenance tickets, average completion time, and identification of frequently maintained resources.

## Architecture & Design Decisions
- **Backend Aggregation**: Analytics are aggregated on the server-side to minimize client-side processing and reduce the number of API calls.
- **Supabase Integration**: Direct SQL-like queries via Supabase JS client for efficient data fetching.
- **Recharts Integration**: Using `recharts` for responsive and premium-looking visualizations.
- **RBAC**: Access is restricted to users with the `admin` role via `verifyToken` and `requireAdmin` middleware.

## API Endpoints
All endpoints are under `/api/admin/analytics` and require an Admin Bearer Token.

### 1. `GET /overview`
Returns high-level summary statistics.
**Response Shape:**
```json
{
  "totalResources": 156,
  "activeBookings": 42,
  "completedBookings": 120,
  "resourcesUnderMaintenance": 5,
  "mostBookedResource": "Main Auditorium",
  "totalMaintenanceTickets": 25,
  "pendingMaintenanceTasks": 3,
  "resourceUtilization": 27
}
```

### 2. `GET /bookings`
Returns booking trends and status distribution.

### 3. `GET /resources`
Returns resource category distribution and top resources.

### 4. `GET /maintenance`
Returns maintenance ticket status distribution and efficiency metrics.

## UI/UX Patterns
- **Stat Cards**: Prominent display of core KPIs with iconography.
- **Charts**: 
  - Area Chart for Booking Trends.
  - Pie Chart for Booking Status.
  - Vertical Bar Chart for Resource Categories.
  - Horizontal Progress Bars for Top Resources.
- **Responsive Design**: Optimized for Desktop, Tablet, and Mobile views using Tailwind CSS.
- **Loading States**: Skeleton-like loading spinners for a smooth user experience.

## Folder/File Structure
- `backend/src/routes/analyticsRoutes.ts`: Route definitions.
- `backend/src/controllers/analyticsCtrl.ts`: Aggregation logic.
- `app/admin/analytics/page.tsx`: Frontend dashboard implementation.

## Setup/Testing
1. Ensure the backend is running on `http://localhost:5000`.
2. Ensure you are logged in as an administrator.
3. Navigate to `/admin/analytics` or click "View Analytics" from the Admin Console.
4. Verify that data is correctly fetched from the Supabase instance.
