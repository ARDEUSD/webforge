# DeskGuard — Library Occupancy Management System

A real-time desk booking system for libraries. Students check in and out of desks by entering their name and student ID — no login required. Staff get a full admin panel.

## Features

- **50 desks** across 4 zones: Quiet Study, Collaboration Area, PC Lab, Window View
- **Self-service check-in / check-out / step away** — no account needed
- **Auto-release** of "away" desks after 30 minutes
- **Session timers** shown on the interactive floor map
- **Admin panel** with activity log and force-reset controls
- **Auto-refresh** every 10 seconds

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Backend | Express 5 + Node.js |
| Database | PostgreSQL + Drizzle ORM |
| Auth | JWT + bcrypt |
| Package manager | pnpm workspaces |

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- A PostgreSQL database (local or hosted)

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/deskguard.git
cd deskguard
pnpm install
```

### 2. Set environment variables

```bash
cp .env.example .env
# Edit .env and fill in DATABASE_URL and SESSION_SECRET
```

### 3. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

### 4. Seed the database (creates 50 desks + admin user)

```bash
pnpm --filter @workspace/scripts run seed
```

### 5. Run the app

Open two terminals:

```bash
# Terminal 1 — API server (port 8080)
PORT=8080 pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (port 5173)
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/deskguard run dev
```

Then open http://localhost:5173

**Admin login:** username `admin` / password `deskguard2025`

---

## Deploying to Vercel

### Step 1 — Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/deskguard.git
git push -u origin main
```

### Step 2 — Set up a hosted database

Sign up for a free PostgreSQL database:
- [Neon](https://neon.tech) (recommended — Vercel-native, free tier)
- [Supabase](https://supabase.com) (free tier)

Copy the connection string — you'll need it in Step 4.

### Step 3 — Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Vercel detects `vercel.json` automatically — no framework preset needed
4. Click **Deploy**

### Step 4 — Add environment variables

In your Vercel project → **Settings → Environment Variables**, add:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `SESSION_SECRET` | A long random string (run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |

Redeploy after adding variables.

### Step 5 — Seed the production database

Run this once against your production database URL to create tables and seed data:

```bash
DATABASE_URL="your-production-connection-string" pnpm --filter @workspace/db run push
DATABASE_URL="your-production-connection-string" pnpm --filter @workspace/scripts run seed
```

Your app is now live at `https://your-project.vercel.app`.

---

## Project Structure

```
artifacts/
  api-server/        Express API server
    src/
      routes/        API route handlers (desks, auth, admin, activity, stats)
      lib/           Logger, DB helpers
  deskguard/         React frontend (Vite)
    src/
      pages/         Dashboard, LibraryMap, AdminPanel, AdminLogin
      components/    CheckInModal, Sidebar, shared UI
      lib/           API client, utilities
lib/
  db/                Drizzle ORM schema + DB connection
  api-zod/           Shared Zod validation schemas
scripts/
  src/seed.ts        Database seeder (50 desks + admin user)
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/desks` | List all desks with session info |
| GET | `/api/desks/search?q=` | Search by name or student ID |
| GET | `/api/desks/my-desk?studentId=` | Find a student's current desk |
| POST | `/api/desks/:id/checkin` | Check in to a desk |
| POST | `/api/desks/:id/away` | Mark as away |
| POST | `/api/desks/:id/checkout` | Check out |
| GET | `/api/stats` | Occupancy stats |
| GET | `/api/activity` | Recent activity log |
| POST | `/api/auth/login` | Admin login |
| GET | `/api/admin/desks` | Admin: all desks |
| POST | `/api/admin/desks/:id/reset` | Admin: force reset a desk |
| GET | `/api/admin/activity` | Admin: full activity log |
