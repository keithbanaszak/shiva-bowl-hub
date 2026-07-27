import type { ReactNode } from "react";
import {
  DataTable,
  type ColumnSpec,
  type TableRow,
} from "@/components/DataTable";
import { ManagerCell } from "@/components/cells";
import { allTime, label, ordinal, getManager } from "@/lib/marts";
import { signed } from "@/components/ui";

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const num = (v: ReactNode, cls = "") => (
  <span className={`font-mono tabular-nums ${cls}`}>{v}</span>
);

/**
 * The single all-time manager table. Lives here so /managers and the Record Book
 * render the same component rather than two drifting copies of the same numbers.
 */
export function AllTimeTable({ caption }: { caption?: string }) {
  const columns: ColumnSpec[] = [
    {
      key: "mgr",
      header: "Manager",
      width: "22%",
      sortable: true,
      descFirst: false,
    },
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
      hideBelow: "md",
      header: "All-play%",
      width: "7.5%",
      align: "right",
      sortable: true,
      headerTitle: "Record if you played everyone every week — true strength",
    },
    // ---- postseason
    {
      key: "porec",
      hideBelow: "md",
      header: "PO record",
      width: "8%",
      align: "right",
      sortable: true,
      headerTitle:
        "Playoff record — winners bracket only, so consolation games don't pad it",
    },
    {
      key: "apps",
      hideBelow: "md",
      header: "PO apps",
      width: "7%",
      align: "right",
      sortable: true,
    },
    {
      key: "titles",
      hideBelow: "md",
      header: "Titles",
      width: "6%",
      align: "right",
      sortable: true,
    },
    {
      key: "fin",
      hideBelow: "md",
      header: "Avg fin",
      width: "7%",
      align: "right",
      sortable: true,
      descFirst: false,
    },
    {
      key: "best",
      hideBelow: "md",
      header: "Best",
      width: "6%",
      align: "right",
      sortable: true,
      descFirst: false,
    },
    // ---- quality
    {
      key: "iq",
      hideBelow: "md",
      header: "Lineup IQ",
      width: "7.5%",
      align: "right",
      sortable: true,
      headerTitle: "Points started / points available",
    },
    {
      key: "luck",
      hideBelow: "md",
      header: "Luck",
      width: "7%",
      align: "right",
      sortable: true,
    },
    {
      key: "pfg",
      hideBelow: "md",
      header: "PF/g",
      width: "7%",
      align: "right",
      sortable: true,
    },
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
      best: num(
        r.bestFinish ? ordinal(r.bestFinish) : "—",
        "text-[var(--muted)]",
      ),
      iq: num(pct(r.careerEfficiency)),
      luck: num(
        signed(r.totalLuck),
        r.totalLuck > 0
          ? "text-[var(--accent)]"
          : r.totalLuck < 0
            ? "text-[var(--bad)]"
            : "",
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
    <DataTable
      rows={rows}
      columns={columns}
      rank
      initialSort={{ key: "win", dir: "desc" }}
      caption={caption}
    />
  );
}
