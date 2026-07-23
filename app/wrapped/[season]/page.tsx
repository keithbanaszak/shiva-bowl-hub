import { notFound } from "next/navigation";
import { WrappedGrid } from "@/components/views/WrappedGrid";
import { completedSeasons } from "@/lib/marts";

export function generateStaticParams() {
  return completedSeasons().map((season) => ({ season }));
}

export default async function WrappedSeasonPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;
  if (!completedSeasons().includes(season)) notFound();
  return <WrappedGrid season={season} />;
}
