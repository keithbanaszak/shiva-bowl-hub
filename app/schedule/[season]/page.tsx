import { notFound } from "next/navigation";
import { ScheduleView } from "@/components/views/ScheduleView";
import { UpcomingScheduleView } from "@/components/views/UpcomingScheduleView";
import { seasonsWithSchedule } from "@/lib/data/schedule";
import { upcoming } from "@/lib/data/upcoming";

/** Played seasons plus the upcoming (scheduled-but-unplayed) season, newest first. */
function scheduleSeasons(): { all: string[]; upcomingSeason: string | null } {
  const played = seasonsWithSchedule();
  const upcomingSeason =
    upcoming.season && !played.includes(upcoming.season) ? upcoming.season : null;
  return { all: [...(upcomingSeason ? [upcomingSeason] : []), ...played], upcomingSeason };
}

export function generateStaticParams() {
  return scheduleSeasons().all.map((season) => ({ season }));
}

export default async function ScheduleSeasonPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;
  const { all, upcomingSeason } = scheduleSeasons();
  if (!all.includes(season)) notFound();
  return season === upcomingSeason ? (
    <UpcomingScheduleView season={season} seasons={all} />
  ) : (
    <ScheduleView season={season} seasons={all} />
  );
}
