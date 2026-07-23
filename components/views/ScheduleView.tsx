import { Card, PageHeader, Badge, Note } from "@/components/ui";
import { MatchupBar } from "@/components/MatchupBar";
import { SeasonPills } from "@/components/SeasonPills";
import { WeekCarousel } from "@/components/WeekCarousel";
import { label } from "@/lib/marts";
import { seasonsWithSchedule, weeksForSeason, matchupsForWeek } from "@/lib/data/schedule";
import type { ScheduleMatchup } from "@/lib/stats/types";

function seriesText(m: ScheduleMatchup): string {
  const s = m.seriesBefore;
  if (!s || (s.aWins === 0 && s.bWins === 0)) return "First-ever meeting";
  if (s.aWins === s.bWins) return `Series even ${s.aWins}-${s.bWins} coming in`;
  const leader = s.aWins > s.bWins ? m.aUserId : m.bUserId;
  return `${label(leader)} led the series ${Math.max(s.aWins, s.bWins)}-${Math.min(s.aWins, s.bWins)} coming in`;
}

function GameOfWeek({ m }: { m: ScheduleMatchup }) {
  return (
    <Card className="relative mb-3 overflow-hidden border-amber-400/30 bg-amber-400/[0.04]">
      <div className="pointer-events-none absolute -right-4 -top-6 text-6xl opacity-10">⭐</div>
      <div className="mb-3 flex items-center gap-2">
        <Badge tone="gold">Game of the Week</Badge>
        {m.isPlayoff && <Badge tone="info">Playoff</Badge>}
      </div>
      <MatchupBar
        aUserId={m.aUserId}
        bUserId={m.bUserId}
        aPoints={m.aPoints}
        bPoints={m.bPoints}
        aProj={m.aProj}
        bProj={m.bProj}
        winnerUserId={m.winnerUserId}
        href={`/compare/${m.aUserId}/${m.bUserId}`}
        featured
      />
      <div className="mt-3 text-sm text-amber-200">{m.reason}</div>
      <div className="mt-0.5 text-xs text-[var(--muted)]">{seriesText(m)}</div>
    </Card>
  );
}

function WeekSection({ season, week }: { season: string; week: number }) {
  const all = matchupsForWeek(season, week);
  const gotw = all.find((m) => m.isGameOfWeek) ?? all[0];
  const rest = all.filter((m) => m !== gotw);
  return (
    <div>
      {gotw && <GameOfWeek m={gotw} />}
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {rest.map((m, i) => (
          <MatchupBar
            key={i}
            aUserId={m.aUserId}
            bUserId={m.bUserId}
            aPoints={m.aPoints}
            bPoints={m.bPoints}
            aProj={m.aProj}
            bProj={m.bProj}
            winnerUserId={m.winnerUserId}
            href={`/compare/${m.aUserId}/${m.bUserId}`}
          />
        ))}
      </div>
    </div>
  );
}

export function ScheduleView({ season }: { season: string }) {
  const seasons = seasonsWithSchedule();
  const weeks = weeksForSeason(season);

  return (
    <div>
      <PageHeader
        kicker="Week by week"
        title={`${season} Schedule`}
        subtitle="One week at a time — left teams in blue, right in red, winner's side darkened. Small number is the projected total."
      />
      <SeasonPills base="/schedule" active={season} seasons={seasons} />

      <div className="mb-6">
        <Note title="Game of the Week">
          Each week's most compelling matchup — chosen from rivalry heat, recent trades between the two,
          championship-rematch history, both being top scorers, playoff stakes, and final margin.
        </Note>
      </div>

      <WeekCarousel labels={weeks.map((w) => `${season} · Week ${w}`)} defaultIndex={weeks.length - 1}>
        {weeks.map((w) => {
          const playoff = matchupsForWeek(season, w)[0]?.isPlayoff;
          return (
            <div key={w}>
              {playoff && (
                <div className="mb-3 flex justify-center">
                  <Badge tone="gold">Playoffs</Badge>
                </div>
              )}
              <WeekSection season={season} week={w} />
            </div>
          );
        })}
      </WeekCarousel>
    </div>
  );
}
