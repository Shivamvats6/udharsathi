# SETUP

## Prerequisites

- Node.js 18+ and npm (check with `node -v` / `npm -v`)
- (Optional, for real Google Sheets/Drive storage) A Google Cloud account — see `docs/GOOGLE_SETUP.md`

## Install

```bash
git clone <this-repo>   # or unzip the file you were given
cd financer-app

cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## Environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

`backend/.env` — the important ones:

| Variable | Default | Notes |
|---|---|---|
| `STORAGE_PROVIDER` | `local` | `local` = JSON files, no setup. `google` = real Sheets/Drive, needs the rest of the Google vars. |
| `JWT_SECRET` | dev value | **Change this** before any real/production use. |
| `CORS_ORIGIN` | `http://localhost:5173` | Must match the URL the frontend runs on. |
| `DEMO_LOGIN_EMAIL` / `DEMO_LOGIN_PASSWORD` | `shivam@finance.com` / `finwise123` | The only login while `STORAGE_PROVIDER=local`. Change or remove for production. |

`frontend/.env`:

| Variable | Default |
|---|---|
| `VITE_API_URL` | `http://localhost:4000/api` |

## Development commands

```bash
# backend (http://localhost:4000)
cd backend
npm run dev      # tsx watch — restarts on file changes
npm test         # runs the calculation-engine test suite

# frontend (http://localhost:5173)
cd frontend
npm run dev
```

## Production build commands

```bash
# backend
cd backend
npm run build    # compiles TypeScript to dist/
npm start        # runs dist/index.js

# frontend
cd frontend
npm run build    # outputs frontend/dist — deploy as static files (Netlify, Vercel, nginx, etc.)
npm run preview  # serve the production build locally to sanity-check it
```

Deploy the backend anywhere that runs Node (Render, Railway, a VPS with
`pm2`, etc.) and the frontend anywhere that serves static files. Point
`VITE_API_URL` at the deployed backend's URL before building the frontend,
and `CORS_ORIGIN` at the deployed frontend's URL in the backend's `.env`.

## Google Sheets / Drive setup

See **`docs/GOOGLE_SETUP.md`** for the full walkthrough (Cloud project,
service account, spreadsheet sharing, Drive backup folder). Once done, set
in `backend/.env`:

```
STORAGE_PROVIDER=google
GOOGLE_SPREADSHEET_ID=...
GOOGLE_SERVICE_ACCOUNT_JSON=...
```

No other code changes are needed — the repository factory
(`backend/src/repositories/index.ts`) picks the implementation based on this
one variable.

## PWA / installing on a phone

1. `cd frontend && npm run build && npm run preview` (or deploy it properly).
2. Open the URL on a phone in Chrome (Android) or Safari (iOS).
3. Chrome: menu → "Install app". Safari: Share → "Add to Home Screen".

The manifest and icons are already set up in `frontend/public/` and
`frontend/vite.config.ts` (via `vite-plugin-pwa`).

## WhatsApp setup

There is nothing to install for WhatsApp — it uses the official `wa.me` deep
link format, which opens the financer's own WhatsApp app (mobile or Web)
with the message pre-filled. The financer must press Send themselves; the
app never sends anything automatically, and never uses WhatsApp Business
API, Cloud API, or any browser automation.

Set the default Hindi/English message templates once in
**Settings → WhatsApp Settings** in the app (or directly via
`PUT /api/settings`). Supported variables are documented on that screen.

## Testing instructions

```bash
cd backend
npm test
```

This runs `src/calculations/engine.test.ts` — 15 tests covering interest
calculation, the 2-day grace period, per-day/fixed late fines and the
maximum-fine cap, full and partial fine waivers, next-payment-date in both
"scheduled date" and "actual payment date" modes, and full repayment
schedule generation (checked against the exact dates from the spec's own
worked example: every 10 days starting 30 Sep → 10, 20, 30 Oct → 09, 19 Nov).

There is currently no automated frontend test suite or API integration test
suite — see "Known limitations" below.

## Known limitations & roadmap

Being upfront about what's simplified in this build, so nothing is a surprise:

- **Excel/PDF report export**: CSV export is implemented in the Reports
  screen; Excel (`xlsx`) and PDF export are not yet wired up. The report
  *data* endpoints (`/api/reports/*`) already return everything needed —
  adding `exceljs` and `pdfkit` calls in `reportController.ts` is the
  remaining work.
- **Firebase Cloud Messaging**: in-app notifications are fully implemented
  (they're created server-side on real events and shown in the Notifications
  screen); push notifications to a phone's lock screen via FCM are not wired
  up yet — that requires a Firebase project and its own credentials, which
  weren't provided.
- **"Login with Google" for the financer**: the demo login (email/password
  against `.env` values) is what's wired up today. A `GET /api/auth/google/url`
  endpoint and the OAuth env vars are scaffolded in the backend for adding a
  real "Sign in with Google" flow later, but the frontend button is currently
  a visual placeholder.
- **Customer edit / full CRUD on loans**: creating customers and loans is
  fully wired; editing an existing customer's profile from the UI (the
  "Edit" button on Customer Details) and editing a loan's terms after
  creation call the same backend endpoints (`PUT /api/customers/:id`,
  `PUT /api/loans/:id`) but don't yet have a dedicated edit form in the UI —
  today they'd need a small form component using the same pattern as `AddLoan.tsx`.
- **Automated end-to-end/UI tests**: only the calculation engine has unit
  tests. Manual testing (adding a customer, a loan, a payment, waiving a
  fine, generating a WhatsApp link) was done during development; a Playwright/
  Vitest UI test suite is a good next addition.
- **Restore from Google Drive backup**: `POST /api/backup/restore/:fileId`
  fetches the backup JSON and returns it, but does not yet write it back
  into the live Sheets/JSON store automatically — that's an intentional
  safety choice (restoring financial data should probably be a reviewed,
  manual step) but means "Restore" today is "fetch and inspect", not
  "one-click overwrite".

## Future PostgreSQL/MySQL migration plan

The repository pattern (`backend/src/repositories/interfaces.ts`) is the
seam for this. To add SQL storage:

1. `npm install pg` (or your driver of choice) in `backend/`.
2. Create `backend/src/repositories/sql/SqlCustomerRepository.ts` etc.,
   each implementing the same interfaces as the Local/Google versions.
3. Add `STORAGE_PROVIDER=sql` handling to `backend/src/repositories/index.ts`.
4. No controller, service, calculation-engine, or frontend code changes
   are needed — they only ever talk to the interfaces.
