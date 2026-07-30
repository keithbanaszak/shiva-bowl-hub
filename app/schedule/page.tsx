import { ScheduleView } from "@/components/views/ScheduleView";
import { UpcomingScheduleView } from "@/components/views/UpcomingScheduleView";
import { seasonsWithSchedule } from "@/lib/data/schedule";
import { upcoming } from "@/lib/data/upcoming";

export default function SchedulePage() {
  const played = seasonsWithSchedule();
  const upcomingSeason =
    upcoming.season && !played.includes(upcoming.season) ? upcoming.season : null;
  const all = [...(upcomingSeason ? [upcomingSeason] : []), ...played];

  // Default to the upcoming season when there is one — that's "what's next".
  return upcomingSeason ? (
    <UpcomingScheduleView season={upcomingSeason} seasons={all} />
  ) : (
    <ScheduleView season={played[0]} seasons={all} />
  );
}
