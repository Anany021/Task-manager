# Team Task Manager (MERN)

A full-stack web app where users sign up, create projects, add team members, assign tasks, and track progress on a dashboard. Role-based access (`admin` / `member`), JWT authentication via HTTP-only cookies, and MongoDB Atlas as the database.

**Stack:** MongoDB · Express · React (Vite) · Node.js

---

## 1. Features

- **Authentication** — Signup / login / logout with JWT in HTTP-only cookies
- **Role-based access control** — `admin` (sees everything) and `member` (sees only their projects)
- **Projects** — Create, update, delete; add members; archive
- **Tasks** — Create, assign, set priority + due date, change status (`todo` → `in_progress` → `done`)
- **Dashboard** — Counts by status, my tasks, overdue tasks, recent activity
- **Validations & relationships** — express-validator on every write route, Mongoose refs between User ↔ Project ↔ Task
- **REST API** — Cleanly versioned under `/api/...`

---

## 2. Folder structure

```
mern-task-manager/
├── README.md
├── .gitignore
├── server/                # Express + Mongoose API (port 5000)
│   ├── package.json
│   ├── railway.json
│   ├── .env.example
│   └── src/
│       ├── server.js
│       ├── config/db.js
│       ├── models/        # User.js, Project.js, Task.js
│       ├── controllers/   # auth, project, task, dashboard, user
│       ├── routes/
│       ├── middleware/    # auth (JWT), role (RBAC)
│       └── utils/         # cookie helpers, seed script
└── client/                # React (Vite) frontend (port 5173)
    ├── package.json
    ├── railway.json
    ├── vite.config.js
    ├── .env.example
    ├── index.html
    └── src/
        ├── main.jsx, App.jsx
        ├── api/axios.js
        ├── context/AuthContext.jsx
        ├── components/Navbar.jsx
        ├── pages/         # Login, Signup, Dashboard, Projects, ProjectDetail
        └── styles/main.css
```

---

## 3. Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 18+ | `node --version` |
| npm | 9+ | comes with Node |
| MongoDB | Atlas account or local install | you said you have a Mongo URI ready |
| Git | any | for pushing to GitHub |

---

## 4. Run locally

You'll have **three terminals**: one for backend, one for frontend, one for the seed script (run once).

### 4.1 Clone / unzip

If I already created this folder for you, skip ahead. Otherwise:

```bash
git clone https://github.com/<your-username>/mern-task-manager.git
cd mern-task-manager
```

### 4.2 Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Open `server/.env` and fill in:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<USER>:<PASS>@<CLUSTER>.mongodb.net/taskmanager?retryWrites=true&w=majority
JWT_SECRET=<paste a long random string here>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Generate a strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Seed sample data (optional but recommended for first run):

```bash
npm run seed
```

This wipes the DB and creates:
- Admin: `admin@example.com` / `admin123`
- Member: `member@example.com` / `member123`
- A sample project + 3 tasks (one of them overdue, on purpose)

Start the API:

```bash
npm run dev
# → Server running on port 5000
```

Sanity check: `curl http://localhost:5000/api/health` should return `{"status":"ok",...}`.

### 4.3 Frontend setup

In a new terminal:

```bash
cd client
npm install
cp .env.example .env
```

`client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start Vite:

```bash
npm run dev
# → Local: http://localhost:5173
```

Open `http://localhost:5173`, log in with the seed credentials.

### 4.4 Common local errors

| Symptom | Fix |
| --- | --- |
| `MONGO_URI is not set` | You forgot to copy `.env.example` to `.env`. |
| `MongoServerError: bad auth` | Wrong username/password in `MONGO_URI`. |
| `MongooseServerSelectionError` | Whitelist your IP in MongoDB Atlas → Network Access → Add IP `0.0.0.0/0` for development. |
| Browser logs `CORS error` / `withCredentials` | Ensure `CLIENT_URL` in `server/.env` exactly matches the URL the frontend is on (incl. http/https and port). |
| `Not authenticated` after login | Backend isn't sending cookies. Check `withCredentials: true` in axios and CORS `credentials: true` (already set). |

---

## 5. Push to GitHub

> **Already done by me locally:** `git init` + first commit (no remote yet).
>
> You only need steps 5.2 onward.

### 5.1 (If starting fresh) initialize git

```bash
cd mern-task-manager
git init -b main
git add .
git commit -m "feat: initial MERN task manager scaffold"
```

### 5.2 Create an empty repo on GitHub

1. Go to <https://github.com/new>
2. Name: `mern-task-manager` (or anything)
3. **Do not** add a README, .gitignore, or license (the local repo already has them)
4. Click **Create repository**

### 5.3 Add the remote and push

GitHub will show you exact commands. They look like this:

```bash
git remote add origin https://github.com/<your-username>/mern-task-manager.git
git branch -M main
git push -u origin main
```

If you use SSH instead of HTTPS:

```bash
git remote add origin git@github.com:<your-username>/mern-task-manager.git
git push -u origin main
```

### 5.4 Verify nothing secret got pushed

Open your repo on GitHub and confirm **`.env` files are NOT visible**. Only `.env.example` should appear. The provided `.gitignore` already blocks `.env`, but double-check.

If you ever accidentally commit a real `.env`:

```bash
git rm --cached server/.env client/.env
git commit -m "chore: remove leaked env files"
git push
# then ROTATE the leaked secrets (Mongo password, JWT secret) immediately
```

---

## 6. Deploy on Railway

Railway can host both the backend and frontend as **separate services** in the same project. Free trial covers the basics.

### 6.1 One-time setup

1. Sign up at <https://railway.app> (use GitHub login — easiest).
2. From the dashboard click **+ New Project** → **Deploy from GitHub repo** → pick `mern-task-manager`.
3. Railway will ask which folder to deploy. Pick **server** for the first service. (If it doesn't ask, you'll set it in step 6.2.)

### 6.2 Backend service (server/)

After Railway creates the first service:

1. **Settings → Service Settings → Root Directory**: set to `server`
2. **Settings → Networking → Generate Domain**: click to get a public URL like
   `https://mern-task-manager-server-production.up.railway.app`
3. **Variables tab → New Variable**, add each of these (paste your real values):

   | Key | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | your Atlas URI |
   | `JWT_SECRET` | the long random string |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | (fill in after creating frontend in 6.3) |

   > Don't set `PORT` — Railway injects it automatically and the code already uses `process.env.PORT`.

4. **Deployments → Trigger redeploy**. After a minute the build logs should end with `Server running on port …`.
5. Test: `curl https://<your-server>.up.railway.app/api/health` → should return `{"status":"ok",…}`.

### 6.3 Frontend service (client/)

Inside the same Railway project click **+ New** → **GitHub Repo** → pick the same repo again.

1. **Settings → Service Settings → Root Directory**: set to `client`
2. **Settings → Networking → Generate Domain** → copy the resulting URL (e.g. `https://mern-task-manager-client-production.up.railway.app`)
3. **Variables tab**:

   | Key | Value |
   | --- | --- |
   | `VITE_API_URL` | the **backend** Railway URL from step 6.2.2 (e.g. `https://mern-task-manager-server-production.up.railway.app`) |

4. **Redeploy**. The build runs `npm install && npm run build`, then `npm run preview` serves the `dist/` folder on `$PORT`.

### 6.4 Wire the two services together

Now go back to the **backend** service:

1. **Variables → CLIENT_URL** = the frontend Railway URL from 6.3.2 (e.g. `https://mern-task-manager-client-production.up.railway.app`).
2. Redeploy the backend so it picks up the new CORS origin.

### 6.5 MongoDB Atlas — allow Railway

Atlas blocks unknown IPs by default. Either:
- **Easy**: Atlas → Network Access → Add IP → `0.0.0.0/0` (allow from anywhere). Fine for a learning project, not for prod.
- **Better**: Use Railway's static egress IPs (Settings → Networking → Static IP) and whitelist them in Atlas.

### 6.6 Cookies in production — important

Because the frontend and backend live on **different domains** on Railway, the browser only sends cookies if:
- Backend response sets `SameSite=None; Secure` — already handled (the code checks `NODE_ENV === 'production'` and switches to `secure: true, sameSite: 'none'`).
- The frontend uses `withCredentials: true` — already set in `client/src/api/axios.js`.
- The backend's `CLIENT_URL` is the **exact** frontend URL (including `https://` and no trailing slash).

If login succeeds but `/api/auth/me` returns 401 from the deployed app, 99% of the time it's `CLIENT_URL` mismatch or Atlas IP block.

### 6.7 Continuous deployment

Both Railway services are linked to your `main` branch. Every `git push` to `main` triggers a redeploy. To deploy a hotfix:

```bash
git checkout -b fix/something
# ... edit ...
git commit -am "fix: something"
git push origin fix/something
# open PR on GitHub, merge to main → Railway redeploys
```

---

## 7. API reference (quick)

All write routes need authentication (cookie set by `/auth/login` or `/auth/signup`).

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/health` | Liveness probe |
| POST | `/api/auth/signup` | `{name, email, password, role?}` |
| POST | `/api/auth/login` | `{email, password}` |
| POST | `/api/auth/logout` | clears cookie |
| GET | `/api/auth/me` | current user |
| GET | `/api/users` | list users (for assignment dropdowns) |
| PUT | `/api/users/:id/role` | **admin only** |
| GET | `/api/projects` | scoped to caller |
| POST | `/api/projects` | `{name, description, members: [userId]}` |
| GET | `/api/projects/:id` | |
| PUT | `/api/projects/:id` | owner / admin |
| DELETE | `/api/projects/:id` | owner / admin (cascades tasks) |
| GET | `/api/tasks?project=...&status=...&assignedTo=me` | |
| POST | `/api/tasks` | `{title, project, assignedTo?, ...}` |
| PUT | `/api/tasks/:id` | members can change status only; owners/admins can change anything |
| DELETE | `/api/tasks/:id` | owner / admin |
| GET | `/api/dashboard` | aggregated stats |

---

## 8. RBAC summary

| Action | Admin | Project owner | Project member | Other users |
| --- | --- | --- | --- | --- |
| View any project | ✅ | own | own (if member) | ❌ |
| Create project | ✅ | ✅ | ✅ | ❌ |
| Edit/delete project | ✅ | ✅ | ❌ | ❌ |
| Create task in project | ✅ | ✅ | ✅ | ❌ |
| Assign task to user | ✅ | ✅ | ❌ | ❌ |
| Change task status (own task) | ✅ | ✅ | ✅ | ❌ |
| Delete task | ✅ | ✅ | ❌ | ❌ |
| Promote/demote user role | ✅ | ❌ | ❌ | ❌ |

---

## 9. Things you might want to add next

- Email verification + password reset
- File attachments on tasks (S3 / Cloudinary)
- Comments / activity log per task
- Real-time updates with Socket.io
- Unit + integration tests (Jest + Supertest)
- A proper landing page

---

## 10. License

MIT — do whatever you want.
