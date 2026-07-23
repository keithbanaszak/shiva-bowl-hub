import type { LineupPlayer, MatchupLineup } from "@/lib/stats/types";
import { pname, ppos, pteam } from "@/lib/data/players-dict";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { MatchupBar } from "@/components/MatchupBar";

function Side({ p, side, win }: { p: LineupPlayer | undefined; side: "l" | "r"; win: boolean }) {
  if (!p) return <div className="flex-1" />;
  const meta = [ppos(p.playerId), pteam(p.playerId)].filter(Boolean).join(" · ");
  const score = (
    <span className="shrink-0 font-mono leading-tight">
      <span className={`block text-sm tabular-nums ${win ? "font-semibold text-[var(--accent)]" : ""}`}>{p.points}</span>
      {p.proj != null && <span className="block text-[10px] text-[var(--muted)]">{p.proj}</span>}
    </span>
  );
  const who = (
    <span className="flex min-w-0 items-center gap-2">
      <PlayerAvatar playerId={p.playerId} size={28} />
      <span className="min-w-0">
        <span className="block truncate text-xs">{pname(p.playerId)}</span>
        {meta && <span className="block truncate text-[10px] text-[var(--muted)]">{meta}</span>}
      </span>
    </span>
  );
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${side === "r" ? "flex-row-reverse text-right" : ""}`}>
      {who}
      <span className="flex-1" />
      {score}
    </div>
  );
}

/** Header (team totals) + slot-by-slot starter comparison with headshots and projections. */
export function MatchupLineups({ lineup, leftUserId }: { lineup: MatchupLineup; leftUserId?: string }) {
  const teams = [...lineup.teams];
  if (leftUserId && teams[0]?.userId !== leftUserId) teams.reverse();
  const [left, right] = teams;
  if (!left || !right) return null;
  const rows = Math.max(left.starters.length, right.starters.length);
  const winner = left.points > right.points ? left.userId : right.points > left.points ? right.userId : null;

  return (
    <div>
      <MatchupBar
        aUserId={left.userId}
        bUserId={right.userId}
        aPoints={left.points}
        bPoints={right.points}
        aProj={left.proj}
        bProj={right.proj}
        winnerUserId={winner}
      />
      <div className="mt-2 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
        {Array.from({ length: rows }).map((_, i) => {
          const lp = left.starters[i];
          const rp = right.starters[i];
          const lWin = (lp?.points ?? 0) > (rp?.points ?? 0);
          const rWin = (rp?.points ?? 0) > (lp?.points ?? 0);
          const slot = lp?.slot ?? rp?.slot ?? "";
          return (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5">
              <Side p={lp} side="l" win={lWin} />
              <span className="w-12 shrink-0 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                {slot}
              </span>
              <Side p={rp} side="r" win={rWin} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
