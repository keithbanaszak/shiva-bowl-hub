import Link from "next/link";
import { PageHeader, Badge, Note } from "@/components/ui";
import { SeasonPills } from "@/components/SeasonPills";
import { WeekCarousel } from "@/components/WeekCarousel";
import { Avatar } from "@/components/Manager";
import { label } from "@/lib/marts";
import { upcoming, upcomingForWeek } from "@/lib/data/upcoming";
import type { UpcomingMatchup } from "@/lib/stats/types";

/** One projected matchup — links to the two managers' head-to-head history. */
function ProjMatchup({
  m,
  featured = false,
}: {
  m: UpcomingMatchup;
  featured?: boolean;
}) {
  const aFav = m.aProj >= m.bProj;
  return (
    <Link
      href={`/compare/${m.aUserId}/${m.bUserId}`}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition hover:border-[var(--border-glow)] ${
        featured
          ? "border-[var(--gold-border)] bg-[var(--gold-soft)]"
          : "border-[var(--border)] bg-[var(--card)]"
      }`}
    >
      <div
        className={`flex min-w-0 flex-1 items-center gap-2 ${aFav ? "" : "opacity-70"}`}
      >
        <Avatar userId={m.aUserId} size={26} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {label(m.aUserId)}
        </span>
      </div>
      <div className="shrink-0 text-center font-mono text-sm tabular-nums">
        <span className={aFav ? "font-bold text-[var(--accent)]" : ""}>
          {m.aProj}
        </span>
        <span className="mx-1.5 text-[var(--muted)]">–</span>
        <span className={!aFav ? "font-bold text-[var(--accent)]" : ""}>
          {m.bProj}
        </span>
      </div>
      <div
        className={`flex min-w-0 flex-1 items-center justify-end gap-2 text-right ${!aFav ? "" : "opacity-70"}`}
      >
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {label(m.bUserId)}
        </span>
        <Avatar userId={m.bUserId} size={26} />
      </div>
    </Link>
  );
}

/**
 * The schedule for a season that hasn't kicked off yet — projected best-lineup
 * totals from each team's current roster (the upcoming mart), one week at a time.
 */
export function UpcomingScheduleView({
  season,
  seasons,
}: {
  season: string;
  seasons: string[];
}) {
  const weeks = upcoming.weeks;

  return (
    <div>
      <PageHeader
        kicker="Week by week · upcoming"
        title={`${season} Schedule`}
        subtitle="The season hasn't started — these are projected best-lineup totals from each team's current roster, week by week."
      />
      <SeasonPills base="/schedule" active={season} seasons={seasons} />

      <div className="mb-6">
        <Note title="Projected, not played">
          Every number here is a <strong>projection</strong>: the highest total
          each roster could put up that week by Sleeper&rsquo;s player
          projections. Real results replace these the moment games are played.
        </Note>
      </div>

      <WeekCarousel
        labels={weeks.map((w) => `${season} · Week ${w}`)}
        defaultIndex={0}
      >
        {weeks.map((w) => {
          const games = upcomingForWeek(w);
          const gotw = games.find((g) => g.isGameOfWeek) ?? games[0];
          const rest = games.filter((g) => g !== gotw);
          return (
            <div key={w}>
              {gotw && (
                <div className="mb-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge tone="gold">★ Projected Game of the Week</Badge>
                  </div>
                  <ProjMatchup m={gotw} featured />
                </div>
              )}
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {rest.map((m) => (
                  <ProjMatchup key={m.matchupId} m={m} />
                ))}
              </div>
            </div>
          );
        })}
      </WeekCarousel>
    </div>
  );
}
