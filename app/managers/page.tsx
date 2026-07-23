import Link from "next/link";
import { PageHeader, Badge } from "@/components/ui";
import { Avatar } from "@/components/Manager";
import { allTime, label, ordinal } from "@/lib/marts";

export default function ManagersPage() {
  return (
    <div>
      <PageHeader
        kicker="The franchises"
        title="Managers"
        subtitle="Tap a manager for their full dynasty résumé — trophies, season-by-season, awards, rivalries, and kryptonite."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allTime.map((r) => (
          <Link
            key={r.userId}
            href={`/managers/${r.userId}`}
            className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--border-glow)] hover:bg-[var(--card-2)]"
          >
            <div className="flex items-center gap-3">
              <Avatar userId={r.userId} size={44} />
              <div className="min-w-0">
                <div className="truncate font-semibold group-hover:text-[var(--accent)]">
                  {label(r.userId)}
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {r.wins}-{r.losses}
                  {r.ties ? `-${r.ties}` : ""} · {(r.winPct * 100).toFixed(0)}%
                </div>
              </div>
              {r.championships > 0 && (
                <span className="ml-auto text-lg">
                  {"🏆".repeat(Math.min(r.championships, 3))}
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge>IQ {(r.careerEfficiency * 100).toFixed(0)}%</Badge>
              <Badge>All-play {(r.allPlayWinPct * 100).toFixed(0)}%</Badge>
              {r.bestFinish && (
                <Badge tone="gold">Best {ordinal(r.bestFinish)}</Badge>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
