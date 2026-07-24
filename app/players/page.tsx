import type { ReactNode } from "react";
import { PageHeader, SectionTitle, Note, signed } from "@/components/ui";
import { PosBadge } from "@/components/Pos";
import { DataTable, type ColumnSpec, type TableRow } from "@/components/DataTable";
import { ManagerCell, PlayerCell } from "@/components/cells";
import { playerStats } from "@/lib/data/players";
import { kryptonite } from "@/lib/data/kryptonite";
import { pname, ppos, pteam } from "@/lib/data/players-dict";
import { label } from "@/lib/marts";

const mono = (v: ReactNode, cls = "") => <span className={`font-mono tabular-nums ${cls}`}>{v}</span>;

export default function PlayersPage() {
  const starts = playerStats.startRecords.slice(0, 30);
  const bench = playerStats.benchLeaders.slice(0, 30);
  const nemeses = kryptonite.nemeses.slice(0, 25);

  // ---- best record while started
  const startCols: ColumnSpec[] = [
    { key: "player", header: "Player", width: "26%", sortable: true, descFirst: false },
    { key: "pos", header: "Pos", width: "6%", align: "center", sortable: true, descFirst: false },
    { key: "starts", header: "Starts", width: "8%", align: "right", sortable: true },
    { key: "record", header: "Record", width: "10%", align: "right", sortable: true },
    { key: "winpct", header: "Win%", width: "8%", align: "right", sortable: true },
    { key: "pts", header: "Pts started", width: "10%", align: "right", sortable: true },
    {
      key: "top",
      header: "Started most by",
      width: "32%",
      sortable: true,
      descFirst: false,
      headerTitle: "The manager who started him most — and their record in those weeks",
    },
  ];

  const startRows: TableRow[] = starts.map((r) => {
    const decided = r.topManagerWins + r.topManagerLosses;
    const topPct = decided > 0 ? r.topManagerWins / decided : 0;
    return {
      key: r.playerId,
      cells: {
        player: <PlayerCell playerId={r.playerId} size={22} sub={pteam(r.playerId)} />,
        pos: <PosBadge pos={ppos(r.playerId)} />,
        starts: mono(r.starts, "text-[var(--muted)]"),
        record: mono(`${r.wins}-${r.losses}${r.ties ? `-${r.ties}` : ""}`),
        winpct: mono(`${(r.winPct * 100).toFixed(0)}%`, "font-semibold text-[var(--accent)]"),
        pts: mono(r.pointsWhileStarting, "text-[var(--muted)]"),
        top: r.topManagerUserId ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <ManagerCell userId={r.topManagerUserId} size={18} />
            <span
              className="shrink-0 whitespace-nowrap font-mono text-[10px] text-[var(--muted)]"
              title={`${r.topManagerWins}-${r.topManagerLosses} in the ${r.topManagerStarts} weeks they started him`}
            >
              {r.topManagerStarts}× · {r.topManagerWins}-{r.topManagerLosses}
            </span>
          </span>
        ) : (
          <span className="text-[var(--faint)]">—</span>
        ),
      },
      sort: {
        player: pname(r.playerId),
        pos: ppos(r.playerId) ?? "",
        starts: r.starts,
        record: r.winPct,
        winpct: r.winPct,
        pts: r.pointsWhileStarting,
        top: topPct,
      },
    };
  });

  // ---- bench points
  const benchCols: ColumnSpec[] = [
    { key: "player", header: "Player", width: "30%", sortable: true, descFirst: false },
    { key: "pos", header: "Pos", width: "10%", align: "center", sortable: true, descFirst: false },
    { key: "pts", header: "Bench pts", width: "15%", align: "right", sortable: true },
    { key: "weeks", header: "Weeks", width: "11%", align: "right", sortable: true },
    { key: "top", header: "Benched most by", width: "34%", sortable: true, descFirst: false },
  ];

  const benchRows: TableRow[] = bench.map((r) => ({
    key: r.playerId,
    cells: {
      player: <PlayerCell playerId={r.playerId} size={22} sub={pteam(r.playerId)} />,
      pos: <PosBadge pos={ppos(r.playerId)} />,
      pts: mono(r.benchPoints, "font-semibold text-[var(--gold)]"),
      weeks: mono(r.benchWeeks, "text-[var(--muted)]"),
      top: r.topManagerUserId ? (
        <span className="flex min-w-0 items-center gap-1.5">
          <ManagerCell userId={r.topManagerUserId} size={18} />
          <span className="shrink-0 font-mono text-[10px] text-[var(--muted)]">{r.topManagerBenchPoints}</span>
        </span>
      ) : (
        <span className="text-[var(--faint)]">—</span>
      ),
    },
    sort: {
      player: pname(r.playerId),
      pos: ppos(r.playerId) ?? "",
      pts: r.benchPoints,
      weeks: r.benchWeeks,
      top: r.topManagerBenchPoints,
    },
  }));

  // ---- kryptonite
  const kryptCols: ColumnSpec[] = [
    { key: "player", header: "Player", width: "23%", sortable: true, descFirst: false },
    { key: "pos", header: "Pos", width: "7%", align: "center", sortable: true, descFirst: false },
    { key: "victim", header: "Torches", width: "23%", sortable: true, descFirst: false },
    {
      key: "own",
      header: "His avg",
      width: "10%",
      align: "right",
      sortable: true,
      headerTitle: "His own average across all started games",
    },
    { key: "vs", header: "Avg vs them", width: "13%", align: "right", sortable: true },
    { key: "diff", header: "Diff", width: "9%", align: "right", sortable: true },
    {
      key: "pctv",
      header: "% above",
      width: "9%",
      align: "right",
      sortable: true,
      headerTitle: "Lift as a share of his own average",
    },
    { key: "g", header: "Gm", width: "6%", align: "right", sortable: true },
  ];

  const kryptRows: TableRow[] = nemeses.map((n, i) => ({
    key: `${n.playerId}:${n.managerUserId}:${i}`,
    cells: {
      player: <PlayerCell playerId={n.playerId} size={22} />,
      pos: <PosBadge pos={ppos(n.playerId)} />,
      victim: <ManagerCell userId={n.managerUserId} size={18} />,
      own: mono(n.overallAvg, "text-[var(--muted)]"),
      vs: mono(n.avgVs, "font-semibold text-[var(--gold)]"),
      diff: mono(signed(n.diff), "text-[var(--accent)]"),
      pctv: mono(`+${(n.pctAbove * 100).toFixed(0)}%`, "text-[var(--accent)]"),
      g: mono(n.games, "text-[var(--muted)]"),
    },
    sort: {
      player: pname(n.playerId),
      pos: ppos(n.playerId) ?? "",
      victim: label(n.managerUserId),
      own: n.overallAvg,
      vs: n.avgVs,
      diff: n.diff,
      pctv: n.pctAbove,
      g: n.games,
    },
  }));

  return (
    <div>
      <PageHeader
        kicker="Player history"
        title="Players"
        subtitle="How NFL players have actually performed inside our league — win/loss records when started, and the points that died on benches."
      />

      <div className="mb-6">
        <Note title="What counts here">
          A player’s <strong>start record</strong> is the win/loss record of whichever team started him, that week
          (minimum 10 career starts to qualify). <strong>Started most by</strong> now also shows that manager’s own
          record in the weeks they started him. <strong>Bench points</strong> are points a player scored while sitting
          on someone’s bench — pure hindsight pain. Click any player for their full <strong>league legacy</strong>.
          Every column sorts.
        </Note>
      </div>

      <SectionTitle>🏆 Best record while started (min 10 starts)</SectionTitle>
      <div className="mb-8">
        <DataTable rows={startRows} columns={startCols} rank initialSort={{ key: "winpct", dir: "desc" }} />
      </div>

      <SectionTitle>🪑 Most points that died on a bench</SectionTitle>
      <div className="mb-8">
        <DataTable rows={benchRows} columns={benchCols} rank initialSort={{ key: "pts", dir: "desc" }} />
      </div>

      <SectionTitle>☠️ Kryptonite — players who torch one manager</SectionTitle>
      <div className="mb-3">
        <Note>
          <span className="text-[var(--muted)]">
            Players who, when started, score well <strong>above their own average</strong> specifically against one
            manager (min 3 meetings) — that manager’s personal bogeyman. <strong>% above</strong> is the honest
            comparison: a +5 lift means far more for a 6-point player than a 25-point one.
          </span>
        </Note>
      </div>
      <DataTable
        rows={kryptRows}
        columns={kryptCols}
        rank
        initialSort={{ key: "diff", dir: "desc" }}
        caption="Sorted by raw points above his norm. Sort by “% above” to surface the biggest relative jumps."
      />
    </div>
  );
}
