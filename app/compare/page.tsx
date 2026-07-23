import Link from "next/link";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { ComparePicker } from "@/components/ComparePicker";
import { activeManagers, label } from "@/lib/marts";
import { topRivalries } from "@/lib/data/h2h";

export default function ComparePage() {
  const managers = activeManagers().map((m) => ({ userId: m.userId, label: m.label }));
  const suggestions = topRivalries(6);

  return (
    <div>
      <PageHeader
        kicker="Head to head"
        title="Compare Managers"
        subtitle="Pick any two managers to see their full history: every meeting (with lineups), the all-time series, and every trade between them."
      />

      <Card className="mb-8">
        <ComparePicker managers={managers} />
      </Card>

      <SectionTitle>Or jump into a rivalry</SectionTitle>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((p) => (
          <Link
            key={`${p.aUserId}-${p.bUserId}`}
            href={`/compare/${p.aUserId}/${p.bUserId}`}
            className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm transition hover:border-[var(--border-glow)] hover:bg-[var(--card-2)]"
          >
            <span className="truncate">
              {label(p.aUserId)} <span className="text-[var(--muted)]">vs</span> {label(p.bUserId)}
            </span>
            <span className="shrink-0 text-xs text-[var(--muted)]">heat {p.heat}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
