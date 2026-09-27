# FinWise — Financer / Loan Collection Management PWA

A complete loan collection management app for a financer who manages his own
customers and loans — customers, loans, custom repayment cycles, interest,
overdue tracking with a grace period, per-customer late fines with waivers,
payments, a reminder center, reports, and personal-WhatsApp deep links
(never automated sending).

This is a real, runnable full-stack project:

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + React Router +
  React Query + React Hook Form + i18next (English/Hindi) + a PWA service worker.
- **Backend**: Node.js + Express + TypeScript, a calculation engine with unit
  tests, and a repository layer that runs on local JSON files out of the box
  and on Google Sheets + Google Drive once you add credentials.

**Both the calculation engine and the API were built and tested while
building this** — 15/15 unit tests pass, and the API was verified live
(login → dashboard → customer detail all return correct calculated numbers)
before this was packaged up.

---

## 1. Quick start (no Google account needed)

You can run the whole app locally in about two minutes — it starts with a
JSON-file "database" pre-loaded with 5 demo customers and loans that match
the screens in the design reference, so you can see it working immediately.

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env
npm install
npm run dev
# → FinWise backend running on http://localhost:4000 (storage: local)

# Terminal 2 — frontend
cd frontend
cp .env.example .env
npm install
npm run dev
# → open http://localhost:5173
```

Log in with the demo account shown on the login screen:

```
Email:    shivam@finance.com
Password: finwise123
```

(Change `DEMO_LOGIN_EMAIL` / `DEMO_LOGIN_PASSWORD` in `backend/.env` any time.)

Data is saved as JSON files under `backend/src/data/` — nothing is lost
between restarts, and there is nothing to install or configure to get here.

## 2. Moving to real Google Sheets + Drive storage

The app is written so that **no frontend or business-logic code changes**
when you switch storage backends — only `backend/.env`:

```bash
STORAGE_PROVIDER=google
GOOGLE_SPREADSHEET_ID=...
GOOGLE_SERVICE_ACCOUNT_JSON=...   # or GOOGLE_SERVICE_ACCOUNT_KEY_FILE=...
```

Full step-by-step instructions (creating the Cloud project, service account,
sharing the spreadsheet, enabling Drive backups) are in **`docs/GOOGLE_SETUP.md`**.

## 3. Project structure

```
financer-app/
├── frontend/                 React + Vite + TS PWA
│   └── src/
│       ├── pages/            Dashboard, Customers, CustomerDetails, AddLoan,
│       │                     LoanDetails, AddPayment, Notifications, Reports, Settings, Login
│       ├── components/       layout (sidebar/bottom-nav), reusable UI
│       ├── calculations/     mirror of the backend calculation engine
│       ├── context/          Auth, Settings (language, currency, WhatsApp templates)
│       ├── locales/          en.json, hi.json (i18next)
│       └── lib/api.ts        axios client (JWT auth header, 401 handling)
├── backend/                   Node + Express + TS API
│   └── src/
│       ├── calculations/      engine.ts (+ engine.test.ts — 15 passing tests)
│       ├── repositories/      interfaces + local (JSON) + google (Sheets/Drive) implementations
│       ├── services/          loanService, dashboardService, reportService, whatsappService
│       ├── controllers/       one per resource
│       ├── routes/            one per resource, all behind JWT auth except /auth
│       ├── middleware/        auth, error handling, rate limiting
│       ├── validators/        Zod schemas for every write endpoint
│       └── integrations/      GoogleSheetsClient.ts, GoogleDriveClient.ts
├── docs/
│   └── GOOGLE_SETUP.md
├── SETUP.md
└── README.md (this file)
```

## 4. What's implemented

- **Calculation engine** (`backend/src/calculations/engine.ts`, mirrored in
  the frontend): interest (fixed / percentage / monthly percentage / custom),
  next-payment-date logic in both "scheduled date" and "actual payment date"
  modes, custom repayment cycles (daily up to every 30 days, or "every X days"),
  a 2-day default grace period, per-day or fixed-amount late fines with an
  optional maximum, fine waivers (full or partial, with the original fine
  always preserved for audit), and full repayment-schedule generation.
- **Customers**: list with search/filter, add/edit, archive (never hard-deleted),
  call (`tel:`) and personal-WhatsApp (`wa.me`) actions, preferred language per customer.
- **Loans**: multiple loans per customer, full configuration form matching the
  design reference, repayment schedule table with live status per installment.
- **Payments**: record a payment against the next due installment, auto-applies
  the outstanding late fine unless you uncheck it.
- **Fine waivers**: full or partial, with an audit-log entry and a notification.
- **Reminder Center / Notifications**: upcoming / due today / overdue / fine
  applied / payment received / fine waived, each generated server-side as
  real events happen (not fake placeholder data).
- **WhatsApp**: `POST /api/whatsapp/reminder-link` builds a `https://wa.me/...`
  link with the message pre-filled from the customer's preferred-language
  template and real numbers — the app opens it in a new tab, and the financer
  presses Send in their own WhatsApp. **Nothing is ever sent automatically.**
- **Reports**: daily collection, monthly collection (with month navigation),
  outstanding by customer, overdue, customer statement, payment history —
  with CSV export in the UI (Excel/PDF export are documented as a next step,
  see "Known limitations" in `SETUP.md`).
- **Settings**: financer profile, app language (persists, and drives which
  WhatsApp template is used per customer), currency, date format, WhatsApp
  message templates with variable substitution, notification toggles, and a
  "Backup to Google Drive" button.
- **i18n**: every screen is translated (`src/locales/en.json` / `hi.json`),
  language persists in `localStorage`, and each customer has their own
  preferred communication language.
- **PWA**: installable, manifest + icons + service worker (via `vite-plugin-pwa`),
  works offline for the app shell.
- **Security**: JWT-protected API, Zod validation on every write endpoint,
  Helmet security headers, CORS restricted to the frontend origin, rate
  limiting (300 req/15 min general, 20 req/15 min on login), secrets only
  ever read from `backend/.env` — never shipped to the frontend bundle.

## 5. Tests

```bash
cd backend
npm test
```

Runs the calculation-engine test suite (interest, grace period, fine
calculation and capping, waivers, next-payment-date in both modes, and full
schedule generation against the exact dates from the spec's own example).
All 15 tests pass.

## 6. Known limitations / what to build next

See **`SETUP.md` → "Known limitations & roadmap"** for the honest list —
this covers things like Excel/PDF export, Firebase push notifications, and
a couple of screens (e.g. a full customer-edit modal) that are wired on the
backend but have a minimal frontend today.
