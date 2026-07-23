import { Card, PageHeader, SectionTitle, Note, Badge } from "@/components/ui";
import { ManagerChip } from "@/components/Manager";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { waivers } from "@/lib/data/waivers";
import { pname } from "@/lib/data/players-dict";
import { label } from "@/lib/marts";
import type { Acquisition } from "@/lib/stats/types";

function LeaderTile({
  title,
  tone,
  a,
  metric,
}: {
  title: string;
  tone: "good" | "gold" | "bad";
  a: Acquisition | null;
  metric: (a: Acquisition) => string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-[var(--muted)]">{title}</div>
      {a ? (
        <>
          <div className="flex items-center gap-2">
            <PlayerAvatar playerId={a.playerId} size={30} />
            <div className="min-w-0">
              <div className="truncate font-semibold">{pname(a.playerId)}</div>
              <div className="truncate text-xs text-[var(--muted)]">{label(a.userId)}</div>
            </div>
          </div>
          <div className="mt-2">
            <Badge tone={tone}>{metric(a)}</Badge>
          </div>
        </>
      ) : (
        <div className="text-sm text-[var(--muted)]">—</div>
      )}
    </div>
  );
}

export default function WaiversPage() {
  const grades = waivers.managerGrades;

  return (
    <div>
      <PageHeader
        kicker="Waiver wire & free agency"
        title="Working the Wire"
        subtitle="Who turns the scrap heap into points — and who lights FAAB on fire."
      />

      <div className="mb-6">
        <Note title="How this is scored">
          For every waiver claim or free-agent add, we credit the manager with the points that player scored{" "}
          <strong>afterward while on their roster</strong> (rest-of-season). <strong>Pts/$ FAAB</strong> is those
          points divided by the bid. A &ldquo;hit&rdquo; is any add that went on to score 20+ points. Free
          ($0) pickups are tracked separately so the bargain hunters get their due.
        </Note>
      </div>

      <SectionTitle>Season highlights</SectionTitle>
      <div className="mb-8 space-y-3">
        {waivers.seasonLeaders.map((sl) => (
          <Card key={sl.season}>
            <div className="mb-3 text-sm font-semibold">{sl.season}</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <LeaderTile title="Best $0 pickup" tone="good" a={sl.bestFreeAdd} metric={(a) => `${a.realizedSeason} pts, free`} />
              <LeaderTile title="Best bang for buck" tone="gold" a={sl.bestValue} metric={(a) => `${a.pointsPerFaab} pts/$ ($${a.faab})`} />
              <LeaderTile title="Biggest FAAB bust" tone="bad" a={sl.biggestBust} metric={(a) => `$${a.faab} → ${a.realizedSeason} pts`} />
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>Manager waiver grades (all-time)</SectionTitle>
      <Card className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
              <th className="py-2 pr-3">Manager</th>
              <th className="px-3">Adds</th>
              <th className="px-3">FAAB spent</th>
              <th className="px-3">Pts gained</th>
              <th className="px-3">Starter pts</th>
              <th className="px-3">Pts/$ FAAB</th>
              <th className="px-3">Free-add pts</th>
              <th className="px-3">Hit rate</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g, i) => (
              <tr key={g.userId} className="border-t border-[var(--border)]">
                <td className="py-2 pr-3">
                  <span className="flex items-center gap-2">
                    <span className="w-5 text-right text-xs text-[var(--muted)]">{i + 1}</span>
                    <ManagerChip userId={g.userId} />
                  </span>
                </td>
                <td className="px-3 tabular-nums text-[var(--muted)]">{g.adds}</td>
                <td className="px-3 tabular-nums text-[var(--muted)]">${g.faabSpent}</td>
                <td className="px-3 tabular-nums font-semibold text-emerald-300">{g.pointsGained}</td>
                <td className="px-3 tabular-nums text-[var(--muted)]">{g.starterPointsGained}</td>
                <td className="px-3 tabular-nums">{g.pointsPerFaab}</td>
                <td className="px-3 tabular-nums text-[var(--muted)]">{g.freeAddPoints}</td>
                <td className="px-3 tabular-nums">{(g.hitRate * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
