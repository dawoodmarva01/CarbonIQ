# CarbonIQ — Deployment Guide

This deploys the full stack on **100% free tiers**: Vercel (frontend), Render (backend), Neon (Postgres). Total time: ~20 minutes.

---

## Prerequisites
- A GitHub account with this repo pushed to it
- Free accounts on: [Vercel](https://vercel.com), [Render](https://render.com), [Neon](https://neon.tech)
- An [free Gemini API key (no card required)](https://ai.google.dev) (for the AI Coach + receipt parsing — optional but recommended)

---

## Step 1 — Push the repo to GitHub
```bash
cd carboniq
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/carboniq.git
git push -u origin main
```

---

## Step 2 — Create the database (Neon)
1. Go to [neon.tech](https://neon.tech) → sign up free → **Create a project**.
2. Name it `carboniq`, choose a region close to you.
3. Once created, copy the **connection string** shown (starts with `postgresql://`).
4. Keep this tab open — you'll paste it into Render in Step 3.

---

## Step 3 — Deploy the backend (Render)
1. Go to [render.com](https://render.com) → **New** → **Web Service**.
2. Connect your GitHub repo, select it.
3. Configure:
   - **Root Directory:** `apps/api`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma migrate deploy && npm start`
   - **Instance Type:** Free
4. Add environment variables (Render dashboard → Environment):
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | paste your Neon connection string |
   | `JWT_SECRET` | generate one: run `openssl rand -base64 32` locally and paste the output |
   | `GEMINI_API_KEY` | your Gemini key |
   | `PORT` | `4000` |
5. Click **Create Web Service**. Wait for the build to finish (~3-5 min).
6. Once live, copy your service URL — it looks like `https://carboniq-api.onrender.com`.
7. **Seed the database** — in the Render dashboard, open the **Shell** tab for your service and run:
   ```bash
   npm run seed
   ```
   This populates demo users so the dashboard isn't empty on first load.

> **Note:** Render's free tier spins down after 15 minutes of inactivity and takes ~30-50 seconds to wake up on the next request. Fine for a demo; for a live judging round, hit the health endpoint (`https://your-api.onrender.com/health`) a minute before you present to warm it up.

---

## Step 4 — Deploy the frontend (Vercel)
1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Import the same GitHub repo.
3. Configure:
   - **Root Directory:** `apps/web`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
4. Add environment variable:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | your Render backend URL from Step 3, e.g. `https://carboniq-api.onrender.com` |
5. Click **Deploy**. Wait ~1-2 minutes.
6. You'll get a live URL like `https://carboniq.vercel.app`.

---

## Step 5 — Fix CORS (one-time)
The backend's CORS config currently allows `localhost:3000` and a placeholder Vercel URL. Update it to your real deployed frontend URL:

In `apps/api/src/app.ts`, find:
```ts
app.use(cors());
```
This is currently wide-open (`cors()` with no options allows all origins), which is fine for a hackathon demo. If you want to lock it down for production, change it to:
```ts
app.use(cors({ origin: ["https://carboniq.vercel.app", "http://localhost:3000"] }));
```
Commit and push — Render will auto-redeploy.

---

## Step 6 — Smoke test
1. Open your Vercel URL.
2. Log in with `demo@carboniq.app` / `demo1234`.
3. Confirm the dashboard loads real numbers (not zeros) — if it's empty, the seed step in Step 3.7 didn't run.
4. Test the AI Coach — ask "why was my footprint high this week?" If it errors, double check `GEMINI_API_KEY` is set on Render.
5. Test receipt scan with any photo of text — OCR runs client-side so this works even if the AI key isn't set (it just won't categorize anything without the key).

---

## Step 7 — Custom domain (optional, for polish)
- Vercel: Project → Settings → Domains → add a free `.vercel.app` subdomain is already included, or connect a custom domain if a sponsor gave you one.
- No action needed on Render unless you also want a custom domain on the API.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Frontend loads but all data is empty | Seed script never ran | Run `npm run seed` in Render's Shell tab |
| "Failed to fetch" errors in browser console | `VITE_API_URL` wrong or backend asleep | Check the env var; visit `/health` on the API to wake it |
| AI Coach replies with a generic error | Missing/invalid `GEMINI_API_KEY` | Set it in Render env vars, redeploy |
| Prisma migration fails on deploy | `DATABASE_URL` malformed | Re-copy the exact string from Neon, including `?sslmode=require` if present |
| Build fails on Vercel with TypeScript errors | Local/deployed code mismatch | Run `npm run build` locally first to confirm it's clean before pushing |

---

## Architecture recap for judges
```
Vercel (React frontend) → Render (Express API) → Neon (Postgres)
                                ↓
                         Claude API (AI coach, receipt structuring)
```
All free-tier, all real infrastructure — nothing mocked.
