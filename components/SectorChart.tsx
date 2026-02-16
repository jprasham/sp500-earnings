"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  type TooltipProps,
} from "recharts";
import type { SectorStats } from "@/lib/data";

/* ───── Custom tooltip ───── */

function ChartTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const beat = payload.find((p) => p.dataKey === "beatPct")?.value ?? 0;
  const inl = payload.find((p) => p.dataKey === "inlinePct")?.value ?? 0;
  const miss = payload.find((p) => p.dataKey === "missPct")?.value ?? 0;
  return (
    <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="font-display font-bold mb-2">{label}</p>
      <div className="space-y-1">
        <Row color="#16a34a" label="Above" val={`${beat}%`} />
        <Row color="#ca8a04" label="In-Line" val={`${inl}%`} />
        <Row color="#dc2626" label="Below" val={`${miss}%`} />
      </div>
    </div>
  );
}

function Row({ color, label, val }: { color: string; label: string; val: string }) {
  return (
    <div className="flex items-center gap-2 justify-between min-w-[120px]">
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
        <span className="text-ink-secondary">{label}</span>
      </span>
      <span className="font-mono font-semibold">{val}</span>
    </div>
  );
}

/* ───── Chart ───── */

interface Props {
  sectors: SectorStats[];
  overall: {
    beatPct: number;
    missPct: number;
    inlinePct: number;
  };
}

export default function SectorChart({ sectors, overall }: Props) {
  // Build data: add the overall S&P 500 bar
  const chartData = [
    ...sectors.map((s) => ({
      name: s.sector.replace("Communication Services", "Comm.\nServices")
        .replace("Consumer Discretionary", "Consumer\nDisc.")
        .replace("Consumer Staples", "Consumer\nStaples")
        .replace("Information Technology", "Info.\nTechnology")
        .replace("Health Care", "Health\nCare")
        .replace("Real Estate", "Real\nEstate"),
      beatPct: s.beatPct,
      inlinePct: s.inlinePct,
      missPct: s.missPct,
      total: s.total,
      fullName: s.sector,
    })),
  ];

  // Insert S&P 500 aggregate at the correct position (after sorted sectors by beat rate)
  // Find where S&P 500 overall beat rate would fall
  const sp500Entry = {
    name: "S&P 500",
    beatPct: overall.beatPct,
    inlinePct: overall.inlinePct,
    missPct: overall.missPct,
    total: 0,
    fullName: "S&P 500 (Overall)",
  };

  // Insert S&P 500 bar — place it in sorted position by beatPct
  let inserted = false;
  const withOverall = [];
  for (const d of chartData) {
    if (!inserted && overall.beatPct >= d.beatPct) {
      withOverall.push(sp500Entry);
      inserted = true;
    }
    withOverall.push(d);
  }
  if (!inserted) withOverall.push(sp500Entry);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={440}>
        <BarChart
          data={withOverall}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          barCategoryGap="16%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#475569", fontFamily: "DM Sans" }}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
            interval={0}
            height={60}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "JetBrains Mono" }}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "rgba(148,163,184,0.08)" }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="square"
            iconSize={12}
            formatter={(value: string) => (
              <span style={{ fontSize: 12, color: "#475569", fontFamily: "DM Sans" }}>
                {value}
              </span>
            )}
          />
          <Bar
            dataKey="beatPct"
            name="Above"
            stackId="stack"
            fill="#16a34a"
            radius={[0, 0, 0, 0]}
          >
            {withOverall.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.name === "S&P 500" ? "#15803d" : "#16a34a"}
              />
            ))}
          </Bar>
          <Bar
            dataKey="inlinePct"
            name="In-Line"
            stackId="stack"
            fill="#ca8a04"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="missPct"
            name="Below"
            stackId="stack"
            fill="#dc2626"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Percentage labels table below chart */}
      <div className="overflow-x-auto mt-2 -mx-2 px-2">
        <table className="w-full text-[10px] font-mono text-center text-ink-secondary">
          <tbody>
            <tr>
              <td className="py-0.5 text-left text-miss font-semibold w-16">Below</td>
              {withOverall.map((d) => (
                <td key={d.name} className="py-0.5">{d.missPct}%</td>
              ))}
            </tr>
            <tr>
              <td className="py-0.5 text-left text-inline font-semibold w-16">In-Line</td>
              {withOverall.map((d) => (
                <td key={d.name} className="py-0.5">{d.inlinePct}%</td>
              ))}
            </tr>
            <tr>
              <td className="py-0.5 text-left text-beat font-semibold w-16">Above</td>
              {withOverall.map((d) => (
                <td key={d.name} className="py-0.5">{d.beatPct}%</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
