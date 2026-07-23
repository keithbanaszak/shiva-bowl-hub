import Link from "next/link";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Avatar } from "@/components/Manager";
import { label } from "@/lib/marts";
import { pname } from "@/lib/data/players-dict";
import { rankLabelFor } from "@/lib/data/playerRanks";
import { posColor } from "@/lib/positions";
import { ppos } from "@/lib/data/players-dict";
import type { ActivityEvent, ActivityKind } from "@/lib/stats/types";

export const KIND_META: Record<ActivityKind, { label: string; glyph: string; cls: string }> = {
  trade: { label: "Trade", glyph: "⇄", cls: "text-[var(--accent-2)]" },
  waiver: { label: "Waiver", glyph: "+", cls: "text-[var(--accent)]" },
  free_agent: { label: "Free agent", glyph: "+", cls: "text-[var(--accent)]" },
  drop: { label: "Drop", glyph: "−", cls: "text-[var(--bad)]" },
};

export const fmtDate = (ms: number | null) =>
  ms ? new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

/** One row in the league activity feed. Server component — reads marts directly. */
export function ActivityRow({ e }: { e: ActivityEvent }) {
  const meta = KIND_META[e.kind];
  const pid = e.playerIds[0] ?? null;

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-2.5">
      <span
        aria-hidden
        title={meta.label}
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--chip)] font-mono text-sm ${meta.cls}`}
      >
        {meta.glyph}
      </span>

      <div className="min-w-0 flex-1">
        {e.kind === "trade" ? (
          <>
            <div className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
              {e.userIds.map((u, i) => (
                <span key={u} className="flex min-w-0 items-center gap-1">
                  {i > 0 && <span className="text-[var(--faint)]">⇄</span>}
                  <Avatar userId={u} size={16} />
                  <span className="truncate">{label(u)}</span>
                </span>
              ))}
            </div>
            <Link href="/trades" className="text-[11px] text-[var(--muted)] hover:text-[var(--accent)]">
              {e.playerIds.length} player{e.playerIds.length === 1 ? "" : "s"} · see receipt →
            </Link>
          </>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-1.5">
              {pid && <PlayerAvatar playerId={pid} size={22} />}
              <span className={`truncate text-sm ${e.kind === "drop" ? "text-[var(--bad)]" : "text-[var(--accent)]"}`}>
                {pid ? pname(pid) : "—"}
              </span>
              {pid && rankLabelFor(e.season, pid) && (
                <span
                  className="shrink-0 rounded px-1 text-[10px] font-semibold"
                  style={{ color: posColor(ppos(pid)), backgroundColor: `${posColor(ppos(pid))}1f` }}
                  title="In-league positional finish that season"
                >
                  {rankLabelFor(e.season, pid)}
                </span>
              )}
            </div>
            <div className="flex min-w-0 items-center gap-1 text-[11px] text-[var(--muted)]">
              <Avatar userId={e.userIds[0]} size={14} />
              <span className="truncate">{label(e.userIds[0])}</span>
            </div>
          </>
        )}
      </div>

      <div className="shrink-0 text-right text-[10px] text-[var(--muted)]">
        {e.faab > 0 && <div className="font-mono text-[var(--gold)]">${e.faab}</div>}
        <div>
          {e.season} · Wk {e.week}
        </div>
        <div className="text-[var(--faint)]">{fmtDate(e.dateMs)}</div>
      </div>
    </div>
  );
}
