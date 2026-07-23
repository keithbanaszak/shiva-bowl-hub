import Link from "next/link";
import type { ReactNode } from "react";
import { Card, PageHeader, SectionTitle, Note, signed } from "@/components/ui";
import { ManagerChip } from "@/components/Manager";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { playerStats } from "@/lib/data/players";
import { kryptonite } from "@/lib/data/kryptonite";
import { pname, ppos } from "@/lib/data/players-dict";
import { hasLegacy } from "@/lib/data/playerLegacy";

/** Link to a player's legacy page when one exists, else plain text. */
function PlayerLink({ id, children }: { id: string; children: ReactNode }) {
  if (!hasLegacy(id)) return <>{children}</>;
  return (
    <Link href={`/players/${id}`} className="hover:text-[var(--accent)]">
      {children}
    </Link>
  );
}

export default function PlayersPage() {
  const starts = playerStats.startRecords.slice(0, 25);
  const bench = playerStats.benchLeaders.slice(0, 25);
  const nemeses = kryptonite.nemeses.slice(0, 12);

  return (
    <div>
      <PageHeader
        kicker="Player history"
        title="Players"
        subtitle="How NFL players have actually performed inside our league — win/loss records when started, and the points that died on benches."
      />

      <div className="mb-6">
        <Note title="What counts here">
          A player&rsquo;s <strong>start record</strong> is the win/loss record of whichever team started him,
          that week (minimum 10 career starts to qualify). <strong>Bench points</strong> are points a player
          scored while sitting on someone&rsquo;s bench — pure hindsight pain. Click any player for their full{" "}
          <strong>league legacy</strong> — every owner, revenge game, and painful drop.
        </Note>
      </div>

      <SectionTitle>🏆 Best record while started (min 10 starts)</SectionTitle>
      <Card className="mb-8 overflow-x-auto scroll-thin">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
              <th className="py-2 pr-3">Player</th>
              <th className="px-3">Pos</th>
              <th className="px-3">Starts</th>
              <th className="px-3">Record</th>
              <th className="px-3">Win%</th>
              <th className="px-3">Pts started</th>
              <th className="px-3">Started most by</th>
            </tr>
          </thead>
          <tbody>
            {starts.map((r, i) => (
              <tr key={r.playerId} className="border-t border-[var(--border)]">
                <td className="py-2 pr-3">
                  <span className="flex items-center gap-2">
                    <span className="w-5 text-right text-xs text-[var(--muted)]">{i + 1}</span>
                    <PlayerAvatar playerId={r.playerId} size={26} />
                    <PlayerLink id={r.playerId}>{pname(r.playerId)}</PlayerLink>
                  </span>
                </td>
                <td className="px-3 text-[var(--muted)]">{ppos(r.playerId) ?? "—"}</td>
                <td className="px-3 tabular-nums text-[var(--muted)]">{r.starts}</td>
                <td className="px-3 tabular-nums">
                  {r.wins}-{r.losses}
                </td>
                <td className="px-3 tabular-nums font-semibold text-[var(--accent)]">{(r.winPct * 100).toFixed(0)}%</td>
                <td className="px-3 tabular-nums text-[var(--muted)]">{r.pointsWhileStarting}</td>
                <td className="px-3">
                  <ManagerChip userId={r.topManagerUserId} size={18} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <SectionTitle>🪑 Most points stranded on a bench</SectionTitle>
      <Card className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
              <th className="py-2 pr-3">Player</th>
              <th className="px-3">Pos</th>
              <th className="px-3">Bench pts</th>
              <th className="px-3">Bench weeks</th>
              <th className="px-3">Benched most by</th>
            </tr>
          </thead>
          <tbody>
            {bench.map((b, i) => (
              <tr key={b.playerId} className="border-t border-[var(--border)]">
                <td className="py-2 pr-3">
                  <span className="flex items-center gap-2">
                    <span className="w-5 text-right text-xs text-[var(--muted)]">{i + 1}</span>
                    <PlayerAvatar playerId={b.playerId} size={26} />
                    <PlayerLink id={b.playerId}>{pname(b.playerId)}</PlayerLink>
                  </span>
                </td>
                <td className="px-3 text-[var(--muted)]">{ppos(b.playerId) ?? "—"}</td>
                <td className="px-3 tabular-nums font-semibold text-[var(--gold)]">{b.benchPoints}</td>
                <td className="px-3 tabular-nums text-[var(--muted)]">{b.benchWeeks}</td>
                <td className="px-3">
                  <ManagerChip userId={b.topManagerUserId} size={18} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <SectionTitle>☠️ Kryptonite — players who torch one manager</SectionTitle>
      <Note>
        <span className="text-[var(--muted)]">
          Players who, when started, score well <strong>above their own average</strong> specifically against one
          manager (min 3 meetings). That manager&rsquo;s personal bogeyman.
        </span>
      </Note>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {nemeses.map((n, i) => (
          <Card key={i} className="flex items-center gap-3">
            <PlayerAvatar playerId={n.playerId} size={36} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                <PlayerLink id={n.playerId}>{pname(n.playerId)}</PlayerLink>
              </div>
              <div className="truncate text-xs text-[var(--muted)]">
                torches <ManagerChip userId={n.managerUserId} size={16} />
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-sm font-semibold text-[var(--gold)]">{n.avgVs}</div>
              <div className="text-[10px] text-[var(--muted)]">{signed(n.diff)} · {n.games}g</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
