# Viva Preparation — DigitalTrace

Simple answers with real file paths and code from this repository. Read the question, then say the short answer first; add the code detail only if the teacher asks.

---

## Part A — Project overview

### 1. What is DigitalTrace?
DigitalTrace is a full-stack browser-history analyzer. A user uploads a Chrome/Edge history CSV, the backend parses and stores it in PostgreSQL, and the React dashboard shows visits, unique domains, top websites, categories, daily/weekly/monthly trends, hourly activity and searchable history.

### 2. Why did you build it?
To practise a complete full-stack workflow — React UI, REST API, authentication, file upload, CSV parsing, a relational database and cloud deployment — using a problem that produces useful visual analytics instead of another to-do app.

### 3. Which part is the “full stack”?
- Frontend: `frontend/` (React + Vite)
- Backend: `backend/` (Express REST API)
- Database: PostgreSQL / Neon (`database/schema.postgres.sql`)
- Deployment: Vercel (`vercel.json`, `api/index.js`)

### 4. What are the main features?
Registration/login, JWT sessions, CSV upload and validation, duplicate detection, dashboard KPIs, charts, history search/pagination, domain analytics, profile update, dark/light theme and logout.

### 5. What is CRUD in your project?
- **Create:** register an account, upload a CSV (`POST /api/history/upload`)
- **Read:** dashboard, history, analytics (`GET` endpoints)
- **Update:** change display name (`PATCH /api/users/profile`)
- **Delete:** remove an upload and its rows (`DELETE /api/history/uploads/:id`)

---

## Part B — React and the frontend

### 6. What is React?
React is a JavaScript library for building user interfaces from reusable components. It updates the page efficiently when state changes, without reloading the browser.

### 7. Where is React used in this project?
`frontend/src/` contains the whole UI. `main.jsx` mounts `<App />`, and `App.jsx` defines the routes.

```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
);
```

### 8. What is a component?
A component is a reusable function that returns JSX. Example: `frontend/src/pages/Login.jsx`, `Dashboard.jsx`, `History.jsx`, and chart components in `frontend/src/components/ActivityChart.jsx`.

### 9. Why did you use Vite?
Vite is the development server and build tool. It gives fast hot reload during development and produces an optimised `frontend/dist` bundle for production.

### 10. How does routing work?
React Router 7 is configured in `frontend/src/App.jsx`:

```jsx
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />

<Route element={<ProtectedRoute />}>
  <Route element={<Layout theme={theme} setTheme={setTheme} />}>
    <Route path="/" element={<Dashboard />} />
    <Route path="/history" element={<HistoryPage />} />
    <Route path="/analytics" element={<Analytics />} />
    <Route path="/upload" element={<Upload />} />
    <Route path="/settings" element={<Settings ... />} />
  </Route>
</Route>
```

### 11. What is `useState` and where is it used?
`useState` stores changing values. In `History.jsx` it stores records, page number, search text and loading/error state.

```jsx
const [records, setRecords] = useState([]);
const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
```

### 12. What is `useEffect` and where is it used?
`useEffect` runs side effects such as API calls when the component loads or a dependency changes. `Dashboard.jsx` fetches all dashboard data when the date range or period changes.

```jsx
useEffect(() => {
  fetchDashboardData();
  return () => { cancelled = true; };
}, [appliedDates, period]);
```

### 13. What is Axios?
Axios is a promise-based HTTP client. The project creates one instance in `frontend/src/services/api.js` with a base URL and a JWT request interceptor.

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')
});
```

### 14. How does React communicate with the backend?
A component calls a service function, the service uses Axios, and the backend returns JSON.

```js
// frontend/src/services/analyticsService.js
export const getDashboardSummary = async (params = {}) => {
  const response = await api.get('/analytics/summary', { params });
  return response.data;
};
```

```jsx
// Dashboard.jsx
const summaryData = await getDashboardSummary({ period, startDate, endDate });
setSummary(summaryData);
```

### 15. What is `fetch()`? Did you use it?
`fetch()` is the browser’s built-in HTTP function. This project uses Axios, but the idea is identical:

```js
const res = await fetch('/api/analytics/summary', {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await res.json();
```

### 16. What is JSON?
A text format for data. Example response from `/api/analytics/summary`:

```json
{ "total_visits": 320, "unique_websites": 25, "total_files": 2,
  "most_visited_website": { "website_url": "github.com", "total_visits": 33 } }
```

### 17. How do the charts work?
`Dashboard.jsx` and `Analytics.jsx` fetch arrays from the API and pass them to `frontend/src/components/ActivityChart.jsx`. Chart.js renders line, doughnut and bar charts from those arrays. No chart data is hardcoded.

### 18. How do search and pagination work?
`History.jsx` sends `page`, `limit`, `search`, `startDate` and `endDate` to `GET /api/history`. The backend builds a parameterised `WHERE` clause, runs a count query and a `LIMIT/OFFSET` query, then returns:

```json
{ "records": [], "pagination": { "page": 2, "limit": 25, "total": 320, "totalPages": 13 } }
```

The search box is debounced with a 350 ms timer so every keystroke does not hit the API.

### 19. How is the frontend responsive?
CSS in `App.css` and `redesign.css` uses media queries at 1100/980/800/600 px. The auth page becomes one column on mobile, the sidebar navigation becomes a 3×2 grid, charts resize, and tables scroll horizontally.

---

## Part C — Backend

### 20. What is Express?
Express is a minimal Node.js web framework. It defines routes, middleware, request parsing and error handling.

```js
const app = express();
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use('/api/users', userRoutes);
app.use('/api/history', historyRoutes);
```

### 21. What is the backend structure?
- `backend/app.js` — Express app, middleware, route mounting, error handler
- `backend/server.js` — starts the HTTP server locally
- `backend/routes/` — HTTP endpoints
- `backend/services/` — CSV parser and category mapping
- `backend/middleware/` — JWT auth, login limiter, Multer upload
- `backend/config/` — PostgreSQL pool and connection settings

### 22. What is middleware?
A function that runs between the request and the route handler. Examples:
- `authMiddleware` checks the JWT.
- `loginLimiter` blocks more than five login attempts per 15 minutes.
- `upload.single('file')` parses multipart form data.
- The final error handler converts Multer and JSON errors into clean responses.

### 23. What is a REST API?
An API that exposes resources through URLs and HTTP methods. Examples from this project:

| Method | URL | Action |
|---|---|---|
| GET | `/api/history` | read history |
| POST | `/api/history/upload` | create an import |
| PATCH | `/api/users/profile` | update profile |
| DELETE | `/api/history/uploads/2` | delete an upload |

### 24. What is the difference between GET and POST?
- `GET` reads data and puts parameters in the query string (`?page=2`); it should not change data.
- `POST` sends a body to create something, such as a login request or a CSV upload.

### 25. How does the backend validate input?
- Registration validates types, name/email lengths, email pattern and password strength.
- CSV upload validates extension, MIME type, size, headers, URL protocol, timestamps and row limits.
- SQL uses positional parameters (`$1`, `$2`), which prevents SQL injection.

### 26. How does error handling work?
Routes return `400` for validation, `401` for auth, `404` for missing/not-owned resources, `409` for duplicate email, `413` for too-large files and `500` for unexpected errors. `backend/app.js` has a central error handler.

### 27. What is CORS?
CORS controls which frontend origins may call the API. `backend/app.js` reads `CLIENT_ORIGIN` and allows only those origins:

```js
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
```

---

## Part D — Authentication and security

### 28. How does authentication work?
1. User registers; bcrypt hashes the password.
2. Login compares the password with `bcrypt.compare`.
3. The backend signs a JWT containing `{ id, email }` with a 1-day expiry.
4. The frontend stores the token and Axios attaches it as `Authorization: Bearer <token>`.
5. `authMiddleware` verifies the token before protected routes run.

```js
const token = jwt.sign({ id: user.id, email: user.email },
  process.env.JWT_SECRET, { expiresIn: '1d' });
```

### 29. Why bcrypt?
bcrypt is a slow, salted hashing algorithm designed for passwords. Even if the database leaks, the original passwords are not directly recoverable.

### 30. How are protected pages enforced?
`frontend/src/components/ProtectedRoute.jsx` checks for a token and redirects to `/login` if none exists. On the backend, `authMiddleware` verifies the signature; the frontend check is only a convenience, not the security boundary.

### 31. What happens when a token expires?
The Axios response interceptor catches `401`, clears both storages and redirects to `/login`.

### 32. Do all members see the same data? How are accounts kept separate?
All read endpoints intentionally return the combined team dataset, so every registered member sees all uploads, charts and history. Login accounts remain separate: the JWT identifies who is asking, each upload records its owner, and only the owner can delete their file.

---

## Part E — Database

### 33. Why PostgreSQL instead of MySQL?
The original project used MySQL. PostgreSQL was chosen for Neon hosting, stronger SQL features (`date_trunc`, `ON CONFLICT`, `RETURNING`) and reliable transactions. The migration changed the driver and queries, not the application design.

### 34. What tables exist?
`users`, `uploaded_files`, `domains`, `website_categories`, `browser_history`. Full columns and types are in `DATABASE_DOCUMENTATION.md`.

### 35. What are the relationships?
- User → many uploads
- Upload → many history rows (cascade delete)
- Domain → many history rows
- Category → many domains

### 36. How does the backend talk to Neon?
`backend/config/db.js` creates a `pg` pool using `DATABASE_URL` (the pooled Neon URL) with SSL. Routes call `db.query(...)` or take a client for transactions. Neon credentials live only in `.env` / Vercel environment variables.

### 37. Show a real SQL query from the project.
Summary query in `backend/routes/analyticsRoutes.js` (team-wide):

```sql
SELECT COALESCE(SUM(bh.visit_count), 0)::int AS total_visits,
       COUNT(DISTINCT bh.domain_id)::int AS unique_websites
FROM browser_history bh;
```

### 38. How do weekly and monthly analytics work?
The API accepts `?period=weekly|monthly`, whitelists the value, maps it to a PostgreSQL unit and calls:

```sql
SELECT to_char(date_trunc($1::text, bh.visit_time), 'YYYY-MM-DD') AS bucket,
       SUM(bh.visit_count)::int AS total_visits
FROM browser_history bh
GROUP BY 1 ORDER BY 1;
```

### 39. What is a transaction and where is it used?
A transaction groups queries so they succeed or fail together. Uploads use `BEGIN … COMMIT/ROLLBACK` for the upload record, domains and history rows. Deletes also use a transaction.

### 40. How are duplicate visits handled?
`browser_history` has a unique index on `(user_id, website_url, visit_time)`. Inserts use:

```sql
ON CONFLICT (user_id, website_url, visit_time) DO NOTHING
RETURNING visit_count;
```

The API reports how many rows were imported and how many were duplicates.

---

## Part F — CSV processing

### 41. How does CSV upload work end to end?
`Upload.jsx` sends `FormData` → Multer stores it in memory → `csv-parser` converts rows to objects → `backend/services/csvParser.js` maps headers, validates URLs/timestamps and returns records → the route inserts the upload, domains and history in one transaction → the frontend shows rows/imported/duplicates.

### 42. Which timestamp formats are supported?
ISO (`2026-11-20T09:17:33Z`), `YYYY-MM-DD HH:mm:ss`, `YYYY/MM/DD`, US `MM/DD/YYYY hh:mm:ss AM/PM`, day-first when unambiguous, Unix seconds/milliseconds and Chromium WebKit microseconds (`last_visit_time`).

### 43. Why store `TIMESTAMP` without time zone?
Browser exports contain wall-clock times. Storing them as `TIMESTAMP` preserves the exact time the user saw, instead of shifting it by the server’s timezone. The `pg` driver returns it as a string so the browser can display it directly.

### 44. What happens if one CSV row is invalid?
The parser collects errors with row numbers. The API returns `400` with `{ message, errors }` and the whole file is rejected — no partial import. Example: `Row 2: "not-a-url" is not a valid http(s) URL.`

---

## Part G — Deployment and workflow

### 45. How is the app deployed on Vercel?
`vercel.json` builds `frontend/dist`, routes `/api/*` to `api/index.js` (which exports the Express app) and sends all other paths to `index.html` for React Router. Environment variables `DATABASE_URL`, `JWT_SECRET` and `CLIENT_ORIGIN` are set in the Vercel dashboard. The live project is <https://digitaltrace-course.vercel.app>.

### 46. Why does `/api/index.js` exist?
Vercel runs serverless functions. `api/index.js` requires `backend/app.js` and exports the Express app, so the same routes work locally and in production without duplicating backend code.

### 47. What are environment variables and why are they used?
They keep secrets and per-environment settings out of Git: database URL, JWT secret and allowed frontend origin. `.env` is ignored; `.env.example` documents the names with placeholders.

### 48. What is the Git workflow?
Work is committed to the independent public repository `hassan2002-6/DigitalTrace`. The original Mayur repository is kept only as a local `upstream` reference with pushes disabled; the GitHub project has no fork parent. Commit messages describe the change; secrets are checked before every push.

### 49. What was the hardest part?
Three things:
- migrating MySQL-specific SQL (`DATE_FORMAT`, `HOUR`, `?` placeholders) to PostgreSQL;
- keeping uploaded wall-clock times correct across timezones;
- making duplicate imports safe with a unique index and `ON CONFLICT` inside a chunked transaction.

### 50. What would you improve next?
- API integration tests against a temporary database.
- A password-reset flow and refresh tokens.
- Exporting analytics as CSV/PDF.
- A scheduled cleanup job for old uploads.
- Splitting the frontend bundle to remove the 500 KB chunk warning.

### 51. If two members upload the same visit, is it counted twice?
Yes. The unique index is `(user_id, website_url, visit_time)`, so duplicate suppression is per account, not across the team. If Hassan and Mayur both upload the same browser visit, the shared dashboard counts both because they are two members’ records. The uploader name keeps the source clear, and deleting one member’s file removes only that member’s rows.
