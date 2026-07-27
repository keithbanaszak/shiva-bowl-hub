import { Avatar } from "@/components/Manager";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import {
  DraftBoardGrid,
  type BoardCellData,
  type BoardSlot,
} from "@/components/DraftBoardGrid";
import { label, getManager } from "@/lib/marts";

/** Sleeper handle when we have one — shorter than a team name, and stable. */
const handle = (userId: string | null | undefined): string =>
  (userId && getManager(userId)?.displayName) || label(userId);
import { posColor } from "@/lib/positions";
import type { DraftBoard as Board, DraftBoardCell } from "@/lib/stats/types";

/** Amber pill naming the manager who now owns a traded pick. */
function NowOwned({ userId }: { userId: string }) {
  return (
    <div className="mt-0.5 flex items-center gap-0.5 rounded bg-[var(--gold-soft)] px-0.5">
      <Avatar userId={userId} size={10} />
      <span className="truncate text-[10px] font-medium leading-tight text-[var(--gold)]">
        {handle(userId)}
      </span>
    </div>
  );
}

function Cell({ c }: { c: DraftBoardCell }) {
  const col = c.position ? posColor(c.position) : null;
  // A pick is "traded" only when its current owner differs from the column's original owner.
  const traded =
    c.isTraded && !!c.ownerUserId && c.ownerUserId !== c.slotOwnerUserId;

  return (
    <div
      style={
        col
          ? { backgroundColor: `${col}1f`, borderColor: `${col}4d` }
          : undefined
      }
      className={`min-h-[54px] rounded-md border p-1 ${col ? "" : "border-[var(--border)] bg-[var(--panel)]"} ${
        traded ? "ring-1 ring-inset ring-[var(--gold-border)]" : ""
      }`}
    >
      <div className="flex items-center justify-between font-mono text-[10px] leading-none text-[var(--muted)]">
        <span>
          {c.round}.{String(c.slot).padStart(2, "0")}
        </span>
        {c.position && (
          <span style={col ? { color: col } : undefined}>{c.position}</span>
        )}
      </div>

      {c.playerId ? (
        <>
          <div className="mt-1 flex items-center gap-1">
            <PlayerAvatar playerId={c.playerId} size={16} ring={false} />
            <span className="min-w-0 truncate text-[10px] leading-tight">
              {c.name}
            </span>
          </div>
          {traded && c.ownerUserId && <NowOwned userId={c.ownerUserId} />}
        </>
      ) : traded && c.ownerUserId ? (
        <div className="mt-1 flex items-center gap-1">
          <Avatar userId={c.ownerUserId} size={14} />
          <span className="min-w-0 truncate text-[10px] font-medium leading-tight text-[var(--gold)]">
            {handle(c.ownerUserId)}
          </span>
        </div>
      ) : (
        <div className="mt-1.5 text-[10px] text-[var(--faint)]">—</div>
      )}
    </div>
  );
}

/**
 * The whole board on one screen. Columns used to be `minmax(120px, 1fr)`, which
 * forced a horizontal scrollbar at twelve teams; the grid now divides the width
 * evenly and the cells are sized to suit.
 *
 * Cells render here on the server and are handed to DraftBoardGrid, which owns
 * only the click-to-spotlight state.
 */
export function DraftBoard({ board }: { board: Board }) {
  const rounds = [...new Set(board.cells.map((c) => c.round))].sort(
    (a, b) => a - b,
  );

  const order: BoardSlot[] = board.order.map((o) => ({
    slot: o.slot,
    userId: o.userId,
    label: label(o.userId),
    avatar: <Avatar userId={o.userId} size={22} />,
  }));

  const cells: BoardCellData[] = board.cells.map((c) => ({
    slot: c.slot,
    round: c.round,
    // spotlight follows whoever actually owns the pick, not the column header
    ownerUserId: c.ownerUserId ?? c.slotOwnerUserId,
    node: <Cell c={c} />,
  }));

  return (
    <DraftBoardGrid
      slots={board.slots}
      order={order}
      rounds={rounds}
      cells={cells}
    />
  );
}
