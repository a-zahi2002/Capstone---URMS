# Booking Statistics Charts (Chart.js)

## Feature Overview
The Booking Statistics section provides granular visual reports on booking activities, status workflows, and resource utilization using the Chart.js library. This module complements the general analytics overview with deeper insights and filtering capabilities.

## Chart Descriptions

### 1. Booking Trends (Line Chart)
- **Visual**: Line chart with area fill.
- **Data**: Displays booking counts over time.
- **Filtering**: Supports "Last 7 Days", "Last 30 Days", and "Last 12 Months".
- **Purpose**: Identifies peak usage periods and long-term growth trends.

### 2. Workflow Distribution (Doughnut Chart)
- **Visual**: Doughnut/Pie chart.
- **Data**: Distribution of booking statuses: Pending, Approved, Completed, Cancelled, and Rejected.
- **Purpose**: Visualizes the efficiency of the booking approval workflow.

### 3. Resource Popularity (Bar Chart - Horizontal)
- **Visual**: Horizontal bar chart.
- **Data**: Top 10 most booked resources.
- **Purpose**: Identifies the most highly utilized physical assets in the university.

### 4. Usage by Category (Bar Chart - Vertical)
- **Visual**: Vertical bar chart.
- **Data**: Total bookings grouped by resource type (e.g., Labs, Lecture Halls, Equipment).
- **Purpose**: Shows which categories of resources are in highest demand.

## Technical Implementation

### Frontend: Chart.js Integration
- **Library**: `chart.js` with `react-chartjs-2`.
- **Architecture**:
  - `components/charts/ChartConfig.ts`: Global registration of Chart.js scales and elements.
  - `components/charts/BookingLineChart.tsx`: Reusable line chart component.
  - `components/charts/BookingBarChart.tsx`: Reusable bar chart component (supports horizontal/vertical).
  - `components/charts/BookingPieChart.tsx`: Reusable doughnut chart component.
- **Responsive Design**: Charts use `responsive: true` and `maintainAspectRatio: false` within flexible Tailwind containers to ensure correct rendering on all devices.

### Backend: Analytics API
New endpoints implemented in `analyticsCtrl.ts`:
- `GET /api/admin/analytics/booking-trends?range=7d|30d|12m`: Aggregates bookings by day or month based on the range.
- `GET /api/admin/analytics/booking-status`: Aggregates counts for all status types.
- `GET /api/admin/analytics/resource-bookings`: Returns top 10 resources by booking count.
- `GET /api/admin/analytics/category-bookings`: Joins `bookings` and `resources` to aggregate by category type.

## Access Control
- **Authorization**: All analytics endpoints are protected by `verifyToken` and `requireAdmin` middleware.
- **UI Protection**: The `/admin/analytics` route is wrapped in a `ProtectedRoute` component that validates admin claims.

## Folder Structure
- `backend/src/routes/analyticsRoutes.ts`: Route definitions for statistics.
- `backend/src/controllers/analyticsCtrl.ts`: SQL aggregation logic via Supabase.
- `components/charts/`: Reusable Chart.js wrapper components.
- `app/admin/analytics/page.tsx`: Main UI container with tabbed navigation.

## Performance Considerations
- **Server-side Aggregation**: Queries use Supabase's PostgreSQL engine to aggregate data before sending it to the client.
- **Conditional Fetching**: Detailed report data is only fetched when the "Booking Reports" tab is active.
- **Range Optimization**: Date-based filters limit the dataset size for trend analysis.

## Future Enhancements
- **Export Capabilities**: Add functionality to export chart data to CSV or PDF reports.
- **Comparison Views**: Allow administrators to compare current booking trends with previous periods (e.g., Year-over-Year).
- **Custom Date Pickers**: Support custom start/end dates for more flexible reporting.

## Testing Instructions
1. Log in as an administrator.
2. Navigate to `http://localhost:3000/admin/analytics`.
3. Switch to the **Booking Reports** tab.
4. Verify that all four charts render correctly.
5. Toggle between the "7 Days", "30 Days", and "12 Months" filters and ensure the Line Chart updates appropriately.
6. Resize the browser to verify mobile/tablet responsiveness.
