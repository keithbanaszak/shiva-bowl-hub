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
import {
  DataTable,
  type ColumnSpec,
  type TableRow,
} from "@/components/DataTable";
import {
  ManagerCell,
  PlayerCell,
  WhenCell,
  whenOrder,
} from "@/components/cells";
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

const regretCols: ColumnSpec[] = [
  {
    key: "player",
    header: "Player",
    width: "20%",
    sortable: true,
    descFirst: false,
  },
  {
    key: "by",
    hideBelow: "sm",
    header: "Dropped by",
    width: "17%",
    sortable: true,
    descFirst: false,
  },
  {
    key: "when",
    hideBelow: "sm",
    header: "When",
    width: "11%",
    sortable: true,
  },
  {
    key: "next",
    header: "Picked up by",
    width: "17%",
    sortable: true,
    descFirst: false,
  },
  {
    key: "ppg",
    header: "PPG after",
    width: "9%",
    align: "right",
    sortable: true,
    headerTitle:
      "Points per game after the drop — time-invariant, so a late cut competes fairly",
  },
  {
    key: "n4",
    hideBelow: "sm",
    header: "Next 4wk",
    width: "9%",
    align: "right",
    sortable: true,
    headerTitle: "Points in the four weeks right after you dropped him",
  },
  {
    key: "before",
    hideBelow: "sm",
    header: "PPG before",
    width: "9%",
    align: "right",
    sortable: true,
    headerTitle:
      "His average while you still had him — is this a breakout or a known quantity?",
  },
  {
    key: "tot",
    hideBelow: "sm",
    header: "Total after",
    width: "8%",
    align: "right",
    sortable: true,
  },
];

export default function WaiversPage() {
  const grades = waivers.managerGrades;
  const regrets = waivers.dropRegrets.slice(0, 25);
  const churn = waivers.churn;

  const regretRows: TableRow[] = regrets.map((d) => ({
    key: d.id,
    cells: {
      player: <PlayerCell playerId={d.playerId} size={22} />,
      by: <ManagerCell userId={d.userId} size={18} />,
      when: <WhenCell season={d.season} week={d.week} />,
      next: <ManagerCell userId={d.nextUserId} size={18} />,
      ppg: (
        <span className="font-mono font-semibold tabular-nums text-[var(--bad)]">
          {d.ppgAfter}
        </span>
      ),
      n4: (
        <span className="font-mono tabular-nums text-[var(--muted)]">
          {d.next4}
        </span>
      ),
      before: (
        <span className="font-mono tabular-nums text-[var(--faint)]">
          {d.ppgBefore}
        </span>
      ),
      tot: (
        <span className="font-mono tabular-nums text-[var(--muted)]">
          {d.pointsAfterSeason}
        </span>
      ),
    },
    sort: {
      player: pname(d.playerId),
      by: label(d.userId),
      when: whenOrder(d.season, d.week),
      next: d.nextUserId ? label(d.nextUserId) : null,
      ppg: d.ppgAfter,
      n4: d.next4,
      before: d.ppgBefore,
      tot: d.pointsAfterSeason,
    },
  }));

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
      </p>
      <div className="mb-8">
        <DataTable
          rows={regretRows}
          columns={regretCols}
          rank
          initialSort={{ key: "ppg", dir: "desc" }}
          caption="Ranked by points per game AFTER the drop rather than the raw total — otherwise week-1 cuts win purely on having more weeks left to accumulate. Every column sorts."
        />
      </div>

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
