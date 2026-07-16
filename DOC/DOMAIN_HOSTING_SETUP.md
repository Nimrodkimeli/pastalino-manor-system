# Pastalino Domain Hosting Setup (Worker Access)

This setup publishes the app so workers can access it on a domain with HTTPS.

## Recommended topology

- Frontend: Netlify (or Vercel)
- Backend API: Railway (with persistent volume)
- Domains:
  - `app.yourdomain.com` -> frontend
  - `api.yourdomain.com` -> backend

## 1) Prepare backend (already updated)

`backend/src/db.js` now supports an env var:

- `DB_PATH` (optional)
- Falls back to local `backend/data/pastalino.sqlite`

For production, set `DB_PATH` to persistent storage (example: `/data/pastalino.sqlite`).

## 2) Deploy backend on Railway

1. Push this repo to GitHub.
2. In Railway, create a new project from the repo.
3. Set service root to `backend`.
4. Build/Start:
   - Build: `npm install`
   - Start: `npm start`
5. Add variables:
   - `PORT=4000` (or leave blank and use Railway provided port handling)
   - `JWT_SECRET=<strong-random-secret>`
   - `DB_PATH=/data/pastalino.sqlite`
6. Add a Railway Volume mounted at `/data`.
7. Deploy and verify:
   - `https://<railway-backend-url>/api/status`

## 3) Deploy frontend on Netlify

1. Create site from GitHub repo.
2. Set base directory: `frontend`
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add env var:
   - `VITE_API_URL=https://api.yourdomain.com/api`
6. Deploy.

## 4) Connect your domain

In your DNS provider (Cloudflare/GoDaddy/etc):

- `CNAME app -> <netlify-site-domain>`
- `CNAME api -> <railway-backend-domain>`

Then in platforms:

- Netlify custom domain: `app.yourdomain.com`
- Railway custom domain: `api.yourdomain.com`

Wait for SSL to issue, then test:

- `https://app.yourdomain.com`
- `https://api.yourdomain.com/api/status`

## 5) Worker rollout checklist

- Create worker accounts in Staff section.
- Test login from a phone and desktop.
- Confirm document upload works on production domain.
- Confirm notes, members, and discharge forms save correctly.
- Back up DB volume snapshot weekly.

## 6) Security minimums

- Use long unique `JWT_SECRET`.
- Restrict who can edit DNS/platform settings.
- Keep HTTPS only.
- Rotate admin passwords quarterly.

## 7) Local command reminders

This repo has no root `package.json`, so use:

- Frontend dev: from `frontend`, run `npm run dev`
- Backend dev: from `backend`, run `npm run dev`
