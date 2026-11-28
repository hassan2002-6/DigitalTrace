# Running DigitalTrace in VS Code (Windows)

This guide is for teammates who have **VS Code, Git and Node.js** but not Hermes. Everything runs with normal PowerShell commands.

---

## 1. Install the prerequisites

| Tool | Check with | If missing |
|---|---|---|
| Node.js (20.19+ or 22.12+) | `node -v` | Install the current LTS from <https://nodejs.org> |
| npm | `npm -v` | Included with Node.js |
| Git | `git --version` | Install from <https://git-scm.com> |
| VS Code | `code --version` | Install from <https://code.visualstudio.com> |

If `code` is not recognised, open VS Code → `Ctrl+Shift+P` → “Shell Command: Install ‘code’ command in PATH”.

---

## 2. Get the repository

The repository is public, so you can clone it directly — no collaborator invitation is needed.

```powershell
git clone https://github.com/hassan2002-6/DigitalTrace.git
cd DigitalTrace
code .
```

---

## Group members: stop here (shared database)

If you are a group member, you do **not** need to create a Neon database, configure a backend, or create any `.env` file. All members share the database hosted by Hassan through the deployed API.

Short page you can follow instead: <https://github.com/hassan2002-6/DigitalTrace/blob/main/MEMBER_SETUP.md>

From the `DigitalTrace` folder:

```powershell
cd frontend
npm install
npm run dev:shared
```

Open <http://localhost:5173> and register your own account. Use `npm run dev:shared`, not `npm run dev`.

The rest of this guide is the **owner/full-stack path** for running the backend with direct database access.

---

## 3. Create the Neon database

1. Go to <https://neon.tech> and sign in.
2. Create a project called `digitaltrace` (choose the region closest to you).
3. Open **Connection Details**.
4. Copy two strings:
   - **Pooled connection** (host contains `-pooler`)
   - **Direct connection**
5. Never commit these strings.

---

## 4. Configure the backend

In VS Code, open a terminal (`Ctrl+Backtick`) and run:

```powershell
cd backend
Copy-Item .env.example .env
notepad .env
```

Paste your values:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/digitaltrace?sslmode=require
DIRECT_URL=postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/digitaltrace?sslmode=require

JWT_SECRET=make_up_a_long_random_value
```

Save and close Notepad.

Install and migrate:

```powershell
npm install
npm run db:migrate
```

You should see:

```
Connected: digitaltrace (PostgreSQL ...)
Applying base schema...
Done. Seeded categories: 8
```

Start the API:

```powershell
npm run dev
```

Leave this terminal running. Test <http://localhost:5000/api/health> in a browser.

---

## 5. Start the frontend (second terminal)

In VS Code: **Terminal → New Terminal**, then:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open <http://localhost:5173>.

Register a new account, then upload `frontend/public/sample-browser-history.csv`.

> If your API is not on port 5000, change `VITE_API_URL` in `frontend/.env`.

---

## 6. Run the tests

Stop the API with `Ctrl+C`, then:

```powershell
cd backend
npm test
```

Expected: `pass 14`, `fail 0`.

You can also build the frontend to check for errors:

```powershell
cd ..\frontend
npm run build
```

---

## 7. Everyday development

**Terminal 1 — backend**

```powershell
cd backend
npm run dev
```

**Terminal 2 — frontend**

```powershell
cd frontend
npm run dev
```

Useful root commands (run from the repository root):

```powershell
npm run install:all
npm run dev:backend
npm run dev:frontend
npm run db:migrate
npm test
npm run build
```

---

## 8. Pull the latest changes

```powershell
cd C:\path\to\DigitalTrace
git pull origin main

cd backend
npm install
npm run db:migrate

cd ..\frontend
npm install
```

Restart both dev servers.

---

## 9. Common problems

| Problem | Cause / fix |
|---|---|
| `DATABASE_URL is not set` | `backend/.env` missing or not saved |
| `password authentication failed` | Wrong user/password in the connection string |
| `relation "users" does not exist` | Run `npm run db:migrate` |
| `ECONNREFUSED localhost:5000` | Backend terminal is not running, or crashed |
| Login page looks like plain HTML | You opened `frontend/index.html` directly. Always use `npm run dev` and open port 5173 |
| CORS error | `CLIENT_ORIGIN` must exactly match the frontend URL (`http://localhost:5173`) |
| 429 on login | Five attempts per 15 minutes; wait or restart the API |
| Port 5000/5173 already in use | Stop the other process or change `PORT` / Vite’s `--port` |
| Upload rejected | Read the red error list; it names the row and the problem |

---

## 10. Important rules

- Never commit `backend/.env` or `frontend/.env`.
- Never paste the Neon connection string into chat, email or a screenshot.
- Do not run `npm run db:migrate` against a database you do not own.
- Commit to your own repository; do not push to another team’s or the original owner’s repository.
