# Run DigitalTrace — Group Member Setup

This is the short version for group members. You **do not** need Neon, a database password, a backend terminal, or any `.env` file.

The app you start in VS Code uses the deployed API, which is connected to the shared Neon database. Every member registers a separate login, but all members see the same combined team data with the uploader’s name.

---

## 1. Install these once

| Tool | Version | Check |
|---|---|---|
| Node.js | **20.19+ or 22.12+** (Vite 8 requirement) | `node -v` |
| Git | Any recent version | `git --version` |
| VS Code | Any recent version | `code --version` |

If Node is older, install the current LTS from <https://nodejs.org> and reopen VS Code.

---

## 2. Clone and start

Open **PowerShell** (or the VS Code terminal) and run these four commands:

```powershell
git clone https://github.com/hassan2002-6/DigitalTrace.git
cd DigitalTrace\frontend
npm install
npm run dev:shared
```

Vite prints a local URL, normally:

```
http://localhost:5173
```

Open it in your browser.

> Use **`npm run dev:shared`**. Do **not** use `npm run dev` — that expects a private backend running on port 5000.
>
> On macOS/Linux the path is `cd DigitalTrace/frontend`; the npm commands are the same.

---

## 3. Use the app

1. Click **Create an account** and register with any email/password that meets the rules.
2. Your dashboard will already show history uploaded by the team (the demo dataset is 320 visits). That is expected.
3. Open **Upload Data** and upload:
   ```
   frontend\public\sample-browser-history.csv
   ```
   The Upload page also has a “Download a sample CSV” link.
4. After the upload, the dashboard includes your rows as well and the Team uploads table shows your name next to your file.

---

## 4. What you do NOT need

- ❌ No Neon account
- ❌ No `DATABASE_URL` or `DIRECT_URL`
- ❌ No `backend\.env`
- ❌ No backend terminal
- ❌ No database password from Hassan
- ❌ No deployment

Only the frontend runs on your computer. The API and database stay on the deployed server.

---

## 5. Common problems

| Problem | Fix |
|---|---|
| `node: command not found` | Install Node.js and reopen the terminal/VS Code |
| `Vite requires Node.js version 20.19+` | Install the current Node LTS, then run `npm install` again |
| `npm run dev:shared` missing | Make sure you are inside the `frontend` folder |
| Blank page or API error | Wait 5–10 seconds for the hosted API to wake up, then refresh |
| Port 5173 already in use | Vite will offer another port; open the URL it prints |
| Login says “Too many attempts” | Wait 15 minutes, or register a new account |
| `EACCES` / permission error on install | Reopen VS Code as your normal user; do not use OneDrive-synced folders |

---

## 6. Updating later

```powershell
cd DigitalTrace
git pull origin main
cd frontend
npm install
npm run dev:shared
```

---

## 7. Shared data and privacy

- Do not create or commit a `backend/.env`.
- Do not ask for or share the Neon connection string.
- The data is shared intentionally: every member sees the combined dashboard and history.
- Login accounts stay separate, and each CSV shows who uploaded it. Only the uploader can delete their own file.
- The repository is public: <https://github.com/hassan2002-6/DigitalTrace>

For the owner/full-stack setup, see [README.md](README.md) or [RUNNING_IN_VSCODE.md](RUNNING_IN_VSCODE.md).
