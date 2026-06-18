# Resource Utilization Reports & Peak Usage Analytics

This module provides administrators with deep insights into how university resources are being used, including efficiency metrics and peak activity patterns.

## Features

### 1. Resource Utilization Metrics
- **Total Booking Hours**: Cumulative time each resource has been reserved.
- **Utilization Rate**: Percentage of time a resource is booked vs. total available time in the selected period (7d, 30d, 12m).
- **Efficiency Grading**: Visual indicators (Green/Amber/Red) based on utilization thresholds.
- **Resource Comparison**: Tabular breakdown of metrics per resource, sorted by highest utilization.

### 2. Peak Usage Analysis
- **Peak Booking Hours**: Hourly distribution of booking starts to identify busy times of day.
- **Busiest Days**: Daily distribution (Monday-Sunday) to identify high-traffic days of the week.
- **Visual Heatmaps**: Bar charts representing frequency across time dimensions.

### 3. Integrated Dashboard
- **Tabbed Interface**: Seamless switching between Overview, Booking Stats, and Resource Utilization.
- **Time Range Filtering**: Global filters for 7 Days, 30 Days, and 12 Months.
- **Real-time Data**: Direct integration with Supabase for accurate, up-to-date reporting.

## Technical Implementation

### Backend Aggregation (`/backend/src/controllers/analyticsCtrl.ts`)
- **`getResourceUtilization`**: 
    - Calculates duration for all approved/completed bookings.
    - Aggregates data per resource.
    - Computes utilization rate based on total hours in the period.
- **`getPeakUsage`**:
    - Analyzes `start_time` of all valid bookings.
    - Groups data by hour (0-23) and day of week (0-6).

### Frontend Visualization (`/app/admin/analytics/page.tsx`)
- **Chart.js Integration**: Uses `BookingBarChart` for peak hours and days.
- **Responsive Tables**: Dynamic utilization grid with progress bars.
- **State Management**: Conditional data fetching to optimize performance and reduce API load.

### API Endpoints
- `GET /api/admin/analytics/resource-utilization?range=7d|30d|12m`
- `GET /api/admin/analytics/peak-usage`

## Security & RBAC
- Access is restricted to users with the `admin` role.
- All requests require a valid JWT token verified via `verifyToken` and `requireAdmin` middleware.

## Configuration
Thresholds for utilization indicators:
- **High (>70%)**: Red (Overutilized/Potential Bottleneck)
- **Moderate (30-70%)**: Amber (Optimal Usage)
- **Low (<30%)**: Emerald (Underutilized)
