import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  PageHeader,
  SectionTitle,
  Stat,
  Badge,
  Tag,
  Note,
} from "@/components/ui";
import { Avatar, ManagerChip } from "@/components/Manager";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PlayerTimeline } from "@/components/charts/PlayerTimeline";

import { completedSeasons, label } from "@/lib/marts";
import { legacyFor, legacyIds } from "@/lib/data/playerLegacy";

export function generateStaticParams() {
  return legacyIds().map((playerId) => ({ playerId }));
}

export default async function PlayerLegacyPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const p = legacyFor(playerId);
  if (!p) notFound();

  // oldest first, so league time runs left to right on the timeline. Use played
  // seasons (completedSeasons), NOT the raw chain — the chain includes the
  // rolled-over next season before any game is played, which would draw a
  // phantom gridline for a season that hasn't happened.
  const allSeasons = [...completedSeasons()].sort((a, b) => Number(a) - Number(b));

  return (
    <div>
      <Link
        href="/players"
        className="mb-4 inline-block text-sm text-[var(--muted)] hover:text-[var(--accent)]"
      >
        ← All players
      </Link>

      <div className="mb-6 flex items-center gap-4">
        <PlayerAvatar playerId={p.playerId} size={64} />
        <div>
          <PageHeader
            title={p.name}
            kicker={`${p.position ?? "—"}${p.team ? ` · ${p.team}` : ""} · ${p.firstSeen}${p.lastSeen !== p.firstSeen ? `–${p.lastSeen}` : ""}`}
          />
          {p.currentOwnerUserId && (
            <div className="-mt-3">
              <Badge tone="accent2">
                <Avatar userId={p.currentOwnerUserId} size={14} /> Rostered by{" "}
                {label(p.currentOwnerUserId)}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {p.totalWeeks === 0 ? (
        <Note title="No in-league history yet">
          {p.name} is on a current roster but hasn’t scored a game inside our
          league yet — check back once the season starts.
        </Note>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="League points" value={p.careerPoints} tone="good" />
            <Stat label="Points while started" value={p.careerStarterPoints} />
            <Stat
              label="Weeks rostered"
              value={p.totalWeeks}
              sub={`${p.totalStarts} starts`}
            />
            <Stat
              label="Managers"
              value={p.ownerTotals.length}
              sub="who rostered him"
            />
          </div>

          {/* ownership timeline */}
          <SectionTitle>🧬 Ownership timeline</SectionTitle>
          <div className="mb-8">
            <PlayerTimeline stints={p.timeline} seasons={allSeasons} />
          </div>

          {/* points by manager */}
          <SectionTitle>📊 Points by manager</SectionTitle>
          <Card className="mb-8 overflow-x-auto scroll-thin">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
                  <th className="py-2 pr-3">Manager</th>
                  <th className="px-3">Weeks</th>
                  <th className="px-3">Starts</th>
                  <th className="px-3">Points</th>
                  <th className="px-3">Started pts</th>
                  <th className="px-3">PPG</th>
                  <th className="px-3">Best game</th>
                </tr>
              </thead>
              <tbody>
                {p.ownerTotals.map((o) => (
                  <tr
                    key={o.userId}
                    className="border-t border-[var(--border)]"
                  >
                    <td className="py-2 pr-3">
                      <ManagerChip
                        userId={o.userId}
                        href={`/managers/${o.userId}`}
                        size={18}
                      />
                    </td>
                    <td className="px-3 tabular-nums text-[var(--muted)]">
                      {o.weeks}
                    </td>
                    <td className="px-3 tabular-nums text-[var(--muted)]">
                      {o.starts}
                    </td>
                    <td className="px-3 tabular-nums font-semibold text-[var(--accent)]">
                      {o.points}
                    </td>
                    <td className="px-3 tabular-nums text-[var(--muted)]">
                      {o.starterPoints}
                    </td>
                    <td className="px-3 tabular-nums">{o.ppg}</td>
                    <td className="px-3 tabular-nums text-[var(--muted)]">
                      {o.bestGame
                        ? `${o.bestGame.points} (${o.bestGame.season} Wk${o.bestGame.week}${o.bestGame.opponentUserId ? ` vs ${label(o.bestGame.opponentUserId)}` : ""})`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* revenge games */}
            <div>
              <SectionTitle>😤 Revenge games</SectionTitle>
              <Card>
                {p.revengeGames.length === 0 ? (
                  <div className="text-sm text-[var(--muted)]">
                    No big games against a former owner.
                  </div>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {p.revengeGames.map((g, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-2"
                      >
                        <span>
                          <span className="font-mono font-semibold text-[var(--gold)]">
                            {g.points}
                          </span>{" "}
                          for {label(g.forUserId)} vs former owner{" "}
                          <Link
                            href={`/managers/${g.formerOwnerUserId}`}
                            className="hover:text-[var(--accent)]"
                          >
                            {label(g.formerOwnerUserId)}
                          </Link>
                        </span>
                        <span className="shrink-0 text-xs text-[var(--muted)]">
                          {g.season} Wk{g.week}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            {/* boom weeks */}
            <div>
              <SectionTitle>💥 Biggest games</SectionTitle>
              <Card>
                <ul className="space-y-2 text-sm">
                  {p.boomWeeks.map((g, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-[var(--accent)]">
                          {g.points}
                        </span>
                        for {label(g.userId)}
                        {!g.started && <Tag>bench</Tag>}
                      </span>
                      <span className="shrink-0 text-xs text-[var(--muted)]">
                        {g.season} Wk{g.week}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>

          {p.mostPainfulDrop && (
            <div className="mt-6">
              <SectionTitle>🩹 Most painful drop</SectionTitle>
              <Card>
                <div className="text-sm">
                  <Link
                    href={`/managers/${p.mostPainfulDrop.droppedByUserId}`}
                    className="font-medium hover:text-[var(--accent)]"
                  >
                    {label(p.mostPainfulDrop.droppedByUserId)}
                  </Link>{" "}
                  dropped him in {p.mostPainfulDrop.season} Wk
                  {p.mostPainfulDrop.week} — he then scored{" "}
                  <span className="font-mono font-semibold text-[var(--bad)]">
                    {p.mostPainfulDrop.afterPoints}
                  </span>{" "}
                  points for other teams.
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
