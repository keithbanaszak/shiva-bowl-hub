"use client";

import { useMemo, useState } from "react";
import type { StandingsTimelineRow } from "@/lib/stats/types";

export type TimelineTeam = {
  userId: string;
  label: string;
  avatarUrl: string | null;
};

/**
 * Bump chart: standings position, week by week.
 *
 * Twelve series is well past what any categorical palette can keep separable —
 * the validated set tops out at eight, and only three survive an all-pairs
 * check. So colour carries NO identity here: every line is the same neutral and
 * the highlighted one takes the accent. Identity comes from the avatar and label
 * pinned to the end of each line, plus hover/click, which is also why this stays
 * readable for colour-blind viewers.
 *
 * Rank 1 is drawn at the top, so "falling off" literally falls.
 */
export function StandingsTimeline({
  rows,
  teams,
  season,
}: {
  rows: StandingsTimelineRow[];
  teams: TimelineTeam[];
  season: string;
}) {
  const [focus, setFocus] = useState<string | null>(null);

  const { weeks, series, n } = useMemo(() => {
    const weeks = [...new Set(rows.map((r) => r.week))].sort((a, b) => a - b);
    const byUser = new Map<string, StandingsTimelineRow[]>();
    for (const r of rows) {
      const arr = byUser.get(r.userId) ?? [];
      arr.push(r);
      byUser.set(r.userId, arr);
    }
    for (const arr of byUser.values()) arr.sort((a, b) => a.week - b.week);
    const n = Math.max(1, ...rows.map((r) => r.rank));
    return { weeks, series: byUser, n };
  }, [rows]);

  if (weeks.length === 0) return null;

  // geometry
  const padL = 34;
  const padR = 152; // room for the avatar + name at the end of each line
  const padT = 18;
  const padB = 26;
  const stepX = 62;
  const rowH = 26;
  const w = padL + padR + (weeks.length - 1) * stepX;
  const h = padT + padB + (n - 1) * rowH;

  const x = (week: number) => padL + weeks.indexOf(week) * stepX;
  const y = (rank: number) => padT + (rank - 1) * rowH;

  const ordered = teams
    .filter((t) => series.has(t.userId))
    .sort((a, b) => {
      const la = series.get(a.userId)!.at(-1)!.rank;
      const lb = series.get(b.userId)!.at(-1)!.rank;
      return la - lb;
    });

  return (
    <figure className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">
      <figcaption className="mb-1 font-display text-sm font-semibold">
        {season} standings, week by week
      </figcaption>
      <p className="mb-2 text-xs text-[var(--muted)]">
        Position after each week. Hover or tap a team to trace its season.
      </p>

      <div className="scroll-thin overflow-x-auto">
        <svg
          width={w}
          height={h}
          role="img"
          aria-label={`${season} weekly standings positions`}
        >
          {/* rank gridlines */}
          {Array.from({ length: n }, (_, i) => i + 1).map((r) => (
            <g key={r}>
              <line
                x1={padL}
                x2={padL + (weeks.length - 1) * stepX}
                y1={y(r)}
                y2={y(r)}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                x={padL - 8}
                y={y(r) + 3}
                textAnchor="end"
                className="fill-[var(--faint)] text-[9px]"
              >
                {r}
              </text>
            </g>
          ))}

          {/* week labels */}
          {weeks.map((wk) => (
            <text
              key={wk}
              x={x(wk)}
              y={h - 8}
              textAnchor="middle"
              className="fill-[var(--faint)] text-[9px]"
            >
              {wk}
            </text>
          ))}

          {/* lines — dimmed neutral unless focused */}
          {ordered.map((t) => {
            const pts = series.get(t.userId)!;
            const d = pts
              .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.week)},${y(p.rank)}`)
              .join(" ");
            const on = focus === t.userId;
            const dim = focus != null && !on;
            return (
              <g
                key={t.userId}
                onMouseEnter={() => setFocus(t.userId)}
                onMouseLeave={() => setFocus(null)}
                style={{ cursor: "pointer" }}
              >
                {/* fat invisible hit area so thin lines are still grabbable */}
                <path d={d} fill="none" stroke="transparent" strokeWidth={12} />
                <path
                  d={d}
                  fill="none"
                  stroke={on ? "var(--accent)" : "var(--muted)"}
                  strokeWidth={on ? 2.5 : 1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={dim ? 0.12 : on ? 1 : 0.45}
                />
                {on &&
                  pts.map((p) => (
                    <circle
                      key={p.week}
                      cx={x(p.week)}
                      cy={y(p.rank)}
                      r={3}
                      fill="var(--accent)"
                      stroke="var(--card)"
                      strokeWidth={1.5}
                    >
                      <title>{`Wk ${p.week} · ${p.rank}${p.rank === 1 ? "st" : p.rank === 2 ? "nd" : p.rank === 3 ? "rd" : "th"} · ${p.wins}-${p.losses}`}</title>
                    </circle>
                  ))}
              </g>
            );
          })}

          {/* end-of-line identity: avatar + name, never colour alone */}
          {ordered.map((t) => {
            const last = series.get(t.userId)!.at(-1)!;
            const on = focus === t.userId;
            const dim = focus != null && !on;
            return (
              <g
                key={`lab-${t.userId}`}
                opacity={dim ? 0.25 : 1}
                onMouseEnter={() => setFocus(t.userId)}
                onMouseLeave={() => setFocus(null)}
                style={{ cursor: "pointer" }}
              >
                {t.avatarUrl && (
                  <image
                    href={t.avatarUrl}
                    x={x(last.week) + 8}
                    y={y(last.rank) - 8}
                    width={16}
                    height={16}
                    clipPath="inset(0% round 50%)"
                  />
                )}
                <text
                  x={x(last.week) + 28}
                  y={y(last.rank) + 4}
                  className={`text-[10px] ${on ? "fill-[var(--accent)] font-semibold" : "fill-[var(--muted)]"}`}
                >
                  {t.label.length > 18 ? `${t.label.slice(0, 17)}…` : t.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}
