"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useBelow } from "@/hooks/useBelow";

/**
 * Sortable table with LOCKED column widths and a real mobile form.
 *
 * `table-fixed` plus an explicit width on every column is what stops columns
 * jumping when sorted — without it, re-sorting changes the longest string in a
 * column and the browser re-lays out the lot.
 *
 * Everything crossing the boundary is SERIALIZABLE — no render callbacks. Server
 * pages pre-render each cell into `cells` (ReactNodes pass through the RSC
 * payload fine) and supply plain primitives in `sort`, so sorting runs on the
 * client while the heavy player/manager dictionaries stay on the server.
 *
 * MOBILE: a 704px table dragged sideways in a 343px phone card is unusable, so
 * columns marked `hideBelow` drop out below that breakpoint (see useBelow — the
 * full table still renders on the server and desktop), the first column sticks
 * while the rest scroll, and the width floor relaxes so the surviving columns
 * fill the screen instead of forcing a 2× horizontal drag.
 */

export type ColumnSpec = {
  key: string;
  header: ReactNode;
  /**
   * Column width, ideally a PERCENTAGE (e.g. "22%"). Under `table-fixed` these
   * divide the available width; when `hideBelow` columns drop on mobile the
   * survivors are renormalised back to 100%.
   */
  width: string;
  align?: "left" | "right" | "center";
  /** Sortable when the row supplies a `sort` value for this key. */
  sortable?: boolean;
  /** First click sorts descending (the default for stat columns). */
  descFirst?: boolean;
  headerTitle?: string;
  /** Hide this column below the breakpoint — "md" implies "sm". */
  hideBelow?: "sm" | "md";
};

export type TableRow = {
  key: string;
  cells: Record<string, ReactNode>;
  sort?: Record<string, number | string | null>;
  /** Marks a row as historical (e.g. a manager who left). Enables a hide toggle. */
  inactive?: boolean;
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
  minWidth = "44rem",
  stickyFirst = true,
  toolbar,
}: {
  rows: TableRow[];
  columns: ColumnSpec[];
  initialSort?: { key: string; dir?: Dir };
  caption?: ReactNode;
  emptyText?: string;
  /** Show a 1..n gutter that follows the current sort. */
  rank?: boolean;
  maxHeight?: string;
  /** Desktop width floor. On phones this relaxes to 20rem so few columns fill. */
  minWidth?: string;
  /** Freeze the first column while the rest scroll horizontally. */
  stickyFirst?: boolean;
  /** Controls rendered above the table (filters, toggles). */
  toolbar?: ReactNode;
}) {
  const [sortKey, setSortKey] = useState<string | null>(
    initialSort?.key ?? null,
  );
  const [dir, setDir] = useState<Dir>(initialSort?.dir ?? "desc");
  const [hideInactive, setHideInactive] = useState(false);
  const belowSm = useBelow("sm");
  const belowMd = useBelow("md");

  const anyInactive = rows.some((r) => r.inactive);

  // drop hidden columns for the current width, then renormalise % widths to 100
  // so the survivors fill the table (a dropped <col> otherwise leaves a gap)
  const cols = useMemo(() => {
    const kept = columns.filter(
      (c) =>
        !(
          (c.hideBelow === "sm" && belowSm) ||
          (c.hideBelow === "md" && belowMd)
        ),
    );
    const pcts = kept.map((c) =>
      c.width.trim().endsWith("%") ? parseFloat(c.width) : NaN,
    );
    const allPct = pcts.every((n) => !Number.isNaN(n));
    const total =
      pcts.reduce((s, n) => s + (Number.isNaN(n) ? 0 : n), 0) || 100;
    return kept.map((c, i) => ({
      ...c,
      width: allPct ? `${((pcts[i] / total) * 100).toFixed(2)}%` : c.width,
    }));
  }, [columns, belowSm, belowMd]);

  const effMin = belowSm ? "20rem" : minWidth;

  const sorted = useMemo(() => {
    const visible = hideInactive ? rows.filter((r) => !r.inactive) : rows;
    if (!sortKey) return visible;
    const mul = dir === "asc" ? 1 : -1;
    return [...visible].sort((a, b) => {
      const va = a.sort?.[sortKey] ?? null;
      const vb = b.sort?.[sortKey] ?? null;
      // nulls always sink, whichever way we're sorting
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number")
        return (va - vb) * mul;
      // numeric collation so "10-4" sorts after "9-5" on a string fallback
      return (
        String(va).localeCompare(String(vb), undefined, { numeric: true }) * mul
      );
    });
  }, [rows, sortKey, dir, hideInactive]);

  const toggle = (c: ColumnSpec) => {
    if (!c.sortable) return;
    if (sortKey === c.key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(c.key);
      setDir(c.descFirst === false ? "asc" : "desc");
    }
  };

  const alignCls = (a?: string) =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  /*
   * Freeze the identity column(s) so the name never scrolls out of sight. When a
   * rank gutter is shown we freeze BOTH it and the first data column (the name),
   * offsetting the name by the gutter's 2.5rem — freezing a bare rank number
   * alone tells you nothing about whose row it is. A frozen cell needs a solid
   * background or scrolled content bleeds through, and a z above the body.
   */
  const rankSticky = stickyFirst ? "sticky left-0 bg-[var(--card)]" : "";
  const firstColSticky = (i: number) =>
    stickyFirst && i === 0
      ? rank
        ? "sticky left-[2.5rem] bg-[var(--card)]"
        : "sticky left-0 bg-[var(--card)]"
      : "";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      {(toolbar || anyInactive) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-3 py-2">
          {toolbar}
          {anyInactive && (
            <label className="ml-auto flex cursor-pointer select-none items-center gap-1.5 py-2 -my-1 text-xs text-[var(--muted)]">
              <input
                type="checkbox"
                checked={hideInactive}
                onChange={(e) => setHideInactive(e.target.checked)}
                className="h-5 w-5 accent-[var(--accent)]"
              />
              Hide former managers
              <span className="rounded bg-[var(--chip)] px-1 text-[11px]">
                {rows.filter((r) => r.inactive).length}
              </span>
            </label>
          )}
        </div>
      )}
      {/* right-edge fade hints there's more to scroll; background-attachment:local
          hides it once scrolled to the end. Mobile-only — desktop needs no scroll. */}
      <div
        className="scroll-thin overflow-x-auto sm:[mask-image:none]"
        style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
      >
        <table
          className="w-full table-fixed text-sm"
          style={{ minWidth: effMin }}
        >
          <colgroup>
            {rank && <col style={{ width: "2.5rem" }} />}
            {cols.map((c) => (
              <col key={c.key} style={{ width: c.width }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10 bg-[var(--card)]">
            <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--muted)]">
              {rank && (
                <th
                  className={`px-2 py-2.5 text-right font-medium ${rankSticky} ${stickyFirst ? "z-30" : ""}`}
                >
                  #
                </th>
              )}
              {cols.map((c, i) => {
                const active = sortKey === c.key;
                return (
                  <th
                    key={c.key}
                    className={`px-2 py-2.5 font-medium ${alignCls(c.align)} ${firstColSticky(i)} ${firstColSticky(i) ? "z-30" : ""}`}
                    title={c.headerTitle}
                    aria-sort={
                      active
                        ? dir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    {c.sortable ? (
                      <button
                        onClick={() => toggle(c)}
                        className={`-my-1 flex min-h-[40px] w-full items-center gap-1 py-1 transition hover:text-[var(--foreground)] ${
                          active ? "text-[var(--accent)]" : ""
                        } ${c.align === "right" ? "flex-row-reverse" : c.align === "center" ? "justify-center" : ""}`}
                      >
                        <span className="truncate">{c.header}</span>
                        <span
                          aria-hidden
                          className={`shrink-0 text-[9px] ${active ? "" : "opacity-30"}`}
                        >
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
              <tr
                key={row.key}
                className="border-b border-[var(--border)] last:border-0"
              >
                {rank && (
                  <td
                    className={`px-2 py-2 text-right font-mono text-[11px] tabular-nums text-[var(--muted)] ${rankSticky} ${stickyFirst ? "z-10" : ""}`}
                  >
                    {i + 1}
                  </td>
                )}
                {cols.map((c, ci) => (
                  <td
                    key={c.key}
                    className={`overflow-hidden px-2 py-2 ${alignCls(c.align)} ${firstColSticky(ci)} ${firstColSticky(ci) ? "z-10" : ""}`}
                  >
                    {row.cells[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && (
        <div className="px-3 py-8 text-center text-sm text-[var(--muted)]">
          {emptyText}
        </div>
      )}
      {caption && (
        <div className="border-t border-[var(--border)] px-3 py-2 text-xs text-[var(--muted)]">
          {caption}
        </div>
      )}
    </div>
  );
}
