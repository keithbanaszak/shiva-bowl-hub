import Link from "next/link";
import type { ReactNode } from "react";
import { Card, PageHeader, SectionTitle, Note } from "@/components/ui";
import { BarLeaderboard, type BarRow } from "@/components/BarLeaderboard";
import { RecordTable } from "@/components/records/RecordTable";
import { AllTimeTable } from "@/components/managers/AllTimeTable";
import { records } from "@/lib/data/records";
import { allTime } from "@/lib/marts";

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export default function RecordsPage() {
  const iq: BarRow[] = [...allTime]
    .sort((a, b) => b.careerEfficiency - a.careerEfficiency)
    .map((r) => ({
      userId: r.userId,
      display: pct(r.careerEfficiency),
      pct: r.careerEfficiency * 100,
    }));
  const allPlay: BarRow[] = [...allTime]
    .sort((a, b) => b.allPlayWinPct - a.allPlayWinPct)
    .map((r) => ({
      userId: r.userId,
      display: pct(r.allPlayWinPct),
      pct: r.allPlayWinPct * 100,
    }));
  const winPct: BarRow[] = [...allTime]
    .sort((a, b) => b.winPct - a.winPct)
    .map((r) => ({
      userId: r.userId,
      display: pct(r.winPct),
      pct: r.winPct * 100,
    }));

  return (
    <div>
      <PageHeader
        kicker="Records & rankings"
        title="The Record Book"
        subtitle="All-time manager rankings and the biggest single weeks in league history."
      />

      <SectionTitle>All-time manager rankings</SectionTitle>
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <div className="mb-3 text-sm font-semibold">
            🧠 Lineup IQ{" "}
            <span className="font-normal text-[var(--muted)]">
              (start/sit efficiency)
            </span>
          </div>
          <BarLeaderboard rows={iq} />
        </Card>
        <Card>
          <div className="mb-3 text-sm font-semibold">
            📊 All-play win%{" "}
            <span className="font-normal text-[var(--muted)]">
              (true strength)
            </span>
          </div>
          <BarLeaderboard rows={allPlay} />
        </Card>
        <Card>
          <div className="mb-3 text-sm font-semibold">🏅 Career win%</div>
          <BarLeaderboard rows={winPct} />
        </Card>
      </div>

      <SectionTitle>All-time manager table</SectionTitle>
      <div className="mb-3">
        <Note title="Regular season vs postseason">
          The first block is the <strong>regular season</strong> — record, win%
          and all-play%. The middle block is the <strong>postseason</strong>:
          playoff record counts winners-bracket games only, so consolation games
          do not pad it. Click any header to sort.
        </Note>
      </div>
      <div className="mb-10">
        <AllTimeTable caption="Sorted by regular-season win%. Column widths are fixed, so sorting never reflows the table." />
      </div>

      <div className="mb-2 text-sm text-[var(--muted)]">
        Want one manager’s full story?{" "}
        <Link href="/managers" className="text-[var(--accent)] hover:underline">
          Browse manager profiles →
        </Link>
      </div>

      <div className="mb-4 mt-6">
        <Note title="What counts as a record">
          Only weeks that were <strong>actual games</strong> are eligible. Week
          18 has no matchup in this league, so nobody sets a lineup — those
          weeks used to dominate the lowest-scoring and bench tables with scores
          nobody was trying to avoid.
        </Note>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <RecordTable
          emoji="🚀"
          title="Highest scoring weeks"
          rows={records.topWeeks}
          valueLabel="Points"
          tone="good"
        />
        <RecordTable
          emoji="💀"
          title="Lowest scoring weeks"
          rows={records.lowWeeks}
          valueLabel="Points"
          tone="bad"
        />
        <RecordTable
          emoji="🔨"
          title="Biggest blowouts"
          rows={records.biggestBlowouts}
          valueLabel="Margin"
          tone="gold"
        />
        <RecordTable
          emoji="🪑"
          title="Most points left on bench"
          rows={records.bestBenchWeeks}
          valueLabel="Bench pts"
          tone="gold"
        />
        <RecordTable
          emoji="🎆"
          title="Highest-scoring shootouts"
          rows={records.highestCombined}
          valueLabel="Combined"
          tone="good"
        />
      </div>
    </div>
  );
}
