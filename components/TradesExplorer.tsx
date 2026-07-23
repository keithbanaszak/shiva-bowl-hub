"use client";

import { useMemo, useState } from "react";
import type { Trade, TradeAsset } from "@/lib/stats/types";
import {
  TradeReceipt,
  type Basis,
  type Mgr,
} from "@/components/trades/TradeReceipt";

function assetText(a: TradeAsset): string {
  return a.kind === "player"
    ? a.name
    : `${a.season} R${a.round}${a.becameName ? ` → ${a.becameName}` : ""}`;
}

export function TradesExplorer({
  trades,
  managers,
}: {
  trades: Trade[];
  managers: Mgr[];
}) {
  const mgrMap = useMemo(
    () => new Map(managers.map((m) => [m.userId, m])),
    [managers],
  );
  const seasons = useMemo(
    () =>
      [...new Set(trades.map((t) => t.season))].sort(
        (a, b) => Number(b) - Number(a),
      ),
    [trades],
  );

  const [q, setQ] = useState("");
  const [season, setSeason] = useState("all");
  const [sort, setSort] = useState<"new" | "lopsided" | "even">("new");
  const [basis, setBasis] = useState<Basis>("career");

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
      if (!needle) return true;
      const inAssets = t.sides.some((s) =>
        [...s.received, ...s.sent].some((a) =>
          assetText(a).toLowerCase().includes(needle),
        ),
      );
      const inMgr = t.sides.some((s) =>
        (mgrMap.get(s.userId)?.label ?? "").toLowerCase().includes(needle),
      );
      return inAssets || inMgr;
    });
    if (sort === "new")
      list = [...list].sort((a, b) => (b.dateMs ?? 0) - (a.dateMs ?? 0));
    if (sort === "lopsided")
      list = [...list]
        .filter((t) => diff(t) != null)
        .sort((a, b) => (diff(b) ?? 0) - (diff(a) ?? 0));
    if (sort === "even")
      list = [...list]
        .filter(
          (t) =>
            diff(t) != null &&
            Object.values(t.realized!).every((r) => r[key] > 0),
        )
        .sort((a, b) => (diff(a) ?? 0) - (diff(b) ?? 0));
    return list;
  }, [trades, q, season, sort, basis, mgrMap]);

  const seg = (on: boolean) =>
    `rounded-md px-2.5 py-1.5 transition ${
      on
        ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
        : "text-[var(--muted)] hover:text-[var(--foreground)]"
    }`;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a player or manager…"
          aria-label="Search trades"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--border-glow)] lg:max-w-xs"
        />
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            aria-label="Filter by season"
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
          >
            <option value="all">All seasons</option>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

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
                onClick={() => setSort(k)}
                className={seg(sort === k)}
              >
                {lab}
              </button>
            ))}
          </div>

          {/* grade the same trade on career value or just rest-of-season */}
          <div
            className="flex rounded-lg border border-[var(--border)] p-0.5 text-xs"
            role="group"
            aria-label="Scoring basis"
          >
            {(
              [
                [
                  "career",
                  "Career",
                  "All points since the trade, across seasons",
                ],
                [
                  "ros",
                  "ROS",
                  "Rest-of-season only — points before that season ended",
                ],
              ] as const
            ).map(([k, lab, title]) => (
              <button
                key={k}
                onClick={() => setBasis(k)}
                className={seg(basis === k)}
                title={title}
              >
                {lab}
              </button>
            ))}
          </div>

          <span className="ml-auto text-xs text-[var(--muted)]">
            {filtered.length} trades
          </span>
        </div>
      </div>

      {/* CSS columns, not a grid: each card sizes to its own content instead of
          stretching to match the tallest card in its row */}
      <div className="columns-1 gap-3 lg:columns-2">
        {filtered.map((t) => (
          <TradeReceipt key={t.id} t={t} mgrMap={mgrMap} basis={basis} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-[var(--muted)]">
          No trades match.
        </div>
      )}
    </div>
  );
}
