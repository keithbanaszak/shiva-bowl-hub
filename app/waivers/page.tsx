import Link from "next/link";
import {
  Card,
  PageHeader,
  SectionTitle,
  Note,
  Badge,
  Stat,
} from "@/components/ui";
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-[var(--muted)]">
        {title}
      </div>
      {a ? (
        <>
          <div className="flex items-center gap-2">
            <PlayerAvatar playerId={a.playerId} size={30} />
            <div className="min-w-0">
              <div className="truncate font-semibold">{pname(a.playerId)}</div>
              <div className="truncate text-xs text-[var(--muted)]">
                {label(a.userId)}
              </div>
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
  const regrets = waivers.dropRegrets.slice(0, 12);
  const churn = waivers.churn;

  const totalAdds = churn.reduce((s, c) => s + c.adds, 0);
  const totalDrops = churn.reduce((s, c) => s + c.drops, 0);
  const totalFaab = churn.reduce((s, c) => s + c.faabSpent, 0);

  return (
    <div>
      <PageHeader
        kicker="Waiver wire & free agency"
        title="Working the Wire"
        subtitle="Who turns the scrap heap into points, who lights FAAB on fire — and who let the good one walk."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total adds" value={totalAdds} tone="good" />
        <Stat label="Total drops" value={totalDrops} tone="bad" />
        <Stat label="FAAB spent" value={`$${totalFaab}`} tone="gold" />
        <Stat
          label="Regret drops"
          value={waivers.dropRegrets.length}
          sub="scored for someone else"
        />
      </div>

      <div className="mb-8">
        <Note title="How this is scored">
          For every waiver claim or free-agent add, we credit the manager with
          the points that player scored{" "}
          <strong>afterward while on their roster</strong> (rest-of-season).{" "}
          <strong>Pts/$ FAAB</strong> is those points divided by the bid. A
          “hit” is any add that went on to score 20+ points. Free ($0) pickups
          are tracked separately so the bargain hunters get their due.
        </Note>
      </div>

      {/* ---- the ones that got away ---- */}
      <SectionTitle>🪤 The ones that got away</SectionTitle>
      <p className="mb-3 text-sm text-[var(--muted)]">
        Players dropped who then scored for <em>somebody else</em>.
        Rest-of-season points after the drop.
      </p>
      <Card className="mb-8 overflow-x-auto scroll-thin">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
              <th className="py-2 pr-3">Player</th>
              <th className="px-3">Dropped by</th>
              <th className="px-3">When</th>
              <th className="px-3">Picked up by</th>
              <th className="px-3 text-right">Pts after (ROS)</th>
              <th className="px-3 text-right">Career</th>
            </tr>
          </thead>
          <tbody>
            {regrets.map((d) => (
              <tr key={d.id} className="border-t border-[var(--border)]">
                <td className="py-2 pr-3">
                  <Link
                    href={`/players/${d.playerId}`}
                    className="flex items-center gap-2 hover:text-[var(--accent)]"
                  >
                    <PlayerAvatar playerId={d.playerId} size={24} />
                    <span className="truncate">{pname(d.playerId)}</span>
                    {d.reacquired && (
                      <span
                        title="This manager later re-acquired him"
                        className="shrink-0 rounded bg-[var(--chip)] px-1 text-[9px] uppercase text-[var(--muted)]"
                      >
                        re-added
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-3">
                  <ManagerChip
                    userId={d.userId}
                    href={`/managers/${d.userId}`}
                    size={18}
                  />
                </td>
                <td className="whitespace-nowrap px-3 text-xs text-[var(--muted)]">
                  {d.season} · Wk {d.week}
                </td>
                <td className="px-3">
                  {d.nextUserId ? (
                    <ManagerChip
                      userId={d.nextUserId}
                      href={`/managers/${d.nextUserId}`}
                      size={18}
                    />
                  ) : (
                    <span className="text-xs text-[var(--muted)]">—</span>
                  )}
                </td>
                <td className="px-3 text-right font-mono font-semibold tabular-nums text-[var(--bad)]">
                  {d.pointsAfterSeason}
                </td>
                <td className="px-3 text-right font-mono tabular-nums text-[var(--muted)]">
                  {d.pointsAfterCareer}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ---- season highlights ---- */}
      <SectionTitle>Season highlights</SectionTitle>
      <div className="mb-8 space-y-3">
        {waivers.seasonLeaders.map((sl) => (
          <Card key={sl.season}>
            <div className="mb-3 text-sm font-semibold">{sl.season}</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <LeaderTile
                title="Best $0 pickup"
                tone="good"
                a={sl.bestFreeAdd}
                metric={(a) => `${a.realizedSeason} pts, free`}
              />
              <LeaderTile
                title="Best bang for buck"
                tone="gold"
                a={sl.bestValue}
                metric={(a) => `${a.pointsPerFaab} pts/$ ($${a.faab})`}
              />
              <LeaderTile
                title="Biggest FAAB bust"
                tone="bad"
                a={sl.biggestBust}
                metric={(a) => `$${a.faab} → ${a.realizedSeason} pts`}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* ---- roster churn ---- */}
      <SectionTitle>Roster churn (all-time)</SectionTitle>
      <Card className="mb-8 overflow-x-auto scroll-thin">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
              <th className="py-2 pr-3">Manager</th>
              <th className="px-3 text-right">Adds</th>
              <th className="px-3 text-right">Drops</th>
              <th className="px-3 text-right">Total moves</th>
              <th className="px-3 text-right">FAAB spent</th>
              <th className="px-3 text-right">Regret pts</th>
            </tr>
          </thead>
          <tbody>
            {churn.map((c) => (
              <tr key={c.userId} className="border-t border-[var(--border)]">
                <td className="py-2 pr-3">
                  <ManagerChip
                    userId={c.userId}
                    href={`/managers/${c.userId}`}
                  />
                </td>
                <td className="px-3 text-right tabular-nums text-[var(--accent)]">
                  {c.adds}
                </td>
                <td className="px-3 text-right tabular-nums text-[var(--bad)]">
                  {c.drops}
                </td>
                <td className="px-3 text-right font-semibold tabular-nums">
                  {c.adds + c.drops}
                </td>
                <td className="px-3 text-right tabular-nums text-[var(--gold)]">
                  ${c.faabSpent}
                </td>
                <td className="px-3 text-right tabular-nums text-[var(--muted)]">
                  {c.regretPoints}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ---- grades ---- */}
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
                    <span className="w-5 text-right text-xs text-[var(--muted)]">
                      {i + 1}
                    </span>
                    <ManagerChip
                      userId={g.userId}
                      href={`/managers/${g.userId}`}
                    />
                  </span>
                </td>
                <td className="px-3 tabular-nums text-[var(--muted)]">
                  {g.adds}
                </td>
                <td className="px-3 tabular-nums text-[var(--muted)]">
                  ${g.faabSpent}
                </td>
                <td className="px-3 font-semibold tabular-nums text-[var(--accent)]">
                  {g.pointsGained}
                </td>
                <td className="px-3 tabular-nums text-[var(--muted)]">
                  {g.starterPointsGained}
                </td>
                <td className="px-3 tabular-nums">{g.pointsPerFaab}</td>
                <td className="px-3 tabular-nums text-[var(--muted)]">
                  {g.freeAddPoints}
                </td>
                <td className="px-3 tabular-nums">
                  {(g.hitRate * 100).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
