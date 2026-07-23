import Link from "next/link";
import { Card, PageHeader, SectionTitle, signed } from "@/components/ui";
import { ManagerChip } from "@/components/Manager";
import { BarLeaderboard, type BarRow } from "@/components/BarLeaderboard";
import { records } from "@/lib/data/records";
import { allTime, label, ordinal } from "@/lib/marts";
import type { RecordEntry } from "@/lib/stats/types";

function RecordTable({
  title,
  emoji,
  rows,
  valueLabel,
  vs = true,
  tone = "default",
}: {
  title: string;
  emoji: string;
  rows: RecordEntry[];
  valueLabel: string;
  vs?: boolean;
  tone?: "default" | "good" | "bad" | "gold";
}) {
  const valueClass =
    tone === "good" ? "text-[var(--accent)]" : tone === "bad" ? "text-[var(--bad)]" : tone === "gold" ? "text-[var(--gold)]" : "text-[var(--foreground)]";
  return (
    <div>
      <SectionTitle>
        {emoji} {title}
      </SectionTitle>
      <Card className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
              <th className="py-2 pr-3">#</th>
              <th className="px-3">Manager</th>
              <th className="px-3">When</th>
              {vs && <th className="px-3">Opponent</th>}
              <th className="px-3 text-right">{valueLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-[var(--border)]">
                <td className="py-2 pr-3 text-xs text-[var(--muted)]">{i + 1}</td>
                <td className="px-3">
                  <ManagerChip userId={r.userId} size={20} />
                </td>
                <td className="px-3 tabular-nums text-[var(--muted)]">
                  {r.season} wk {r.week}
                </td>
                {vs && <td className="px-3 text-[var(--muted)]">{label(r.opponentUserId)}</td>}
                <td className={`px-3 text-right font-mono font-semibold tabular-nums ${valueClass}`}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default function RecordsPage() {
  const iq: BarRow[] = [...allTime]
    .sort((a, b) => b.careerEfficiency - a.careerEfficiency)
    .map((r) => ({ userId: r.userId, display: `${(r.careerEfficiency * 100).toFixed(1)}%`, pct: r.careerEfficiency * 100 }));
  const allPlay: BarRow[] = [...allTime]
    .sort((a, b) => b.allPlayWinPct - a.allPlayWinPct)
    .map((r) => ({ userId: r.userId, display: `${(r.allPlayWinPct * 100).toFixed(1)}%`, pct: r.allPlayWinPct * 100 }));
  const winPct: BarRow[] = [...allTime]
    .sort((a, b) => b.winPct - a.winPct)
    .map((r) => ({ userId: r.userId, display: `${(r.winPct * 100).toFixed(1)}%`, pct: r.winPct * 100 }));

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
          <div className="mb-3 text-sm font-semibold">🧠 Lineup IQ <span className="font-normal text-[var(--muted)]">(start/sit efficiency)</span></div>
          <BarLeaderboard rows={iq} />
        </Card>
        <Card>
          <div className="mb-3 text-sm font-semibold">📊 All-play win% <span className="font-normal text-[var(--muted)]">(true strength)</span></div>
          <BarLeaderboard rows={allPlay} />
        </Card>
        <Card>
          <div className="mb-3 text-sm font-semibold">🏅 Career win%</div>
          <BarLeaderboard rows={winPct} />
        </Card>
      </div>

      <SectionTitle>All-time manager table</SectionTitle>
      <Card className="mb-10 overflow-x-auto scroll-thin">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
              <th className="py-2 pr-3">Manager</th>
              <th className="px-3">Record</th>
              <th className="px-3">Win%</th>
              <th className="px-3">All-play%</th>
              <th className="px-3">Lineup IQ</th>
              <th className="px-3">Luck</th>
              <th className="px-3">PF/g</th>
              <th className="px-3">Titles</th>
              <th className="px-3">Avg fin</th>
            </tr>
          </thead>
          <tbody>
            {allTime.map((r, i) => (
              <tr key={r.userId} className="border-t border-[var(--border)]">
                <td className="py-2 pr-3">
                  <span className="flex items-center gap-2">
                    <span className="w-4 text-right text-xs text-[var(--muted)]">{i + 1}</span>
                    <ManagerChip userId={r.userId} href={`/managers/${r.userId}`} />
                  </span>
                </td>
                <td className="px-3 tabular-nums">
                  {r.wins}-{r.losses}
                  {r.ties ? `-${r.ties}` : ""}
                </td>
                <td className="px-3 tabular-nums">{(r.winPct * 100).toFixed(1)}%</td>
                <td className="px-3 tabular-nums text-[var(--muted)]">{(r.allPlayWinPct * 100).toFixed(1)}%</td>
                <td className="px-3 tabular-nums">{(r.careerEfficiency * 100).toFixed(1)}%</td>
                <td className={`px-3 tabular-nums ${r.totalLuck > 0 ? "text-[var(--accent)]" : r.totalLuck < 0 ? "text-[var(--bad)]" : ""}`}>
                  {signed(r.totalLuck)}
                </td>
                <td className="px-3 tabular-nums text-[var(--muted)]">{r.pointsPerGame}</td>
                <td className="px-3 tabular-nums">{r.championships || "—"}</td>
                <td className="px-3 tabular-nums text-[var(--muted)]">{r.avgFinish ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mb-2 text-sm text-[var(--muted)]">
        Want one manager&rsquo;s full story?{" "}
        <Link href="/managers" className="text-[var(--accent)] hover:underline">
          Browse manager profiles →
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <RecordTable emoji="🚀" title="Highest scoring weeks" rows={records.topWeeks} valueLabel="Points" tone="good" />
        <RecordTable emoji="💀" title="Lowest scoring weeks" rows={records.lowWeeks} valueLabel="Points" tone="bad" />
        <RecordTable emoji="🔨" title="Biggest blowouts" rows={records.biggestBlowouts} valueLabel="Margin" tone="gold" />
        <RecordTable emoji="🪑" title="Most points left on bench" rows={records.bestBenchWeeks} valueLabel="Bench pts" tone="gold" />
        <RecordTable emoji="🎆" title="Highest-scoring shootouts" rows={records.highestCombined} valueLabel="Combined" tone="good" />
      </div>
    </div>
  );
}
