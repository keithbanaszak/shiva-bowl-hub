import { Avatar } from "@/components/Manager";
import { label } from "@/lib/marts";

export type BarRow = { userId: string; display: string; pct: number };

/** Horizontal bar leaderboard (manager avatar + name + proportional gradient bar). */
export function BarLeaderboard({ rows }: { rows: BarRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.pct));
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={r.userId}>
          <div className="mb-1 flex items-center gap-2">
            <span className="w-4 text-right text-[11px] text-[var(--muted)]">{i + 1}</span>
            <Avatar userId={r.userId} size={20} />
            <span className="min-w-0 truncate text-sm">{label(r.userId)}</span>
          </div>
          <div className="ml-6 h-6 overflow-hidden rounded-md bg-white/5">
            <div
              className="flex h-full items-center rounded-md bg-gradient-to-r from-sky-500/50 to-emerald-400/60 px-2"
              style={{ width: `${Math.max(8, (r.pct / max) * 100)}%` }}
            >
              <span className="font-mono text-[11px] font-semibold tabular-nums text-white">{r.display}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
