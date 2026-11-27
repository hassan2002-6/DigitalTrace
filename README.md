# DigitalTrace — Browser History Analyzer

A full-stack web application that turns a Chrome/Edge browser-history CSV export into a private analytics dashboard: total visits, unique domains, top websites, category breakdowns, daily/weekly/monthly trends, hourly activity, searchable history and recent activity.

Built with **React + Vite**, **Node.js + Express** and **PostgreSQL (Neon in production)** for a Full Stack Development course project.

> **Project status:** live in production at **https://digitaltrace-course.vercel.app** — React frontend, Express API and Neon PostgreSQL verified end to end.

---

## Features

| Area | What works |
|---|---|
| Authentication | Register, login, JWT sessions, bcrypt password hashing, remember-me, show/hide password, working logout |
| CSV import | Chrome/Edge CSV upload, flexible column names, six timestamp formats, row-level validation, transaction-safe import |
| Duplicate handling | Exact duplicate visits are skipped (`user_id + URL + visit_time`), with an import report |
| Dashboard | Real totals, unique domains, upload count, top domain, daily/weekly/monthly line chart, category doughnut, top-domain bar chart, hourly chart, recent activity |
| History | Server-side search, date filters, 25-row pagination, category and visit-count badges |
| Analytics | Daily/weekly/monthly trend, category split, top domains, hourly activity, full domain breakdown table |
| Profile | View account details, update display name, switch dark/light theme, log out |
| Security | User-scoped queries, JWT middleware, login rate limiting, Helmet, CORS allow-list, 10 KB JSON limit, 4 MB CSV limit |
| Responsive UI | Desktop split-screen auth, mobile single-column auth, adaptive sidebar/navigation, responsive charts and tables |

No dashboard statistic is hardcoded. Every number and chart is computed from PostgreSQL rows belonging to the signed-in user.

---

## Tech stack

**Frontend** — React 19, Vite 8, React Router 7, Axios, Chart.js (`react-chartjs-2`), lucide-react, hand-written CSS with a dark/light theme.

**Backend** — Node.js 18+, Express 5, PostgreSQL (`pg`), JWT (`jsonwebtoken`), bcrypt, Multer, csv-parser, Helmet, CORS, express-rate-limit.

**Database** — PostgreSQL 17 (tested) / Neon PostgreSQL (production). Tables: `users`, `uploaded_files`, `domains`, `website_categories`, `browser_history`.

```
React SPA (5173)
   │  Axios + JWT
   ▼
Express API (5000)  ── shared app for local + Vercel
   │  pg connection pool (SSL)
   ▼
PostgreSQL / Neon
   ├── users
   ├── uploaded_files
   ├── domains ── website_categories
   └── browser_history
```

---

## Project structure

```
DigitalTrace/
├── api/index.js                  Vercel serverless entry (exports Express app)
├── backend/
│   ├── app.js                    Express app (routes, security, errors)
│   ├── server.js                 Local HTTP listener
│   ├── config/
│   │   ├── db.js                 PostgreSQL pool
│   │   └── pgConfig.js           Connection + SSL settings
│   ├── middleware/               JWT auth, login limiter, Multer upload
│   ├── routes/                   users, categories, history, analytics
│   ├── scripts/migrate.js        Runs schema + migrations (no psql needed)
│   ├── services/
│   │   ├── csvParser.js          Chromium CSV parser + validation
│   │   └── categoryService.js    URL hostname → category
│   └── test/csvParser.test.js    14 unit tests
├── database/
│   ├── schema.postgres.sql       Current schema + category seed
│   ├── schema.sql                Legacy MySQL schema (kept for reference)
│   └── migrations/               Incremental SQL migrations
├── frontend/
│   ├── public/sample-browser-history.csv
│   └── src/
│       ├── components/           Layout, Sidebar, charts, ProtectedRoute
│       ├── pages/                Login, Register, Dashboard, Analytics,
│       │                         History, Upload, Settings
│       ├── services/             Axios API, auth, history, analytics
│       └── redesign.css          Auth/dashboard redesign styles
├── vercel.json
├── README.md
├── RUNNING_IN_VSCODE.md
├── API_DOCUMENTATION.md
├── DATABASE_DOCUMENTATION.md
└── VIVA_PREPARATION.md
```

---

## Quick start

### 1. Create a Neon database

1. Sign in at <https://neon.tech> and create a project named `digitaltrace`.
2. Open **Dashboard → Connection Details**.
3. Copy the **pooled** connection string (the host contains `-pooler`) and the **direct** connection string.
4. Keep both private — they go only into `backend/.env` and Vercel environment variables.

### 2. Backend

```powershell
cd backend
Copy-Item .env.example .env
notepad .env
```

Fill in:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://...-pooler.../digitaltrace?sslmode=require
DIRECT_URL=postgresql://.../digitaltrace?sslmode=require
JWT_SECRET=<long random string>
```

Then:

```powershell
npm install
npm run db:migrate
npm run dev
```

Check <http://localhost:5000/api/health> → `{"status":"success","database":"connected"}`.

### 3. Frontend

In a second PowerShell window:

```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>, register an account, then upload `public/sample-browser-history.csv`.

### Local PostgreSQL alternative

Set `PGSSL=disable` and point `DATABASE_URL` at a local database, for example:

```env
DATABASE_URL=postgresql://postgres@127.0.0.1:5432/digitaltrace
PGSSL=disable
```

Create the database once with `createdb digitaltrace`, then run `npm run db:migrate`.

### Root shortcuts

```powershell
npm run install:all     # backend + frontend dependencies
npm run dev:backend
npm run dev:frontend
npm run db:migrate
npm test
npm run build
```

---

## CSV format

The uploader targets **Chromium browser-history CSV exports** (Chrome, Edge, Brave and other Chromium browsers through a history-export extension). Column order does not matter.

| Field | Accepted header examples |
|---|---|
| URL (required) | `URL`, `Website URL`, `Link`, `Address`, `Page URL` |
| Visit Time (required) | `Visit Time`, `Timestamp`, `Last Visit Time`, `Date/Time`, `Visited At` |
| Title (optional) | `Title`, `Page Title`, `Name` |
| Visit Count (optional) | `Visit Count`, `Visits`, `Count` |

Accepted timestamps:

```
2026-11-20 09:17:33          2026-11-20T09:17:33Z
2026/11/20 09:17:33          11/20/2026 9:17:33 AM
20/11/2026 09:17:33          13312345678901234   (Chromium last_visit_time, WebKit µs)
1763716653 / 1763716653000   (Unix seconds / milliseconds)
```

Limits and rules:

- `.csv` only, maximum **4 MB**, maximum **50,000 rows**.
- `http://` / `https://` URLs only; invalid rows reject the whole file with row-level messages.
- Imports are transactional — an upload either fully succeeds or leaves no partial data.
- Exact duplicates are skipped and reported; uploading the same file twice imports nothing new.
- A sample file is at `frontend/public/sample-browser-history.csv` and is downloadable from the Upload page.

---

## Testing

```powershell
cd backend
npm test
```

14 unit tests cover header aliases, BOM handling, US/ISO/Unix/WebKit timestamps, 12-hour midnight/noon, day-first dates, impossible dates, missing columns, invalid URLs with row numbers, and empty/header-only files.

Manual smoke checks used during development:

- register → login → upload 320-row sample → summary totals
- duplicate re-upload → 0 imported, 320 duplicates
- search `github` → 33 matching records
- pagination → 320 records / 13 pages
- weekly/monthly activity
- delete upload → cascade
- logout → token cleared, protected routes redirect

---

## Deployment (Vercel)

The new Vercel project is live — separate from any other project on the account.

1. Import the GitHub repository into Vercel.
2. Framework preset: **Vite**; root directory: repository root.
3. Set environment variables:
   - `DATABASE_URL` — Neon **pooled** URL
   - `JWT_SECRET` — same long random value as local
   - `CLIENT_ORIGIN` — the final `https://<project>.vercel.app` URL
4. Build settings come from `vercel.json`:
   - install: backend + frontend dependencies
   - build: `npm --prefix frontend run build`
   - output: `frontend/dist`
   - `/api/*` → `api/index.js`, all other routes → `index.html`
5. Deploy, then verify `/api/health`, registration, login, CSV upload and analytics on the live URL.

**Live URL:** <https://digitaltrace-course.vercel.app>

Deployment verified on 27 November 2026:

- `/api/health` → `database: connected`
- registration and login through the live API
- 320-row CSV upload through the live API
- live dashboard showing 320 visits, 25 domains and 4 charts
- SPA deep link `/login` returns the app shell
- deleting the verification upload removed its 320 rows without affecting the demo account

The project is a new Vercel project (`digitaltrace-course`) and does not share a project, domain or environment with any other application.

Build settings come from `vercel.json`:

- install: backend + frontend dependencies
- build: `npm --prefix frontend run build`
- output: `frontend/dist`
- `/api/*` → `api/index.js`, all other routes → `index.html`

Environment variables configured in Vercel: `DATABASE_URL` (Neon pooled), `JWT_SECRET`, `CLIENT_ORIGIN`.

The current deployment was created with the Vercel CLI. To enable automatic deployments from the repository, install the Vercel GitHub App for `hassan2002-6/DigitalTrace` and connect it under **Project Settings → Git**.

---

## Documentation

- [RUNNING_IN_VSCODE.md](RUNNING_IN_VSCODE.md) — beginner setup on Windows with VS Code, Git and Node.js
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) — every endpoint, request/response, caller and SQL
- [DATABASE_DOCUMENTATION.md](DATABASE_DOCUMENTATION.md) — tables, relationships, indexes and queries
- [VIVA_PREPARATION.md](VIVA_PREPARATION.md) — 25+ questions with answers and real code references

---

## Security notes

- Passwords are hashed with bcrypt (10 rounds); plain passwords are never stored.
- JWTs expire after one day and are sent as `Authorization: Bearer <token>`.
- Every history and analytics query filters by the authenticated `user_id`.
- Uploads and deletes run in PostgreSQL transactions; deleting a file cascades to its history rows.
- `.env` files are git-ignored. Only `.env.example` placeholders are committed.
- The five-attempt login limit is in-memory; restarting the API resets it.

---

## Credits

Original scaffold, authentication, upload pipeline and dashboard UI by **Mayur Shahani**. Completion work — PostgreSQL migration, Chromium CSV parser, analytics, duplicate detection, profile/logout, responsive redesign, tests and documentation — added for the course submission.
