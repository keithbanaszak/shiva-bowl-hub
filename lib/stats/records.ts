import type { RecordEntry, Records, TeamWeek } from "./types";

const N = 15;

/**
 * The record book, built only from weeks that were ACTUAL GAMES.
 *
 * Sleeper still reports rosters and player points for week 18, but this league's
 * season ends at week 17 — there is no matchup, so nobody sets a lineup and
 * nothing is at stake. Those weeks were dominating "lowest scoring" and "most
 * points left on bench" with scores nobody was trying to avoid. A week only
 * counts here if it had an opponent.
 */
export function computeRecords(teamWeeks: TeamWeek[]): Records {
  const base = (t: TeamWeek, value: number, note?: string): RecordEntry => ({
    season: t.season,
    week: t.week,
    userId: t.userId,
    opponentUserId: t.opponentUserId,
    opponentPoints: t.opponentPoints,
    isPlayoff: t.isPlayoff,
    value,
    note,
  });

  // a real game: an opponent to play, and points on the board
  const played = teamWeeks.filter((t) => t.points > 0 && t.opponentUserId != null);

  const topWeeks = [...played]
    .sort((a, b) => b.points - a.points)
    .slice(0, N)
    .map((t) => base(t, t.points));

  const lowWeeks = [...played]
    .sort((a, b) => a.points - b.points)
    .slice(0, N)
    .map((t) => base(t, t.points));

  // one row per matchup (winner's perspective)
  const blowouts = played
    .filter((t) => t.margin != null && t.margin > 0)
    .sort((a, b) => (b.margin ?? 0) - (a.margin ?? 0))
    .slice(0, N)
    .map((t) => base(t, t.margin ?? 0));

  const bestBenchWeeks = played
    .filter((t) => t.benchPoints != null)
    .sort((a, b) => (b.benchPoints ?? 0) - (a.benchPoints ?? 0))
    .slice(0, N)
    .map((t) => base(t, t.benchPoints ?? 0));

  const highestCombined = played
    .filter((t) => t.opponentPoints != null && t.opponentUserId && t.userId < t.opponentUserId)
    .map((t) => base(t, Math.round((t.points + (t.opponentPoints ?? 0)) * 100) / 100))
    .sort((a, b) => b.value - a.value)
    .slice(0, N);

  return { topWeeks, lowWeeks, biggestBlowouts: blowouts, bestBenchWeeks, highestCombined };
}
