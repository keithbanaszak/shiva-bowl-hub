import { notFound } from "next/navigation";
import { ScheduleView } from "@/components/views/ScheduleView";
import { seasonsWithSchedule } from "@/lib/data/schedule";

export function generateStaticParams() {
  return seasonsWithSchedule().map((season) => ({ season }));
}

export default async function ScheduleSeasonPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;
  if (!seasonsWithSchedule().includes(season)) notFound();
  return <ScheduleView season={season} />;
}
