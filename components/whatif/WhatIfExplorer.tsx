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

  const rows = useMemo(
    () =>
      managerSeasons
        .filter((r) => r.scope === scope)
        .sort((a, b) => b.flips - a.flips || a.efficiency - b.efficiency),
    [managerSeasons, scope],
  );

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

  const maxDelta = Math.max(1, ...rows.map((r) => r.optimalW - r.actualW));

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
              <th className="px-3 py-2.5 text-left font-medium">Manager</th>
              <th className="px-3 py-2.5 text-right font-medium">Actual</th>
              <th className="px-3 py-2.5 text-center font-medium">If perfect</th>
              <th className="px-3 py-2.5 text-right font-medium" title="Losses & ties a perfect lineup turns into wins">
                Stolen wins
              </th>
              <th className="px-3 py-2.5 text-right font-medium" title="Actual points ÷ perfect-lineup points">
                Efficiency
              </th>
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
            🪑 Costliest benchings
          </h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            Players who most often should have been in a lineup that would have
            won — total points gained across the stolen games{" "}
            {scope === "all" ? "of all time" : `in ${scope}`}. Tap one to filter
            the receipts.
          </p>
          <div className="flex flex-wrap gap-2">
            {costly.map((c) => (
              <button
                key={c.pid}
                onClick={() => setPlayer((p) => (p === c.pid ? null : c.pid))}
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
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          🎣 Stolen wins
          <span className="ml-2 text-sm font-normal text-[var(--muted)]">
            {shownFlips.length} game{shownFlips.length === 1 ? "" : "s"}
          </span>
        </h2>
        {player && (
          <button
            onClick={() => setPlayer(null)}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            clear {pname(player)} filter ✕
          </button>
        )}
      </div>
      <div className="space-y-2">
        {shownFlips.map((w) => (
          <FlipReceipt key={w.id} w={w} onPickPlayer={(pid) => setPlayer(pid)} />
        ))}
        {shownFlips.length === 0 && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            No stolen wins here — every winnable game was won.
          </div>
        )}
      </div>
    </div>
  );
}
