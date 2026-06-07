# Report Export System (PDF/Excel)

## Feature Overview
The Report Export System enables authorized admin users to generate and download analytical reports in both PDF and Excel formats. This feature is integrated into the Analytics Dashboard and Maintenance Overview to provide management-ready insights.

## Supported Export Types
1.  **System Overview**: High-level summary of resources, bookings, and maintenance.
2.  **Booking Statistics**: Detailed trends, status distribution, and most-booked resources.
3.  **Resource Utilization**: Asset efficiency, total bookings per resource, and hours used.
4.  **Maintenance Reports**: Comprehensive list of maintenance tickets, their status, priority, and outcomes.

## Technical Architecture

### PDF Generation Flow
- **Library**: `pdfkit`
- **Utility**: `backend/src/services/exportService.ts` contains a generic `generatePDFReport` function.
- **Workflow**: 
    1.  Frontend sends a request to `/api/admin/analytics/export/pdf`.
    2.  Backend aggregates data using existing analytics logic.
    3.  `generatePDFReport` builds the document with a header, summary section, and data tables.
    4.  The PDF is streamed directly to the HTTP response.

### Excel Generation Flow
- **Library**: `xlsx` (SheetJS)
- **Utility**: `backend/src/services/exportService.ts` contains a generic `generateExcelReport` function.
- **Workflow**:
    1.  Frontend sends a request to `/api/admin/analytics/export/excel`.
    2.  Backend aggregates data into a JSON array of objects.
    3.  `generateExcelReport` converts JSON to a worksheet and creates a workbook.
    4.  The workbook is returned as a buffer with the appropriate MIME type.

## API Endpoints

### Analytics Exports
- **Endpoint**: `GET /api/admin/analytics/export/pdf`
- **Endpoint**: `GET /api/admin/analytics/export/excel`
- **Query Params**:
    - `type`: `overview`, `bookings`, or `utilization`
    - `range`: `7d`, `30d`, or `12m` (for bookings/utilization)
- **Access**: Admin only.

### Maintenance Exports
- **Endpoint**: `GET /api/maintenance-tickets/report/pdf`
- **Endpoint**: `GET /api/maintenance-tickets/report/excel`
- **Access**: Admin or Maintenance Staff.

## UI Access Points
- **Analytics Dashboard**: Export buttons (PDF/Excel) are located in the top-right toolbar, context-aware of the active tab.
- **Maintenance Dashboard**: Export controls are integrated into the header section next to the "Create Task" button.

## Performance Considerations
- **Stream-based PDF**: Using `pdfkit`'s streaming capability ensures low memory usage for large reports.
- **Buffer-based Excel**: Excel files are generated in memory as buffers for speed.
- **Reusable Aggregation**: Export endpoints reuse the same aggregation logic as the dashboard UI to minimize database load.

## Future Improvements
- **Visual Charts**: Integrate Recharts/Chart.js snapshots into the PDF reports.
- **Append Mode for Sheets**: Allow appending data to an existing Google Sheet instead of always creating a new one.
- **Advanced Excel Formatting**: Apply conditional formatting rules for utilization rate columns.

## Testing Instructions
1.  Log in as an Admin.
2.  Navigate to **Analytics & Reports**.
3.  Click the **PDF** or **Excel** buttons in different tabs (Overview, Booking Stats, Utilization).
4.  Verify that the downloaded files contain accurate data matching the dashboard.
5.  Navigate to **Maintenance Overview**.
6.  Click **Export PDF** or **Export Excel**.
7.  Verify the maintenance ticket list in the exported files.
