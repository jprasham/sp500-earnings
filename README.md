# S&P 500 Earnings Dashboard

A real-time S&P 500 earnings tracker that displays beat/miss/in-line breakdowns by sector, inspired by FactSet's weekly earnings reports.

![Dashboard Preview](https://img.shields.io/badge/Next.js-14-black?logo=next.js) ![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)

## Features

- **Auto-detects the latest quarter** from the dataset
- **Beat / Miss / In-Line classification** with configurable tolerance
- **Stacked bar chart** by sector (matches FactSet's visual style)
- **Summary KPI cards** with counts and percentages
- **Sector breakdown table** with beat rates and average surprise
- **Sortable, filterable company table** with search
- **Reads directly from GitHub** — push new data and the dashboard updates automatically

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your GitHub raw URL
npm run dev
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete step-by-step guide.

## Data Format

The app expects an Excel (`.xlsx`) or CSV file with these columns:

| Column | Type | Example |
|--------|------|---------|
| `TICKERS` | string | `AAPL` |
| `COMPANY` | string | `Apple Inc.` |
| `SECTOR` | string | `Information Technology` |
| `EPS_ACTUAL_DATE` | date | `2025-12-31` |
| `EPS_ACTUAL` | number | `2.84` |
| `EPS_ESTIMATE` | number | `2.66` |

## License

MIT
