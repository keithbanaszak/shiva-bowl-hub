import { Avatar } from "@/components/Manager";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { label } from "@/lib/marts";
import type { DraftBoard as Board, DraftBoardCell } from "@/lib/stats/types";

const POS_TINT: Record<string, string> = {
  QB: "bg-rose-500/15 border-rose-500/30",
  RB: "bg-emerald-500/15 border-emerald-500/30",
  WR: "bg-sky-500/15 border-sky-500/30",
  TE: "bg-amber-500/15 border-amber-500/30",
  K: "bg-violet-500/15 border-violet-500/30",
  DEF: "bg-zinc-500/15 border-zinc-500/30",
};

/** Amber pill naming the manager who now owns a traded pick. */
function NowOwned({ userId }: { userId: string }) {
  return (
    <div className="mt-1 flex items-center gap-1 rounded bg-amber-400/10 px-1 py-0.5">
      <span className="text-[8px] font-semibold uppercase tracking-wide text-[var(--gold)]/70">now</span>
      <Avatar userId={userId} size={12} />
      <span className="truncate text-[9px] font-medium text-[var(--gold)]">{label(userId)}</span>
    </div>
  );
}

function Cell({ c }: { c: DraftBoardCell }) {
  const tint = (c.position && POS_TINT[c.position]) || "bg-[var(--panel)] border-[var(--border)]";
  // A pick is "traded" only when its current owner differs from the column's original owner.
  const traded = c.isTraded && !!c.ownerUserId && c.ownerUserId !== c.slotOwnerUserId;

  return (
    <div
      className={`min-h-[64px] rounded-lg border p-1.5 ${
        c.playerId ? tint : "border-[var(--border)] bg-[var(--panel)]"
      } ${traded ? "ring-1 ring-inset ring-amber-400/30" : ""}`}
    >
      <div className="flex items-center justify-between font-mono text-[9px] text-[var(--muted)]">
        <span>
          {c.round}.{String(c.slot).padStart(2, "0")}
        </span>
        {c.position && <span>{c.position}</span>}
      </div>

      {c.playerId ? (
        // Made pick: keep the player; flag the new owner only when traded.
        <>
          <div className="mt-1 flex items-center gap-1.5">
            <PlayerAvatar playerId={c.playerId} size={22} />
            <span className="min-w-0 truncate text-[11px] leading-tight">{c.name}</span>
          </div>
          {traded && c.ownerUserId && <NowOwned userId={c.ownerUserId} />}
        </>
      ) : traded && c.ownerUserId ? (
        // Future pick that was traded away: show the team that now owns it.
        <div className="mt-1 flex items-center gap-1.5">
          <Avatar userId={c.ownerUserId} size={18} />
          <span className="min-w-0 truncate text-[11px] font-medium leading-tight text-[var(--gold)]">
            {label(c.ownerUserId)}
          </span>
        </div>
      ) : (
        // Future pick still owned by the column's original manager: stay clean.
        <div className="mt-2 text-[10px] text-[var(--muted)]/40">—</div>
      )}
    </div>
  );
}

export function DraftBoard({ board }: { board: Board }) {
  const byRound = new Map<number, DraftBoardCell[]>();
  for (const c of board.cells) {
    const arr = byRound.get(c.round) ?? [];
    arr.push(c);
    byRound.set(c.round, arr);
  }
  const rounds = [...byRound.keys()].sort((a, b) => a - b);
  const cols = `repeat(${board.slots}, minmax(120px, 1fr))`;

  return (
    <div className="overflow-x-auto scroll-thin rounded-xl border border-[var(--border)] bg-[var(--card)] p-2">
      <div className="min-w-fit">
        {/* header: original slot owners — sticky so columns stay labeled while scrolling */}
        <div
          className="sticky top-0 z-10 grid gap-1.5 rounded-t-lg bg-[var(--card)]/90 pb-2 backdrop-blur"
          style={{ gridTemplateColumns: cols }}
        >
          {board.order.map((o) => (
            <div key={o.slot} className="flex flex-col items-center gap-1 px-1 text-center">
              <Avatar userId={o.userId} size={26} />
              <span className="truncate text-[10px] leading-tight text-[var(--muted)]">{label(o.userId)}</span>
            </div>
          ))}
        </div>
        {/* rounds */}
        {rounds.map((r) => (
          <div key={r} className="mb-1.5 grid gap-1.5" style={{ gridTemplateColumns: cols }}>
            {(byRound.get(r) ?? [])
              .sort((a, b) => a.slot - b.slot)
              .map((c) => (
                <Cell key={c.slot} c={c} />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
