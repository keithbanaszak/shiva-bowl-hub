"use client";

import { useMemo, useState } from "react";
import type { Trade, TradeAsset } from "@/lib/stats/types";
import { TradeReceipt, type Basis, type Mgr } from "@/components/trades/TradeReceipt";

const PAGE = 12;

function assetText(a: TradeAsset): string {
  return a.kind === "player" ? a.name : `${a.season} R${a.round}${a.becameName ? ` → ${a.becameName}` : ""}`;
}

export function TradesExplorer({ trades, managers }: { trades: Trade[]; managers: Mgr[] }) {
  const mgrMap = useMemo(() => new Map(managers.map((m) => [m.userId, m])), [managers]);
  const seasons = useMemo(
    () => [...new Set(trades.map((t) => t.season))].sort((a, b) => Number(b) - Number(a)),
    [trades],
  );
  // only managers who actually appear in a trade, sorted by name
  const tradeManagers = useMemo(() => {
    const ids = new Set(trades.flatMap((t) => t.sides.map((s) => s.userId)));
    return managers.filter((m) => ids.has(m.userId)).sort((a, b) => a.label.localeCompare(b.label));
  }, [trades, managers]);

  const [q, setQ] = useState("");
  const [season, setSeason] = useState("all");
  const [sort, setSort] = useState<"new" | "lopsided" | "even">("new");
  const [basis, setBasis] = useState<Basis>("career");
  const [picked, setPicked] = useState<string[]>([]);
  const [mgrOpen, setMgrOpen] = useState(false);
  const [page, setPage] = useState(0);

  const resetPage = () => setPage(0);
  const togglePicked = (id: string) => {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    resetPage();
  };

  const filtered = useMemo(() => {
    const key = basis === "career" ? "career" : "season";
    const diff = (t: Trade): number | null => {
      if (!t.realized) return null;
      const vals = Object.values(t.realized).map((r) => r[key]);
      if (vals.length < 2) return null;
      return Math.max(...vals) - Math.min(...vals);
    };

    const needle = q.trim().toLowerCase();
    let list = trades.filter((t) => {
      if (season !== "all" && t.season !== season) return false;
      // manager filter: the trade must involve EVERY picked manager, so two
      // picks means "trades between these two", three means all three, etc.
      if (picked.length > 0) {
        const ids = new Set(t.sides.map((s) => s.userId));
        if (!picked.every((p) => ids.has(p))) return false;
      }
      if (!needle) return true;
      const inAssets = t.sides.some((s) =>
        [...s.received, ...s.sent].some((a) => assetText(a).toLowerCase().includes(needle)),
      );
      const inMgr = t.sides.some((s) => (mgrMap.get(s.userId)?.label ?? "").toLowerCase().includes(needle));
      return inAssets || inMgr;
    });
    if (sort === "new") list = [...list].sort((a, b) => (b.dateMs ?? 0) - (a.dateMs ?? 0));
    if (sort === "lopsided")
      list = [...list].filter((t) => diff(t) != null).sort((a, b) => (diff(b) ?? 0) - (diff(a) ?? 0));
    if (sort === "even")
      list = [...list]
        .filter((t) => diff(t) != null && Object.values(t.realized!).every((r) => r[key] > 0))
        .sort((a, b) => (diff(a) ?? 0) - (diff(b) ?? 0));
    return list;
  }, [trades, q, season, sort, basis, picked, mgrMap]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages - 1);
  const shown = filtered.slice(current * PAGE, current * PAGE + PAGE);

  const seg = (on: boolean) =>
    `inline-flex min-h-10 items-center justify-center rounded-md px-2.5 py-1.5 transition sm:min-h-0 ${
      on ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
    }`;

  const betweenNote =
    picked.length >= 2
      ? `between ${picked.map((id) => mgrMap.get(id)?.label ?? "?").join(" & ")}`
      : picked.length === 1
        ? `involving ${mgrMap.get(picked[0])?.label ?? "?"}`
        : null;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            resetPage();
          }}
          placeholder="Search a player or manager…"
          aria-label="Search trades"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-base outline-none focus:border-[var(--border-glow)] sm:text-sm lg:max-w-xs"
        />
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <select
            value={season}
            onChange={(e) => {
              setSeason(e.target.value);
              resetPage();
            }}
            aria-label="Filter by season"
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-base sm:text-sm"
          >
            <option value="all">All seasons</option>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* manager multi-select — pick 2+ to see trades strictly between them */}
          <div className="relative">
            <button
              onClick={() => setMgrOpen((v) => !v)}
              aria-expanded={mgrOpen}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm transition sm:min-h-0 ${
                picked.length ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {picked.length ? `${picked.length} manager${picked.length > 1 ? "s" : ""}` : "Managers"}
              <span aria-hidden className={`text-[10px] transition ${mgrOpen ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>
            {mgrOpen && (
              <>
                <button
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setMgrOpen(false)}
                  className="fixed inset-0 z-30 cursor-default"
                />
                <div className="scroll-thin absolute left-0 top-full z-40 mt-1.5 max-h-72 w-60 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--overlay)] p-1.5 shadow-xl">
                  {picked.length > 0 && (
                    <button
                      onClick={() => {
                        setPicked([]);
                        resetPage();
                      }}
                      className="mb-1 w-full rounded-lg px-2 py-1.5 text-left text-xs text-[var(--muted)] hover:bg-[var(--card-2)]"
                    >
                      Clear selection
                    </button>
                  )}
                  {tradeManagers.map((m) => (
                    <label
                      key={m.userId}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--card-2)]"
                    >
                      <input
                        type="checkbox"
                        checked={picked.includes(m.userId)}
                        onChange={() => togglePicked(m.userId)}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                      <span className="min-w-0 truncate">{m.label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex rounded-lg border border-[var(--border)] p-0.5 text-xs">
            {(
              [
                ["new", "Newest"],
                ["lopsided", "Most lopsided"],
                ["even", "Most even"],
              ] as const
            ).map(([k, lab]) => (
              <button
                key={k}
                onClick={() => {
                  setSort(k);
                  resetPage();
                }}
                className={seg(sort === k)}
              >
                {lab}
              </button>
            ))}
          </div>

          {/* grade the same trade on career value or just rest-of-season */}
          <div className="flex rounded-lg border border-[var(--border)] p-0.5 text-xs" role="group" aria-label="Scoring basis">
            {(
              [
                ["career", "Career", "All points since the trade, across seasons"],
                ["ros", "ROS", "Rest-of-season only — points before that season ended"],
              ] as const
            ).map(([k, lab, title]) => (
              <button key={k} onClick={() => setBasis(k)} className={seg(basis === k)} title={title}>
                {lab}
              </button>
            ))}
          </div>

          <span className="ml-auto text-xs text-[var(--muted)]">
            {filtered.length} trade{filtered.length === 1 ? "" : "s"}
            {betweenNote && <span className="text-[var(--accent)]"> {betweenNote}</span>}
          </span>
        </div>
      </div>

      {/* CSS columns, not a grid: each card sizes to its own content instead of
          stretching to match the tallest card in its row */}
      <div className="columns-1 gap-3 lg:columns-2">
        {shown.map((t) => (
          <TradeReceipt key={t.id} t={t} mgrMap={mgrMap} basis={basis} />
        ))}
      </div>

      {filtered.length === 0 && <div className="py-12 text-center text-sm text-[var(--muted)]">No trades match.</div>}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={() => setPage(Math.max(0, current - 1))}
            disabled={current === 0}
            className="rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--muted)] transition enabled:hover:bg-[var(--card-2)] enabled:hover:text-[var(--foreground)] disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-xs text-[var(--muted)]">
            Page {current + 1} of {pages}
          </span>
          <button
            onClick={() => setPage(Math.min(pages - 1, current + 1))}
            disabled={current >= pages - 1}
            className="rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--muted)] transition enabled:hover:bg-[var(--card-2)] enabled:hover:text-[var(--foreground)] disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
