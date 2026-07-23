import Link from "next/link";
import type { ReactNode } from "react";
import { Card, PageHeader, SectionTitle, Note, signed } from "@/components/ui";
import { BarLeaderboard, type BarRow } from "@/components/BarLeaderboard";
import { RecordTable } from "@/components/records/RecordTable";
import { DataTable, type ColumnSpec, type TableRow } from "@/components/DataTable";
import { ManagerCell } from "@/components/cells";
import { records } from "@/lib/data/records";
import { allTime, label, ordinal, getManager } from "@/lib/marts";

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const num = (v: ReactNode, cls = "") => <span className={`font-mono tabular-nums ${cls}`}>{v}</span>;

export default function RecordsPage() {
  const iq: BarRow[] = [...allTime]
    .sort((a, b) => b.careerEfficiency - a.careerEfficiency)
    .map((r) => ({ userId: r.userId, display: pct(r.careerEfficiency), pct: r.careerEfficiency * 100 }));
  const allPlay: BarRow[] = [...allTime]
    .sort((a, b) => b.allPlayWinPct - a.allPlayWinPct)
    .map((r) => ({ userId: r.userId, display: pct(r.allPlayWinPct), pct: r.allPlayWinPct * 100 }));
  const winPct: BarRow[] = [...allTime]
    .sort((a, b) => b.winPct - a.winPct)
    .map((r) => ({ userId: r.userId, display: pct(r.winPct), pct: r.winPct * 100 }));

  const columns: ColumnSpec[] = [
    { key: "mgr", header: "Manager", width: "22%", sortable: true, descFirst: false },
    // ---- regular season
    {
      key: "rec",
      header: "Reg record",
      width: "8%",
      align: "right",
      sortable: true,
      headerTitle: "Regular-season record",
    },
    { key: "win", header: "Win%", width: "7%", align: "right", sortable: true },
    {
      key: "allplay",
      header: "All-play%",
      width: "7.5%",
      align: "right",
      sortable: true,
      headerTitle: "Record if you played everyone every week — true strength",
    },
    // ---- postseason
    {
      key: "porec",
      header: "PO record",
      width: "8%",
      align: "right",
      sortable: true,
      headerTitle: "Playoff record — winners bracket only, so consolation games don't pad it",
    },
    { key: "apps", header: "PO apps", width: "7%", align: "right", sortable: true },
    { key: "titles", header: "Titles", width: "6%", align: "right", sortable: true },
    { key: "fin", header: "Avg fin", width: "7%", align: "right", sortable: true, descFirst: false },
    { key: "best", header: "Best", width: "6%", align: "right", sortable: true, descFirst: false },
    // ---- quality
    {
      key: "iq",
      header: "Lineup IQ",
      width: "7.5%",
      align: "right",
      sortable: true,
      headerTitle: "Points started / points available",
    },
    { key: "luck", header: "Luck", width: "7%", align: "right", sortable: true },
    { key: "pfg", header: "PF/g", width: "7%", align: "right", sortable: true },
  ];

  const rows: TableRow[] = allTime.map((r) => ({
    key: r.userId,
    inactive: getManager(r.userId)?.active === false,
    cells: {
      mgr: <ManagerCell userId={r.userId} />,
      rec: num(`${r.wins}-${r.losses}${r.ties ? `-${r.ties}` : ""}`),
      win: num(pct(r.winPct)),
      allplay: num(pct(r.allPlayWinPct), "text-[var(--muted)]"),
      porec:
        r.playoffWins + r.playoffLosses > 0 ? (
          num(`${r.playoffWins}-${r.playoffLosses}`, "text-[var(--accent-2)]")
        ) : (
          <span className="text-[var(--faint)]">—</span>
        ),
      apps: num(r.playoffAppearances, "text-[var(--muted)]"),
      titles: num(r.championships || "—", "text-[var(--gold)]"),
      fin: num(r.avgFinish ?? "—", "text-[var(--muted)]"),
      best: num(r.bestFinish ? ordinal(r.bestFinish) : "—", "text-[var(--muted)]"),
      iq: num(pct(r.careerEfficiency)),
      luck: num(
        signed(r.totalLuck),
        r.totalLuck > 0 ? "text-[var(--accent)]" : r.totalLuck < 0 ? "text-[var(--bad)]" : "",
      ),
      pfg: num(r.pointsPerGame, "text-[var(--muted)]"),
    },
    sort: {
      mgr: label(r.userId),
      rec: r.winPct,
      win: r.winPct,
      allplay: r.allPlayWinPct,
      porec: r.playoffWinPct,
      apps: r.playoffAppearances,
      titles: r.championships,
      fin: r.avgFinish,
      best: r.bestFinish,
      iq: r.careerEfficiency,
      luck: r.totalLuck,
      pfg: r.pointsPerGame,
    },
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
            🧠 Lineup IQ <span className="font-normal text-[var(--muted)]">(start/sit efficiency)</span>
          </div>
          <BarLeaderboard rows={iq} />
        </Card>
        <Card>
          <div className="mb-3 text-sm font-semibold">
            📊 All-play win% <span className="font-normal text-[var(--muted)]">(true strength)</span>
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
          The first block is the <strong>regular season</strong> — record, win% and all-play%. The middle block is the{" "}
          <strong>postseason</strong>: playoff record counts winners-bracket games only, so consolation games do not pad
          it. Click any header to sort.
        </Note>
      </div>
      <div className="mb-10">
        <DataTable
          rows={rows}
          columns={columns}
          rank
          initialSort={{ key: "win", dir: "desc" }}
          caption="Sorted by regular-season win% by default. Column widths are fixed, so sorting never reflows the table."
        />
      </div>

      <div className="mb-2 text-sm text-[var(--muted)]">
        Want one manager’s full story?{" "}
        <Link href="/managers" className="text-[var(--accent)] hover:underline">
          Browse manager profiles →
        </Link>
      </div>

      <div className="mb-4 mt-6">
        <Note title="What counts as a record">
          Only weeks that were <strong>actual games</strong> are eligible. Week 18 has no matchup in this league, so
          nobody sets a lineup — those weeks used to dominate the lowest-scoring and bench tables with scores nobody was
          trying to avoid.
        </Note>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <RecordTable emoji="🚀" title="Highest scoring weeks" rows={records.topWeeks} valueLabel="Points" tone="good" />
        <RecordTable emoji="💀" title="Lowest scoring weeks" rows={records.lowWeeks} valueLabel="Points" tone="bad" />
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
