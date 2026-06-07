# Custom Date Range Reports - Implementation Details

## Overview
The "Custom Date Range Reports" feature enables administrators to filter all analytics data, charts, and exportable reports by a specific start and end date. This provides granular control over reporting periods beyond the standard 7-day, 30-day, and 12-month presets.

## Architecture

### Backend Implementation
The backend implementation centralizes filtering logic within `backend/src/controllers/analyticsCtrl.ts`.

#### 1. Standardized Filtering Helper
A new helper function `applyDateRangeFilter` was implemented to ensure consistent application of date constraints across all Supabase queries.
- **Function**: `applyDateRangeFilter(query, startDate, endDate, column = 'created_at')`
- **Logic**: 
  - If `startDate` is provided, applies `.gte(column, startDate)`.
  - If `endDate` is provided, applies `.lte(column, endDate)`.
  - Automatically handles ISO string conversion.

#### 2. Controller Integration
All analytics endpoints now accept `startDate` and `endDate` query parameters.
- **Overview Analytics**: Filters active counts and maintenance tickets.
- **Booking Statistics**: Aggregates statuses, resource rankings, and category distributions within the range.
- **Resource Utilization**: Calculates efficiency metrics based on the number of days in the custom range.
- **Trends & Peak Usage**: Scopes temporal distributions to the selected window.

#### 3. Enhanced Exports
PDF and Excel export utilities were updated to:
- Propagate the custom range to the data fetching layer.
- Include the selected date range in the report headers and metadata (e.g., "Range: 2026-01-01 to 2026-01-31").

### Frontend Implementation
The frontend integration is managed in `app/admin/analytics/page.tsx`.

#### 1. State Management
Three new state variables were introduced:
- `timeRange`: Extended to include `'custom'`.
- `startDate`: Tracks the custom start date (YYYY-MM-DD).
- `endDate`: Tracks the custom end date (YYYY-MM-DD).

#### 2. UI Components
- **TimeRangePicker**: Updated with a "Custom" option.
- **Date Inputs**: A dynamic, glassmorphism-styled date selection bar appears in the dashboard header when "Custom" is active.
- **Reactive Fetching**: `useEffect` hooks trigger data synchronization whenever the department, time range, or custom dates are modified.

## Usage Guide
1. Navigate to the **Admin Analytics** dashboard.
2. Select **"Custom"** from any Time Range picker (Global header or individual chart sections).
3. Use the date inputs in the header to specify your desired window.
4. The dashboard metrics and charts will update automatically.
5. Click **PDF** or **Excel** to export a report reflecting the chosen period.

## Technical Notes
- **Timezone Handling**: Dates are processed as ISO strings to ensure consistency between the client and the Supabase database.
- **Performance**: Filtering is performed server-side via Supabase query builders to minimize payload sizes.
- **Validation**: The frontend uses standard HTML5 date inputs, and the backend handles parsing with native `Date` objects.
