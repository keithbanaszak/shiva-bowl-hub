/** Sleeper's position color language, reused site-wide for quick recognition. */
export const POS_COLORS: Record<string, string> = {
  QB: "#fc2b6d", // pink/red
  RB: "#00ceb8", // teal
  WR: "#58a7ff", // blue
  TE: "#ffae58", // orange
  K: "#bd66ff", // purple
  DEF: "#7c8aa0", // slate
  DST: "#7c8aa0",
};

const MUTED = "#8b95a7";

/** Hex color for a position (muted fallback for unknown/empty). */
export const posColor = (pos: string | null | undefined): string =>
  (pos && POS_COLORS[pos.toUpperCase()]) || MUTED;

/** Same color with an appended 2-digit alpha (e.g. "1f", "55"). */
export const posColorA = (pos: string | null | undefined, alpha: string): string => `${posColor(pos)}${alpha}`;

/** Slot color, including the flex slots that have no Sleeper position color. */
export const slotTone = (slot: string): string =>
  slot === "FLEX" || slot === "SUPER_FLEX" ? "var(--accent-2)" : posColor(slot);
