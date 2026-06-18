import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.join(__dirname, '../../../.env.local'), override: true });

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
];

/**
 * Initialise a Google Auth client from available credentials.
 * Priority: GOOGLE_SERVICE_ACCOUNT_JSON env var > serviceAccountKey.json file.
 * Throws a clear error if neither is configured.
 */
const getAuthClient = async () => {
    // 1. Try environment variable (preferred — no file required on server)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        let credentials: object;
        try {
            credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        } catch {
            throw new Error(
                'GOOGLE_SERVICE_ACCOUNT_JSON is set but contains invalid JSON. ' +
                'Ensure the value is a properly escaped JSON string.'
            );
        }
        const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
        return auth.getClient();
    }

    // 2. Fallback to key file
    const keyPath = path.join(__dirname, '../config/serviceAccountKey.json');
    try {
        const auth = new google.auth.GoogleAuth({ keyFile: keyPath, scopes: SCOPES });
        return auth.getClient();
    } catch (e: any) {
        // Don't swallow — propagate with helpful message
        throw new Error(
            `Google Service Account credentials not configured. ` +
            `Set GOOGLE_SERVICE_ACCOUNT_JSON in .env.local or place serviceAccountKey.json at ${keyPath}. ` +
            `Original error: ${e.message}`
        );
    }
};

/**
 * Export data to a new Google Spreadsheet.
 * Shares the created sheet with `userEmail` if provided.
 */
export const exportToGoogleSheets = async (
    title: string,
    sheets: { name: string; headers: string[]; rows: (string | number)[][] }[],
    userEmail?: string
) => {
    // Obtain a single auth client — reused for both Sheets and Drive
    const authClient = await getAuthClient();
    const sheetsApi = google.sheets({ version: 'v4', auth: authClient as any });

    // 1. Create spreadsheet
    const spreadsheet = await sheetsApi.spreadsheets.create({
        requestBody: {
            properties: { title: `${title} — ${new Date().toLocaleDateString()}` }
        }
    });
    const spreadsheetId = spreadsheet.data.spreadsheetId;
    if (!spreadsheetId) throw new Error("Google Sheets API returned no spreadsheetId after creation.");

    // 2. Rename/add worksheets
    const renameRequests: any[] = sheets.map((sheet, i) =>
        i === 0
            ? { updateSheetProperties: { properties: { sheetId: 0, title: sheet.name }, fields: 'title' } }
            : { addSheet: { properties: { title: sheet.name } } }
    );
    await sheetsApi.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: renameRequests } });

    // 3. Write data to each sheet
    for (const sheet of sheets) {
        const values = [sheet.headers, ...sheet.rows.map(row => row.map(cell => String(cell)))];
        await sheetsApi.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheet.name}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values }
        });
    }

    // 4. Share with requesting user — reuse same authClient (no separate file auth)
    if (userEmail && userEmail.includes('@')) {
        try {
            const driveApi = google.drive({ version: 'v3', auth: authClient as any });
            await driveApi.permissions.create({
                fileId: spreadsheetId,
                requestBody: { role: 'writer', type: 'user', emailAddress: userEmail }
            });
        } catch (shareErr: any) {
            // Non-fatal: sheet is still created, user can access via service account ownership
            console.warn(`Google Sheets sharing with ${userEmail} failed (non-fatal): ${shareErr.message}`);
        }
    }

    return {
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    };
};
