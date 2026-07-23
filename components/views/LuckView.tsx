import Link from "next/link";
import { Card, PageHeader, SectionTitle, Stat, Badge, Note, signed } from "@/components/ui";
import { ManagerChip } from "@/components/Manager";
import { SeasonPills } from "@/components/SeasonPills";
import { LuckScatter, type LuckPoint } from "@/components/charts/LuckScatter";
import { completedSeasons, label } from "@/lib/marts";
import { standingsForSeason } from "@/lib/data/standings";

export function LuckView({ season }: { season: string }) {
  const seasons = completedSeasons();
  const rows = standingsForSeason(season);
  const byAllPlay = [...rows].sort((a, b) => b.allPlayWinPct - a.allPlayWinPct);

  const luckiest = [...rows].sort((a, b) => b.luck - a.luck)[0];
  const cursed = [...rows].sort((a, b) => a.luck - b.luck)[0];
  const avgPf = rows.length ? rows.reduce((s, r) => s + r.pointsFor, 0) / rows.length : 0;

  const points: LuckPoint[] = rows.map((r) => ({
    label: label(r.userId),
    pointsFor: r.pointsFor,
    wins: r.wins,
    luck: r.luck,
  }));

  return (
    <div>
      <PageHeader
        kicker="Schedule luck · fraud detector"
        title="Who was lucky, who got robbed"
        subtitle="All-play asks: if you played everyone every week, what would your record be? Luck is your actual wins minus what your scoring earned."
      />
      <SeasonPills base="/luck" active={season} seasons={seasons} />

      <div className="mb-6">
        <Note title="All-play & luck, explained">
          <strong>All-play</strong>: pretend each team played everyone else every week — beating all who scored
          less. <strong>Expected wins</strong> = your share of all-play wins; <strong>luck</strong> = actual wins
          minus expected. Positive luck = won more than your scoring earned.{" "}
          <Link href="/glossary" className="text-emerald-300 hover:underline">
            full methodology →
          </Link>
        </Note>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {luckiest && (
          <Stat
            label="Schedule Merchant"
            value={label(luckiest.userId)}
            sub={`${signed(luckiest.luck)} wins vs expected · ${luckiest.wins}-${luckiest.losses}`}
            tone="good"
          />
        )}
        {cursed && (
          <Stat
            label="Most Cursed"
            value={label(cursed.userId)}
            sub={`${signed(cursed.luck)} wins vs expected · ${cursed.wins}-${cursed.losses}`}
            tone="bad"
          />
        )}
      </div>

      <SectionTitle>Points For vs Wins</SectionTitle>
      <Card className="mb-8">
        <p className="mb-2 text-xs text-[var(--muted)]">
          Dashed line = league-average PF. Up-and-left of it = winning without scoring (fraud). Down-and-right = scoring without winning (cursed).
        </p>
        <LuckScatter points={points} avgPf={Math.round(avgPf)} />
      </Card>

      <SectionTitle>True power rankings (by all-play)</SectionTitle>
      <Card className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
              <th className="py-2 pr-3">Manager</th>
              <th className="px-3">Actual</th>
              <th className="px-3">PF</th>
              <th className="px-3">All-play</th>
              <th className="px-3">All-play%</th>
              <th className="px-3">Median</th>
              <th className="px-3">Exp. W</th>
              <th className="px-3">Luck</th>
              <th className="px-3">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {byAllPlay.map((r) => {
              const verdict =
                r.luck >= 1.5 ? <Badge tone="bad">Fraud</Badge> : r.luck <= -1.5 ? <Badge tone="info">Cursed</Badge> : null;
              return (
                <tr key={r.userId} className="border-t border-[var(--border)]">
                  <td className="py-2 pr-3">
                    <ManagerChip userId={r.userId} />
                  </td>
                  <td className="px-3 tabular-nums">
                    {r.wins}-{r.losses}
                    {r.ties ? `-${r.ties}` : ""}
                  </td>
                  <td className="px-3 tabular-nums">{r.pointsFor}</td>
                  <td className="px-3 tabular-nums text-[var(--muted)]">
                    {r.allPlayWins}-{r.allPlayLosses}
                  </td>
                  <td className="px-3 tabular-nums">{(r.allPlayWinPct * 100).toFixed(0)}%</td>
                  <td className="px-3 tabular-nums text-[var(--muted)]">
                    {r.medianWins}-{r.medianLosses}
                  </td>
                  <td className="px-3 tabular-nums text-[var(--muted)]">{r.expectedWins}</td>
                  <td
                    className={`px-3 tabular-nums ${r.luck > 0 ? "text-emerald-300" : r.luck < 0 ? "text-red-400" : ""}`}
                  >
                    {signed(r.luck)}
                  </td>
                  <td className="px-3">{verdict}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
