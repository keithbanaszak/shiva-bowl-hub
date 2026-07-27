import Link from "next/link";
import { Card, PageHeader, SectionTitle, Badge } from "@/components/ui";
import { Avatar, ManagerChip } from "@/components/Manager";
import { SeasonPills } from "@/components/SeasonPills";
import { completedSeasons, label, ordinal } from "@/lib/marts";
import { leagueConfig } from "@/league.config";
import { awardsForSeason } from "@/lib/data/awards";
import { playoffsForSeason } from "@/lib/data/playoffs";
import { standingsForSeason } from "@/lib/data/standings";
import type { Award } from "@/lib/stats/types";

function AwardCard({ a }: { a: Award }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{a.title}</div>
        <Badge tone={a.kind === "serious" ? "good" : "gold"}>{a.value}</Badge>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Avatar userId={a.userId} size={32} />
        <span className="truncate font-medium">{label(a.userId)}</span>
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">{a.blurb}</p>
    </Card>
  );
}

export function AwardsView({ season }: { season: string }) {
  const seasons = completedSeasons();
  const awards = awardsForSeason(season);
  const po = playoffsForSeason(season);
  const finalOrder = [...standingsForSeason(season)].sort(
    (a, b) => (a.finish ?? 99) - (b.finish ?? 99),
  );

  const serious = awards.filter((a) => a.kind === "serious");
  const funny = awards.filter((a) => a.kind === "funny");

  const find = (key: string) => awards.find((a) => a.key === key);
  const headlines: string[] = [];
  if (po?.championUserId)
    headlines.push(
      `${label(po.championUserId)} are your ${season} ${leagueConfig.shortName} champions.`,
    );
  const merch = find("schedule_merchant");
  if (merch)
    headlines.push(
      `${label(merch.userId)} wins Schedule Merchant after finishing ${merch.value} above expectation.`,
    );
  const trader = find("best_trader");
  if (trader)
    headlines.push(
      `${label(trader.userId)} fleeced the league for ${trader.value}.`,
    );
  const bench = find("bench_billionaire");
  if (bench)
    headlines.push(
      `${label(bench.userId)} left ${bench.value} on the bench — a league record of regret.`,
    );

  return (
    <div>
      <PageHeader kicker="End-of-season honors" title={`${season} Awards`} />
      <SeasonPills base="/awards" active={season} seasons={seasons} />

      {po?.championUserId && (
        <Card className="mb-8 border-[var(--gold-border)] bg-[var(--gold-soft)]">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🏆</div>
            <div>
              <div className="text-xs uppercase tracking-widest text-[var(--gold)]">
                {season} Champion
              </div>
              <div className="text-xl font-semibold text-[var(--gold)]">
                {label(po.championUserId)}
              </div>
              <div className="text-sm text-[var(--muted)]">
                def. {label(po.runnerUpUserId)} · 3rd {label(po.thirdUserId)} ·
                🚽 {label(po.toiletUserId)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {headlines.length > 0 && (
        <Card className="mb-8">
          <SectionTitle>📰 Headlines</SectionTitle>
          <ul className="space-y-2">
            {headlines.map((h, i) => (
              <li key={i} className="text-sm">
                <span className="mr-2 text-[var(--accent)]">▸</span>
                {h}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <SectionTitle>🏅 Serious awards</SectionTitle>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {serious.map((a) => (
          <AwardCard key={a.key} a={a} />
        ))}
      </div>

      <SectionTitle>🤡 Not-so-serious awards</SectionTitle>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {funny.map((a) => (
          <AwardCard key={a.key} a={a} />
        ))}
      </div>

      <SectionTitle>Final standings</SectionTitle>
      <Card className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
              <th className="py-2 pr-3">Finish</th>
              <th className="px-3">Manager</th>
              <th className="px-3">Seed</th>
              <th className="px-3">Record</th>
              <th className="px-3">PF</th>
            </tr>
          </thead>
          <tbody>
            {finalOrder.map((r) => (
              <tr key={r.userId} className="border-t border-[var(--border)]">
                <td className="py-2 pr-3 tabular-nums">
                  {r.finish
                    ? r.finish === 1
                      ? "🏆 1st"
                      : ordinal(r.finish)
                    : "—"}
                </td>
                <td className="px-3">
                  <ManagerChip
                    userId={r.userId}
                    href={`/wrapped/${season}/${r.userId}`}
                  />
                </td>
                <td className="px-3 tabular-nums text-[var(--muted)]">
                  {r.seed ?? "—"}
                </td>
                <td className="px-3 tabular-nums">
                  {r.wins}-{r.losses}
                  {r.ties ? `-${r.ties}` : ""}
                </td>
                <td className="px-3 tabular-nums text-[var(--muted)]">
                  {r.pointsFor}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-6">
        <Link
          href={`/wrapped/${season}`}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          See individual Dynasty Wrapped cards for {season} →
        </Link>
      </div>
    </div>
  );
}
