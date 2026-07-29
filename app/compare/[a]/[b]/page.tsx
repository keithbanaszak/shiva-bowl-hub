import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { Card, PageHeader, Stat, Badge } from "@/components/ui";
import { ManagerIdentity } from "@/components/Manager";
import {
  CompareTimeline,
  type TimelineMeeting,
} from "@/components/compare/CompareTimeline";
import { TradeReceipt, type Mgr } from "@/components/trades/TradeReceipt";
import { RosterColumn } from "@/components/compare/RosterColumn";
import { label, managers } from "@/lib/marts";
import { h2h, getPair } from "@/lib/data/h2h";
import { meetings } from "@/lib/data/teamWeeks";
import { tradesBetween } from "@/lib/data/trades";
import { lineupForMeeting } from "@/lib/data/lineups";
import { playoffs } from "@/lib/data/playoffs";
import { currentRosterFor, rosterAge } from "@/lib/data/rosterAge";

export function generateStaticParams() {
  const params: { a: string; b: string }[] = [];
  for (const p of h2h) {
    params.push({ a: p.aUserId, b: p.bUserId });
    params.push({ a: p.bUserId, b: p.aUserId });
  }
  return params;
}

// The winners-bracket title game each season, used to flag a meeting as a final.
const champGames = playoffs
  .flatMap((p) => p.games)
  .filter((g) => g.bracket === "winners" && g.placement === 1);

const mgrMap = new Map<string, Mgr>(
  managers.map((m) => [
    m.userId,
    { userId: m.userId, label: m.label, avatarUrl: m.avatarUrl },
  ]),
);

export default async function ComparePairPage({
  params,
}: {
  params: Promise<{ a: string; b: string }>;
}) {
  const { a, b } = await params;
  const pair = getPair(a, b);
  if (!pair || a === b) notFound();

  const flip = pair.aUserId !== a;
  const aWins = flip ? pair.bWins : pair.aWins;
  const bWins = flip ? pair.aWins : pair.bWins;
  const aPts = flip ? pair.bPoints : pair.aPoints;
  const bPts = flip ? pair.aPoints : pair.bPoints;
  const aPlayoff = flip ? pair.playoffBWins : pair.playoffAWins;
  const bPlayoff = flip ? pair.playoffAWins : pair.playoffBWins;
  const aLeads = aWins > bWins;
  const tied = aWins === bWins;

  const games = meetings(a, b);
  const trades = tradesBetween(a, b);

  const isChampionship = (season: string, week: number): boolean =>
    champGames.some(
      (g) =>
        g.season === season &&
        g.week === week &&
        ((g.homeUserId === a && g.awayUserId === b) ||
          (g.homeUserId === b && g.awayUserId === a)),
    );

  // enrich each meeting with the running series record + title-game flag
  let ra = 0;
  let rb = 0;
  const timeline: TimelineMeeting[] = games.map((g) => {
    const aWon = g.result === "W";
    const bWon = g.result === "L";
    if (aWon) ra++;
    else if (bWon) rb++;
    return {
      season: g.season,
      week: g.week,
      aPoints: g.points,
      bPoints: g.opponentPoints ?? 0,
      winnerUserId: aWon ? a : bWon ? b : null,
      isPlayoff: g.isPlayoff,
      isChampionship: isChampionship(g.season, g.week),
      runA: ra,
      runB: rb,
    };
  });
  const lineups = games.map((g) => lineupForMeeting(g.season, g.week, a, b) ?? null);

  return (
    <div>
      <BackLink fallback="/compare" />

      <PageHeader
        kicker="Manager vs manager"
        title={`${label(a)} vs ${label(b)}`}
      />

      {/* scoreboard */}
      <Card className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <ManagerIdentity userId={a} size={48} href={`/managers/${a}`} />
            {aLeads && (
              <div className="mt-1.5">
                <Badge tone="good">Leads series</Badge>
              </div>
            )}
          </div>
          <div className="shrink-0 text-center">
            <div className="font-mono text-3xl font-bold tabular-nums">
              {aWins}–{bWins}
            </div>
            <div className="text-xs text-[var(--muted)]">
              {tied ? "dead even" : "all-time"}
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-end">
            <ManagerIdentity
              userId={b}
              size={48}
              href={`/managers/${b}`}
              align="right"
            />
            {!aLeads && !tied && (
              <div className="mt-1.5">
                <Badge tone="good">Leads series</Badge>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Rivalry heat" value={pair.heat} tone="gold" />
        <Stat label="Games" value={pair.games} />
        <Stat label="Avg margin" value={pair.avgMargin} />
        <Stat
          label="Playoff record"
          value={aPlayoff + bPlayoff > 0 ? `${aPlayoff}-${bPlayoff}` : "—"}
        />
        <Stat label={`${label(a)} pts`} value={aPts} />
        <Stat label={`${label(b)} pts`} value={bPts} />
        {pair.biggest && (
          <Stat
            label="Biggest blowout"
            value={Math.abs(pair.biggest.margin)}
            sub={`${pair.biggest.season} wk ${pair.biggest.week}`}
            tone="bad"
          />
        )}
        {pair.closest && (
          <Stat
            label="Closest game"
            value={Math.abs(pair.closest.margin)}
            sub={`${pair.closest.season} wk ${pair.closest.week}`}
            tone="good"
          />
        )}
      </div>

      {pair.currentStreak && (
        <p className="mb-8 text-sm text-[var(--muted)]">
          Current streak:{" "}
          <span className="text-[var(--foreground)]">
            {label(pair.currentStreak.holder)}
          </span>{" "}
          has won the last {pair.currentStreak.length}.
        </p>
      )}

      {/* every meeting, as a timeline */}
      <h2 className="mb-3 text-lg font-semibold tracking-tight">
        Every meeting ({games.length})
      </h2>
      <div className="mb-8">
        <CompareTimeline
          meetings={timeline}
          lineups={lineups}
          aUserId={a}
          bUserId={b}
        />
      </div>

      {/* trades between them — same receipt as the trade analyzer */}
      {trades.length > 0 && (
        <>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Trades between them ({trades.length})
          </h2>
          <div className="mb-8 columns-1 gap-3 sm:columns-2">
            {trades.map((t) => (
              <TradeReceipt key={t.id} t={t} mgrMap={mgrMap} basis="career" />
            ))}
          </div>
        </>
      )}

      {/* current rosters, side by side */}
      {(currentRosterFor(a) || currentRosterFor(b)) && (
        <>
          <h2 className="mb-1 text-lg font-semibold tracking-tight">
            Current rosters
          </h2>
          <p className="mb-3 text-xs text-[var(--muted)]">
            Who each manager holds right now ({rosterAge.season}).
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <div className="mb-3">
                <ManagerIdentity userId={a} size={28} href={`/managers/${a}`} />
              </div>
              <RosterColumn team={currentRosterFor(a)} />
            </Card>
            <Card>
              <div className="mb-3">
                <ManagerIdentity userId={b} size={28} href={`/managers/${b}`} />
              </div>
              <RosterColumn team={currentRosterFor(b)} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
