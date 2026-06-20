# Google Sheets Export Integration

## Overview
The Google Sheets Export integration allows administrators to export analytics data directly from the URMS dashboard into a new Google Spreadsheet. This provides a familiar interface for further data manipulation and sharing.

## Integration Flow
1. **Trigger**: Admin clicks the "Sheets" button on the Analytics Dashboard.
2. **Backend Processing**:
   - The backend fetches the required analytics data using the existing `analyticsService`.
   - The `googleSheetsService` initializes a connection using a Google Service Account.
   - A new Spreadsheet is created via the Google Sheets API.
   - Data is injected into the sheet with proper headers and basic formatting.
3. **Sharing**: The service account automatically shares the generated spreadsheet with the administrator's email address (retrieved from their authentication token).
4. **Response**: The backend returns the Spreadsheet URL.
5. **UI Update**: The frontend displays a success message with a direct link to the new sheet and automatically opens it in a new tab.

## Authentication Approach
- **Service Account**: The integration uses a Google Cloud Service Account for server-to-server communication. This avoids the need for individual users to authorize the application every time they want to export data.
- **Scopes**:
  - `https://www.googleapis.com/auth/spreadsheets`: To create and edit sheets.
  - `https://www.googleapis.com/auth/drive.file`: To manage the created files and handle sharing permissions.

## API Endpoints
- **GET** `/api/admin/analytics/export/google-sheets`
  - **Query Parameters**:
    - `type`: `overview`, `bookings`, or `utilization`.
    - `department`: (Optional) Filter by department.
    - `range`: `7d`, `30d`, `12m`, or `custom`.
    - `startDate` / `endDate`: For custom ranges.

## Configuration & Setup
### 1. Google Cloud Console
- Create a new project or select an existing one.
- Enable the **Google Sheets API** and **Google Drive API**.
- Create a **Service Account** under "IAM & Admin" > "Service Accounts".
- Create and download a **JSON Key** for the service account.

### 2. Environment Variables
Add the following to your `.env.local`:
```bash
GOOGLE_SERVICE_ACCOUNT_JSON='{"type": "service_account", "project_id": "...", "private_key": "...", "client_email": "...", ...}'
```
Alternatively, place the JSON key at `backend/src/config/serviceAccountKey.json`.

## Export Formatting
- **Headers**: First row is automatically bolded (via future batch update) or set as header.
- **Worksheets**:
  - `overview`: Single "Summary" sheet.
  - `bookings`: "Status Distribution" and "Daily Trends" sheets.
  - `utilization`: "Utilization" sheet with resource-level metrics.
- **Metadata**: Every export includes the generation timestamp and active filters.

## Access Control
- Strictly restricted to users with the `admin` role.
- Reuses `verifyToken` and `requireAdmin` middleware.

## Error Handling
- **Credential Failure**: Returns 500 if the service account is misconfigured.
- **API Limits**: Gracefully handles rate limits (though unlikely with standard admin usage).
- **Sharing Errors**: If the user email is invalid or the Drive API fails to share, the sheet is still created but might require manual access if not using the Service Account's drive.

## Future Improvements
- **Append Mode**: Allow appending data to an existing sheet instead of always creating a new one.
- **Advanced Formatting**: Apply conditional formatting for utilization rates.
- **Scheduled Sheets**: Integrate with the Automated Report system to sync data to Sheets every week.
