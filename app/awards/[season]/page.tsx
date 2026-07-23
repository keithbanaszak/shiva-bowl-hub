import { notFound } from "next/navigation";
import { AwardsView } from "@/components/views/AwardsView";
import { completedSeasons } from "@/lib/marts";

export function generateStaticParams() {
  return completedSeasons().map((season) => ({ season }));
}

export default async function AwardsSeasonPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;
  if (!completedSeasons().includes(season)) notFound();
  return <AwardsView season={season} />;
}
