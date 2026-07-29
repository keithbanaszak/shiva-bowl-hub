import Link from "next/link";
import type { ReactNode } from "react";
import { Card, PageHeader, TileLink } from "@/components/ui";
import { Avatar, ManagerChip } from "@/components/Manager";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PosBadge } from "@/components/Pos";
import { ActivityRow } from "@/components/activity/ActivityRow";
import { ActivityBySeason } from "@/components/charts/ActivityBySeason";
import { FitText } from "@/components/FitText";
import { chain, completedSeasons, label } from "@/lib/marts";
import { playoffsForSeason } from "@/lib/data/playoffs";
import { standingsForSeason } from "@/lib/data/standings";
import { schedule } from "@/lib/data/schedule";
import { leagueConfig } from "@/league.config";
import { home } from "@/lib/data/home";
import { events } from "@/lib/data/activity";
import { upcoming } from "@/lib/data/upcoming";
import type { ScheduleMatchup, UpcomingMatchup } from "@/lib/stats/types";

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHead({
  title,
  href,
  linkText,
}: {
  title: ReactNode;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 border-b border-[var(--border)] pb-2">
      <h2 className="font-display text-lg font-semibold tracking-tight">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-xs text-[var(--accent)] hover:underline"
        >
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
        <span className="font-display uppercase tracking-widest text-[var(--accent-2)]">
          ★ Game of the Week
        </span>
        <span className="text-[var(--muted)]">
          {m.season} · Wk {m.week}
          {m.isPlayoff ? " · Playoffs" : ""}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex min-w-0 flex-1 items-center gap-2 ${aWin ? "" : "opacity-70"}`}
        >
          <Avatar userId={m.aUserId} size={32} />
          <span className="truncate text-sm font-medium">
            {label(m.aUserId)}
          </span>
        </div>
        <div className="shrink-0 text-center font-mono tabular-nums">
          <span className={aWin ? "font-bold text-[var(--accent)]" : ""}>
            {m.aPoints}
          </span>
          <span className="mx-1 text-[var(--muted)]">–</span>
          <span className={bWin ? "font-bold text-[var(--accent)]" : ""}>
            {m.bPoints}
          </span>
        </div>
        <div
          className={`flex min-w-0 flex-1 items-center justify-end gap-2 text-right ${bWin ? "" : "opacity-70"}`}
        >
          <span className="truncate text-sm font-medium">
            {label(m.bUserId)}
          </span>
          <Avatar userId={m.bUserId} size={32} />
        </div>
      </div>
      {m.reason && (
        <div className="mt-3 text-center text-xs text-[var(--muted)]">
          {m.reason}
        </div>
      )}
      <Link
        href={`/schedule/${m.season}`}
        className="mt-3 text-center text-xs text-[var(--accent)] hover:underline"
      >
        full schedule →
      </Link>
    </Card>
  );
}

/** The upcoming marquee game, shown in the hero when a season is scheduled. */
function UpcomingGotwCard({ m }: { m: UpcomingMatchup }) {
  const aFav = m.aProj >= m.bProj;
  return (
    <Card className="flex h-full flex-col justify-center border-[var(--accent-2-border)]">
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="font-display uppercase tracking-widest text-[var(--accent-2)]">
          ★ Projected Game of the Week
        </span>
        <span className="text-[var(--muted)]">
          {m.season} · Wk {m.week} · upcoming
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex min-w-0 flex-1 items-center gap-2 ${aFav ? "" : "opacity-70"}`}
        >
          <Avatar userId={m.aUserId} size={32} />
          <span className="truncate text-sm font-medium">{label(m.aUserId)}</span>
        </div>
        <div className="shrink-0 text-center font-mono tabular-nums">
          <span className={aFav ? "font-bold text-[var(--accent)]" : ""}>
            {m.aProj}
          </span>
          <span className="mx-1 text-[var(--muted)]">–</span>
          <span className={!aFav ? "font-bold text-[var(--accent)]" : ""}>
            {m.bProj}
          </span>
        </div>
        <div
          className={`flex min-w-0 flex-1 items-center justify-end gap-2 text-right ${!aFav ? "" : "opacity-70"}`}
        >
          <span className="truncate text-sm font-medium">{label(m.bUserId)}</span>
          <Avatar userId={m.bUserId} size={32} />
        </div>
      </div>
      <div className="mt-3 text-center text-[11px] text-[var(--muted)]">
        Projected best-lineup totals
      </div>
      <Link
        href={`/schedule/${m.season}`}
        className="mt-1 text-center text-xs text-[var(--accent)] hover:underline"
      >
        full schedule →
      </Link>
    </Card>
  );
}

/** One compact projected matchup row for the "upcoming week" strip. */
function UpcomingRow({ m }: { m: UpcomingMatchup }) {
  const aFav = m.aProj >= m.bProj;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-2.5 py-2">
      {m.isGameOfWeek && (
        <span
          aria-hidden
          title="Projected game of the week"
          className="shrink-0 text-[var(--accent-2)]"
        >
          ★
        </span>
      )}
      <div
        className={`flex min-w-0 flex-1 items-center gap-1.5 ${aFav ? "" : "opacity-70"}`}
      >
        <Avatar userId={m.aUserId} size={20} />
        <Link
          href={`/managers/${m.aUserId}`}
          className="min-w-0 flex-1 truncate text-xs hover:text-[var(--accent)]"
        >
          {label(m.aUserId)}
        </Link>
      </div>
      <div className="shrink-0 text-center font-mono text-[11px] tabular-nums">
        <span className={aFav ? "font-semibold text-[var(--accent)]" : "text-[var(--muted)]"}>
          {m.aProj}
        </span>
        <span className="mx-1 text-[var(--faint)]">–</span>
        <span className={!aFav ? "font-semibold text-[var(--accent)]" : "text-[var(--muted)]"}>
          {m.bProj}
        </span>
      </div>
      <div
        className={`flex min-w-0 flex-1 items-center justify-end gap-1.5 text-right ${!aFav ? "" : "opacity-70"}`}
      >
        <Link
          href={`/managers/${m.bUserId}`}
          className="min-w-0 flex-1 truncate text-xs hover:text-[var(--accent)]"
        >
          {label(m.bUserId)}
        </Link>
        <Avatar userId={m.bUserId} size={20} />
      </div>
    </div>
  );
}

export default function Home() {
  const seasons = completedSeasons();
  const latest = seasons[0] ?? null;
  const span = seasons.length ? `${seasons[seasons.length - 1]}–${seasons[0]}` : "";

  // Season state drives the hero. A season only counts as "live" once it has
  // actually played a game (standings exist) — Sleeper flags a rolled-over
  // season in_season the moment its schedule is generated, months before
  // kickoff, so we key off real results, not status. While live we lead with the
  // current title race; otherwise we crown the reigning champion, the winner of
  // the most recently *finished* season.
  const inSeason = chain.find((c) => c.status === "in_season")?.season ?? null;
  const liveStandings = inSeason ? standingsForSeason(inSeason) : [];
  const liveActive = !!inSeason && liveStandings.length > 0;
  const leader = liveActive ? liveStandings[0] : null;

  const lastComplete =
    chain
      .filter((c) => c.status === "complete")
      .map((c) => c.season)
      .sort((a, b) => Number(b) - Number(a))[0] ?? null;
  const champ = lastComplete
    ? (playoffsForSeason(lastComplete)?.championUserId ?? null)
    : null;

  const latestGotw = [...schedule]
    .filter((m) => m.isGameOfWeek)
    .sort(
      (a, b) =>
        Number(b.season) * 100 + b.week - (Number(a.season) * 100 + a.week),
    )[0];

  // upcoming (scheduled-but-unplayed) week — drives the "what's next" preview
  const hasUpcoming = upcoming.nextWeek != null;
  const upWeekGames = hasUpcoming
    ? upcoming.matchups.filter((m) => m.week === upcoming.nextWeek)
    : [];
  const upGotw = upWeekGames.find((m) => m.isGameOfWeek) ?? upWeekGames[0] ?? null;

  const seasonStandings = latest ? standingsForSeason(latest) : [];
  const maxPf = Math.max(...seasonStandings.map((r) => r.pointsFor), 0);
  const lp = home.lastPlayed;
  const recent = events.slice(0, 8);

  return (
    <div>
      <PageHeader
        kicker={`${leagueConfig.tagline} · ${span}`}
        title={leagueConfig.name}
      />

      {/* hero: season-aware — the current title race while a season is live,
          the reigning champion between seasons — plus the marquee game */}
      <div className="mb-8 grid grid-cols-1 items-stretch gap-3 lg:grid-cols-3">
        {liveActive && leader ? (
          <Card className="relative flex flex-col justify-center overflow-hidden border-[var(--border-glow)]">
            <div className="pointer-events-none absolute -right-4 -top-6 text-7xl opacity-10">
              📈
            </div>
            <div className="font-display text-xs uppercase tracking-widest text-[var(--accent)]">
              {inSeason} in progress{lp ? ` · through Wk ${lp.week}` : ""}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-wider text-[var(--muted)]">
              Current leader
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Avatar userId={leader.userId} size={52} />
              <div className="min-w-0">
                <Link
                  href={`/managers/${leader.userId}`}
                  className="text-lg font-semibold hover:underline"
                >
                  {label(leader.userId)}
                </Link>
                <div className="font-mono text-xs text-[var(--muted)]">
                  {leader.wins}-{leader.losses} · {Math.round(leader.pointsFor)}{" "}
                  PF
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <Link
                href="/playoffs"
                className="text-[var(--accent)] hover:underline"
              >
                playoff picture →
              </Link>
              {champ && (
                <span className="text-[var(--muted)]">
                  Reigning:{" "}
                  <Link
                    href={`/awards/${lastComplete}`}
                    className="text-[var(--gold)] hover:underline"
                  >
                    {label(champ)}
                  </Link>
                </span>
              )}
            </div>
          </Card>
        ) : (
          <Card className="relative flex flex-col justify-center overflow-hidden border-[var(--gold-border)] bg-[var(--gold-soft)]">
            <div className="pointer-events-none absolute -right-4 -top-6 text-7xl opacity-10">
              🏆
            </div>
            <div className="font-display text-xs uppercase tracking-widest text-[var(--gold)]">
              Reigning Champion · {lastComplete}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Avatar userId={champ} size={52} />
              <Link
                href={`/managers/${champ}`}
                className="text-lg font-semibold text-[var(--gold)] hover:underline"
              >
                {label(champ)}
              </Link>
            </div>
            <Link
              href={`/awards/${lastComplete}`}
              className="mt-3 inline-block text-xs text-[var(--gold)] hover:underline"
            >
              {lastComplete} awards →
            </Link>
          </Card>
        )}
        <div className="lg:col-span-2">
          {upGotw ? (
            <UpcomingGotwCard m={upGotw} />
          ) : (
            latestGotw && <GameOfWeekCard m={latestGotw} />
          )}
        </div>
      </div>

      {/* activity feed + standings */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-8">
          {hasUpcoming && upWeekGames.length > 0 && (
            <section>
              <SectionHead
                title={`🔮 Upcoming · ${upcoming.season} Week ${upcoming.nextWeek}`}
                href={`/schedule/${upcoming.season}`}
                linkText="full schedule"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {upWeekGames.map((m) => (
                  <UpcomingRow key={m.matchupId} m={m} />
                ))}
              </div>
              <div className="mt-2 text-[11px] text-[var(--muted)]">
                Projected best-lineup totals from each team&rsquo;s current
                roster — the season hasn&rsquo;t kicked off yet.
              </div>
            </section>
          )}

          {lp && home.weeklyAwards.length > 0 && (
            <section>
              <SectionHead
                title={`📣 ${lp.season} Week ${lp.week}`}
                href={`/schedule/${lp.season}`}
                linkText="schedule"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {home.weeklyAwards.map((a) => (
                  <Panel key={a.key}>
                    <div className="text-xs text-[var(--muted)]">
                      {a.emoji} {a.title}
                    </div>
                    <div className="mt-1.5">
                      <ManagerChip
                        userId={a.userId}
                        href={`/managers/${a.userId}`}
                        size={22}
                        className="font-medium"
                      />
                    </div>
                    <div className="mt-1.5 font-mono text-xs text-[var(--gold)]">
                      {a.value}
                    </div>
                  </Panel>
                ))}
              </div>
              {/* wraps instead of scrolling sideways — six fixed cells always fit */}
              {home.topPerformers.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {home.topPerformers.map((p) => (
                    <div
                      key={p.pos}
                      className="flex min-w-0 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-2 py-1.5"
                    >
                      <PosBadge pos={p.pos} />
                      <PlayerAvatar playerId={p.playerId} size={20} />
                      <Link
                        href={`/players/${p.playerId}`}
                        className="min-w-0 flex-1 hover:text-[var(--accent)]"
                      >
                        <FitText className="text-[11px]">{p.name}</FitText>
                      </Link>
                      <span className="shrink-0 font-mono text-[11px] font-semibold text-[var(--accent)]">
                        {p.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section>
            <SectionHead
              title="⚡ Latest activity"
              href="/activity"
              linkText="full feed"
            />
            <div className="space-y-1.5">
              {recent.map((e) => (
                <ActivityRow key={e.id} e={e} />
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
                    className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-center transition hover:border-[var(--gold-border)]"
                  >
                    <div className="text-xs uppercase tracking-widest text-[var(--muted)]">
                      {season}
                    </div>
                    <div className="mx-auto my-2 w-fit">
                      <Avatar userId={po?.championUserId} size={40} />
                    </div>
                    <div className="truncate text-sm font-medium text-[var(--gold)]">
                      {label(po?.championUserId)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <SectionHead title="Explore" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <TileLink
                href="/activity"
                emoji="⚡"
                title="League Activity"
                desc="Every trade, add and drop, in order."
              />
              <TileLink
                href="/integrity"
                emoji="🔍"
                title="Lineup Integrity"
                desc="Tank watch — lineups vs projections."
              />
              <TileLink
                href="/breakdown"
                emoji="🎛️"
                title="Breakdown"
                desc="Scoring by position and lineup slot."
              />
              <TileLink
                href="/rivalries"
                emoji="🔥"
                title="Rivalries"
                desc="The league's hottest feuds, ranked."
              />
              <TileLink
                href="/draft"
                emoji="🎯"
                title="Draft Room"
                desc="Rookie-draft steals and busts."
              />
              <TileLink
                href="/records"
                emoji="📈"
                title="Record Book"
                desc="Top weeks, blowouts, bench heists."
              />
            </div>
          </section>
        </div>

        {/* standings sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <SectionHead
            title={`📊 ${latest} Standings`}
            href={`/luck/${latest}`}
            linkText="luck"
          />
          <Panel>
            <div className="mb-2 flex items-center justify-between px-1 text-[11px] uppercase tracking-wider text-[var(--muted)]">
              <span>Team</span>
              <span className="flex gap-2">
                <span className="w-8 text-right">Rec</span>
                <span className="w-10 text-right">PF</span>
                <span
                  className="hidden w-10 text-right sm:inline-block"
                  title="Maximum possible points — every optimal lineup, all season"
                >
                  Max
                </span>
              </span>
            </div>
            <div className="space-y-0.5">
              {seasonStandings.map((r, i) => {
                // magnitude encoding: bar length is points-for against the league
                // leader, so the scoring spread is visible without reading numbers
                const share = maxPf > 0 ? (r.pointsFor / maxPf) * 100 : 0;
                return (
                  <div key={r.userId} className="relative rounded-lg px-1 py-1">
                    <div
                      aria-hidden
                      className="absolute inset-y-0 left-0 rounded-lg bg-[var(--accent-soft)]"
                      style={{ width: `${share}%` }}
                    />
                    <div className="relative flex items-center gap-2 text-sm">
                      <span className="w-4 shrink-0 text-right font-mono text-[11px] text-[var(--muted)]">
                        {i + 1}
                      </span>
                      <Avatar userId={r.userId} size={20} />
                      <Link
                        href={`/managers/${r.userId}`}
                        className="min-w-0 flex-1 text-xs hover:text-[var(--accent)]"
                      >
                        <FitText>{label(r.userId)}</FitText>
                      </Link>
                      {r.champion && <span title="Champion">🏆</span>}
                      <span className="w-8 shrink-0 text-right font-mono text-[11px] tabular-nums text-[var(--muted)]">
                        {r.wins}-{r.losses}
                      </span>
                      <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums">
                        {Math.round(r.pointsFor)}
                      </span>
                      {/* max PF = every week's optimal lineup; the gap is what start/sit cost */}
                      <span
                        className="hidden w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-[var(--muted)] sm:inline-block"
                        title={`Max possible ${Math.round(r.seasonPpts)} · left ${Math.round(r.benchPoints)} on the bench (${(r.efficiency * 100).toFixed(0)}% efficiency)`}
                      >
                        {Math.round(r.seasonPpts)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 border-t border-[var(--border)] px-1 pt-2 text-[10px] text-[var(--muted)]">
              Bar = points for vs the league leader. Max = every optimal lineup,
              so the PF/Max gap is what start-sit decisions cost.
            </div>
          </Panel>
          <div className="mt-6">
            <ActivityBySeason events={events} />
          </div>
        </aside>
      </div>
    </div>
  );
}
