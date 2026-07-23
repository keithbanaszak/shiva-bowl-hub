import type { ActivityEvent, ActivityKind } from "@/lib/stats/types";

/**
 * Roster churn per season, split by move type.
 *
 * Stacked bars: the job is magnitude (how much happened) plus composition (what
 * kind), which is exactly what a stack encodes. Series order is FIXED — trades
 * always slot 1, drops always slot 4 — so the colors never shift between seasons.
 *
 * Slot colors are the validated categorical steps from --series-N. Two of them
 * sit under 3:1 on the light surface, so per the relief rule this ships visible
 * direct labels (the per-segment counts) and a legend, never color alone.
 */

const SERIES: Array<{ kind: ActivityKind; label: string; varName: string }> = [
  { kind: "trade", label: "Trades", varName: "--series-1" },
  { kind: "waiver", label: "Waiver claims", varName: "--series-2" },
  { kind: "free_agent", label: "Free agents", varName: "--series-3" },
  { kind: "drop", label: "Drops", varName: "--series-4" },
];

export function ActivityBySeason({ events }: { events: ActivityEvent[] }) {
  const bySeason = new Map<string, Record<string, number>>();
  for (const e of events) {
    const row = bySeason.get(e.season) ?? {};
    row[e.kind] = (row[e.kind] ?? 0) + 1;
    bySeason.set(e.season, row);
  }

  const seasons = [...bySeason.keys()].sort((a, b) => Number(a) - Number(b));
  const totals = seasons.map((s) =>
    Object.values(bySeason.get(s) ?? {}).reduce((a, b) => a + b, 0),
  );
  const max = Math.max(1, ...totals);

  return (
    <figure className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <figcaption className="mb-1 font-display text-sm font-semibold">
        Moves per season
      </figcaption>
      <p className="mb-4 text-xs text-[var(--muted)]">
        Every trade, claim, signing and cut. 2026 is the offseason so far.
      </p>

      {/* legend — always present for 2+ series, so identity is never color-alone */}
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5">
        {SERIES.map((s) => (
          <span
            key={s.kind}
            className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]"
          >
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: `var(${s.varName})` }}
            />
            {s.label}
          </span>
        ))}
      </div>

      <div className="space-y-2.5">
        {seasons.map((season, i) => {
          const row = bySeason.get(season) ?? {};
          const total = totals[i];
          return (
            <div key={season} className="flex items-center gap-3">
              <span className="w-9 shrink-0 font-mono text-xs tabular-nums text-[var(--muted)]">
                {season}
              </span>
              {/* 2px surface gaps between segments keep adjacent fills legible */}
              <div
                className="flex h-6 flex-1 gap-[2px]"
                style={{ width: `${(total / max) * 100}%` }}
              >
                {SERIES.map((s, si) => {
                  const v = row[s.kind] ?? 0;
                  if (!v) return null;
                  const pct = (v / total) * 100;
                  return (
                    <div
                      key={s.kind}
                      title={`${season} · ${s.label}: ${v}`}
                      className={`group relative grid place-items-center overflow-hidden ${
                        si === 0 ? "rounded-l" : ""
                      } ${si === SERIES.length - 1 ? "rounded-r" : ""}`}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: `var(${s.varName})`,
                      }}
                    >
                      {/* direct label — required relief for the low-contrast slots */}
                      {pct > 9 && (
                        <span className="font-mono text-[10px] font-semibold tabular-nums text-white mix-blend-luminosity">
                          {v}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums">
                {total}
              </span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
