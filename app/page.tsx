import Link from "next/link";
import type { ReactNode } from "react";
import { Card, PageHeader, TileLink } from "@/components/ui";
import { Avatar, ManagerChip } from "@/components/Manager";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PosBadge } from "@/components/Pos";
import { ActivityRow } from "@/components/activity/ActivityRow";
import { ActivityBySeason } from "@/components/charts/ActivityBySeason";
import { FitText } from "@/components/FitText";
import { completedSeasons, label } from "@/lib/marts";
import { playoffsForSeason } from "@/lib/data/playoffs";
import { standingsForSeason } from "@/lib/data/standings";
import { schedule } from "@/lib/data/schedule";
import { home } from "@/lib/data/home";
import { events } from "@/lib/data/activity";
import type { ScheduleMatchup } from "@/lib/stats/types";

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

export default function Home() {
  const seasons = completedSeasons();
  const latest = seasons[0];
  const span = seasons.length ? `${seasons[seasons.length - 1]}–${latest}` : "";
  const champ = playoffsForSeason(latest)?.championUserId ?? null;

  const latestGotw = [...schedule]
    .filter((m) => m.isGameOfWeek)
    .sort(
      (a, b) =>
        Number(b.season) * 100 + b.week - (Number(a.season) * 100 + a.week),
    )[0];

  const seasonStandings = standingsForSeason(latest);
  const maxPf = Math.max(...seasonStandings.map((r) => r.pointsFor), 0);
  const lp = home.lastPlayed;
  const recent = events.slice(0, 14);

  return (
    <div>
      <PageHeader kicker={`Dynasty hub · ${span}`} title="The Shiva Bowl" />

      {/* hero: champion + marquee game */}
      <div className="mb-8 grid grid-cols-1 items-stretch gap-3 lg:grid-cols-3">
        <Card className="relative flex flex-col justify-center overflow-hidden border-[var(--gold-border)] bg-[var(--gold-soft)]">
          <div className="pointer-events-none absolute -right-4 -top-6 text-7xl opacity-10">
            🏆
          </div>
          <div className="font-display text-xs uppercase tracking-widest text-[var(--gold)]">
            Reigning Champion · {latest}
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
            href={`/awards/${latest}`}
            className="mt-3 inline-block text-xs text-[var(--gold)] hover:underline"
          >
            {latest} awards →
          </Link>
        </Card>
        <div className="lg:col-span-2">
          {latestGotw && <GameOfWeekCard m={latestGotw} />}
        </div>
      </div>

      {/* activity feed + standings */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
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
              {home.topPerformers.length > 0 && (
                <div className="scroll-thin mt-2 flex gap-2 overflow-x-auto pb-1">
                  {home.topPerformers.map((p) => (
                    <div
                      key={p.pos}
                      className="flex shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-2.5 py-2"
                    >
                      <PosBadge pos={p.pos} />
                      <PlayerAvatar playerId={p.playerId} size={22} />
                      <Link
                        href={`/players/${p.playerId}`}
                        className="text-xs hover:text-[var(--accent)]"
                      >
                        {p.name}
                      </Link>
                      <span className="font-mono text-xs font-semibold text-[var(--accent)]">
                        {p.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

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
            <div className="mb-2 flex items-center justify-between px-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
              <span>Team</span>
              <span>Rec · PF</span>
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
                        <FitText fits={17}>{label(r.userId)}</FitText>
                      </Link>
                      {r.champion && <span title="Champion">🏆</span>}
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--muted)]">
                        {r.wins}-{r.losses}
                      </span>
                      <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums">
                        {Math.round(r.pointsFor)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 border-t border-[var(--border)] px-1 pt-2 text-[10px] text-[var(--muted)]">
              Bar length is points for, against the league leader.
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
