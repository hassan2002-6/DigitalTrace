# Database Documentation — DigitalTrace (PostgreSQL / Neon)

DigitalTrace uses **PostgreSQL** (tested on PostgreSQL 17, production target Neon). The schema is in `database/schema.postgres.sql` and is applied by `backend/scripts/migrate.js`.

---

## 1. Why PostgreSQL

- Relational integrity with foreign keys and cascading deletes.
- Strong aggregate functions (`SUM`, `COUNT DISTINCT`, `date_trunc`) used by the analytics.
- Native `TIMESTAMP` handling for exported browser-history times.
- Neon provides a free serverless PostgreSQL database with connection pooling.
- `ON CONFLICT` makes duplicate suppression a single atomic insert.

The original project used MySQL (`mysql2`). The migration changed the driver, placeholders and date functions; the application structure and UI stayed the same.

---

## 2. Entity relationship diagram

```
users (1) ───< uploaded_files (1) ───< browser_history >─── (1) domains >─── (1) website_categories
   │                                          │
   └──────────────< browser_history ──────────┘   (user_id is denormalised for fast,
                                                   shared team reads; owner kept for delete)
```

- One user has many uploads.
- One upload has many history rows; deleting an upload cascades to its rows.
- One domain has many history rows; a domain belongs to one category.
- History rows also store `user_id` directly. That keeps uploader attribution and owner-only deletion fast, while shared reads join `uploaded_files` → `users` for the display name.

---

## 3. Tables

### `users`

| Column | Type | Rules |
|---|---|---|
| `id` | `BIGSERIAL` | Primary key |
| `name` | `VARCHAR(100)` | Not null |
| `email` | `VARCHAR(150)` | Not null, unique on `LOWER(email)` |
| `password` | `VARCHAR(255)` | bcrypt hash, not null |
| `created_at` | `TIMESTAMPTZ` | Default `NOW()` |

Why a lower-case unique index: `Demo@x.com` and `demo@x.com` must not create two accounts.

```sql
CREATE UNIQUE INDEX uq_users_email ON users (LOWER(email));
```

### `website_categories`

| Column | Type | Rules |
|---|---|---|
| `id` | `SERIAL` | Primary key |
| `category_name` | `VARCHAR(50)` | Unique, not null |

Seeded values: Technology, Entertainment, Education, Social Media, Shopping, News, Productivity, Other.

### `domains`

| Column | Type | Rules |
|---|---|---|
| `id` | `BIGSERIAL` | Primary key |
| `hostname` | `VARCHAR(255)` | Unique, not null (e.g. `github.com`) |
| `category_id` | `INTEGER` | FK → `website_categories(id)`, `ON DELETE SET NULL` |

A domain is created on first sight. `ON CONFLICT (hostname) DO UPDATE SET category_id = COALESCE(domains.category_id, EXCLUDED.category_id)` keeps an existing category if one is already set.

### `uploaded_files`

| Column | Type | Rules |
|---|---|---|
| `id` | `BIGSERIAL` | Primary key |
| `user_id` | `BIGINT` | FK → `users(id)`, cascade delete |
| `file_name` | `VARCHAR(255)` | Original CSV name |
| `file_type` | `VARCHAR(20)` | Default `csv` |
| `upload_date` | `TIMESTAMPTZ` | Default `NOW()` |
| `status` | `VARCHAR(20)` | `Processing`, `Completed` or `No new records` |
| `row_count` | `INTEGER` | Rows in the file |
| `visit_count` | `INTEGER` | Visits actually inserted |
| `duplicate_count` | `INTEGER` | Rows skipped as duplicates |

### `browser_history`

| Column | Type | Rules |
|---|---|---|
| `id` | `BIGSERIAL` | Primary key |
| `upload_id` | `BIGINT` | FK → `uploaded_files(id)`, cascade delete |
| `user_id` | `BIGINT` | FK → `users(id)`, cascade delete |
| `domain_id` | `BIGINT` | FK → `domains(id)`, `ON DELETE SET NULL` |
| `website_url` | `TEXT` | Full URL from the CSV |
| `page_title` | `TEXT` | May be null |
| `visit_time` | `TIMESTAMP` | Wall-clock time from the export |
| `visit_count` | `INTEGER` | Default 1, check `> 0` |
| `created_at` | `TIMESTAMPTZ` | Import timestamp |

`TIMESTAMP` (without time zone) is deliberate: an exported time such as `2026-11-20 09:17:33` is stored exactly as written, instead of being shifted by the server’s timezone. The `pg` driver is configured (`types.setTypeParser(1114, value => value)`) to return that wall-clock string to the API.

---

## 4. Indexes and constraints

| Index / constraint | Purpose |
|---|---|
| `uq_users_email` on `LOWER(email)` | Prevent duplicate accounts |
| `idx_uploaded_files_user` on `(user_id, upload_date DESC)` | Uploader attribution and owner checks |
| `idx_history_user_time` on `(user_id, visit_time DESC)` | Per-user duplicate checks and date ordering |
| `idx_history_upload` on `(upload_id)` | Cascade deletes and upload filtering |
| `idx_history_domain` on `(domain_id)` | Domain joins |
| `uq_history_user_url_time` on `(user_id, website_url, visit_time)` | Exact duplicate suppression |

The unique index is what makes `ON CONFLICT (user_id, website_url, visit_time) DO NOTHING` possible.

---

## 5. Query patterns

### Register

```sql
INSERT INTO users (name, email, password)
VALUES ($1, $2, $3);
```

### Login

```sql
SELECT id, name, email, password
FROM users
WHERE LOWER(email) = LOWER($1);
```

### History with date filter and pagination

```sql
SELECT bh.id, bh.website_url, bh.page_title, bh.visit_time,
       bh.visit_count, d.hostname, u.name AS uploader_name,
       wc.category_name
FROM browser_history bh
INNER JOIN uploaded_files uf ON bh.upload_id = uf.id
INNER JOIN users u ON uf.user_id = u.id
LEFT JOIN domains d ON bh.domain_id = d.id
LEFT JOIN website_categories wc ON d.category_id = wc.id
WHERE bh.visit_time >= $1::date
  AND bh.visit_time < ($2::date + INTERVAL '1 day')
ORDER BY bh.visit_time DESC, bh.id DESC
LIMIT $3 OFFSET $4;
```

Both team members see the same rows; the uploader join supplies the name shown in the table.

The count query uses the same `WHERE` clauses so pagination totals match the rows.

### Summary

```sql
SELECT COALESCE(SUM(bh.visit_count), 0)::int AS total_visits,
       COUNT(DISTINCT bh.domain_id)::int AS unique_websites
FROM browser_history bh;
```

### Daily / weekly / monthly trend

```sql
SELECT to_char(date_trunc($1::text, bh.visit_time), 'YYYY-MM-DD') AS bucket,
       COALESCE(SUM(bh.visit_count), 0)::int AS total_visits
FROM browser_history bh
GROUP BY 1
ORDER BY 1;
```

`$1` is a whitelisted unit: `day`, `week` or `month`.

### Hourly activity

```sql
SELECT EXTRACT(HOUR FROM bh.visit_time)::int AS activity_hour,
       COALESCE(SUM(bh.visit_count), 0)::int AS total_visits
FROM browser_history bh
GROUP BY 1
ORDER BY 1;
```

### Upsert a domain

```sql
INSERT INTO domains (hostname, category_id)
VALUES ($1, $2)
ON CONFLICT (hostname)
DO UPDATE SET category_id = COALESCE(domains.category_id, EXCLUDED.category_id)
RETURNING id;
```

### Insert history with duplicate suppression

```sql
INSERT INTO browser_history
    (upload_id, user_id, domain_id, website_url, page_title, visit_time, visit_count)
VALUES (...)
ON CONFLICT (user_id, website_url, visit_time) DO NOTHING
RETURNING visit_count;
```

`RETURNING visit_count` tells the API exactly how many visits were inserted and lets it report duplicates.

### Delete an upload

```sql
SELECT id FROM uploaded_files
WHERE id = $1 AND user_id = $2
FOR UPDATE;

DELETE FROM uploaded_files WHERE id = $1;
```

`browser_history.upload_id` uses `ON DELETE CASCADE`, so the history rows disappear automatically.

---

## 6. Transactions

Uploads and deletions use explicit transactions:

```js
await client.query('BEGIN');
// insert upload, domains, history
await client.query('COMMIT');
// on error:
await client.query('ROLLBACK');
```

This guarantees that a malformed CSV or a failed insert never leaves a half-imported file.

---

## 7. Shared team read access

Read endpoints intentionally return the combined dataset:

- history: no user filter; joins `uploaded_files` and `users` to show `uploader_name`
- analytics: no user filter; totals and charts cover every member
- uploads: all rows, joined to `users` for `uploader_name` and `can_delete`
- delete: `WHERE id = $1 AND user_id = $2`, so only the original uploader can remove a file

The JWT payload identifies the signed-in account, and `authMiddleware` verifies the signature before any query runs. Login accounts stay separate even though read data is shared. Each upload and history row keeps `user_id` for attribution and owner-only deletion.

---

## 8. Neon setup

1. Create a Neon project and database `digitaltrace`.
2. Copy the **pooled** URL (API) and **direct** URL (migrations).
3. Put them in `backend/.env`:

```env
DATABASE_URL=postgresql://...-pooler.../digitaltrace?sslmode=require
DIRECT_URL=postgresql://.../digitaltrace?sslmode=require
```

4. Run:

```powershell
cd backend
npm run db:migrate
```

The script connects with `DIRECT_URL`, applies `database/schema.postgres.sql`, then any file in `database/migrations/postgres/`, and seeds the eight categories.

Pool settings (`backend/config/pgConfig.js`): SSL enabled, `max` 5 connections, 10-second connection timeout, 30-second idle timeout. On Vercel, keep the pool small because many serverless invocations can run concurrently; Neon’s pooler handles the rest.

---

## 9. Preserving existing data

The previous MySQL database contained 320 browser-history rows. A full MySQL dump was saved before migration:

```
C:\Users\Lenovov\projects\_backups\digitaltrace-mysql-<timestamp>.sql
```

The same 320 rows were imported into PostgreSQL through the normal CSV upload endpoint (`frontend/public/sample-browser-history.csv`) for the demo account, so the current dataset is real database data, not hardcoded values.

To move local PostgreSQL data to Neon later, use `pg_dump`/`pg_restore` with the direct connection string, or re-upload the original CSV through the application.

---

## 10. Common database errors

| Error | Meaning | Fix |
|---|---|---|
| `DATABASE_URL is not set` | `.env` missing | Copy `.env.example` to `.env` |
| `password authentication failed` | Wrong Neon credentials | Recopy the connection string |
| `relation "users" does not exist` | Schema not applied | `npm run db:migrate` |
| `ENOTFOUND` / timeout | Wrong host or paused Neon project | Check Neon dashboard; wake the project |
| `duplicate key value violates unique constraint` | Email already registered | Expected; return 409 |
| `SSL required` | `sslmode` missing | Add `?sslmode=require` |
| `column ... does not exist` | Old schema | Run migrations; check `schema.postgres.sql` |
