"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Avatar, ManagerChip } from "@/components/Manager";
import { label } from "@/lib/marts";
import { pname, ppos } from "@/lib/data/players-dict";
import { posColor } from "@/lib/positions";
import type {
  WhatIfManagerSeason,
  WhatIfSwap,
  WhatIfWeek,
} from "@/lib/stats/types";

type SortKey = "team" | "actual" | "perfect" | "stolen" | "eff";
const PAGE = 15;

function rec(w: number, l: number, t: number): string {
  return t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`;
}

function SwapRow({ s }: { s: WhatIfSwap }) {
  const col = ppos(s.inPlayerId) ? posColor(ppos(s.inPlayerId)) : "var(--muted)";
  return (
    <div className="flex items-center gap-2 py-0.5 text-xs">
      <span
        className="w-[70px] shrink-0 font-mono text-[10px] uppercase"
        style={{ color: col ?? "var(--faint)" }}
      >
        {s.slot}
      </span>
      {s.outPlayerId ? (
        <span className="flex min-w-0 items-center gap-1 text-[var(--muted)] line-through decoration-[var(--bad)]/60">
          <PlayerAvatar playerId={s.outPlayerId} size={16} />
          <span className="truncate">{pname(s.outPlayerId)}</span>
          <span className="font-mono text-[10px]">{s.outPoints}</span>
        </span>
      ) : (
        <span className="text-[10px] uppercase text-[var(--bad)]">empty</span>
      )}
      <span aria-hidden className="shrink-0 text-[var(--faint)]">
        →
      </span>
      <Link
        href={`/players/${s.inPlayerId}`}
        className="flex min-w-0 items-center gap-1 hover:text-[var(--accent)]"
      >
        <PlayerAvatar playerId={s.inPlayerId} size={16} />
        <span className="truncate font-medium">{pname(s.inPlayerId)}</span>
        <span className="font-mono text-[10px] text-[var(--accent)]">
          {s.inPoints}
        </span>
      </Link>
      <span className="ml-auto shrink-0 font-mono text-[10px] font-semibold text-[var(--gold)]">
        +{s.gain}
      </span>
    </div>
  );
}

function FlipReceipt({
  w,
  onPickPlayer,
}: {
  w: WhatIfWeek;
  onPickPlayer: (pid: string) => void;
}) {
  const margin = w.opponentPoints != null ? w.actualPoints - w.opponentPoints : null;
  return (
    <details className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] open:bg-[var(--panel)]">
      <summary className="flex cursor-pointer flex-wrap items-center gap-2 p-3.5 [&::-webkit-details-marker]:hidden">
        <Avatar userId={w.userId} size={22} />
        <span className="font-medium">{label(w.userId)}</span>
        <span className="text-xs text-[var(--muted)]">
          {w.season} · Wk {w.week} · lost to {label(w.opponentUserId)}
          {margin != null && (
            <span className="text-[var(--bad)]"> by {Math.abs(margin).toFixed(2)}</span>
          )}
        </span>
        <span className="ml-auto flex items-center gap-3 font-mono text-xs tabular-nums">
          <span className="text-[var(--muted)]">
            {w.actualPoints}
            <span className="mx-1 text-[var(--faint)]">→</span>
            <span className="font-semibold text-[var(--accent)]">
              {w.optimalPoints}
            </span>
          </span>
          <span
            aria-hidden
            className="text-[var(--faint)] transition group-open:rotate-180"
          >
            ▾
          </span>
        </span>
      </summary>
      <div className="border-t border-[var(--border)] p-3.5 pt-3">
        <div className="mb-2 text-xs text-[var(--muted)]">
          The perfect lineup scores{" "}
          <span className="font-mono text-[var(--accent)]">{w.optimalPoints}</span>{" "}
          — past the opponent&rsquo;s{" "}
          <span className="font-mono">{w.opponentPoints}</span> — flipping this
          loss to a win. The changes:
        </div>
        <div className="rounded-xl border border-[var(--border)] p-2">
          {w.swaps.map((s, i) => (
            <SwapRow key={i} s={s} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {w.swaps.slice(0, 4).map((s) => (
            <button
              key={s.inPlayerId}
              onClick={() => onPickPlayer(s.inPlayerId)}
              className="rounded-full bg-[var(--chip)] px-2 py-0.5 text-[11px] text-[var(--muted)] transition hover:text-[var(--accent)]"
            >
              filter {pname(s.inPlayerId)} →
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}

export function WhatIfExplorer({
  seasons,
  managerSeasons,
  flipWeeks,
}: {
  seasons: string[];
  managerSeasons: WhatIfManagerSeason[];
  flipWeeks: WhatIfWeek[];
}) {
  const [scope, setScope] = useState("all");
  const [player, setPlayer] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "stolen",
    dir: "desc",
  });
  const reset = () => setPage(0);
  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "team" ? "asc" : "desc" },
    );

  const rows = useMemo(() => {
    const val = (r: WhatIfManagerSeason): number | string => {
      switch (sort.key) {
        case "team":
          return label(r.userId).toLowerCase();
        case "actual":
          return r.actualW;
        case "perfect":
          return r.optimalW;
        case "eff":
          return r.efficiency;
        default:
          return r.flips;
      }
    };
    const mul = sort.dir === "asc" ? 1 : -1;
    return managerSeasons
      .filter((r) => r.scope === scope)
      .sort((a, b) => {
        const va = val(a);
        const vb = val(b);
        if (typeof va === "string" || typeof vb === "string")
          return String(va).localeCompare(String(vb)) * mul;
        return (va - vb) * mul || b.flips - a.flips;
      });
  }, [managerSeasons, scope, sort]);

  const flips = useMemo(
    () => flipWeeks.filter((w) => scope === "all" || w.season === scope),
    [flipWeeks, scope],
  );

  // players who most often should have been started in a winnable game (scope)
  const costly = useMemo(() => {
    const acc = new Map<string, { pid: string; games: number; gain: number }>();
    for (const w of flips)
      for (const s of w.swaps) {
        if (s.gain <= 0) continue;
        const a = acc.get(s.inPlayerId) ?? { pid: s.inPlayerId, games: 0, gain: 0 };
        a.games++;
        a.gain += s.gain;
        acc.set(s.inPlayerId, a);
      }
    return [...acc.values()].sort((a, b) => b.gain - a.gain).slice(0, 8);
  }, [flips]);

  const shownFlips = useMemo(
    () => (player ? flips.filter((w) => w.swaps.some((s) => s.inPlayerId === player)) : flips),
    [flips, player],
  );
  const pages = Math.max(1, Math.ceil(shownFlips.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const pagedFlips = shownFlips.slice(cur * PAGE, cur * PAGE + PAGE);

  const maxDelta = Math.max(1, ...rows.map((r) => r.optimalW - r.actualW));
  const arrow = (key: SortKey) =>
    sort.key === key ? (sort.dir === "asc" ? "▲" : "▼") : "↕";

  return (
    <div>
      {/* scope tabs */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {[["all", "Career"], ...seasons.map((s) => [s, s] as const)].map(
          ([k, lab]) => (
            <button
              key={k}
              onClick={() => {
                setScope(k);
                setPlayer(null);
                reset();
              }}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                scope === k
                  ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {lab}
            </button>
          ),
        )}
      </div>

      {/* record counterfactual */}
      <div className="mb-8 overflow-x-auto scroll-thin rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--muted)]">
              {(
                [
                  ["team", "Manager", "text-left"],
                  ["actual", "Actual", "text-right"],
                  ["perfect", "If perfect", "text-center"],
                  ["stolen", "Stolen wins", "text-right"],
                  ["eff", "Efficiency", "text-right"],
                ] as const
              ).map(([key, lab, align]) => (
                <th key={key} className={`px-3 py-2.5 font-medium ${align}`}>
                  <button
                    onClick={() => toggleSort(key)}
                    className={`inline-flex items-center gap-1 transition hover:text-[var(--foreground)] ${
                      sort.key === key ? "text-[var(--accent)]" : ""
                    } ${align === "text-center" ? "justify-center" : align === "text-right" ? "flex-row-reverse" : ""}`}
                    title={
                      key === "stolen"
                        ? "Losses & ties a perfect lineup turns into wins"
                        : key === "eff"
                          ? "Actual points ÷ perfect-lineup points"
                          : undefined
                    }
                  >
                    <span>{lab}</span>
                    <span aria-hidden className="text-[9px] opacity-60">
                      {arrow(key)}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const delta = r.optimalW - r.actualW;
              return (
                <tr key={r.userId} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3 py-2">
                    <ManagerChip userId={r.userId} href={`/managers/${r.userId}`} size={22} />
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {rec(r.actualW, r.actualL, r.actualT)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono tabular-nums text-[var(--accent)]">
                        {rec(r.optimalW, r.optimalL, r.optimalT)}
                      </span>
                      {delta > 0 && (
                        <span
                          className="rounded bg-[var(--gold-soft)] px-1 font-mono text-[10px] font-semibold text-[var(--gold)]"
                          title={`${delta} more wins with a perfect lineup`}
                          style={{ opacity: 0.5 + 0.5 * (delta / maxDelta) }}
                        >
                          +{delta}W
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums text-[var(--gold)]">
                    {r.flips || "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-[var(--muted)]">
                    {(r.efficiency * 100).toFixed(0)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* costliest benchings — the (B) player angle */}
      {costly.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2 font-display text-lg font-semibold tracking-tight">
            🪑 Players left on the bench
          </h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            In the games below — ones a perfect lineup would have won — these are
            the players most often sitting on the bench who should have started.
            The number is the total points that benching cost{" "}
            {scope === "all" ? "all-time" : `in ${scope}`}. Tap a player to see
            only the games he could have swung.
          </p>
          <div className="flex flex-wrap gap-2">
            {costly.map((c) => (
              <button
                key={c.pid}
                onClick={() => {
                  setPlayer((p) => (p === c.pid ? null : c.pid));
                  reset();
                }}
                className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition ${
                  player === c.pid
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--border)] bg-[var(--chip)] hover:border-[var(--border-glow)]"
                }`}
              >
                <PlayerAvatar playerId={c.pid} size={22} />
                <span className="font-medium">{pname(c.pid)}</span>
                <span className="font-mono text-[11px] text-[var(--gold)]">
                  +{c.gain.toFixed(0)} · {c.games}g
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* stolen-win receipts */}
      <div className="mb-1 flex items-end justify-between gap-3">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          🎣 Games a perfect lineup would&rsquo;ve won
          <span className="ml-2 text-sm font-normal text-[var(--muted)]">
            {shownFlips.length} game{shownFlips.length === 1 ? "" : "s"}
          </span>
        </h2>
        {player && (
          <button
            onClick={() => {
              setPlayer(null);
              reset();
            }}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            clear {pname(player)} filter ✕
          </button>
        )}
      </div>
      <p className="mb-3 text-sm text-[var(--muted)]">
        Real losses (and ties) where this manager&rsquo;s best possible lineup —
        the same players, started right — would have outscored the opponent&rsquo;s
        actual total. Open one for the exact swaps.
      </p>
      <div className="space-y-2">
        {pagedFlips.map((w) => (
          <FlipReceipt
            key={w.id}
            w={w}
            onPickPlayer={(pid) => {
              setPlayer(pid);
              reset();
            }}
          />
        ))}
        {shownFlips.length === 0 && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            No stolen wins here — every winnable game was won.
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={() => setPage(Math.max(0, cur - 1))}
            disabled={cur === 0}
            className="rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--muted)] transition enabled:hover:bg-[var(--card-2)] enabled:hover:text-[var(--foreground)] disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-xs text-[var(--muted)]">
            Page {cur + 1} of {pages}
          </span>
          <button
            onClick={() => setPage(Math.min(pages - 1, cur + 1))}
            disabled={cur >= pages - 1}
            className="rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--muted)] transition enabled:hover:bg-[var(--card-2)] enabled:hover:text-[var(--foreground)] disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
