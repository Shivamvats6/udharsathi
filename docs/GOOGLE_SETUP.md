# Google Sheets + Google Drive Setup

This lets the app store real data in a Google Sheet you own, and back it up
to a folder in your Google Drive, instead of the local JSON files it uses
by default. The app uses a **Service Account** (not interactive OAuth), so
there's no login screen for Google — the backend authenticates as a "robot"
account and you just share your Sheet/Drive with it.

## 1. Create a Google Cloud project

1. Go to https://console.cloud.google.com/ and create a new project (e.g. "FinWise").
2. In the left menu, go to **APIs & Services → Library**.
3. Enable **Google Sheets API**.
4. Enable **Google Drive API**.

## 2. Create a Service Account

1. Go to **APIs & Services → Credentials → Create Credentials → Service account**.
2. Give it a name (e.g. `finwise-backend`). No special roles are needed at the project level.
3. Once created, open it, go to the **Keys** tab → **Add Key → Create new key → JSON**.
4. A JSON file downloads — this is your `GOOGLE_SERVICE_ACCOUNT_JSON`. Keep it secret.
5. Note the service account's email address — it looks like:
   `finwise-backend@your-project.iam.gserviceaccount.com`

## 3. Create the spreadsheet

1. Create a new Google Sheet (any name, e.g. "FinWise Data").
2. Click **Share**, and share it with the service account's email address
   (from step 2.5) with **Editor** access.
3. Copy the spreadsheet ID from its URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_PART_IS_THE_ID`**`/edit`

You do **not** need to create the tabs (Customers, Loans, Repayments,
Payments, FineAdjustments, Notifications, Settings, AuditLogs) by hand —
the app's `ensureSheetsExist()` helper (in
`backend/src/integrations/GoogleSheetsClient.ts`) can create any missing tab
with the correct header row the first time it's called. (Wire it into a
one-time setup script or call it manually if you want to pre-create them.)

## 4. Set up Drive backups

1. In Google Drive, no manual folder setup is required — the backend
   creates `FinancerApp/Backups/` automatically the first time you click
   "Backup to Google Drive" in Settings.
2. Because the backup files are created **by the service account**, they
   live in the service account's own Drive space by default. To see them in
   *your* Drive too, either:
   - Share the `FinancerApp` folder it creates back to your own account
     (open Drive as the service account isn't directly possible, so instead
     create the `FinancerApp` folder yourself in your own Drive first and
     share it with the service account email with Editor access — the app
     will then use your existing folder instead of creating a new one), or
   - Use a **Shared Drive** (Team Drive) instead of My Drive, and add the
     service account as a member — this avoids the "whose Drive is it"
     issue entirely and is the recommended approach for production use.

## 5. Configure the backend

In `backend/.env`:

```bash
STORAGE_PROVIDER=google
GOOGLE_SPREADSHEET_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz...

# Option A — paste the whole downloaded JSON key as one line:
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...", ...}

# Option B — or point to the file instead (don't commit it to git!):
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=/absolute/path/to/service-account-key.json

DRIVE_APP_FOLDER_NAME=FinancerApp
```

Restart the backend. `GET /health` will show `"storage":"google"` once it's
picked up.

## 6. (Optional) "Login with Google" for the financer

This is separate from the Sheets/Drive service account above — it would let
the financer sign in with their own Google account instead of the demo
email/password. The backend has the scaffolding for this
(`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
`GOOGLE_OAUTH_REDIRECT_URI` in `.env`, and `GET /api/auth/google/url` in
`authController.ts`), but finishing the OAuth callback flow and the
frontend redirect handling is not done in this build — see `SETUP.md` →
"Known limitations".

To set it up when you're ready:

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Authorized redirect URI: `http://localhost:5173/oauth/callback` (or your
   production URL).
4. Copy the Client ID and Client Secret into `backend/.env`.

## Troubleshooting

- **"The caller does not have permission"** — you forgot to share the
  spreadsheet (or Drive folder) with the service account's email address.
- **"Requested entity was not found"** — check `GOOGLE_SPREADSHEET_ID` is
  copied correctly from the URL (no extra characters).
- **Sheets API / Drive API errors about API not enabled** — double check
  both APIs are enabled in step 1 for the *same* project the service account
  belongs to.
