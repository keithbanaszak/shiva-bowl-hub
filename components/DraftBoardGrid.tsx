"use client";

import { useState, type ReactNode } from "react";

export type BoardSlot = {
  slot: number;
  userId: string | null;
  label: string;
  avatar: ReactNode;
};
export type BoardCellData = {
  slot: number;
  round: number;
  ownerUserId: string | null;
  node: ReactNode;
};

/**
 * Interactive shell for the draft board.
 *
 * Only the spotlight state lives on the client. Every cell arrives already
 * rendered from the server, which keeps the 128KB player dictionary out of the
 * browser bundle — importing PlayerAvatar directly into a client component
 * dragged the whole of data/players.json along with it.
 */
export function DraftBoardGrid({
  slots,
  order,
  rounds,
  cells,
}: {
  slots: number;
  order: BoardSlot[];
  rounds: number[];
  cells: BoardCellData[];
}) {
  const [focus, setFocus] = useState<string | null>(null);

  // 88px floor per column: twelve of those (~1080px) exceed a phone, so the
  // board scrolls horizontally there instead of crushing names to ~24px. Above
  // ~1100px CSS-px the 1fr wins and all twelve fill the width — desktop unchanged.
  const cols = `repeat(${slots}, minmax(88px, 1fr))`;
  const focusLabel = order.find((o) => o.userId === focus)?.label ?? "";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2">
      <p className="mb-1 text-center text-[10px] text-[var(--muted)] lg:hidden">
        Swipe to see all {slots} teams →
      </p>
      {/* one shared scroll container so the header and every round compute
          identical column tracks; the 88px floor without it would push the whole
          page sideways (the app has no global overflow-x guard) */}
      <div className="scroll-thin -mx-2 overflow-x-auto px-2">
        <div className="min-w-0">
          <div
            className="mb-1.5 grid gap-1"
            style={{ gridTemplateColumns: cols }}
          >
            {order.map((o) => {
              const active = focus != null && o.userId === focus;
              return (
                <button
                  key={o.slot}
                  onClick={() => setFocus(active ? null : o.userId)}
                  disabled={!o.userId}
                  title={o.userId ? `Spotlight ${o.label}'s picks` : undefined}
                  className={`flex flex-col items-center gap-0.5 rounded-md px-0.5 py-1 text-center transition ${
                    active
                      ? "bg-[var(--accent-soft)]"
                      : "hover:bg-[var(--card-2)]"
                  } ${focus && !active ? "opacity-40" : ""}`}
                >
                  {o.avatar}
                  <span className="w-full truncate text-[10px] leading-tight text-[var(--muted)]">
                    {o.label}
                  </span>
                </button>
              );
            })}
          </div>

          {focus && (
            <div className="mb-1.5 text-center text-[10px] text-[var(--muted)]">
              Showing <span className="text-[var(--accent)]">{focusLabel}</span>
              ’s picks ·{" "}
              <button
                onClick={() => setFocus(null)}
                className="underline hover:text-[var(--foreground)]"
              >
                show all
              </button>
            </div>
          )}

          {rounds.map((r) => (
            <div
              key={r}
              className="mb-1 grid gap-1"
              style={{ gridTemplateColumns: cols }}
            >
              {cells
                .filter((c) => c.round === r)
                .sort((a, b) => a.slot - b.slot)
                .map((c) => (
                  <div
                    key={c.slot}
                    className={`transition-opacity ${focus != null && c.ownerUserId !== focus ? "opacity-15" : "opacity-100"}`}
                  >
                    {c.node}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
