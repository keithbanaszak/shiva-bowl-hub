"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Manager";
import { posColor } from "@/lib/positions";

export type MatrixCol = "QB" | "RB" | "WR" | "TE" | "PICKS";
export type MatrixCell = {
  strength: number; // 0-100 (teamPower posStrength, or futureCapital for PICKS)
  startedPpg: number; // all-time started PPG (0 for PICKS)
  totalPpw: number; // all-time total per week (0 for PICKS)
  stance: "surplus" | "need" | "balanced";
};
export type MatrixRow = { userId: string; label: string; cells: Record<MatrixCol, MatrixCell> };

const COLS: MatrixCol[] = ["QB", "RB", "WR", "TE", "PICKS"];
const METRICS = [
  { key: "strength", label: "Current strength" },
  { key: "started", label: "Started PPG" },
  { key: "total", label: "Total / wk" },
] as const;
type Metric = (typeof METRICS)[number]["key"];

const colColor = (c: MatrixCol) => (c === "PICKS" ? "#22d3ee" : posColor(c));

function cellValue(cell: MatrixCell, metric: Metric, isPicks: boolean): number {
  if (isPicks) return cell.strength; // picks have no PPG — always show capital
  if (metric === "strength") return cell.strength;
  if (metric === "started") return cell.startedPpg;
  return cell.totalPpw;
}

const fmt = (v: number, metric: Metric, isPicks: boolean) =>
  isPicks || metric === "strength" ? String(Math.round(v)) : v.toFixed(1);

const alphaHex = (t: number) => {
  const a = Math.round(Math.max(0.05, Math.min(0.8, t)) * 255);
  return a.toString(16).padStart(2, "0");
};

const STANCE_DOT: Record<MatrixCell["stance"], string> = {
  surplus: "#34d399",
  need: "#fb7185",
  balanced: "transparent",
};

export function PosMatrix({ rows }: { rows: MatrixRow[] }) {
  const [metric, setMetric] = useState<Metric>("strength");
  const [sortCol, setSortCol] = useState<MatrixCol | null>(null);

  // per-column min/max for the active metric (for heatmap contrast)
  const range: Record<MatrixCol, { min: number; max: number }> = {} as never;
  for (const c of COLS) {
    const vals = rows.map((r) => cellValue(r.cells[c], metric, c === "PICKS"));
    range[c] = { min: Math.min(...vals), max: Math.max(...vals) };
  }

  const sorted = sortCol
    ? [...rows].sort(
        (a, b) =>
          cellValue(b.cells[sortCol], metric, sortCol === "PICKS") -
          cellValue(a.cells[sortCol], metric, sortCol === "PICKS"),
      )
    : rows;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`rounded-lg px-3 py-1.5 text-xs transition ${
              metric === m.key ? "bg-accent/15 text-accent" : "text-[var(--muted)] hover:bg-[var(--card-2)] hover:text-[var(--foreground)]"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto scroll-thin rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
              <th className="px-3 py-2.5">Manager</th>
              {COLS.map((c) => (
                <th key={c} className="px-2 py-2.5 text-center">
                  <button
                    onClick={() => setSortCol(sortCol === c ? null : c)}
                    className="inline-flex items-center gap-1 hover:text-[var(--foreground)]"
                    style={{ color: colColor(c) }}
                  >
                    {c}
                    <span className="text-[9px] opacity-70">{sortCol === c ? "▾" : ""}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.userId} className="border-t border-[var(--border)]">
                <td className="px-3 py-1.5">
                  <Link href={`/managers/${r.userId}`} className="flex items-center gap-2 hover:text-[var(--accent)]">
                    <Avatar userId={r.userId} size={20} />
                    <span className="min-w-0 truncate">{r.label}</span>
                  </Link>
                </td>
                {COLS.map((c) => {
                  const isPicks = c === "PICKS";
                  const v = cellValue(r.cells[c], metric, isPicks);
                  const { min, max } = range[c];
                  const t = max > min ? (v - min) / (max - min) : 0.5;
                  return (
                    <td key={c} className="px-1.5 py-1.5 text-center">
                      <div
                        className="relative mx-auto flex h-9 min-w-[44px] items-center justify-center rounded-md font-mono text-xs font-semibold tabular-nums"
                        style={{ backgroundColor: `${colColor(c)}${alphaHex(t)}` }}
                      >
                        {fmt(v, metric, isPicks)}
                        {r.cells[c].stance !== "balanced" && (
                          <span
                            className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: STANCE_DOT[r.cells[c].stance] }}
                            title={r.cells[c].stance}
                          />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--muted)]">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: STANCE_DOT.surplus }} /> surplus
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: STANCE_DOT.need }} /> need
        </span>
        <span>PICKS column = future draft capital (0–100). Cells colored by relative value within each column.</span>
      </div>
    </div>
  );
}
