import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, PageHeader, SectionTitle, Stat, Badge, signed } from "@/components/ui";
import { Avatar, ManagerChip } from "@/components/Manager";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { allTime, getManager, label, ordinal } from "@/lib/marts";
import { standingsForUser } from "@/lib/data/standings";
import { playoffs } from "@/lib/data/playoffs";
import { awardsForUser } from "@/lib/data/awards";
import { rivalriesFor } from "@/lib/data/h2h";
import { tradesForUser } from "@/lib/data/trades";
import { kryptonite } from "@/lib/data/kryptonite";
import { rowsForUser } from "@/lib/data/slotScoring";
import { slotTone } from "@/lib/positions";
import { pname } from "@/lib/data/players-dict";

export function generateStaticParams() {
  return allTime.map((r) => ({ userId: r.userId }));
}

export default async function ManagerProfile({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const row = allTime.find((r) => r.userId === userId);
  const mgr = getManager(userId);
  if (!row || !mgr) notFound();

  const seasons = standingsForUser(userId);

  // trophy case
  let thirds = 0;
  let toilets = 0;
  for (const po of playoffs) {
    const place = po.finishes[userId];
    if (place === 3) thirds++;
    const maxPlace = Math.max(0, ...Object.values(po.finishes));
    if (maxPlace > 0 && place === maxPlace) toilets++;
  }

  // rivalries oriented to this manager
  const rivs = rivalriesFor(userId).map((p) => {
    const isA = p.aUserId === userId;
    return {
      oppId: isA ? p.bUserId : p.aUserId,
      myWins: isA ? p.aWins : p.bWins,
      oppWins: isA ? p.bWins : p.aWins,
      games: p.games,
      heat: p.heat,
    };
  });
  const nemesis = [...rivs].filter((r) => r.games >= 3).sort((a, b) => b.oppWins - b.myWins - (a.oppWins - a.myWins))[0];
  const freeLunch = [...rivs].filter((r) => r.games >= 3).sort((a, b) => b.myWins - b.oppWins - (a.myWins - a.oppWins))[0];
  const topRival = rivs[0];

  const krypt = kryptonite.byManager[userId];

  // all-time production by starting lineup slot, in the canonical slot order
  const SLOT_ORDER = ["QB", "RB", "WR", "TE", "FLEX", "SUPER_FLEX", "K", "DEF"];
  const slots = rowsForUser(userId, "all").sort(
    (a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot),
  );

  // best / worst trade by career realized for this manager
  const myTrades = tradesForUser(userId)
    .filter((t) => t.realized && t.realized[userId])
    .map((t) => ({ t, net: t.realized![userId].career }));
  const bestTrade = [...myTrades].sort((a, b) => b.net - a.net)[0];

  const awards = awardsForUser(userId);

  return (
    <div>
      <Link href="/managers" className="mb-4 inline-block text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← All managers
      </Link>

      <div className="mb-6 flex items-center gap-4">
        <Avatar userId={userId} size={64} />
        <div>
          <PageHeader
            title={mgr.realName || mgr.label}
            kicker={`${seasons.length} seasons · ${row.wins}-${row.losses}${row.ties ? `-${row.ties}` : ""}`}
          />
          {/* when we know the human, the team name becomes the subtitle */}
          <div className="-mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--muted)]">
            {mgr.realName && <span className="font-medium text-[var(--foreground)]">{mgr.label}</span>}
            {mgr.nickname && <span>&ldquo;{mgr.nickname}&rdquo;</span>}
            <span className="text-[var(--faint)]">@{mgr.displayName}</span>
            {mgr.joined && <span>· since {mgr.joined}</span>}
            {mgr.favoriteTeam && <span>· {mgr.favoriteTeam} fan</span>}
          </div>
          {mgr.bio && <p className="mt-1.5 max-w-2xl text-sm text-[var(--muted)]">{mgr.bio}</p>}
        </div>
      </div>

      {/* trophy case */}
      <Card className="mb-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="text-center">
            <div className="text-3xl">🏆</div>
            <div className="mt-1 text-2xl font-bold">{row.championships}</div>
            <div className="text-xs text-[var(--muted)]">Championships</div>
          </div>
          <div className="text-center">
            <div className="text-3xl">🥈</div>
            <div className="mt-1 text-2xl font-bold">{row.runnerUps}</div>
            <div className="text-xs text-[var(--muted)]">Runner-ups</div>
          </div>
          <div className="text-center">
            <div className="text-3xl">🥉</div>
            <div className="mt-1 text-2xl font-bold">{thirds}</div>
            <div className="text-xs text-[var(--muted)]">Third place</div>
          </div>
          <div className="text-center">
            <div className="text-3xl">🚽</div>
            <div className="mt-1 text-2xl font-bold">{toilets}</div>
            <div className="text-xs text-[var(--muted)]">Toilet bowls</div>
          </div>
        </div>
      </Card>

      {/* career stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Win %" value={`${(row.winPct * 100).toFixed(1)}%`} />
        <Stat label="All-play %" value={`${(row.allPlayWinPct * 100).toFixed(1)}%`} sub="true strength" />
        <Stat label="Lineup IQ" value={`${(row.careerEfficiency * 100).toFixed(1)}%`} sub="start/sit" />
        <Stat label="Schedule luck" value={signed(row.totalLuck)} tone={row.totalLuck > 0 ? "good" : row.totalLuck < 0 ? "bad" : "default"} />
        <Stat label="Points / game" value={row.pointsPerGame} />
        <Stat label="Playoff appearances" value={row.playoffAppearances} />
        <Stat label="Best finish" value={row.bestFinish ? ordinal(row.bestFinish) : "—"} tone="gold" />
        <Stat label="Avg finish" value={row.avgFinish ?? "—"} />
      </div>

      {/* rivalry + kryptonite */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {nemesis && (
          <Card>
            <div className="text-xs uppercase tracking-wider text-[var(--bad)]">Nemesis</div>
            <div className="mt-2"><ManagerChip userId={nemesis.oppId} href={`/compare/${userId}/${nemesis.oppId}`} /></div>
            <div className="mt-1 text-sm text-[var(--muted)]">{nemesis.myWins}-{nemesis.oppWins} vs them</div>
          </Card>
        )}
        {freeLunch && (
          <Card>
            <div className="text-xs uppercase tracking-wider text-[var(--accent)]">Free lunch</div>
            <div className="mt-2"><ManagerChip userId={freeLunch.oppId} href={`/compare/${userId}/${freeLunch.oppId}`} /></div>
            <div className="mt-1 text-sm text-[var(--muted)]">{freeLunch.myWins}-{freeLunch.oppWins} vs them</div>
          </Card>
        )}
        {krypt && (
          <Card>
            <div className="text-xs uppercase tracking-wider text-[var(--gold)]">Kryptonite</div>
            <div className="mt-2 flex items-center gap-2">
              <PlayerAvatar playerId={krypt.playerId} size={28} />
              <span className="truncate text-sm font-medium">{pname(krypt.playerId)}</span>
            </div>
            <div className="mt-1 text-sm text-[var(--muted)]">
              {krypt.avgVs} avg vs you ({signed(krypt.diff)} over his norm, {krypt.games} games)
            </div>
          </Card>
        )}
      </div>

      {/* production by starting slot */}
      {slots.length > 0 && (
        <>
          <SectionTitle>🎰 By lineup slot (all-time)</SectionTitle>
          <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {slots.map((s) => (
              <div
                key={s.slot}
                className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-2.5"
                title={`${s.starts} starts · ${s.avgPerStart} per start${s.topPlayer ? ` · most points: ${s.topPlayer.name}` : ""}`}
              >
                <div
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: slotTone(s.slot) }}
                >
                  {s.slot === "SUPER_FLEX" ? "SFLEX" : s.slot}
                </div>
                <div className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{s.avgPerWeek}</div>
                <div className="text-[10px] text-[var(--muted)]">
                  per wk · {ordinal(s.rank)} in league
                </div>
              </div>
            ))}
          </div>
          <p className="-mt-6 mb-8 text-xs text-[var(--muted)]">
            Points per team-week from each starting slot. Two-slot groups (RB, WR, and FLEX since 2025) are roughly
            double a single slot — see the{" "}
            <Link href="/breakdown" className="text-[var(--accent)] hover:underline">
              league breakdown
            </Link>{" "}
            for per-start comparisons.
          </p>
        </>
      )}

      {/* season by season */}
      <SectionTitle>Season by season</SectionTitle>
      <Card className="mb-8 overflow-x-auto scroll-thin">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
              <th className="py-2 pr-3">Season</th>
              <th className="px-3">Record</th>
              <th className="px-3">Finish</th>
              <th className="px-3">PF</th>
              <th className="px-3">All-play%</th>
              <th className="px-3">Luck</th>
              <th className="px-3">IQ</th>
              <th className="px-3"></th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((s) => (
              <tr key={s.season} className="border-t border-[var(--border)]">
                <td className="py-2 pr-3 tabular-nums">{s.season}</td>
                <td className="px-3 tabular-nums">
                  {s.wins}-{s.losses}
                  {s.ties ? `-${s.ties}` : ""}
                </td>
                <td className="px-3 tabular-nums">{s.finish ? (s.finish === 1 ? "🏆 1st" : ordinal(s.finish)) : "—"}</td>
                <td className="px-3 tabular-nums text-[var(--muted)]">{s.pointsFor}</td>
                <td className="px-3 tabular-nums text-[var(--muted)]">{(s.allPlayWinPct * 100).toFixed(0)}%</td>
                <td className={`px-3 tabular-nums ${s.luck > 0 ? "text-[var(--accent)]" : s.luck < 0 ? "text-[var(--bad)]" : ""}`}>{signed(s.luck)}</td>
                <td className="px-3 tabular-nums text-[var(--muted)]">{(s.efficiency * 100).toFixed(0)}%</td>
                <td className="px-3">
                  <Link href={`/wrapped/${s.season}/${userId}`} className="text-xs text-[var(--accent)] hover:underline">
                    wrapped →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* awards + best trade */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle>🏅 Awards won ({awards.length})</SectionTitle>
          <Card>
            {awards.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">No awards yet.</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {awards.map(({ season, award }, i) => (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <span>
                      <span className="text-[var(--muted)]">{season}</span> · {award.title}
                    </span>
                    <Badge tone={award.kind === "serious" ? "good" : "gold"}>{award.value}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <div>
          <SectionTitle>🧾 Signature trade</SectionTitle>
          <Card>
            {bestTrade ? (
              <div>
                <div className="mb-2 text-xs text-[var(--muted)]">
                  {bestTrade.t.season} · Wk {bestTrade.t.week} · {bestTrade.net} career points acquired
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {bestTrade.t.sides
                    .find((s) => s.userId === userId)
                    ?.received.map((a, i) =>
                      a.kind === "player" ? (
                        <span key={i} className="flex items-center gap-1.5 rounded-full bg-[var(--card-2)] px-2 py-1 text-xs">
                          <PlayerAvatar playerId={a.playerId} size={18} />
                          {a.name}
                        </span>
                      ) : (
                        <span key={i} className="rounded-full bg-[var(--card-2)] px-2 py-1 text-xs text-[var(--muted)]">
                          {a.season} R{a.round}
                          {a.becameName ? ` → ${a.becameName}` : ""}
                        </span>
                      ),
                    )}
                </div>
                <Link href="/trades" className="mt-3 inline-block text-xs text-[var(--accent)] hover:underline">
                  all trades →
                </Link>
              </div>
            ) : (
              <div className="text-sm text-[var(--muted)]">No trades on record.</div>
            )}
          </Card>
        </div>
      </div>

      {topRival && (
        <p className="mt-6 text-sm text-[var(--muted)]">
          Fiercest rivalry:{" "}
          <Link href={`/compare/${userId}/${topRival.oppId}`} className="text-[var(--accent)] hover:underline">
            {label(topRival.oppId)}
          </Link>{" "}
          (heat {topRival.heat}, {topRival.myWins}-{topRival.oppWins}).
        </p>
      )}
    </div>
  );
}
