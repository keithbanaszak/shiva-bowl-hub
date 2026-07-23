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

export const fmtDate = (ms: number | null) =>
  ms
    ? new Date(ms).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

const shortDate = (ms: number | null) =>
  ms
    ? new Date(ms).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

/** One row in the league activity feed. Server component — reads marts directly. */
export function ActivityRow({ e }: { e: ActivityEvent }) {
  const meta = KIND_META[e.kind];
  const pid = e.playerIds[0] ?? null;
  const rank = pid ? rankLabelFor(e.season, pid) : null;

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1.5">
      <span
        aria-hidden
        title={meta.label}
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[var(--chip)] font-mono text-sm ${meta.cls}`}
      >
        {meta.glyph}
      </span>

      {e.kind === "trade" ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {e.userIds.map((u, i) => (
            <span key={u} className="flex min-w-0 items-center gap-1 text-sm">
              {i > 0 && <span className="text-[var(--faint)]">⇄</span>}
              <Avatar userId={u} size={16} />
              <FitText fits={16} className="max-w-[13ch]">
                {label(u)}
              </FitText>
            </span>
          ))}
          <Link
            href="/trades"
            className="text-[11px] text-[var(--muted)] hover:text-[var(--accent)]"
          >
            · {e.playerIds.length} player{e.playerIds.length === 1 ? "" : "s"} →
          </Link>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {pid && <PlayerAvatar playerId={pid} size={20} />}
          <Link
            href={pid ? `/players/${pid}` : "#"}
            className={`min-w-0 text-sm hover:underline ${
              e.kind === "drop" ? "text-[var(--bad)]" : "text-[var(--accent)]"
            }`}
          >
            <FitText fits={20}>{pid ? pname(pid) : "—"}</FitText>
          </Link>
          {rank && (
            <span
              className="shrink-0 rounded px-1 text-[10px] font-semibold"
              style={{
                color: posColor(ppos(pid)),
                backgroundColor: `${posColor(ppos(pid))}1f`,
              }}
              title="In-league positional finish that season"
            >
              {rank}
            </span>
          )}
          <span className="ml-1 flex min-w-0 shrink items-center gap-1 text-[11px] text-[var(--muted)]">
            <Avatar userId={e.userIds[0]} size={14} />
            <FitText fits={18} className="max-w-[16ch]">
              {label(e.userIds[0])}
            </FitText>
          </span>
        </div>
      )}

      <div className="shrink-0 text-right text-[10px] leading-tight text-[var(--muted)]">
        {e.faab > 0 && (
          <span className="mr-1.5 font-mono text-[var(--gold)]">${e.faab}</span>
        )}
        <span className="whitespace-nowrap">
          {e.season} wk{e.week}
        </span>
        <span className="ml-1.5 hidden whitespace-nowrap text-[var(--faint)] sm:inline">
          {shortDate(e.dateMs)}
        </span>
      </div>
    </div>
  );
}
