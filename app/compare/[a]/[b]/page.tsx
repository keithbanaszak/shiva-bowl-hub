import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, PageHeader, Stat, Badge } from "@/components/ui";
import { Avatar } from "@/components/Manager";
import { MatchupLineups } from "@/components/MatchupLineups";
import { label } from "@/lib/marts";
import { h2h, getPair } from "@/lib/data/h2h";
import { meetings } from "@/lib/data/teamWeeks";
import { tradesBetween } from "@/lib/data/trades";
import { lineupForMeeting } from "@/lib/data/lineups";
import { pname } from "@/lib/data/players-dict";

export function generateStaticParams() {
  const params: { a: string; b: string }[] = [];
  for (const p of h2h) {
    params.push({ a: p.aUserId, b: p.bUserId });
    params.push({ a: p.bUserId, b: p.aUserId });
  }
  return params;
}

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

  return (
    <div>
      <Link href="/compare" className="mb-4 inline-block text-sm text-[var(--muted)] hover:text-emerald-300">
        ← Compare
      </Link>

      <PageHeader kicker="Manager vs manager" title={`${label(a)} vs ${label(b)}`} />

      {/* scoreboard */}
      <Card className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar userId={a} size={48} />
            <div className="min-w-0">
              <div className="truncate font-semibold">{label(a)}</div>
              {aLeads && <Badge tone="good">Leads series</Badge>}
            </div>
          </div>
          <div className="shrink-0 text-center">
            <div className="font-mono text-3xl font-bold tabular-nums">
              {aWins}–{bWins}
            </div>
            <div className="text-xs text-[var(--muted)]">{tied ? "dead even" : "all-time"}</div>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            <div className="min-w-0 text-right">
              <div className="truncate font-semibold">{label(b)}</div>
              {!aLeads && !tied && <Badge tone="good">Leads series</Badge>}
            </div>
            <Avatar userId={b} size={48} />
          </div>
        </div>
      </Card>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Rivalry heat" value={pair.heat} tone="gold" />
        <Stat label="Games" value={pair.games} />
        <Stat label="Avg margin" value={pair.avgMargin} />
        <Stat label="Playoff record" value={aPlayoff + bPlayoff > 0 ? `${aPlayoff}-${bPlayoff}` : "—"} />
        <Stat label={`${label(a)} pts`} value={aPts} />
        <Stat label={`${label(b)} pts`} value={bPts} />
        {pair.biggest && (
          <Stat label="Biggest blowout" value={Math.abs(pair.biggest.margin)} sub={`${pair.biggest.season} wk ${pair.biggest.week}`} tone="bad" />
        )}
        {pair.closest && (
          <Stat label="Closest game" value={Math.abs(pair.closest.margin)} sub={`${pair.closest.season} wk ${pair.closest.week}`} tone="good" />
        )}
      </div>

      {pair.currentStreak && (
        <p className="mb-8 text-sm text-[var(--muted)]">
          Current streak: <span className="text-white">{label(pair.currentStreak.holder)}</span> has won the last{" "}
          {pair.currentStreak.length}.
        </p>
      )}

      {/* trades between them */}
      {trades.length > 0 && (
        <>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Trades between them ({trades.length})</h2>
          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {trades.map((t) => (
              <Card key={t.id}>
                <div className="mb-2 text-xs text-[var(--muted)]">{t.season} · Week {t.week}</div>
                <div className="grid grid-cols-2 gap-3">
                  {t.sides
                    .filter((s) => s.userId === a || s.userId === b)
                    .map((s) => (
                      <div key={s.userId} className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-2.5">
                        <div className="mb-1 truncate text-xs font-medium">{label(s.userId)} got</div>
                        <ul className="space-y-0.5 text-xs">
                          {s.received.map((as, i) => (
                            <li key={i} className="truncate">
                              {as.kind === "player" ? pname(as.playerId) : `${as.season} R${as.round}${as.becameName ? ` → ${as.becameName}` : ""}`}
                            </li>
                          ))}
                          {s.faabReceived > 0 && <li className="text-[var(--muted)]">${s.faabReceived} FAAB</li>}
                        </ul>
                        {t.realized?.[s.userId] && (
                          <div className="mt-1 text-[10px] text-[var(--muted)]">
                            realized {t.realized[s.userId].season} (career {t.realized[s.userId].career})
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* every meeting with expandable lineups */}
      <h2 className="mb-3 text-lg font-semibold tracking-tight">Every meeting ({games.length})</h2>
      <div className="space-y-2">
        {games.map((g, i) => {
          const lineup = lineupForMeeting(g.season, g.week, a, b);
          const aWon = g.result === "W";
          return (
            <details key={i} className="group rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="flex items-center gap-2 text-[var(--muted)]">
                  <span className="tabular-nums">{g.season}</span>
                  <span>wk {g.week}</span>
                  {g.isPlayoff && <Badge tone="gold">PO</Badge>}
                </span>
                <span className="flex items-center gap-3 font-mono tabular-nums">
                  <span className={aWon ? "font-semibold text-emerald-300" : ""}>{g.points}</span>
                  <span className="text-[var(--muted)]">–</span>
                  <span className={g.result === "L" ? "font-semibold text-emerald-300" : ""}>{g.opponentPoints}</span>
                </span>
                <span className="hidden w-28 text-right text-xs text-[var(--muted)] sm:block">
                  {g.result === "W" ? `${label(a)} won` : g.result === "L" ? `${label(b)} won` : "tie"}
                </span>
                <span className="text-xs text-[var(--muted)] group-open:rotate-180">▾</span>
              </summary>
              {lineup ? (
                <div className="border-t border-[var(--border)] p-4">
                  <MatchupLineups lineup={lineup} leftUserId={a} />
                </div>
              ) : (
                <div className="border-t border-[var(--border)] p-4 text-xs text-[var(--muted)]">
                  Lineup detail unavailable for this week.
                </div>
              )}
            </details>
          );
        })}
      </div>
    </div>
  );
}
