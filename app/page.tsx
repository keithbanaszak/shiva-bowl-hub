import Link from "next/link";
import type { ReactNode } from "react";
import { Card, PageHeader, TileLink, Badge } from "@/components/ui";
import { Avatar, ManagerChip } from "@/components/Manager";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PosBadge } from "@/components/Pos";
import { TradeCard } from "@/components/TradeCard";
import { completedSeasons, label } from "@/lib/marts";
import { playoffsForSeason } from "@/lib/data/playoffs";
import { trades } from "@/lib/data/trades";
import { waivers } from "@/lib/data/waivers";
import { standingsForSeason } from "@/lib/data/standings";
import { schedule } from "@/lib/data/schedule";
import { home } from "@/lib/data/home";
import { pname } from "@/lib/data/players-dict";
import type { ScheduleMatchup, WaiverMove } from "@/lib/stats/types";

const fmtDate = (ms: number | null) =>
  ms ? new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 ${className}`}>{children}</div>;
}

/** Consistent section header with a separating rule, used for every block. */
function SectionHead({ title, href, linkText }: { title: ReactNode; href?: string; linkText?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 border-b border-[var(--border)] pb-2">
      <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
      {href && (
        <Link href={href} className="shrink-0 text-xs text-emerald-300 hover:underline">
          {linkText ?? "see all"} →
        </Link>
      )}
    </div>
  );
}

function GameOfWeekCard({ m }: { m: ScheduleMatchup }) {
  const aWin = m.winnerUserId === m.aUserId;
  const bWin = m.winnerUserId === m.bUserId;
  return (
    <Card className="flex h-full flex-col justify-center">
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="font-display uppercase tracking-widest text-accent-2">★ Game of the Week</span>
        <span className="text-[var(--muted)]">
          {m.season} · Wk {m.week}
          {m.isPlayoff ? " · Playoffs" : ""}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className={`flex min-w-0 flex-1 items-center gap-2 ${aWin ? "" : "opacity-70"}`}>
          <Avatar userId={m.aUserId} size={32} />
          <span className="truncate text-sm font-medium">{label(m.aUserId)}</span>
        </div>
        <div className="shrink-0 text-center font-mono tabular-nums">
          <span className={aWin ? "font-bold text-emerald-300" : ""}>{m.aPoints}</span>
          <span className="mx-1 text-[var(--muted)]">–</span>
          <span className={bWin ? "font-bold text-emerald-300" : ""}>{m.bPoints}</span>
        </div>
        <div className={`flex min-w-0 flex-1 items-center justify-end gap-2 text-right ${bWin ? "" : "opacity-70"}`}>
          <span className="truncate text-sm font-medium">{label(m.bUserId)}</span>
          <Avatar userId={m.bUserId} size={32} />
        </div>
      </div>
      {m.reason && <div className="mt-3 text-center text-xs text-[var(--muted)]">{m.reason}</div>}
      <Link href={`/schedule/${m.season}`} className="mt-3 text-center text-xs text-emerald-300 hover:underline">
        full schedule →
      </Link>
    </Card>
  );
}

function MoveItem({ m }: { m: WaiverMove }) {
  const pid = m.addPlayerId ?? m.dropPlayerId;
  const isAdd = !!m.addPlayerId;
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-white/[0.02] p-2.5">
      <div className="flex min-w-0 items-center gap-2">
        {pid && <PlayerAvatar playerId={pid} size={26} />}
        <div className="min-w-0">
          {pid && (
            <div className={`truncate text-sm ${isAdd ? "text-emerald-300" : "text-rose-300/80"}`}>
              {isAdd ? "+" : "−"} {pname(pid)}
            </div>
          )}
          <div className="truncate text-[11px] text-[var(--muted)]">
            <ManagerChip userId={m.userId} size={14} />
          </div>
        </div>
      </div>
      <div className="shrink-0 text-right text-[11px] text-[var(--muted)]">
        {m.faab > 0 ? <div className="font-mono text-amber-300">${m.faab}</div> : <div>{isAdd ? "free" : "drop"}</div>}
        <div>{fmtDate(m.dateMs)}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const seasons = completedSeasons();
  const latest = seasons[0];
  const span = seasons.length ? `${seasons[seasons.length - 1]}–${latest}` : "";
  const champ = playoffsForSeason(latest)?.championUserId ?? null;

  const recentTrades = trades.slice(0, 3);
  const recentMoves = waivers.recentMoves.slice(0, 6);
  const bestAdd = waivers.seasonLeaders.find((s) => s.season === latest)?.bestFreeAdd ?? null;

  const latestGotw = [...schedule]
    .filter((m) => m.isGameOfWeek)
    .sort((a, b) => Number(b.season) * 100 + b.week - (Number(a.season) * 100 + a.week))[0];

  const seasonStandings = standingsForSeason(latest);
  const lp = home.lastPlayed;

  return (
    <div>
      <PageHeader kicker={`Dynasty hub · ${span}`} title="The Shiva Bowl" />

      {/* hero: champion + marquee game */}
      <div className="mb-10 grid grid-cols-1 items-stretch gap-3 lg:grid-cols-3">
        <Card className="relative flex flex-col justify-center overflow-hidden border-amber-400/30 bg-amber-400/[0.04]">
          <div className="pointer-events-none absolute -right-4 -top-6 text-7xl opacity-10">🏆</div>
          <div className="font-display text-xs uppercase tracking-widest text-amber-300/80">
            Reigning Champion · {latest}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Avatar userId={champ} size={52} />
            <Link href={`/managers/${champ}`} className="text-lg font-semibold text-amber-200 hover:underline">
              {label(champ)}
            </Link>
          </div>
          <Link href={`/awards/${latest}`} className="mt-3 inline-block text-xs text-amber-300/80 hover:underline">
            {latest} awards →
          </Link>
        </Card>
        <div className="lg:col-span-2">{latestGotw && <GameOfWeekCard m={latestGotw} />}</div>
      </div>

      {/* around the league last week */}
      {lp && (home.topPerformers.length > 0 || home.weeklyAwards.length > 0) && (
        <section className="mb-10">
          <SectionHead title={`📣 Around the league · ${lp.season} Week ${lp.week}`} href={`/schedule/${lp.season}`} linkText="schedule" />

          {home.topPerformers.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {home.topPerformers.map((p) => (
                <Panel key={p.pos}>
                  <div className="mb-1 flex items-center justify-between">
                    <PosBadge pos={p.pos} />
                    <span className="font-mono text-sm font-semibold text-emerald-300">{p.points}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PlayerAvatar playerId={p.playerId} size={24} />
                    <Link href={`/players/${p.playerId}`} className="min-w-0 truncate text-xs hover:text-emerald-300">
                      {p.name}
                    </Link>
                  </div>
                  <div className="mt-1 truncate text-[10px] text-[var(--muted)]">{label(p.userId)}</div>
                </Panel>
              ))}
            </div>
          )}

          {home.weeklyAwards.length > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {home.weeklyAwards.map((a) => (
                <Panel key={a.key}>
                  <div className="text-xs text-[var(--muted)]">
                    {a.emoji} {a.title}
                  </div>
                  <div className="mt-1.5">
                    <ManagerChip userId={a.userId} href={`/managers/${a.userId}`} size={22} className="font-medium" />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs">
                    <span className="font-mono text-amber-300">{a.value}</span>
                    {a.detail && (
                      <span className="flex items-center gap-1 text-[var(--muted)]">
                        vs <Avatar userId={a.detail} size={16} /> {label(a.detail)}
                      </span>
                    )}
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </section>
      )}

      {/* main column + standings sidebar */}
      <div className="grid gap-x-8 gap-y-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-10">
          <section>
            <SectionHead title="🧾 Recent trades" href="/trades" linkText="all trades" />
            <div className="space-y-3">
              {recentTrades.map((t) => (
                <TradeCard key={t.id} t={t} />
              ))}
            </div>
          </section>

          <section>
            <SectionHead title="🔁 Recent moves" href="/waivers" linkText="waiver hub" />
            {bestAdd?.playerId && (
              <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-2.5 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <PlayerAvatar playerId={bestAdd.playerId} size={26} />
                  <span className="min-w-0">
                    <span className="truncate font-medium text-emerald-200">{pname(bestAdd.playerId)}</span>
                    <span className="block text-[11px] text-[var(--muted)]">Best free add · {latest}</span>
                  </span>
                </span>
                <span className="shrink-0 font-mono text-sm text-emerald-300">{bestAdd.realizedSeason} pts</span>
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {recentMoves.map((m) => (
                <MoveItem key={m.id} m={m} />
              ))}
            </div>
          </section>

          <section>
            <SectionHead title="🏆 Champions" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {seasons.map((season) => {
                const po = playoffsForSeason(season);
                return (
                  <Link
                    key={season}
                    href={`/awards/${season}`}
                    className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-center transition hover:border-amber-400/40"
                  >
                    <div className="text-xs uppercase tracking-widest text-[var(--muted)]">{season}</div>
                    <div className="mx-auto my-2 w-fit">
                      <Avatar userId={po?.championUserId} size={40} />
                    </div>
                    <div className="truncate text-sm font-medium text-amber-200">{label(po?.championUserId)}</div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <SectionHead title="Explore" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <TileLink href="/teams" emoji="🛠️" title="Team Power" desc="Roster strength, contender ↔ rebuilder, pick capital." />
              <TileLink href="/rivalries" emoji="🔥" title="Rivalries" desc="The league's hottest feuds, ranked by heat." />
              <TileLink href="/draft" emoji="🎯" title="Draft Room" desc="Rookie-draft steals, busts, and the best drafters." />
              <TileLink href="/players" emoji="📇" title="Players" desc="Every player's league legacy and ownership." />
              <TileLink href="/luck" emoji="🍀" title="Schedule Luck" desc="All-play, median records, and the Fraud Detector." />
              <TileLink href="/records" emoji="📈" title="Record Book" desc="Top weeks, blowouts, and bench heists." />
            </div>
          </section>
        </div>

        {/* standings sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <SectionHead title={`📊 ${latest} Standings`} href={`/luck/${latest}`} linkText="luck" />
          <Panel>
            <div className="mb-2 flex items-center justify-between px-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
              <span>Team</span>
              <span>Rec · PF</span>
            </div>
            <div className="space-y-1">
              {seasonStandings.map((r, i) => (
                <div key={r.userId} className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm">
                  <span className="w-4 shrink-0 text-right font-mono text-[11px] text-[var(--muted)]">{i + 1}</span>
                  <Avatar userId={r.userId} size={20} />
                  <Link href={`/managers/${r.userId}`} className="min-w-0 flex-1 truncate text-xs hover:text-emerald-300">
                    {label(r.userId)}
                  </Link>
                  {r.champion && <span title="Champion">🏆</span>}
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--muted)]">
                    {r.wins}-{r.losses}
                  </span>
                  <span className="w-12 shrink-0 text-right font-mono text-[11px] tabular-nums">
                    {Math.round(r.pointsFor)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 border-t border-[var(--border)] px-1 pt-2 text-[10px] text-[var(--muted)]">
              Sorted by record, then points for.
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
