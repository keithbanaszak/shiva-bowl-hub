import Link from "next/link";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PosBadge } from "@/components/Pos";
import type { RosterAgeTeam, RosterEntry } from "@/lib/stats/types";

const ORDER = ["QB", "RB", "WR", "TE", "K", "DEF"];

/** A manager's current roster, grouped by position. */
export function RosterColumn({ team }: { team: RosterAgeTeam | undefined }) {
  if (!team || team.roster.length === 0) {
    return (
      <div className="text-xs text-[var(--muted)]">
        Not in the league this season.
      </div>
    );
  }

  const byPos = new Map<string, RosterEntry[]>();
  for (const p of team.roster) {
    const arr = byPos.get(p.pos) ?? [];
    arr.push(p);
    byPos.set(p.pos, arr);
  }
  const positions = [...byPos.keys()].sort((a, b) => {
    const ia = ORDER.indexOf(a);
    const ib = ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });

  return (
    <div className="space-y-3">
      {positions.map((pos) => (
        <div key={pos}>
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--muted)]">
            <PosBadge pos={pos} />
            <span>{byPos.get(pos)!.length}</span>
          </div>
          <div className="space-y-0.5">
            {byPos.get(pos)!.map((p) => (
              <Link
                key={p.playerId}
                href={`/players/${p.playerId}`}
                className="flex items-center gap-1.5 rounded px-1 py-0.5 text-xs transition hover:bg-[var(--card-2)]"
              >
                <PlayerAvatar playerId={p.playerId} size={18} />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                {p.age != null && (
                  <span className="shrink-0 font-mono text-[10px] text-[var(--muted)]">
                    {p.age}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
