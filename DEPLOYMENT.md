# S&P 500 Earnings Dashboard — Deployment Guide

## Architecture Overview

```
┌──────────────┐     raw URL     ┌──────────────┐     weekly push     ┌──────────────┐
│  Vercel App  │ ◀────────────── │   GitHub Repo  │ ◀─────────────── │  You (Friday)  │
│  (Next.js)   │   fetches xlsx  │  /data/S_P500  │    replace file   │  FactSet CSV   │
└──────────────┘                 └──────────────┘                    └──────────────┘
```

The app fetches the Excel file at runtime from a GitHub raw URL, parses it,
detects the latest quarter, classifies each company, and renders the dashboard.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | https://nodejs.org |
| npm | ≥ 9 | comes with Node |
| Git | any | https://git-scm.com |
| GitHub account | — | https://github.com |
| Vercel account | free tier OK | https://vercel.com |

---

## Step 1 — Create the Project Locally

```bash
# 1a. Unzip the project archive you received
unzip sp500-earnings.zip -d sp500-earnings
cd sp500-earnings

# 1b. Install dependencies
npm install

# 1c. Create a local environment file
cp .env.example .env.local
```

Edit `.env.local` and set a *temporary* local URL (you'll update it after pushing data to GitHub):

```env
NEXT_PUBLIC_DATA_URL=https://raw.githubusercontent.com/<YOUR_USER>/<YOUR_REPO>/main/data/S_P500_DATA.xlsx
NEXT_PUBLIC_INLINE_TOLERANCE=0.02
```

> **Tip:** The tolerance (default 0.02 = ±2 %) defines the "in-line" band.
> Set to `0` if you want strict beat/miss only.

---

## Step 2 — Initialise Git and Push to GitHub

```bash
# 2a. Initialise the repo
git init
git add .
git commit -m "Initial commit — S&P 500 Earnings Dashboard"

# 2b. Create a new repo on GitHub (via the web UI or CLI)
#     Name it e.g. "sp500-earnings"
#     Do NOT initialise with a README (you already have files)

# 2c. Add remote and push
git remote add origin https://github.com/<YOUR_USER>/sp500-earnings.git
git branch -M main
git push -u origin main
```

---

## Step 3 — Add the Dataset File

The app expects the data file at a GitHub raw URL. You can store it inside
**the same repo** or in a **separate data repo** — either works.

### Option A: Same Repo (simplest)

```bash
# Create a data directory inside the project
mkdir -p data

# Copy your FactSet export into it
cp /path/to/S_P500_DATA.xlsx data/S_P500_DATA.xlsx

# Commit and push
git add data/
git commit -m "Add initial dataset"
git push
```

Your raw URL will be:
```
https://raw.githubusercontent.com/<YOUR_USER>/sp500-earnings/main/data/S_P500_DATA.xlsx
```

### Option B: Separate Data Repo

Create a second repo (e.g. `sp500-data`), push the file there, and use that
repo's raw URL. This keeps data refreshes from triggering a rebuild.

### Verify the URL works

Open the raw URL in your browser — it should download the `.xlsx` file.
If you get a 404, double-check the path and ensure the repo is **public**
(or use a GitHub token — see "Private Repo" section below).

---

## Step 4 — Connect GitHub to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select the `sp500-earnings` repo
4. Vercel auto-detects Next.js — accept the defaults
5. **Before clicking Deploy**, expand **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_DATA_URL` | `https://raw.githubusercontent.com/<YOUR_USER>/<YOUR_REPO>/main/data/S_P500_DATA.xlsx` |
| `NEXT_PUBLIC_INLINE_TOLERANCE` | `0.02` |

6. Click **Deploy**

Vercel will build and give you a live URL like `https://sp500-earnings.vercel.app`.

---

## Step 5 — Verify the Live Site

1. Open the Vercel URL
2. Confirm the dashboard shows the correct quarter (e.g. "Q4 2025")
3. Check that sector counts and beat/miss rates look reasonable
4. Test the sortable company table, filters, and search

If you see a "Data Error" screen:
- Check the Vercel **Function Logs** (Dashboard → your project → Functions tab)
- Verify the `NEXT_PUBLIC_DATA_URL` env var is correct
- Confirm the GitHub file is accessible via its raw URL

---

## Step 6 — Weekly Update Workflow (Every Friday)

### 6a. Export fresh data from FactSet

Ensure the export has these exact columns:

| Column | Description |
|--------|-------------|
| `TICKERS` | Ticker symbol |
| `COMPANY` | Company name |
| `SECTOR` | GICS sector |
| `EPS_ACTUAL_DATE` | Date of actual EPS (fiscal quarter end) |
| `EPS_ACTUAL` | Reported EPS |
| `EPS_ESTIMATE` | Consensus EPS estimate |

Save as `S_P500_DATA.xlsx` (or `.csv` — both are auto-detected).

### 6b. Replace the file in the repo

```bash
cd sp500-earnings          # or your data repo
cp /path/to/new/S_P500_DATA.xlsx data/S_P500_DATA.xlsx
git add data/S_P500_DATA.xlsx
git commit -m "Weekly data refresh — $(date +%Y-%m-%d)"
git push
```

### 6c. Confirm updated data is live

The app fetches data at **runtime** (not build time), so pushing the file to
GitHub is all you need — no Vercel redeploy required. The API route uses
`cache: "no-store"` and adds a cache-buster, so the next page load will
pick up the new file.

> **Note:** GitHub's CDN may cache raw files for up to 5 minutes.
> If you need instant updates, append `?token=<random>` to the URL — the
> app already appends a timestamp-based cache-buster automatically.

### 6d. (Optional) Automate with GitHub Actions

Create `.github/workflows/refresh.yml` to auto-commit the file:

```yaml
name: Weekly Data Refresh
on:
  schedule:
    - cron: '0 18 * * 5'   # every Friday at 6 PM UTC
  workflow_dispatch:         # manual trigger

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Download latest data
        run: |
          # Replace with your actual FactSet export mechanism
          # e.g. curl, scp, or a script that calls FactSet's API
          echo "Place your download command here"
      - name: Commit and push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/S_P500_DATA.xlsx
          git diff --staged --quiet || git commit -m "Auto-refresh $(date +%Y-%m-%d)"
          git push
```

---

## Private Repo / Authentication (Optional)

If the data repo is **private**, the raw URL will return 404 for anonymous
requests. Two solutions:

### Option A: GitHub Personal Access Token

1. Create a **fine-grained token** at `Settings → Developer settings → Tokens`
   with `Contents: read` permission on the data repo.
2. Add it as a Vercel env var: `GITHUB_TOKEN=ghp_xxxx`
3. Update `lib/data.ts` to add an `Authorization` header:

```typescript
const res = await fetch(url + cacheBuster, {
  cache: "no-store",
  headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
});
```

### Option B: Make Only the Data Repo Public

Keep the app repo private if you wish, but make the data repo public so the
raw URL is accessible without auth.

---

## Customisation Reference

| What | Where | Notes |
|------|-------|-------|
| In-line tolerance | `NEXT_PUBLIC_INLINE_TOLERANCE` env var | Fraction, e.g. `0.02` = ±2 % |
| Chart colours | `tailwind.config.ts` → `colors.beat/miss/inline` | Also update `SectorChart.tsx` hex values |
| Fonts | `globals.css` and `tailwind.config.ts` | Google Fonts loaded in CSS |
| Data file path | `NEXT_PUBLIC_DATA_URL` env var | Any raw-accessible URL works |
| Quarter detection | `lib/data.ts` → `toQuarterLabel()` | Uses calendar quarters |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Data Error" on load | Bad URL or file format | Check `NEXT_PUBLIC_DATA_URL`, verify the raw URL returns a file |
| Wrong quarter shown | Multiple quarters in data | The quarter with the most entries wins; ensure old data is cleaned |
| All companies show "Miss" | Tolerance too high | Lower `NEXT_PUBLIC_INLINE_TOLERANCE` |
| Stale data after push | GitHub CDN cache | Wait ~5 min or append `?v=2` to the URL |
| Build fails on Vercel | Missing env var | Add `NEXT_PUBLIC_DATA_URL` in Vercel → Settings → Env Vars |

---

## Local Development

```bash
npm run dev        # starts on http://localhost:3000
npm run build      # production build
npm run start      # serve production build locally
```

That's it! Push your FactSet export every Friday and the dashboard stays current.
