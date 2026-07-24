import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { Avatar } from "@/components/Manager";
import { completedSeasons, label } from "@/lib/marts";
import { playoffsForSeason } from "@/lib/data/playoffs";
import { awardsForSeason } from "@/lib/data/awards";

export default function AwardsIndex() {
  const seasons = completedSeasons();
  return (
    <div>
      <PageHeader
        kicker="Hall of honors"
        title="Awards"
        subtitle="Pick a season for champions, headlines, and the full slate of serious and not-so-serious awards."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {seasons.map((season) => {
          const po = playoffsForSeason(season);
          const merch = awardsForSeason(season).find(
            (a) => a.key === "schedule_merchant",
          );
          return (
            <Link
              key={season}
              href={`/awards/${season}`}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--gold-border)] hover:bg-[var(--card-2)]"
            >
              <div className="text-xs uppercase tracking-widest text-[var(--muted)]">
                {season}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <Avatar userId={po?.championUserId} size={32} />
                <span className="truncate font-semibold text-[var(--gold)] group-hover:text-[var(--gold)]">
                  {label(po?.championUserId)}
                </span>
              </div>
              {merch && (
                <div className="mt-3 text-xs text-[var(--muted)]">
                  Schedule Merchant: {label(merch.userId)} ({merch.value})
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
