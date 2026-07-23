import Link from "next/link";
import { PageHeader, Badge, signed } from "@/components/ui";
import { Avatar } from "@/components/Manager";
import { SeasonPills } from "@/components/SeasonPills";
import { completedSeasons, ordinal } from "@/lib/marts";
import { cardsForSeason } from "@/lib/data/cards";

export function WrappedGrid({ season }: { season: string }) {
  const seasons = completedSeasons();
  const cards = [...cardsForSeason(season)].sort((a, b) => (a.finish ?? 99) - (b.finish ?? 99));

  return (
    <div>
      <PageHeader
        kicker="Dynasty Wrapped"
        title={`${season} Wrapped`}
        subtitle="Tap a manager for their screenshotable season recap card."
      />
      <SeasonPills base="/wrapped" active={season} seasons={seasons} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.userId}
            href={`/wrapped/${season}/${c.userId}`}
            className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-emerald-400/40 hover:bg-white/[0.06]"
          >
            <div className="flex items-center gap-3">
              <Avatar userId={c.userId} size={40} />
              <div className="min-w-0">
                <div className="truncate font-semibold group-hover:text-emerald-300">{c.label}</div>
                <div className="text-xs text-[var(--muted)]">
                  {c.record} · {c.finish ? ordinal(c.finish) : "—"}
                </div>
              </div>
              {c.champion && <span className="ml-auto text-xl">🏆</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge>{c.pointsFor} PF</Badge>
              <Badge tone={c.luck > 0 ? "good" : c.luck < 0 ? "bad" : "default"}>luck {signed(c.luck)}</Badge>
              <Badge tone="gold">{c.benchPoints} on bench</Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
