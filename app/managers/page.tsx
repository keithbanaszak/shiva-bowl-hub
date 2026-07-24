import Link from "next/link";
import { PageHeader, Badge, Note } from "@/components/ui";
import { Avatar } from "@/components/Manager";
import { FitText } from "@/components/FitText";
import { AllTimeTable } from "@/components/managers/AllTimeTable";
import { ManagerViews } from "@/components/managers/ManagerViews";
import { allTime, label, ordinal, getManager } from "@/lib/marts";

function Cards() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {allTime.map((r) => {
        const m = getManager(r.userId);
        return (
          <Link
            key={r.userId}
            href={`/managers/${r.userId}`}
            className={`group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--border-glow)] hover:bg-[var(--card-2)] ${
              m?.active === false ? "opacity-70" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar userId={r.userId} size={44} />
              <div className="min-w-0 flex-1">
                <div className="min-w-0 font-semibold group-hover:text-[var(--accent)]">
                  <FitText>{m?.realName || label(r.userId)}</FitText>
                </div>
                <div className="truncate text-xs text-[var(--muted)]">
                  {m?.realName ? `${label(r.userId)} · ` : ""}
                  {r.wins}-{r.losses}
                  {r.ties ? `-${r.ties}` : ""} · {(r.winPct * 100).toFixed(0)}%
                </div>
              </div>
              {r.championships > 0 && (
                <span className="ml-auto shrink-0 text-lg">{"🏆".repeat(Math.min(r.championships, 3))}</span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge>IQ {(r.careerEfficiency * 100).toFixed(0)}%</Badge>
              <Badge>All-play {(r.allPlayWinPct * 100).toFixed(0)}%</Badge>
              {r.bestFinish && <Badge tone="gold">Best {ordinal(r.bestFinish)}</Badge>}
              {m?.active === false && <Badge>✦ former</Badge>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function ManagersPage() {
  return (
    <div>
      <PageHeader
        kicker="The franchises"
        title="Managers"
        subtitle="Every manager's career at a glance. Click any name for their full dynasty résumé — trophies, season-by-season, awards, rivalries and kryptonite."
      />

      <div className="mb-4">
        <Note title="One table, two views">
          This is the same all-time table the{" "}
          <Link href="/records" className="text-[var(--accent)] hover:underline">
            Record Book
          </Link>{" "}
          shows, so the numbers can never drift apart. Every column sorts; the ✦ marks managers who have left the
          league, and the checkbox hides them.
        </Note>
      </div>

      <ManagerViews
        table={<AllTimeTable caption="Sorted by regular-season win%. Click any header to re-sort." />}
        cards={<Cards />}
      />
    </div>
  );
}
