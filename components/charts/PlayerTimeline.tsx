import { Avatar } from "@/components/Manager";
import { label } from "@/lib/marts";
import type { PlayerOwnerStint } from "@/lib/stats/types";

/**
 * A player's ownership as an actual timeline.
 *
 * x-axis is league time (season, then week), so the LENGTH of each band is how
 * long that manager held him and the GAPS are spells on waivers. The old version
 * was a bulleted list, which gave no sense of duration or of when the moves
 * clustered.
 *
 * Each band is bookended by markers saying HOW he arrived and HOW he left:
 *   ◆ drafted   + waiver / free agent   ⇄ traded   − dropped
 *
 * Departure is inferred from the NEXT stint: arriving by trade means the previous
 * owner traded him away; arriving off waivers means they dropped him. A trailing
 * stint has no marker — he was still rostered when the data ends.
 */

const WEEKS_PER_SEASON = 18;

type Marker = {
  kind: "draft" | "waiver" | "trade" | "drop";
  glyph: string;
  cls: string;
  label: string;
};

const MARKERS: Record<Marker["kind"], Omit<Marker, "kind">> = {
  draft: { glyph: "◆", cls: "text-[var(--gold)]", label: "Drafted" },
  waiver: {
    glyph: "+",
    cls: "text-[var(--accent)]",
    label: "Added off waivers / FA",
  },
  trade: {
    glyph: "⇄",
    cls: "text-[var(--accent-2)]",
    label: "Acquired by trade",
  },
  drop: { glyph: "−", cls: "text-[var(--bad)]", label: "Dropped" },
};

const arrivalKind = (
  a: PlayerOwnerStint["acquisition"],
): Marker["kind"] | null =>
  a === "draft"
    ? "draft"
    : a === "trade"
      ? "trade"
      : a === "waiver"
        ? "waiver"
        : null;

export function PlayerTimeline({
  stints,
  seasons,
}: {
  stints: PlayerOwnerStint[];
  seasons: string[];
}) {
  if (stints.length === 0) return null;

  // continuous league-time axis so a gap between stints is visible as a gap
  const idx = (season: string) => Math.max(0, seasons.indexOf(season));
  const pos = (season: string, week: number) =>
    idx(season) * WEEKS_PER_SEASON + Math.max(0, week - 1);

  const first = Math.min(...stints.map((s) => pos(s.fromSeason, s.fromWeek)));
  const last = Math.max(...stints.map((s) => pos(s.toSeason, s.toWeek)));
  // pad so the end marker isn't flush against the edge
  const lo = Math.max(0, first - 1);
  const hi = last + 1;
  const span = Math.max(1, hi - lo);

  const pct = (p: number) => ((p - lo) / span) * 100;

  // season boundaries that fall inside the visible range
  const ticks = seasons
    .map((s, i) => ({ season: s, at: i * WEEKS_PER_SEASON }))
    .filter((t) => t.at >= lo - 1 && t.at <= hi + 1);

  return (
    <figure className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      {/* season gridlines + labels */}
      <div className="relative mb-1 h-4">
        {ticks.map((t) => (
          <span
            key={t.season}
            className="absolute -translate-x-1/2 font-mono text-[10px] text-[var(--faint)]"
            style={{ left: `${Math.min(100, Math.max(0, pct(t.at)))}%` }}
          >
            {t.season}
          </span>
        ))}
      </div>

      <div className="relative">
        {/* vertical season rules behind the bands */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {ticks.map((t) => (
            <span
              key={t.season}
              className="absolute top-0 h-full border-l border-dashed border-[var(--border)]"
              style={{ left: `${Math.min(100, Math.max(0, pct(t.at)))}%` }}
            />
          ))}
        </div>

        <ol className="relative space-y-1.5">
          {stints.map((s, i) => {
            const start = pos(s.fromSeason, s.fromWeek);
            const end = pos(s.toSeason, s.toWeek);
            const left = pct(start);
            const width = Math.max(1.5, pct(end) - pct(start));

            const arrive = arrivalKind(s.acquisition);
            // how he LEFT: the next stint's arrival tells us
            const next = stints[i + 1];
            const departKind: Marker["kind"] | null = next
              ? next.acquisition === "trade"
                ? "trade"
                : "drop"
              : null;

            return (
              <li key={i} className="relative h-9">
                <div
                  className="absolute inset-y-0 flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--accent-soft)] px-1.5"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    minWidth: "2.5rem",
                  }}
                  title={`${label(s.userId)} · ${s.fromSeason} wk${s.fromWeek} → ${s.toSeason} wk${s.toWeek} · ${s.weeks} weeks · ${s.points} pts`}
                >
                  <Avatar userId={s.userId} size={18} />
                  <span className="min-w-0 flex-1 truncate text-[11px]">
                    {label(s.userId)}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-[var(--muted)]">
                    {s.points}
                  </span>
                </div>

                {/* arrival marker, pinned to the band's left edge */}
                {arrive && (
                  <span
                    className={`absolute top-1/2 grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[var(--border)] bg-[var(--overlay)] font-mono text-[11px] leading-none ${MARKERS[arrive].cls}`}
                    style={{ left: `${left}%` }}
                    title={`${MARKERS[arrive].label} — ${s.fromSeason} wk${s.fromWeek}`}
                  >
                    {MARKERS[arrive].glyph}
                  </span>
                )}

                {/* departure marker at the right edge */}
                {departKind && (
                  <span
                    className={`absolute top-1/2 grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[var(--border)] bg-[var(--overlay)] font-mono text-[11px] leading-none ${MARKERS[departKind].cls}`}
                    style={{ left: `${pct(end)}%` }}
                    title={`${departKind === "trade" ? "Traded away" : "Dropped"} — ${s.toSeason} wk${s.toWeek}`}
                  >
                    {MARKERS[departKind].glyph}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--border)] pt-2 text-[11px] text-[var(--muted)]">
        {(["draft", "waiver", "trade", "drop"] as const).map((k) => (
          <span key={k} className="flex items-center gap-1">
            <span className={`font-mono ${MARKERS[k].cls}`}>
              {MARKERS[k].glyph}
            </span>
            {MARKERS[k].label}
          </span>
        ))}
        <span className="ml-auto">
          Bar length = weeks rostered; the number is points scored for that
          manager.
        </span>
      </figcaption>
    </figure>
  );
}
