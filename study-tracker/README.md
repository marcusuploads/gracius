# StudyForge — Study Timer & Tracker

A full-stack study tracker: timer (stopwatch + Pomodoro + manual entry, works offline),
subjects, study/rest/distraction/sleepy logs, day/week/month/year stats, friends +
leaderboard, dark mode, gamified unlock animations, and an owner-only private gallery.

## 🚀 Go live in ~10 minutes (Render, free tier)

### 1. Push this project to GitHub
```bash
cd study-tracker
git init
git add .
git commit -m "Initial commit"
```
Create a new empty repo on https://github.com/new, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/study-tracker.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Render using the Blueprint (easiest)
1. Go to https://dashboard.render.com/blueprints
2. Click **New Blueprint Instance**, connect your GitHub, select this repo.
3. Render reads `render.yaml` and automatically creates:
   - A free Postgres database
   - A free web service, wired to that database
   - A random `JWT_SECRET`
4. Click **Apply**. First deploy takes ~3-5 minutes (installs deps + builds the React app).
5. Once deployed, Render gives you a URL like `https://study-tracker.onrender.com` — that's your live site.

**No Blueprint button showing?** Deploy manually instead:
1. New + → PostgreSQL → free plan → note the "Internal Database URL".
2. New + → Web Service → connect your repo → Build Command: `npm install && npm run build` → Start Command: `npm start`.
3. Add environment variables: `DATABASE_URL` (paste the internal DB URL) and `JWT_SECRET` (any long random string).
4. Deploy.

### 3. Create your account
Open the live URL and sign up. **The first account created becomes Owner/Admin** automatically
(gets access to the private Gallery page).

### 4. Share it
Send the Render URL to classmates/friends — the free tier comfortably handles 100 users doing
normal study-tracking traffic. (Free-tier note: the service sleeps after 15 min of no traffic
and takes ~30s to wake on the next visit — fine for a class project, upgrade to a paid instance
if you need it always-instant.)

## 🔌 Offline mode — how it works
The timer runs entirely in the browser (`Date.now()` based), so it keeps working with no
internet at all. When you hit **Stop & Save**:
- If you're online, the session is sent straight to the server.
- If you're offline, it's stored in your browser's local storage.
- The moment your connection comes back (the app listens for the `online` browser event),
  all queued sessions are automatically synced to the server and your stats update.

## 🖥 Running locally (optional, for development)
Requires Node 18+ and a Postgres database (or use a free one from Render/Supabase/Neon).
```bash
cp .env.example .env      # then edit DATABASE_URL and JWT_SECRET
npm install
npm run build              # builds the React frontend into client/dist
npm start                  # serves everything on http://localhost:3000
```
For live-reloading frontend development, run the API (`npm run dev:server`) and, in another
terminal, `cd client && npm run dev` (Vite proxies `/api` to port 3000).

## 📁 Project structure
```
study-tracker/
  server/        Express API (auth, subjects, sessions/logs, friends, gallery)
  client/        React + Vite + Tailwind frontend
  render.yaml    One-click Render deployment blueprint
```

## 🔮 Optional next step: Google Calendar
Not wired in yet since it needs your own free Google Cloud OAuth Client ID (tied to your
Google account — I can't generate one for you). Ask me and I'll add a "Connect Calendar"
button once you've created credentials at https://console.cloud.google.com/apis/credentials.
