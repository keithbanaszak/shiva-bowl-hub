import { ScheduleView } from "@/components/views/ScheduleView";
import { seasonsWithSchedule } from "@/lib/data/schedule";

export default function SchedulePage() {
  return <ScheduleView season={seasonsWithSchedule()[0]} />;
}
