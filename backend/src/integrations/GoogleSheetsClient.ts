import { google, sheets_v4 } from "googleapis";
import { env } from "../config/env";

/**
 * Thin wrapper around the Google Sheets API v4.
 * Auth uses a Service Account (recommended for a backend-only, single-financer
 * app) so there is no interactive OAuth consent screen needed at runtime.
 *
 * Setup (see /docs/GOOGLE_SETUP.md):
 *  1. Create a Google Cloud project, enable Sheets API + Drive API.
 *  2. Create a Service Account, download its JSON key.
 *  3. Share your Google Sheet + Drive backup folder with the service
 *     account's email (it looks like xxx@xxx.iam.gserviceaccount.com).
 *  4. Put the key file path (or inline JSON) in backend/.env
 */
let sheetsClient: sheets_v4.Sheets | null = null;

function getAuth() {
  if (env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return new google.auth.GoogleAuth({
      credentials,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
      ],
    });
  }
  if (env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE) {
    return new google.auth.GoogleAuth({
      keyFile: env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
      ],
    });
  }
  throw new Error(
    "Google credentials not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_KEY_FILE in backend/.env"
  );
}

export function getSheetsClient(): sheets_v4.Sheets {
  if (!sheetsClient) {
    sheetsClient = google.sheets({ version: "v4", auth: getAuth() as any });
  }
  return sheetsClient;
}

export function getDriveAuth() {
  return getAuth();
}

const SPREADSHEET_ID = () => {
  if (!env.GOOGLE_SPREADSHEET_ID) {
    throw new Error("GOOGLE_SPREADSHEET_ID is not set in backend/.env");
  }
  return env.GOOGLE_SPREADSHEET_ID;
};

/** Read all rows (including header) of a sheet/tab as arrays. */
export async function readSheet(tabName: string): Promise<string[][]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID(),
    range: `${tabName}!A:Z`,
  });
  return (res.data.values as string[][]) ?? [];
}

/** Read a sheet and map rows to objects using the header row as keys. */
export async function readSheetAsObjects<T = Record<string, string>>(tabName: string): Promise<T[]> {
  const rows = await readSheet(tabName);
  if (rows.length === 0) return [];
  const [header, ...body] = rows;
  return body.map((row) => {
    const obj: Record<string, string> = {};
    header.forEach((key, i) => (obj[key] = row[i] ?? ""));
    return obj as T;
  });
}

/** Append one row of values to the end of a tab. */
export async function appendRow(tabName: string, values: (string | number)[]): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID(),
    range: `${tabName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

/** Append many rows at once (batch operation, per spec section 25). */
export async function appendRows(tabName: string, rows: (string | number)[][]): Promise<void> {
  if (rows.length === 0) return;
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID(),
    range: `${tabName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
}

/**
 * Update a single row in place, found by matching `idColumnLetter` to `id`.
 * Uses a targeted range update rather than rewriting the whole sheet.
 */
export async function updateRowById(
  tabName: string,
  idColumnLetter: string,
  id: string,
  header: string[],
  updatedRowObject: Record<string, string | number>
): Promise<void> {
  const sheets = getSheetsClient();
  const idColRange = `${tabName}!${idColumnLetter}:${idColumnLetter}`;
  const idColRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID(), range: idColRange });
  const idColValues = (idColRes.data.values ?? []).map((r) => r[0]);
  const rowIndex = idColValues.findIndex((v) => v === id); // 0-based, includes header row
  if (rowIndex === -1) throw new Error(`Row with id ${id} not found in ${tabName}`);

  const rowNumber = rowIndex + 1; // 1-based for A1 notation
  const values = header.map((key) => updatedRowObject[key] ?? "");
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID(),
    range: `${tabName}!A${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

/** Ensures all required tabs exist (per spec section 25); creates missing ones with headers. */
export async function ensureSheetsExist(tabsWithHeaders: Record<string, string[]>): Promise<void> {
  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID() });
  const existingTitles = new Set((meta.data.sheets ?? []).map((s) => s.properties?.title));

  const missing = Object.keys(tabsWithHeaders).filter((t) => !existingTitles.has(t));
  if (missing.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID(),
      requestBody: {
        requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
      },
    });
    for (const title of missing) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID(),
        range: `${title}!A1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [tabsWithHeaders[title]] },
      });
    }
  }
}
