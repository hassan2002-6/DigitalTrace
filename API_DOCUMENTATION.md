# API Documentation — DigitalTrace

Base URL (local): `http://localhost:5000/api`
Production: `https://<your-vercel-project>.vercel.app/api`

All endpoints are **internal APIs built in this repository**. There are no third-party API integrations. Chart.js is a drawing library, not an API.

---

## 1. Background concepts (viva-ready)

### What is an API?
An **Application Programming Interface** is a defined way for two programs to talk. In this project the React frontend asks the Express backend for data, and the backend answers with JSON.

### What is a REST API?
A **REST API** exposes resources (users, history, analytics) at URLs and uses HTTP methods to act on them:

| Method | Meaning | Example here |
|---|---|---|
| GET | Read data | `GET /api/history` |
| POST | Create or submit data | `POST /api/history/upload` |
| PATCH | Partially update | `PATCH /api/users/profile` |
| DELETE | Remove data | `DELETE /api/history/uploads/3` |

### What is JSON?
**JavaScript Object Notation** is a text format for structured data:

```json
{ "total_visits": 320, "unique_websites": 25 }
```

### What is `fetch()`?
`fetch()` is the browser’s built-in function for HTTP requests:

```js
const response = await fetch('http://localhost:5000/api/analytics/summary', {
    headers: { Authorization: `Bearer ${token}` }
});
const data = await response.json();
```

This project uses **Axios** instead of raw `fetch()`. Axios does the same job but adds a base URL, automatic JSON parsing and interceptors.

### How React talks to the backend
`frontend/src/services/api.js` creates one Axios instance. Every service imports it, so the JWT header and base URL are defined once:

```js
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ||
        (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});
```

### How the backend talks to PostgreSQL
`backend/config/db.js` creates a `pg` pool from `DATABASE_URL`. Routes call `db.query(...)`; the pool handles SSL and connection reuse.

---

## 2. Endpoint index

| # | Method | Endpoint | Auth | Main caller |
|---|---|---|---|---|
| 1 | GET | `/health` | No | Browser / deployment check |
| 2 | POST | `/users/register` | No | `Register.jsx` → `authService.js` |
| 3 | POST | `/users/login` | No | `Login.jsx` → `authService.js` |
| 4 | GET | `/users/profile` | JWT | `Settings.jsx` → `authService.js` |
| 5 | PATCH | `/users/profile` | JWT | `Settings.jsx` → `authService.js` |
| 6 | GET | `/categories` | No | (available for dropdowns) |
| 7 | GET | `/history` | JWT | `History.jsx` → `historyService.js` |
| 8 | GET | `/history/uploads` | JWT | Upload/history management |
| 9 | POST | `/history/upload` | JWT | `Upload.jsx` → `api.post` |
| 10 | DELETE | `/history/uploads/:id` | JWT | Upload management |
| 11 | GET | `/analytics/summary` | JWT | `Dashboard.jsx` |
| 12 | GET | `/analytics/categories` | JWT | `Dashboard.jsx`, `Analytics.jsx` |
| 13 | GET | `/analytics/websites` | JWT | `Dashboard.jsx`, `Analytics.jsx` |
| 14 | GET | `/analytics/domains` | JWT | `Analytics.jsx` |
| 15 | GET | `/analytics/activity` | JWT | `Dashboard.jsx`, `Analytics.jsx` |
| 16 | GET | `/analytics/hourly` | JWT | `Dashboard.jsx`, `Analytics.jsx` |
| 17 | GET | `/analytics/hourly-websites` | JWT | `ActivityChart.jsx` |
| 18 | GET | `/analytics/recent` | JWT | `Dashboard.jsx` |

Authentication header for every JWT endpoint:

```
Authorization: Bearer <token>
```

Errors always return JSON:

```json
{ "message": "Explanation for the user" }
```

CSV validation errors add an array:

```json
{
  "message": "CSV validation failed: 1 row(s) are invalid.",
  "errors": ["Row 2: \"not-a-url\" is not a valid http(s) URL."]
}
```

---

## 3. Authentication endpoints

### POST `/users/register`

- **Purpose:** create an account.
- **Caller:** `frontend/src/pages/Register.jsx` → `registerUser()` in `frontend/src/services/authService.js`.
- **Request body:**

```json
{ "name": "Demo Student", "email": "demo@example.com", "password": "DemoPass123" }
```

- **Validation:** all fields required; name ≤ 100 chars; valid email ≤ 150 chars; password ≥ 8 chars with uppercase, lowercase and a number.
- **Backend:** `backend/routes/userRoutes.js` → bcrypt hash (10 rounds) → insert.
- **SQL:**

```sql
INSERT INTO users (name, email, password)
VALUES ($1, $2, $3);
```

- **Responses:** `201 { "message": "User registered successfully" }`; `400` validation; `409` email exists.
- **Frontend:** success → `/login` with a green success message.

```js
const response = await api.post('/users/register', userData);
return response.data;
```

### POST `/users/login`

- **Purpose:** verify credentials and issue a JWT.
- **Caller:** `Login.jsx` → `loginUser()`.
- **Request:**

```json
{ "email": "demo@example.com", "password": "DemoPass123" }
```

- **Backend:** `userRoutes.js`; rate-limited to 5 attempts per 15 minutes; `bcrypt.compare`; signs `{ id, email }` with `JWT_SECRET`, expiry `1d`.
- **SQL:**

```sql
SELECT id, name, email, password
FROM users
WHERE LOWER(email) = LOWER($1);
```

- **Response:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "1", "name": "Demo Student", "email": "demo@example.com" }
}
```

- **Frontend:** stores the token in `localStorage` when “Remember me” is checked, otherwise `sessionStorage`, then navigates to `/`.
- **Errors:** `400` missing fields; `401` wrong credentials; `429` too many attempts.

```js
const response = await loginUser({ email, password });
const target = remember ? localStorage : sessionStorage;
target.setItem('token', response.token);
```

### GET `/users/profile`

- **Purpose:** load the signed-in account.
- **Caller:** `Settings.jsx` → `getUserProfile()`.
- **SQL:** `SELECT id, name, email, created_at FROM users WHERE id = $1;`
- **Response:** `{ "id": "1", "name": "...", "email": "...", "created_at": "..." }`
- **Frontend:** account card, avatar initial, “Member since” date.

### PATCH `/users/profile`

- **Purpose:** update the display name.
- **Request:** `{ "name": "New Name" }`
- **SQL:** `UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email, created_at;`
- **Response:** `{ "message": "Profile updated successfully", "user": { ... } }`
- **Frontend:** saves the form and shows a green confirmation.

### Logout

There is no server endpoint, because JWT is stateless. `Settings.jsx` removes the token from both storages and navigates to `/login`. The Axios response interceptor also clears the session automatically on any `401`.

---

## 4. History endpoints

### GET `/history`

- **Purpose:** paginated, searchable, date-filtered browsing history for the current user.
- **Caller:** `History.jsx` → `getBrowsingHistory(params)`.
- **Query parameters:**

| Name | Example | Notes |
|---|---|---|
| `page` | `1` | Default 1 |
| `limit` | `25` | Max 100 |
| `search` | `github` | Matches URL, title or hostname |
| `startDate` | `2026-11-10` | `YYYY-MM-DD` |
| `endDate` | `2026-11-23` | Inclusive |

- **Backend:** `backend/routes/historyRoutes.js`; builds `WHERE` clauses with positional parameters (`$1`, `$2`, …), never string concatenation.
- **SQL (simplified):**

```sql
SELECT bh.id, bh.website_url, bh.page_title, bh.visit_time,
       bh.visit_count, d.hostname, wc.category_name
FROM browser_history bh
LEFT JOIN domains d ON bh.domain_id = d.id
LEFT JOIN website_categories wc ON d.category_id = wc.id
WHERE bh.user_id = $1
  AND bh.visit_time >= $2::date
  AND bh.visit_time < ($3::date + INTERVAL '1 day')
ORDER BY bh.visit_time DESC, bh.id DESC
LIMIT $4 OFFSET $5;
```

- **Response:**

```json
{
  "records": [
    {
      "id": "1",
      "website_url": "https://www.google.com/search?q=mysql+join+examples",
      "page_title": "mysql join examples - Google Search",
      "visit_time": "2026-11-23 23:38:02",
      "visit_count": 1,
      "hostname": "google.com",
      "category_name": "Technology"
    }
  ],
  "pagination": { "page": 1, "limit": 25, "total": 320, "totalPages": 13 }
}
```

- **Frontend:** table rows, total count, “Page X of Y”, search debounce and date buttons.

### GET `/history/uploads`

- **Purpose:** list uploaded files with import statistics.
- **SQL:** `SELECT id, file_name, file_type, upload_date, status, row_count, visit_count, duplicate_count FROM uploaded_files WHERE user_id = $1 ORDER BY upload_date DESC;`
- **Response:** array of upload objects.
- **Frontend:** used for upload management/deletion.

### POST `/history/upload`

- **Purpose:** parse and import a Chromium CSV.
- **Caller:** `Upload.jsx` (direct `api.post` because it sends `FormData`).
- **Request:** `multipart/form-data` with field `file`.
- **Frontend code:**

```js
const formData = new FormData();
formData.append('file', selectedFile);
const response = await api.post('/history/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
```

- **Backend processing:**
  1. Multer stores the file in memory, 5 MB max, `.csv` only.
  2. `backend/services/csvParser.js` detects headers, parses timestamps, validates URLs and collects row errors.
  3. Transaction starts.
  4. Each hostname is inserted into `domains` with `ON CONFLICT (hostname) DO UPDATE`.
  5. History rows are inserted in chunks with `ON CONFLICT (user_id, website_url, visit_time) DO NOTHING`, so duplicates are skipped.
  6. `uploaded_files` is updated with row, visit and duplicate counts.
  7. Commit.
- **SQL (core):**

```sql
INSERT INTO domains (hostname, category_id)
VALUES ($1, $2)
ON CONFLICT (hostname)
DO UPDATE SET category_id = COALESCE(domains.category_id, EXCLUDED.category_id)
RETURNING id;

INSERT INTO browser_history
    (upload_id, user_id, domain_id, website_url, page_title, visit_time, visit_count)
VALUES (...)
ON CONFLICT (user_id, website_url, visit_time) DO NOTHING
RETURNING visit_count;
```

- **Response:**

```json
{
  "message": "Browser history uploaded successfully",
  "file_id": "5",
  "total_records": 320,
  "imported_records": 320,
  "duplicates": 0,
  "total_visits": 320
}
```

Re-uploading the same file returns `imported_records: 0` and `duplicates: 320`.

- **Frontend:** success message shows rows/imported/duplicates; failures show row-level errors from `errors`.

### DELETE `/history/uploads/:id`

- **Purpose:** delete one upload and all its history rows.
- **Backend:** transaction; ownership check with `FOR UPDATE`; delete the upload row; foreign key `ON DELETE CASCADE` removes history.
- **SQL:**

```sql
SELECT id FROM uploaded_files
WHERE id = $1 AND user_id = $2
FOR UPDATE;

DELETE FROM uploaded_files WHERE id = $1;
```

- **Responses:** `200`, `400` invalid ID, `404` not owned/found.

---

## 5. Analytics endpoints

All analytics accept `startDate` and `endDate` (`YYYY-MM-DD`). Every query filters `bh.user_id = $1`.

### GET `/analytics/summary`

- **Purpose:** dashboard KPI cards.
- **SQL:**

```sql
SELECT COALESCE(SUM(bh.visit_count), 0)::int AS total_visits,
       COUNT(DISTINCT bh.domain_id)::int AS unique_websites
FROM browser_history bh
WHERE bh.user_id = $1;

SELECT COUNT(*)::int AS total_files
FROM uploaded_files WHERE user_id = $1;

SELECT d.hostname AS website_url,
       COALESCE(SUM(bh.visit_count), 0)::int AS total_visits
FROM browser_history bh
JOIN domains d ON bh.domain_id = d.id
WHERE bh.user_id = $1
GROUP BY d.hostname
ORDER BY total_visits DESC
LIMIT 1;
```

- **Response:** `{ total_visits, unique_websites, total_files, most_visited_website }`.

### GET `/analytics/categories`

- **Purpose:** doughnut chart of categories.
- **SQL:** joins `domains` → `website_categories`, groups by category, sums `visit_count`.
- **Response:** `[{ "category_name": "Technology", "total_visits": 93 }]`.

### GET `/analytics/websites`

- **Purpose:** top-domain bar chart.
- **SQL:** groups by `d.hostname`, orders by summed visits.
- **Response:** `[{ "website_url": "github.com", "total_visits": 33 }]`.

### GET `/analytics/domains`

- **Purpose:** domain breakdown table with category and URL count.
- **SQL:**

```sql
SELECT d.hostname,
       COALESCE(wc.category_name, 'Uncategorized') AS category_name,
       COUNT(DISTINCT bh.website_url)::int AS unique_urls,
       COALESCE(SUM(bh.visit_count), 0)::int AS total_visits
FROM browser_history bh
JOIN domains d ON bh.domain_id = d.id
LEFT JOIN website_categories wc ON d.category_id = wc.id
WHERE bh.user_id = $1
GROUP BY d.hostname, wc.category_name
ORDER BY total_visits DESC;
```

- **Frontend:** `Analytics.jsx` renders the top 15 rows.

### GET `/analytics/activity?period=daily|weekly|monthly`

- **Purpose:** trend chart.
- **Backend:** maps the period to a PostgreSQL unit (`day`, `week`, `month`) and validates the whitelist.
- **SQL:**

```sql
SELECT to_char(date_trunc($2::text, bh.visit_time), 'YYYY-MM-DD') AS bucket,
       COALESCE(SUM(bh.visit_count), 0)::int AS total_visits
FROM browser_history bh
WHERE bh.user_id = $1
GROUP BY 1
ORDER BY 1;
```

- **Response:** `{ "period": "weekly", "buckets": [{ "bucket": "2026-11-09", "total_visits": 134 }] }`.

### GET `/analytics/hourly`

- **Purpose:** hour-of-day distribution.
- **SQL:** `EXTRACT(HOUR FROM bh.visit_time)::int`, grouped and ordered.
- **Response:** `[{ "activity_hour": 0, "total_visits": 3 }]`.

### GET `/analytics/hourly-websites`

- **Purpose:** tooltip detail for the hourly chart.
- **SQL:** groups by hour and hostname; the frontend filters by the hovered hour.

### GET `/analytics/recent?limit=5`

- **Purpose:** latest visits panel.
- **SQL:** same joins as history, `ORDER BY visit_time DESC LIMIT $2`.
- **Frontend:** `Dashboard.jsx` renders five rows with hostname, title, category and time.

---

## 6. Health endpoint

### GET `/health`

Runs `SELECT 1` through the pool.

- **Success:** `200 { "status": "success", "message": "Backend server is working", "database": "connected" }`
- **Database down:** `503 { "status": "error", "database": "unavailable" }`

This is the first endpoint to check after deployment.

---

## 7. Internal vs external APIs

| Type | Meaning | In this project |
|---|---|---|
| Internal API | Endpoints we wrote and host | All 18 routes above |
| External API | A third-party service we call | **None** |

The app does not call a weather, AI, payment or maps API. Charts are rendered locally by Chart.js from our own database results.

---

## 8. Full request example

```powershell
# 1. Login and copy the token
$login = Invoke-RestMethod -Method Post `
  -Uri http://localhost:5000/api/users/login `
  -ContentType "application/json" `
  -Body '{"email":"demo@digitaltrace.test","password":"DemoPass123"}'

# 2. Use the token
$headers = @{ Authorization = "Bearer $($login.token)" }

Invoke-RestMethod -Uri "http://localhost:5000/api/analytics/summary" -Headers $headers

# 3. Upload a CSV
curl.exe -H "Authorization: Bearer $($login.token)" `
  -F "file=@frontend/public/sample-browser-history.csv;type=text/csv" `
  http://localhost:5000/api/history/upload
```
