"use client";

import { useState } from "react";
import { Avatar } from "@/components/Manager";
import { MatchupLineups } from "@/components/MatchupLineups";
import { label } from "@/lib/marts";
import type { MatchupLineup } from "@/lib/stats/types";

export type TimelineMeeting = {
  season: string;
  week: number;
  aPoints: number;
  bPoints: number;
  /** a, b, or null for a tie. */
  winnerUserId: string | null;
  isPlayoff: boolean;
  isChampionship: boolean;
  /** Head-to-head record AFTER this meeting, from A's side. */
  runA: number;
  runB: number;
};

/**
 * The rivalry as a timeline: one node per meeting, left (oldest) to right, the
 * winner's avatar in each node, the running series record above it, and the
 * playoff/championship games ringed in gold. Click a node to drop its full
 * lineup in below. This replaces the old flat "every meeting" table — the shape
 * of a rivalry (streaks, who owned the big games) reads instantly here.
 */
export function CompareTimeline({
  meetings,
  lineups,
  aUserId,
  bUserId,
}: {
  meetings: TimelineMeeting[];
  lineups: (MatchupLineup | null)[];
  aUserId: string;
  bUserId: string;
}) {
  const [sel, setSel] = useState<number | null>(
    meetings.length ? meetings.length - 1 : null,
  );
  const selM = sel != null ? meetings[sel] : null;
  const selLineup = sel != null ? lineups[sel] : null;

  const swatch = (color: string) => (
    <span
      aria-hidden
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ background: color }}
    />
  );

  return (
    <div>
      <div className="scroll-thin overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 py-4">
        <div className="flex min-w-min items-end gap-1">
          {meetings.map((m, i) => {
            const aWon = m.winnerUserId === aUserId;
            const bWon = m.winnerUserId === bUserId;
            const winColor = aWon
              ? "var(--accent)"
              : bWon
                ? "var(--accent-2)"
                : "var(--muted)";
            const winner = aWon ? aUserId : bWon ? bUserId : null;
            const active = sel === i;
            // inner ring = who won; gold outer ring = playoff, thicker = title game
            const ring = m.isChampionship
              ? `0 0 0 2px ${winColor}, 0 0 0 5px var(--gold)`
              : m.isPlayoff
                ? `0 0 0 2px ${winColor}, 0 0 0 4px var(--gold-border)`
                : `0 0 0 2px ${winColor}`;
            return (
              <button
                key={i}
                onClick={() => setSel(active ? null : i)}
                title={`${m.season} wk ${m.week} — ${label(winner)} won`}
                className={`flex shrink-0 flex-col items-center gap-1 rounded-lg px-1.5 py-1 transition ${
                  active ? "bg-[var(--card-2)]" : "hover:bg-[var(--panel)]"
                }`}
              >
                <span className="font-mono text-[10px] tabular-nums text-[var(--muted)]">
                  {m.runA}-{m.runB}
                </span>
                <span
                  className="relative grid place-items-center rounded-full"
                  style={{ boxShadow: ring }}
                >
                  <Avatar userId={winner ?? aUserId} size={active ? 34 : 28} />
                  {(m.isChampionship || m.isPlayoff) && (
                    <span className="absolute -right-1.5 -top-2 text-[11px] leading-none">
                      {m.isChampionship ? "🏆" : "🏈"}
                    </span>
                  )}
                </span>
                <span className="font-mono text-[9px] tabular-nums text-[var(--faint)]">
                  &rsquo;{m.season.slice(2)} w{m.week}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--muted)]">
        <span className="flex items-center gap-1.5">
          {swatch("var(--accent)")} {label(aUserId)} won
        </span>
        <span className="flex items-center gap-1.5">
          {swatch("var(--accent-2)")} {label(bUserId)} won
        </span>
        <span>🏈 playoff · 🏆 championship · tap a game for lineups</span>
      </div>

      {selM && (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-[var(--muted)]">
              <span className="tabular-nums">{selM.season}</span>
              <span>Week {selM.week}</span>
              {selM.isChampionship ? (
                <span className="rounded-full bg-[var(--gold-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--gold)]">
                  🏆 Championship
                </span>
              ) : (
                selM.isPlayoff && (
                  <span className="rounded-full bg-[var(--gold-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--gold)]">
                    Playoffs
                  </span>
                )
              )}
            </span>
            <span className="font-mono tabular-nums">
              <span
                className={
                  selM.winnerUserId === aUserId
                    ? "font-semibold text-[var(--accent)]"
                    : ""
                }
              >
                {selM.aPoints}
              </span>
              <span className="mx-1 text-[var(--muted)]">–</span>
              <span
                className={
                  selM.winnerUserId === bUserId
                    ? "font-semibold text-[var(--accent)]"
                    : ""
                }
              >
                {selM.bPoints}
              </span>
            </span>
          </div>
          {selLineup ? (
            <MatchupLineups lineup={selLineup} leftUserId={aUserId} />
          ) : (
            <div className="text-xs text-[var(--muted)]">
              Lineup detail unavailable for this week.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
