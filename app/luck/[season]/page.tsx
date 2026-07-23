import { notFound } from "next/navigation";
import { LuckView } from "@/components/views/LuckView";
import { completedSeasons } from "@/lib/marts";

export function generateStaticParams() {
  return completedSeasons().map((season) => ({ season }));
}

export default async function LuckSeasonPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;
  if (!completedSeasons().includes(season)) notFound();
  return <LuckView season={season} />;
}
