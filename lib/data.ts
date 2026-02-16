/* ──────────────────────────────────────────────────────────
 *  lib/data.ts — Data ingestion & analytics for S&P 500 earnings
 * ────────────────────────────────────────────────────────── */

import * as XLSX from "xlsx";

/* ---------- Types ---------- */

export type Verdict = "Beat" | "Miss" | "In-Line";

export interface Company {
  ticker: string;
  company: string;
  sector: string;
  epsActualDate: string;       // ISO date string
  epsActual: number;
  epsEstimate: number;
  surprise: number;            // actual − estimate
  surprisePct: number;         // (actual − estimate) / |estimate| × 100
  verdict: Verdict;
  quarter: string;             // e.g. "Q4 2025"
}

export interface SectorStats {
  sector: string;
  total: number;
  beat: number;
  miss: number;
  inline: number;
  beatPct: number;
  missPct: number;
  inlinePct: number;
  avgSurprisePct: number;
}

export interface DashboardData {
  quarter: string;
  reported: number;
  totalSP500: number;
  reportedPct: number;
  beatCount: number;
  missCount: number;
  inlineCount: number;
  beatPct: number;
  missPct: number;
  inlinePct: number;
  avgSurprisePct: number;
  sectors: SectorStats[];
  companies: Company[];
  earningsGrowthPct: number | null;
}

/* ---------- Helpers ---------- */

/** Derive calendar quarter label from a Date */
function toQuarterLabel(d: Date): string {
  const m = d.getMonth(); // 0-indexed
  const q = Math.floor(m / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

/** Classify EPS result */
function classify(
  actual: number,
  estimate: number,
  tol: number
): Verdict {
  if (estimate === 0) {
    if (actual > 0) return "Beat";
    if (actual < 0) return "Miss";
    return "In-Line";
  }
  const diff = (actual - estimate) / Math.abs(estimate);
  if (diff > tol) return "Beat";
  if (diff < -tol) return "Miss";
  return "In-Line";
}

/* ---------- Main processing ---------- */

export async function fetchAndProcess(
  url: string,
  inlineTolerance: number = 0.02
): Promise<DashboardData> {
  /* 1. Fetch file -------------------------------------------------- */
  const cacheBuster = `?t=${Date.now()}`;
  const res = await fetch(url + cacheBuster, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch data: ${res.status}`);
  const buf = await res.arrayBuffer();

  /* 2. Parse (Excel or CSV auto-detect) ----------------------------- */
  const wb = XLSX.read(new Uint8Array(buf), { type: "array", cellDates: true });
  // Pick the first sheet that isn't the FactSet cache sheet
  const sheetName =
    wb.SheetNames.find((n) => n !== "__FDSCACHE__") ?? wb.SheetNames[0];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(
    wb.Sheets[sheetName],
    { raw: false, dateNF: "yyyy-mm-dd" }
  );

  /* 3. Normalise rows ----------------------------------------------- */
  interface RawRow {
    TICKERS?: string;
    COMPANY?: string;
    SECTOR?: string;
    EPS_ACTUAL_DATE?: string;
    EPS_ACTUAL?: string | number;
    EPS_ESTIMATE?: string | number;
  }

  const parsed: {
    ticker: string;
    company: string;
    sector: string;
    date: Date;
    actual: number;
    estimate: number;
  }[] = [];

  for (const r of rows as RawRow[]) {
    const ticker = r.TICKERS?.toString().trim();
    const company = r.COMPANY?.toString().trim();
    const sector = r.SECTOR?.toString().trim();
    const dateStr = r.EPS_ACTUAL_DATE?.toString().trim();
    const actual = r.EPS_ACTUAL != null ? Number(r.EPS_ACTUAL) : NaN;
    const estimate = r.EPS_ESTIMATE != null ? Number(r.EPS_ESTIMATE) : NaN;

    if (!ticker || !company || !sector || !dateStr) continue;
    if (isNaN(actual) || isNaN(estimate)) continue;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) continue;

    parsed.push({ ticker, company, sector, date, actual, estimate });
  }

  if (parsed.length === 0)
    throw new Error("No valid rows found in dataset.");

  /* 4. Detect latest completed quarter ------------------------------ */
  const quarterCounts: Record<string, number> = {};
  for (const p of parsed) {
    const q = toQuarterLabel(p.date);
    quarterCounts[q] = (quarterCounts[q] || 0) + 1;
  }
  // Pick the quarter with the most reported companies
  const latestQuarter = Object.entries(quarterCounts).sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  /* 5. Filter to latest quarter ------------------------------------- */
  const filtered = parsed.filter(
    (p) => toQuarterLabel(p.date) === latestQuarter
  );

  /* 6. Classify each company ---------------------------------------- */
  const companies: Company[] = filtered.map((p) => {
    const surprise = p.actual - p.estimate;
    const surprisePct =
      p.estimate !== 0 ? (surprise / Math.abs(p.estimate)) * 100 : 0;
    return {
      ticker: p.ticker,
      company: p.company,
      sector: p.sector,
      epsActualDate: p.date.toISOString().slice(0, 10),
      epsActual: p.actual,
      epsEstimate: p.estimate,
      surprise,
      surprisePct,
      verdict: classify(p.actual, p.estimate, inlineTolerance),
      quarter: latestQuarter,
    };
  });

  /* 7. Aggregate KPIs ----------------------------------------------- */
  const beatCount = companies.filter((c) => c.verdict === "Beat").length;
  const missCount = companies.filter((c) => c.verdict === "Miss").length;
  const inlineCount = companies.filter(
    (c) => c.verdict === "In-Line"
  ).length;
  const total = companies.length;
  const avgSurprisePct =
    companies.reduce((s, c) => s + c.surprisePct, 0) / total;

  /* 8. Sector breakdown --------------------------------------------- */
  const sectorMap: Record<string, Company[]> = {};
  for (const c of companies) {
    if (!sectorMap[c.sector]) sectorMap[c.sector] = [];
    sectorMap[c.sector].push(c);
  }

  const sectors: SectorStats[] = Object.entries(sectorMap)
    .map(([sector, list]) => {
      const beat = list.filter((c) => c.verdict === "Beat").length;
      const miss = list.filter((c) => c.verdict === "Miss").length;
      const inl = list.filter((c) => c.verdict === "In-Line").length;
      const n = list.length;
      return {
        sector,
        total: n,
        beat,
        miss,
        inline: inl,
        beatPct: Math.round((beat / n) * 100),
        missPct: Math.round((miss / n) * 100),
        inlinePct: Math.round((inl / n) * 100),
        avgSurprisePct:
          list.reduce((s, c) => s + c.surprisePct, 0) / n,
      };
    })
    .sort((a, b) => b.beatPct - a.beatPct); // Sort by beat rate descending

  return {
    quarter: latestQuarter,
    reported: total,
    totalSP500: 500,
    reportedPct: Math.round((total / 500) * 100),
    beatCount,
    missCount,
    inlineCount,
    beatPct: Math.round((beatCount / total) * 100),
    missPct: Math.round((missCount / total) * 100),
    inlinePct: Math.round((inlineCount / total) * 100),
    avgSurprisePct,
    sectors,
    companies,
    earningsGrowthPct: null, // Not derivable from this dataset alone
  };
}
