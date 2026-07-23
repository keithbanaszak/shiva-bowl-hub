import type { RecordEntry, Records, TeamWeek } from "./types";

const N = 15;

export function computeRecords(teamWeeks: TeamWeek[]): Records {
  const base = (t: TeamWeek, value: number, note?: string): RecordEntry => ({
    season: t.season,
    week: t.week,
    userId: t.userId,
    opponentUserId: t.opponentUserId,
    value,
    note,
  });

  const played = teamWeeks.filter((t) => t.points > 0);

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
