# Maintenance Report Generation (PDF)

**Modules**: Maintenance Management Module, Reporting & Analytics Module (Supporting Function)

This feature provides a backend API to generate and download structured PDF reports of maintenance activities.

## API Endpoint Details

### Generate PDF Report
- **Endpoint**: `GET /api/maintenance-tickets/report/pdf`
- **Authentication**: Required (Firebase JWT)
- **Role Permissions**: 
    - **Admin**: Can generate reports for all tickets.
    - **Maintenance Staff**: Can generate reports for tickets assigned to them (if assignment is implemented).
    - **Other roles**: Access Denied (403 Forbidden).

### Filtering Options
The report endpoint supports the following query parameters for refined data export:
- `status`: Filter by ticket status (e.g., `OPEN`, `IN_PROGRESS`, `COMPLETED`).
- `priority`: Filter by priority (e.g., `High`, `Medium`, `Low`).
- `resourceId`: Filter by a specific resource.

**Example Request**: `/api/maintenance-tickets/report/pdf?status=COMPLETED&priority=High`

## PDF Structure Breakdown

The generated PDF includes the following sections:

1.  **Header**:
    - Title: "Maintenance Report - URMS"
    - Subtitle: "University Resource Management System"
2.  **Summary Section**:
    - A quick overview box showing:
        - Total Maintenance Tickets (matching filters)
        - Count by status: Open, In Progress, and Completed.
3.  **Filters Applied**:
    - Lists any query parameters used to generate the report (for audit clarity).
4.  **Ticket Details Table**:
    - A sequential list of tickets including:
        - Ticket ID & Title
        - Resource ID
        - Issue Description
        - Priority and Status
        - Created Date/Time
5.  **Footer**:
    - Page numbering logic (if multiple pages).
    - Timestamp of when the report was generated.
    - Module identification.

## Implementation Details

- **Library**: `pdfkit`.
- **Method**: Dynamic generation using a stream-based approach piped directly to the HTTP response for memory efficiency.
- **Data Source**: Fetched via the `MaintenanceTicketModel` to ensure data consistency with the rest of the system.

## Example Output Description
The output is an `application/pdf` file named `maintenance-report.pdf`. It features a professional layout with a border for the summary metrics and bold headings for individual ticket entries.

## Error Responses
- **200 OK**: PDF served successfully.
- **401 Unauthorized**: No valid Firebase token provided.
- **403 Forbidden**: User role is not permitted to generate reports.
- **404 Not Found**: No tickets found matching the criteria.
- **500 Server Error**: Critical failure during PDF document assembly.
