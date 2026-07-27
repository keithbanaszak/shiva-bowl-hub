import { Card, PageHeader, SectionTitle, Note, Stat } from "@/components/ui";
import { ManagerChip } from "@/components/Manager";
import { WeekReceipt } from "@/components/integrity/WeekReceipt";
import { integrity, flagged } from "@/lib/data/integrity";
import { leagueConfig } from "@/league.config";

export const metadata = {
  title: `Lineup Integrity — ${leagueConfig.name}`,
  description:
    "Projection-based tank watch: which lineups fell furthest short of the best lineup available.",
};

export default function IntegrityPage() {
  const weeks = flagged();
  const severe = weeks.filter((w) => w.level === "severe");
  const minor = integrity.weeks.filter((w) => w.level === "minor");
  const t = integrity.thresholds;
  const scanned = integrity.scanned;

  return (
    <div>
      <PageHeader
        kicker="Tank watch"
        title="Lineup Integrity"
        subtitle="Which lineups fell furthest short of the best lineup that manager could legally have started — measured on pre-game projections, not on how the games turned out."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Severe weeks" value={severe.length} tone="bad" />
        <Stat
          label="Notable weeks"
          value={weeks.length - severe.length}
          tone="gold"
        />
        <Stat
          label="Minor"
          value={minor.length}
          sub="below the discussion bar"
        />
        <Stat
          label="Regular-season team-weeks"
          value={scanned}
          sub="the population searched"
        />
      </div>

      <div className="mb-8 space-y-3">
        <Note title="How a week gets flagged">
          For every regular-season week we build the highest-scoring lineup a
          manager could legally have started from the players on their roster,
          using <strong>Sleeper’s pre-game projections</strong>. The gap between
          that and what they actually started is the signal. A week is{" "}
          <strong>notable</strong> at {t.notablePct}% below best and{" "}
          <strong>severe</strong> at {t.severePct}% (or {t.deadProj}-or-less
          projected starters in {3}+ slots), and always needs at least a{" "}
          {t.minGapPts}-point absolute gap so a low-scoring roster can’t trip
          the percentage alone.
        </Note>
        <Note title="Why projections, and not points scored">
          Because this has to be fair. Judging on final scores would punish
          managers who set a good lineup and got unlucky, and would excuse a
          manager who benched a star that happened to have a bad game.
          Projections are what the manager could see <em>before</em> lock, so
          the gap measures the decision rather than the result.{" "}
          <strong>Only regular-season weeks are judged</strong> — Week 18 has no
          games and Weeks 15–17 are the playoffs, so a poor lineup there costs
          nobody a playoff spot.
        </Note>
        <Note title="Read these as evidence, not a verdict">
          There are honest explanations for a bad week: injury news that broke
          after lock, a misread bye week, or a genuine punt when a manager was
          already eliminated. A roster full of players who were never going to
          play is labelled <strong>abandoned</strong> rather than a scheme,
          because neglect and tanking are different problems with different
          fixes. Every flagged week below opens to the full lineup so people can
          judge for themselves.
        </Note>
      </div>

      <SectionTitle>Flagged weeks</SectionTitle>
      <p className="mb-3 text-sm text-[var(--muted)]">
        {weeks.length} of {scanned} regular-season team-weeks (
        {((weeks.length / scanned) * 100).toFixed(1)}%). Click any row for the
        receipt.
      </p>
      <div className="mb-8 space-y-2">
        {weeks.map((w) => (
          <WeekReceipt key={w.id} w={w} />
        ))}
        {weeks.length === 0 && (
          <Card>
            <div className="text-sm text-[var(--muted)]">
              Nothing clears the bar. Clean league.
            </div>
          </Card>
        )}
      </div>

      <SectionTitle>By manager</SectionTitle>
      <Card className="mb-8 overflow-x-auto scroll-thin">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
              <th className="py-2 pr-3">Manager</th>
              <th className="px-3 text-right">Severe</th>
              <th className="px-3 text-right">Flagged</th>
              <th className="px-3 text-right">Worst gap</th>
              <th className="px-3">Worst week</th>
              <th className="px-3 text-right">Total pts left out</th>
            </tr>
          </thead>
          <tbody>
            {integrity.managers.map((m) => (
              <tr key={m.userId} className="border-t border-[var(--border)]">
                <td className="py-2 pr-3">
                  <ManagerChip
                    userId={m.userId}
                    href={`/managers/${m.userId}`}
                  />
                </td>
                <td className="px-3 text-right font-semibold tabular-nums text-[var(--bad)]">
                  {m.severeWeeks || "—"}
                </td>
                <td className="px-3 text-right tabular-nums">
                  {m.flaggedWeeks}
                </td>
                <td className="px-3 text-right tabular-nums">
                  {m.worstGapPct}%
                </td>
                <td className="whitespace-nowrap px-3 text-xs text-[var(--muted)]">
                  {m.worstWeek
                    ? `${m.worstWeek.season} · Wk ${m.worstWeek.week}`
                    : "—"}
                </td>
                <td className="px-3 text-right font-mono tabular-nums text-[var(--muted)]">
                  {m.totalGapPts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-[var(--muted)]">
        Managers not listed have never had a week clear even the minor bar.
        Counts include minor weeks, so a manager can appear here with zero
        severe or notable weeks.
      </p>
    </div>
  );
}
