import Link from "next/link";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Avatar } from "@/components/Manager";
import { FitText } from "@/components/FitText";
import { label } from "@/lib/marts";
import { pname, ppos } from "@/lib/data/players-dict";
import { rankLabelFor } from "@/lib/data/playerRanks";
import { posColor } from "@/lib/positions";
import type { ActivityEvent, ActivityKind } from "@/lib/stats/types";

export const KIND_META: Record<
  ActivityKind,
  { label: string; glyph: string; cls: string }
> = {
  trade: { label: "Trade", glyph: "⇄", cls: "text-[var(--accent-2)]" },
  waiver: { label: "Waiver claim", glyph: "+", cls: "text-[var(--accent)]" },
  free_agent: { label: "Free agent", glyph: "+", cls: "text-[var(--accent)]" },
  drop: { label: "Drop", glyph: "−", cls: "text-[var(--bad)]" },
};

const shortDate = (ms: number | null) =>
  ms
    ? new Date(ms).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

/**
 * One row in the league activity feed.
 *
 * Laid out as a fixed grid rather than a flex row: the old version let the
 * player/manager block grow to fill the width, which stranded a lake of
 * whitespace before the FAAB and date while STILL truncating long team names.
 * Fixed tracks mean the manager column is always the same width, so names get
 * a predictable amount of room and the meta columns sit tight to the right.
 */
export function ActivityRow({ e }: { e: ActivityEvent }) {
  const meta = KIND_META[e.kind];
  const pid = e.playerIds[0] ?? null;
  const rank = pid ? rankLabelFor(e.season, pid) : null;
  const col = pid ? posColor(ppos(pid)) : null;

  return (
    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)_minmax(0,6.5rem)_2.5rem_4rem] items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2 py-1 sm:grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,11rem)_3rem_5.5rem] sm:gap-2">
      <span
        aria-hidden
        title={meta.label}
        className={`grid h-5 w-5 place-items-center rounded bg-[var(--chip)] font-mono text-xs ${meta.cls}`}
      >
        {meta.glyph}
      </span>

      {e.kind === "trade" ? (
        <>
          <span className="flex min-w-0 items-center gap-1 text-sm">
            <span className="text-[var(--accent-2)]">Trade</span>
            <span className="truncate text-xs text-[var(--muted)]">
              · {e.playerIds.length} player{e.playerIds.length === 1 ? "" : "s"}
            </span>
            <Link
              href="/trades"
              className="shrink-0 text-[11px] text-[var(--accent)] hover:underline"
            >
              receipt →
            </Link>
          </span>
          <span className="flex min-w-0 items-center gap-1 text-[11px] text-[var(--muted)]">
            {e.userIds.slice(0, 2).map((u, i) => (
              <span key={u} className="flex min-w-0 items-center gap-1">
                {i > 0 && (
                  <span className="shrink-0 text-[var(--faint)]">⇄</span>
                )}
                <Avatar userId={u} size={14} />
                <FitText>{label(u)}</FitText>
              </span>
            ))}
          </span>
        </>
      ) : (
        <>
          <span className="flex min-w-0 items-center gap-1.5">
            {pid && <PlayerAvatar playerId={pid} size={18} />}
            <Link
              href={pid ? `/players/${pid}` : "#"}
              className={`min-w-0 text-sm hover:underline ${
                e.kind === "drop" ? "text-[var(--bad)]" : "text-[var(--accent)]"
              }`}
            >
              <FitText>{pid ? pname(pid) : "—"}</FitText>
            </Link>
            {rank && col && (
              <span
                className="shrink-0 rounded px-1 text-[9px] font-semibold"
                style={{ color: col, backgroundColor: `${col}1f` }}
                title="In-league positional finish that season"
              >
                {rank}
              </span>
            )}
          </span>
          <span className="flex min-w-0 items-center gap-1 text-[11px] text-[var(--muted)]">
            <Avatar userId={e.userIds[0]} size={14} />
            <FitText>{label(e.userIds[0])}</FitText>
          </span>
        </>
      )}

      <span className="text-right font-mono text-[11px] text-[var(--gold)]">
        {e.faab > 0 ? `$${e.faab}` : ""}
      </span>

      <span className="whitespace-nowrap text-right font-mono text-[11px] leading-tight text-[var(--muted)]">
        {e.season} wk{e.week}
        <span className="block text-[var(--faint)]">{shortDate(e.dateMs)}</span>
      </span>
    </div>
  );
}
