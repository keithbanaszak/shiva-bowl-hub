import Link from "next/link";
import { PageHeader, SectionTitle, Badge, Note } from "@/components/ui";
import { Avatar } from "@/components/Manager";
import { topRivalries } from "@/lib/data/h2h";
import { label } from "@/lib/marts";

function heatTone(heat: number): "bad" | "gold" | "good" | "default" {
  if (heat >= 85) return "bad";
  if (heat >= 70) return "gold";
  if (heat >= 50) return "good";
  return "default";
}

export default function RivalriesPage() {
  const top = topRivalries(9);

  return (
    <div>
      <PageHeader
        kicker="Head to head"
        title="Rivalries"
        subtitle="The league's most heated feuds, ranked by Rivalry Heat."
      />

      <div className="mb-6">
        <Note title="What is Rivalry Heat?">
          A 0–100 score that rewards rivalries that are{" "}
          <strong>frequent</strong> (lots of meetings), <strong>even</strong>
          (neither manager dominates), <strong>close</strong> (small average
          margins), and <strong>high-stakes</strong> (playoff meetings count
          extra). Two teams that always play nail-biters score higher than a
          one-sided pairing.
        </Note>
      </div>

      <SectionTitle>🔥 Hottest rivalries</SectionTitle>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {top.map((p) => (
          <Link
            key={`${p.aUserId}-${p.bUserId}`}
            href={`/compare/${p.aUserId}/${p.bUserId}`}
            className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--bad-border)] hover:bg-[var(--card-2)]"
          >
            <div className="flex items-center justify-between">
              <Badge tone={heatTone(p.heat)}>Heat {p.heat}</Badge>
              <span className="text-xs text-[var(--muted)]">
                {p.games} games
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Avatar userId={p.aUserId} size={28} />
                <span className="truncate text-sm">{label(p.aUserId)}</span>
              </div>
              <span className="shrink-0 font-mono text-sm font-semibold">
                {p.aWins}-{p.bWins}
              </span>
              <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                <span className="truncate text-right text-sm">
                  {label(p.bUserId)}
                </span>
                <Avatar userId={p.bUserId} size={28} />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
              <span>avg margin {p.avgMargin}</span>
              {p.playoffAWins + p.playoffBWins > 0 && (
                <span>
                  playoffs {p.playoffAWins}-{p.playoffBWins}
                </span>
              )}
              <span className="text-[var(--accent)] group-hover:underline">
                compare →
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--muted)]">
        Want any specific matchup? Head to{" "}
        <Link href="/compare" className="text-[var(--accent)] hover:underline">
          Compare Managers
        </Link>{" "}
        to pick any two managers and see every meeting, lineup, and trade
        between them.
      </div>
    </div>
  );
}
