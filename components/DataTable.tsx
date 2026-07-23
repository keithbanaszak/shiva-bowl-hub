"use client";

import { useMemo, useState, type ReactNode } from "react";

/**
 * Sortable table with LOCKED column widths.
 *
 * `table-fixed` plus an explicit width on every column is the whole trick:
 * without it, re-sorting changes the longest string in a column and the browser
 * re-lays out every column, so the table visibly jumps on each click.
 *
 * Everything crossing the boundary is SERIALIZABLE — no render callbacks. Server
 * pages pre-render each cell into `cells` (ReactNodes pass through the RSC
 * payload fine) and supply plain primitives in `sort`. That keeps sorting on the
 * client while the heavy player/manager dictionaries stay on the server.
 */

export type ColumnSpec = {
  key: string;
  header: ReactNode;
  /** CSS width. Required — this is what stops the columns jumping when sorted. */
  width: string;
  align?: "left" | "right" | "center";
  /** Sortable when the row supplies a `sort` value for this key. */
  sortable?: boolean;
  /** First click sorts descending (the default for stat columns). */
  descFirst?: boolean;
  headerTitle?: string;
};

export type TableRow = {
  key: string;
  cells: Record<string, ReactNode>;
  sort?: Record<string, number | string | null>;
};

type Dir = "asc" | "desc";

export function DataTable({
  rows,
  columns,
  initialSort,
  caption,
  emptyText = "Nothing to show.",
  rank = false,
  maxHeight,
}: {
  rows: TableRow[];
  columns: ColumnSpec[];
  initialSort?: { key: string; dir?: Dir };
  caption?: ReactNode;
  emptyText?: string;
  /** Show a 1..n gutter that follows the current sort. */
  rank?: boolean;
  maxHeight?: string;
}) {
  const [sortKey, setSortKey] = useState<string | null>(initialSort?.key ?? null);
  const [dir, setDir] = useState<Dir>(initialSort?.dir ?? "desc");

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const mul = dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = a.sort?.[sortKey] ?? null;
      const vb = b.sort?.[sortKey] ?? null;
      // nulls always sink, whichever way we're sorting
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * mul;
      return String(va).localeCompare(String(vb)) * mul;
    });
  }, [rows, sortKey, dir]);

  const toggle = (c: ColumnSpec) => {
    if (!c.sortable) return;
    if (sortKey === c.key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(c.key);
      setDir(c.descFirst === false ? "asc" : "desc");
    }
  };

  const alignCls = (a?: string) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="scroll-thin overflow-x-auto" style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}>
        <table className="w-full table-fixed text-sm">
          <colgroup>
            {rank && <col style={{ width: "2.5rem" }} />}
            {columns.map((c) => (
              <col key={c.key} style={{ width: c.width }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10 bg-[var(--card)]">
            <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--muted)]">
              {rank && <th className="px-2 py-2.5 text-right font-medium">#</th>}
              {columns.map((c) => {
                const active = sortKey === c.key;
                return (
                  <th
                    key={c.key}
                    className={`px-2 py-2.5 font-medium ${alignCls(c.align)}`}
                    title={c.headerTitle}
                    aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    {c.sortable ? (
                      <button
                        onClick={() => toggle(c)}
                        className={`inline-flex max-w-full items-center gap-1 transition hover:text-[var(--foreground)] ${
                          active ? "text-[var(--accent)]" : ""
                        } ${c.align === "right" ? "flex-row-reverse" : ""}`}
                      >
                        <span className="truncate">{c.header}</span>
                        <span aria-hidden className={`shrink-0 text-[9px] ${active ? "" : "opacity-30"}`}>
                          {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={row.key} className="border-b border-[var(--border)] last:border-0">
                {rank && (
                  <td className="px-2 py-2 text-right font-mono text-[11px] tabular-nums text-[var(--muted)]">
                    {i + 1}
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className={`overflow-hidden px-2 py-2 ${alignCls(c.align)}`}>
                    {row.cells[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && <div className="px-3 py-8 text-center text-sm text-[var(--muted)]">{emptyText}</div>}
      {caption && <div className="border-t border-[var(--border)] px-3 py-2 text-xs text-[var(--muted)]">{caption}</div>}
    </div>
  );
}
