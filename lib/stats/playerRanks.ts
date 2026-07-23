import type { Dynasty } from "../model";
import type { PlayerWeekIndex } from "./playerWeeks";
import type { PlayerRankMart, PlayerSeasonRank } from "./types";
import { round2 } from "./util";

/**
 * In-league positional ranks.
 *
 * IMPORTANT: these are ranks *within this league*, not NFL-wide. We only have
 * per-week points for players while someone rostered them, so the population is
 * "players rostered in The Shiva Bowl that season". A waiver-wire nobody who was
 * never rostered simply isn't in the pool. Every surface that renders these must
 * say "in-league" so nobody reads "TE3" as a global ranking.
 *
 * Two ranks are produced per (season, position):
 *  - rank by TOTAL points — rewards availability, the fantasy-relevant number
 *  - rank by PPG — rewards rate, gated behind a games threshold so a one-week
 *    cameo can't take the crown
 */

const MIN_WEEKS_FOR_PPG = 4;

export function computePlayerRanks(dynasty: Dynasty, index: PlayerWeekIndex): PlayerRankMart {
  const posOf = (pid: string): string | null =>
    dynasty.players[pid]?.position ?? dynasty.players[pid]?.fantasy_positions?.[0] ?? null;

  // (season, playerId) -> totals
  const acc = new Map<string, { season: string; playerId: string; points: number; weeks: number; starts: number }>();
  for (const pw of index.all) {
    const key = `${pw.season}:${pw.playerId}`;
    let a = acc.get(key);
    if (!a) {
      a = { season: pw.season, playerId: pw.playerId, points: 0, weeks: 0, starts: 0 };
      acc.set(key, a);
    }
    a.points += pw.points;
    a.weeks++;
    if (pw.started) a.starts++;
  }

  const rows: PlayerSeasonRank[] = [...acc.values()].map((a) => ({
    season: a.season,
    playerId: a.playerId,
    position: posOf(a.playerId),
    points: round2(a.points),
    weeks: a.weeks,
    starts: a.starts,
    ppg: a.weeks > 0 ? round2(a.points / a.weeks) : 0,
    posRank: 0,
    posRankPpg: null,
    posCount: 0,
  }));

  // rank within (season, position)
  const groups = new Map<string, PlayerSeasonRank[]>();
  for (const r of rows) {
    if (!r.position) continue;
    const k = `${r.season}:${r.position}`;
    const g = groups.get(k) ?? [];
    g.push(r);
    groups.set(k, g);
  }

  for (const g of groups.values()) {
    g.sort((a, b) => b.points - a.points);
    g.forEach((r, i) => {
      r.posRank = i + 1;
      r.posCount = g.length;
    });

    const eligible = g.filter((r) => r.weeks >= MIN_WEEKS_FOR_PPG).sort((a, b) => b.ppg - a.ppg);
    eligible.forEach((r, i) => {
      r.posRankPpg = i + 1;
    });
  }

  return { minWeeksForPpg: MIN_WEEKS_FOR_PPG, rows };
}

/** `WR7` style label, or null when the player has no position/rank for that season. */
export function rankLabel(r: PlayerSeasonRank | undefined): string | null {
  if (!r || !r.position || !r.posRank) return null;
  return `${r.position}${r.posRank}`;
}
