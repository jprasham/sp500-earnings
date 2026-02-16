"use client";

import { useState, useMemo } from "react";
import type { DashboardData, Company, SectorStats } from "@/lib/data";
import SectorChart from "./SectorChart";

/* ───── Icons (inline SVG) ───── */

const IconBeat = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);
const IconMiss = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);
const IconInline = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);

/* ───── Sort helpers ───── */

type SortKey = keyof Company;
type SortDir = "asc" | "desc";

function sortCompanies(list: Company[], key: SortKey, dir: SortDir): Company[] {
  return [...list].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === "number" && typeof bv === "number")
      return dir === "asc" ? av - bv : bv - av;
    return dir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });
}

/* ───── Dashboard ───── */

export default function Dashboard({ data }: { data: DashboardData }) {
  const [sortKey, setSortKey] = useState<SortKey>("surprisePct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [verdictFilter, setVerdictFilter] = useState("All");
  const [search, setSearch] = useState("");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sortCls = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? "sort-asc" : "sort-desc") : "";

  const filtered = useMemo(() => {
    let list = data.companies;
    if (sectorFilter !== "All") list = list.filter((c) => c.sector === sectorFilter);
    if (verdictFilter !== "All") list = list.filter((c) => c.verdict === verdictFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.ticker.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q)
      );
    }
    return sortCompanies(list, sortKey, sortDir);
  }, [data.companies, sectorFilter, verdictFilter, search, sortKey, sortDir]);

  const sectorNames = useMemo(
    () => [...new Set(data.companies.map((c) => c.sector))].sort(),
    [data.companies]
  );

  const now = new Date();
  const updatedStr = `${now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

  return (
    <div className="min-h-screen pb-20">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-ink-muted mb-1">
                S&amp;P 500 Earnings Report
              </p>
              <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
                {data.quarter} Earnings
              </h1>
              <p className="text-ink-secondary mt-1 text-sm">
                {data.reported} of {data.totalSP500} companies reported ({data.reportedPct}%)
                &nbsp;·&nbsp; Source: FactSet
                &nbsp;·&nbsp; Updated {updatedStr}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-beat"><IconBeat /> Beat</span>
              <span className="flex items-center gap-1 text-inline"><IconInline /> In-Line</span>
              <span className="flex items-center gap-1 text-miss"><IconMiss /> Miss</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-10 mt-8 space-y-10">
        {/* ── KPI Cards ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-up">
          <KPICard
            label="Beat Estimates"
            value={`${data.beatPct}%`}
            sub={`${data.beatCount} companies`}
            accent="beat"
          />
          <KPICard
            label="Missed Estimates"
            value={`${data.missPct}%`}
            sub={`${data.missCount} companies`}
            accent="miss"
          />
          <KPICard
            label="In-Line"
            value={`${data.inlinePct}%`}
            sub={`${data.inlineCount} companies`}
            accent="inline"
          />
          <KPICard
            label="Avg. EPS Surprise"
            value={`${data.avgSurprisePct >= 0 ? "+" : ""}${data.avgSurprisePct.toFixed(1)}%`}
            sub={`${data.reported} reported`}
            accent={data.avgSurprisePct >= 0 ? "beat" : "miss"}
          />
        </section>

        {/* ── Stacked Bar Chart ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 fade-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-display text-lg font-bold mb-1">
            Earnings Above, In-Line, Below Estimates: {data.quarter}
          </h2>
          <p className="text-xs text-ink-muted mb-6">(Source: FactSet)</p>
          <SectorChart sectors={data.sectors} overall={{
            beatPct: data.beatPct,
            missPct: data.missPct,
            inlinePct: data.inlinePct,
          }} />
        </section>

        {/* ── Sector Breakdown Table ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 fade-up" style={{ animationDelay: "0.15s" }}>
          <h2 className="font-display text-lg font-bold mb-5">Sector Breakdown</h2>
          <div className="overflow-x-auto -mx-6 md:-mx-8 px-6 md:px-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-ink-muted">
                  <th className="pb-3 pr-4 font-medium">Sector</th>
                  <th className="pb-3 px-3 font-medium text-center">Reported</th>
                  <th className="pb-3 px-3 font-medium text-center">Beat</th>
                  <th className="pb-3 px-3 font-medium text-center">In-Line</th>
                  <th className="pb-3 px-3 font-medium text-center">Miss</th>
                  <th className="pb-3 px-3 font-medium text-center">Beat Rate</th>
                  <th className="pb-3 pl-3 font-medium text-center">Avg Surprise</th>
                </tr>
              </thead>
              <tbody>
                {data.sectors.map((s) => (
                  <tr key={s.sector} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pr-4 font-medium">{s.sector}</td>
                    <td className="py-3 px-3 text-center font-mono text-ink-secondary">{s.total}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-beat font-semibold">
                        {s.beat}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-inline font-semibold">
                        {s.inline}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-miss font-semibold">
                        {s.miss}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <BeatRateBar pct={s.beatPct} />
                    </td>
                    <td className="py-3 pl-3 text-center font-mono text-xs">
                      <span className={s.avgSurprisePct >= 0 ? "text-beat" : "text-miss"}>
                        {s.avgSurprisePct >= 0 ? "+" : ""}
                        {s.avgSurprisePct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Company Table ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <h2 className="font-display text-lg font-bold">
              All Companies
              <span className="ml-2 text-sm font-normal text-ink-muted">
                ({filtered.length})
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search ticker or name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 w-52"
                />
              </div>
              {/* Sector filter */}
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
              >
                <option value="All">All Sectors</option>
                {sectorNames.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {/* Verdict filter */}
              <select
                value={verdictFilter}
                onChange={(e) => setVerdictFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
              >
                <option value="All">All Results</option>
                <option value="Beat">Beat</option>
                <option value="In-Line">In-Line</option>
                <option value="Miss">Miss</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto -mx-6 md:-mx-8 px-6 md:px-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-ink-muted">
                  <Th label="Ticker" k="ticker" sortKey={sortKey} sortDir={sortDir} toggle={toggleSort} cls={sortCls} />
                  <Th label="Company" k="company" sortKey={sortKey} sortDir={sortDir} toggle={toggleSort} cls={sortCls} />
                  <Th label="Sector" k="sector" sortKey={sortKey} sortDir={sortDir} toggle={toggleSort} cls={sortCls} />
                  <Th label="Actual" k="epsActual" sortKey={sortKey} sortDir={sortDir} toggle={toggleSort} cls={sortCls} align="right" />
                  <Th label="Estimate" k="epsEstimate" sortKey={sortKey} sortDir={sortDir} toggle={toggleSort} cls={sortCls} align="right" />
                  <Th label="Surprise %" k="surprisePct" sortKey={sortKey} sortDir={sortDir} toggle={toggleSort} cls={sortCls} align="right" />
                  <Th label="Result" k="verdict" sortKey={sortKey} sortDir={sortDir} toggle={toggleSort} cls={sortCls} align="center" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.ticker}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-2.5 pr-3 font-mono font-semibold text-xs">
                      {c.ticker}
                    </td>
                    <td className="py-2.5 pr-3 max-w-[220px] truncate">
                      {c.company}
                    </td>
                    <td className="py-2.5 pr-3 text-ink-secondary text-xs">
                      {c.sector}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs">
                      {c.epsActual.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs text-ink-secondary">
                      {c.epsEstimate.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs">
                      <span className={c.surprisePct >= 0 ? "text-beat" : "text-miss"}>
                        {c.surprisePct >= 0 ? "+" : ""}
                        {c.surprisePct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-center">
                      <VerdictBadge verdict={c.verdict} />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-ink-muted">
                      No companies match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Methodology ── */}
        <section className="text-xs text-ink-muted max-w-2xl fade-up" style={{ animationDelay: "0.25s" }}>
          <h3 className="font-semibold text-ink-secondary mb-1">Methodology</h3>
          <p>
            <strong>Quarter detection:</strong> The calendar quarter with the most
            reported EPS actuals is treated as the &quot;latest completed quarter.&quot;
          </p>
          <p className="mt-1">
            <strong>Classification:</strong> A company <em>beats</em> if EPS
            Actual exceeds EPS Estimate by more than the tolerance (default ±2 %
            of the estimate). It <em>misses</em> if it falls below by the same
            margin. Otherwise it is classified <em>in-line</em>.
          </p>
          <p className="mt-1">
            Data sourced from FactSet. Refreshed weekly (Fridays).
          </p>
        </section>
      </main>
    </div>
  );
}

/* ───── Sub-components ───── */

function KPICard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "beat" | "miss" | "inline";
}) {
  const bgMap = { beat: "bg-beat-bg", miss: "bg-miss-bg", inline: "bg-inline-bg" };
  const textMap = { beat: "text-beat", miss: "text-miss", inline: "text-inline" };
  return (
    <div className={`rounded-2xl border border-slate-200 p-5 ${bgMap[accent]} bg-opacity-60`}>
      <p className="text-xs font-medium text-ink-secondary uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className={`font-display text-3xl font-extrabold ${textMap[accent]}`}>
        {value}
      </p>
      <p className="text-xs text-ink-muted mt-1">{sub}</p>
    </div>
  );
}

function BeatRateBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-beat transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs font-semibold text-beat">{pct}%</span>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const map: Record<string, string> = {
    Beat: "bg-beat-bg text-beat border-beat/20",
    Miss: "bg-miss-bg text-miss border-miss/20",
    "In-Line": "bg-inline-bg text-inline border-inline/20",
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${map[verdict] ?? ""}`}
    >
      {verdict}
    </span>
  );
}

function Th({
  label,
  k,
  sortKey,
  sortDir,
  toggle,
  cls,
  align = "left",
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  toggle: (k: SortKey) => void;
  cls: (k: SortKey) => string;
  align?: "left" | "right" | "center";
}) {
  const alignCls =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <th
      className={`pb-3 px-3 font-medium cursor-pointer select-none hover:text-ink transition-colors ${alignCls} ${cls(k)}`}
      onClick={() => toggle(k)}
    >
      {label}
    </th>
  );
}
