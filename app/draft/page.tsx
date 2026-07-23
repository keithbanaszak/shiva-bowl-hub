import { PageHeader, SectionTitle, Note, signed } from "@/components/ui";
import { DraftBoard } from "@/components/DraftBoard";
import { BoardCarousel } from "@/components/BoardCarousel";
import { DataTable, type ColumnSpec, type TableRow } from "@/components/DataTable";
import { ManagerCell, PlayerCell } from "@/components/cells";
import { draft } from "@/lib/data/draft";
import { draftBoards } from "@/lib/data/draftBoards";
import { label } from "@/lib/marts";
import type { DraftPickROI } from "@/lib/stats/types";

const mono = (v: React.ReactNode, cls = "") => <span className={`font-mono tabular-nums ${cls}`}>{v}</span>;

/** Sleeper-style pick, e.g. "2023 · 3.01". */
function PickLabel({ p }: { p: DraftPickROI }) {
  return (
    <span className="whitespace-nowrap font-mono text-xs tabular-nums text-[var(--muted)]">
      {p.season} <span className="text-[var(--faint)]">·</span> {p.pickLabel}
    </span>
  );
}

/** Steals and busts share a shape: pick, player, drafter, career, value vs slot. */
function pickTable(picks: DraftPickROI[], tone: "good" | "bad"): { columns: ColumnSpec[]; rows: TableRow[] } {
  const columns: ColumnSpec[] = [
    { key: "pick", header: "Pick", width: "22%", sortable: true },
    { key: "player", header: "Player", width: "30%", sortable: true, descFirst: false },
    { key: "by", header: "By", width: "26%", sortable: true, descFirst: false },
    { key: "career", header: "Career", width: "11%", align: "right", sortable: true },
    {
      key: "steal",
      header: "Steal",
      width: "11%",
      align: "right",
      sortable: true,
      headerTitle: "Career points minus what that draft slot normally returns",
    },
  ];

  const rows: TableRow[] = picks.map((p) => ({
    key: `${p.season}-${p.pickNo}`,
    cells: {
      pick: <PickLabel p={p} />,
      player: <PlayerCell playerId={p.playerId} size={22} />,
      by: <ManagerCell userId={p.userId} size={18} />,
      career: mono(p.realizedCareer, "text-[var(--muted)]"),
      steal: mono(
        signed(p.stealScore),
        p.stealScore >= 0 ? "font-semibold text-[var(--accent)]" : "font-semibold text-[var(--bad)]",
      ),
    },
    sort: {
      pick: p.pickNo,
      player: p.name,
      by: label(p.userId),
      career: p.realizedCareer,
      steal: p.stealScore,
    },
  }));

  void tone;
  return { columns, rows };
}

export default function DraftPage() {
  const drafters = draft.drafters;
  const rookiePicks = draft.picks.filter((p) => !p.isStartup);
  const steals = [...rookiePicks].sort((a, b) => b.stealScore - a.stealScore).slice(0, 15);
  // "bust" is now relative to the slot, not raw points — a late pick scoring
  // little isn't a bust, a first-rounder returning nothing is
  const busts = rookiePicks
    .filter((p) => p.round <= 2)
    .sort((a, b) => a.stealScore - b.stealScore)
    .slice(0, 15);

  const stealTbl = pickTable(steals, "good");
  const bustTbl = pickTable(busts, "bad");

  const drafterCols: ColumnSpec[] = [
    { key: "mgr", header: "Manager", width: "20%", sortable: true, descFirst: false },
    { key: "picks", header: "Picks", width: "6%", align: "right", sortable: true },
    {
      key: "perpick",
      header: "Value/pick",
      width: "9%",
      align: "right",
      sortable: true,
      headerTitle: "Points above what their draft slots normally return, per pick — the fair skill measure",
    },
    {
      key: "total",
      header: "Total value",
      width: "9%",
      align: "right",
      sortable: true,
      headerTitle: "Total points above slot expectation (rewards volume as well as skill)",
    },
    {
      key: "hit",
      header: "Hit rate",
      width: "8%",
      align: "right",
      sortable: true,
      headerTitle: "Share of picks that beat their slot",
    },
    { key: "pts", header: "Career pts", width: "9%", align: "right", sortable: true },
    { key: "best", header: "Best pick", width: "19.5%", sortable: false },
    { key: "worst", header: "Worst pick", width: "19.5%", sortable: false },
  ];

  const drafterRows: TableRow[] = drafters.map((d) => ({
    key: d.userId,
    cells: {
      mgr: <ManagerCell userId={d.userId} />,
      picks: mono(d.picks, "text-[var(--muted)]"),
      perpick: mono(
        signed(d.stealPerPick),
        d.stealPerPick >= 0 ? "font-semibold text-[var(--accent)]" : "font-semibold text-[var(--bad)]",
      ),
      total: mono(signed(d.totalSteal), d.totalSteal >= 0 ? "text-[var(--accent)]" : "text-[var(--bad)]"),
      hit: mono(`${(d.hitRate * 100).toFixed(0)}%`),
      pts: mono(d.totalRealized, "text-[var(--muted)]"),
      best: d.bestPick ? (
        <span className="flex min-w-0 items-center gap-1.5 text-xs">
          <PlayerCell playerId={d.bestPick.playerId} size={18} href={false} />
          <span className="shrink-0 font-mono text-[10px] text-[var(--accent)]">{signed(d.bestPick.stealScore)}</span>
        </span>
      ) : (
        <span className="text-[var(--faint)]">—</span>
      ),
      worst: d.worstPick ? (
        <span className="flex min-w-0 items-center gap-1.5 text-xs">
          <PlayerCell playerId={d.worstPick.playerId} size={18} href={false} />
          <span className="shrink-0 font-mono text-[10px] text-[var(--bad)]">{signed(d.worstPick.stealScore)}</span>
        </span>
      ) : (
        <span className="text-[var(--faint)]">—</span>
      ),
    },
    sort: {
      mgr: label(d.userId),
      picks: d.picks,
      perpick: d.stealPerPick,
      total: d.totalSteal,
      hit: d.hitRate,
      pts: d.totalRealized,
    },
  }));

  const boardLabel = (b: (typeof draftBoards)[number]) =>
    b.isFuture ? `${b.season} (Upcoming)` : b.isStartup ? `${b.season} Startup` : b.season;

  return (
    <div>
      <PageHeader
        kicker="Draft room"
        title="Draft Boards"
        subtitle="Click through every draft. Column headers are the original slot owners; cells are tinted by position."
      />

      <BoardCarousel labels={draftBoards.map(boardLabel)} defaultIndex={0}>
        {draftBoards.map((b) => (
          <DraftBoard key={b.season} board={b} />
        ))}
      </BoardCarousel>

      <div className="mb-8 mt-2 text-center text-xs text-[var(--muted)]">
        Amber-outlined cells are traded picks — the badge shows the team that now owns the pick. Click a manager above
        the board to spotlight only their picks.
      </div>

      <div className="mb-6">
        <Note title="How draft value works">
          Each pick is credited with the <strong>career fantasy points</strong> the player produced while on the
          drafting manager’s roster. <strong>Steal</strong> is that minus what the same draft slot normally returns, so
          a late-round hit counts for more than an early-round one. Slot expectation pools neighbouring picks — judging
          each exact slot alone would rest on three samples. The inaugural startup draft is excluded throughout: it was
          veterans, not rookies.
        </Note>
      </div>

      <SectionTitle>🧠 Best drafters (value above slot)</SectionTitle>
      <p className="mb-3 text-sm text-[var(--muted)]">
        Ranked by <strong>value per pick</strong>, not total points — otherwise whoever simply held the most picks wins
        by volume. Sort by “Total value” to see the volume view.
      </p>
      <div className="mb-8">
        <DataTable
          rows={drafterRows}
          columns={drafterCols}
          rank
          initialSort={{ key: "perpick", dir: "desc" }}
          caption="Rookie drafts only. Value/pick is points above what that manager's draft slots normally return."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div>
          <SectionTitle>💎 Biggest rookie-draft steals</SectionTitle>
          <DataTable
            rows={stealTbl.rows}
            columns={stealTbl.columns}
            rank
            initialSort={{ key: "steal", dir: "desc" }}
          />
        </div>
        <div>
          <SectionTitle>🪦 Premium-pick busts (rounds 1–2)</SectionTitle>
          <DataTable
            rows={bustTbl.rows}
            columns={bustTbl.columns}
            rank
            initialSort={{ key: "steal", dir: "asc" }}
            caption="Ranked by how far below the slot's normal return they came in."
          />
        </div>
      </div>
    </div>
  );
}
