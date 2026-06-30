# JS Daily Quiz — Vercel Deployment Guide

Daily JavaScript quiz app with **real push notifications** via ntfy.sh, powered by Vercel cron jobs.

## How it works

```
You set alarm time in app
        ↓
Frontend calls /api/schedule → saves to Vercel KV
        ↓
Vercel Cron runs every minute → /api/cron
        ↓
Cron checks: is it alarm time for any topic?
        ↓
YES → hits ntfy.sh server-side (no CORS) → your phone gets notified
```

No browser needs to be open. Notification fires from Vercel's servers.

---

## Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/js-daily-quiz.git
git push -u origin main
```

---

## Step 2 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Framework Preset: **Other**
4. Click **Deploy**

---

## Step 3 — Add Vercel KV (for saving alarm times)

1. In Vercel dashboard → your project → **Storage** tab
2. Click **Create Database** → choose **KV**
3. Name it anything (e.g. `js-quiz-kv`) → Create
4. Click **Connect to Project** → it auto-adds the env vars

---

## Step 4 — Set Environment Variables

In Vercel dashboard → your project → **Settings** → **Environment Variables**, add:

| Variable | Value | Notes |
|---|---|---|
| `CRON_SECRET` | any random string e.g. `abc123xyz` | Secures cron endpoint |
| `APP_URL` | `https://your-app.vercel.app` | Your actual Vercel URL |

> Get your URL from Vercel dashboard after first deploy.

---

## Step 5 — Redeploy

After adding env vars:
- Vercel dashboard → **Deployments** → **Redeploy** (top deployment)

---

## Step 6 — Set up ntfy on your phone

1. Download **ntfy** app (Android: Play Store / iOS: App Store) — it's free
2. Open the app → tap **+** → enter your topic name (e.g. `js-quiz-kartik-abc`)
3. Subscribe to it

---

## Step 7 — Use the app

1. Open your Vercel URL
2. Click **Settings (gear icon)**
3. Enter your **Gemini API Key** (from [aistudio.google.com](https://aistudio.google.com))
4. Enter your **ntfy topic** (same one you subscribed to on your phone)
5. Click **Test Notif** → you should get a notification on your phone instantly
6. Set your alarm time → **Set Alarm**
7. Done! Every day at that time, your phone gets notified regardless of browser state.

---

## Project Structure

```
js-daily-quiz/
├── public/
│   └── index.html        ← Full quiz frontend
├── api/
│   ├── schedule.js       ← Saves alarm to KV when user sets time
│   ├── cron.js           ← Runs every minute, fires ntfy if it's alarm time
│   └── test-notify.js    ← Sends immediate test notification
├── vercel.json           ← Cron schedule config
├── package.json
└── README.md
```

## Cron Schedule

Currently set to run **every minute** (`* * * * *`) so alarms are accurate to the minute.
Vercel's free hobby plan supports cron jobs running as frequently as once per day.

> **Important:** Vercel Hobby plan supports crons at minimum once per day.
> For per-minute crons you need **Vercel Pro** ($20/month).
>
> **Free alternative:** Change cron to `0 * * * *` (hourly) and alarm time matching
> will fire within the correct hour. Or use the Vercel Hobby plan with a fixed daily time.

### For Hobby plan — use this in vercel.json instead:
```json
{
  "crons": [
    { "path": "/api/cron", "schedule": "30 15 * * *" }
  ]
}
```
This fires at 9:00 PM IST (15:30 UTC) every day — just hardcode your preferred time.
