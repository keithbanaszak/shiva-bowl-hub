import { Avatar } from "@/components/Manager";
import { label } from "@/lib/marts";

export type BarRow = { userId: string; display: string; pct: number };

/**
 * Horizontal bar leaderboard (manager + proportional bar).
 *
 * Bar LENGTH encodes the value; bar COLOR is a single-hue sequential ramp of the
 * same value (emerald, faint→full as it rises), which reinforces the ranking and
 * gives the list visual variance instead of one flat colour on every row. One
 * hue with monotonic intensity — a proper sequential encoding, not a rank-cycled
 * rainbow. Floored at 55% mix so even the lowest bar reads clearly emerald.
 */
export function BarLeaderboard({ rows }: { rows: BarRow[] }) {
  const values = rows.map((r) => r.pct);
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const span = Math.max(1e-6, max - min);

  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => {
        const t = (r.pct - min) / span; // 0 = lowest in set, 1 = highest
        const mix = 55 + t * 45; // 55%→100% emerald over the track colour
        return (
          <div key={r.userId}>
            <div className="mb-1 flex items-center gap-2">
              <span className="w-4 text-right text-[11px] text-[var(--muted)]">{i + 1}</span>
              <Avatar userId={r.userId} size={20} />
              <span className="min-w-0 truncate text-sm">{label(r.userId)}</span>
            </div>
            <div className="ml-6 h-6 overflow-hidden rounded-md bg-[var(--card-2)]">
              <div
                className="flex h-full items-center rounded-md px-2"
                style={{
                  width: `${Math.max(8, (r.pct / max) * 100)}%`,
                  background: `color-mix(in oklab, var(--accent) ${mix.toFixed(0)}%, var(--card-2))`,
                }}
              >
                <span className="font-mono text-[11px] font-semibold tabular-nums text-[var(--foreground)]">
                  {r.display}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
