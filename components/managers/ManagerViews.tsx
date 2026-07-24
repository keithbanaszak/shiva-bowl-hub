"use client";

import { useState, type ReactNode } from "react";

/**
 * Cards / Table switch for the managers page.
 *
 * Both views are rendered on the server and handed in as nodes; this only
 * decides which is shown. That keeps the manager dictionary server-side and
 * means the table is the same component used on the Record Book, rather than a
 * second copy of the same numbers that can drift.
 */
export function ManagerViews({ cards, table }: { cards: ReactNode; table: ReactNode }) {
  const [view, setView] = useState<"table" | "cards">("table");

  const seg = (on: boolean) =>
    `rounded-md px-3 py-1.5 text-xs transition ${
      on ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
    }`;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex rounded-lg border border-[var(--border)] p-0.5" role="group" aria-label="View">
          <button onClick={() => setView("table")} className={seg(view === "table")}>
            Table
          </button>
          <button onClick={() => setView("cards")} className={seg(view === "cards")}>
            Cards
          </button>
        </div>
      </div>
      {view === "table" ? table : cards}
    </div>
  );
}
