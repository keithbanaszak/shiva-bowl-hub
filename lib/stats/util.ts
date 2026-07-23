import type { Dynasty, SeasonData } from "../model";
import type { Matchup } from "../sleeper/types";
import type { Result } from "./types";

/** Build a player_id -> eligible fantasy positions lookup from the slim dict. */
export function eligibilityFn(players: Dynasty["players"]): (playerId: string) => string[] {
  return (playerId: string) => {
    const p = players[playerId];
    if (!p) return [];
    if (p.fantasy_positions && p.fantasy_positions.length > 0) return p.fantasy_positions;
    return p.position ? [p.position] : [];
  };
}

export const playerName = (players: Dynasty["players"], id: string): string =>
  players[id]?.full_name ?? id;

/** Effective team points for a matchup entry (honor commish override). */
export const matchupPoints = (m: Matchup): number =>
  (m.custom_points ?? m.points ?? 0) as number;

export function regularSeasonWeeks(s: SeasonData): number[] {
  return [...s.matchupsByWeek.keys()].filter((w) => w < s.playoffWeekStart).sort((a, b) => a - b);
}

export function playoffWeeks(s: SeasonData): number[] {
  return [...s.matchupsByWeek.keys()].filter((w) => w >= s.playoffWeekStart).sort((a, b) => a - b);
}

/** Group a week's matchup entries by matchup_id (the two entries are opponents). */
export function pairByMatchup(entries: Matchup[]): Map<number, Matchup[]> {
  const m = new Map<number, Matchup[]>();
  for (const e of entries) {
    if (e.matchup_id == null) continue;
    const arr = m.get(e.matchup_id) ?? [];
    arr.push(e);
    m.set(e.matchup_id, arr);
  }
  return m;
}

export function resultOf(pf: number, pa: number): Result {
  if (pf > pa) return "W";
  if (pf < pa) return "L";
  return "T";
}

/** Median of a numeric array. */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export const round1 = (n: number): number => Math.round(n * 10) / 10;
export const round2 = (n: number): number => Math.round(n * 100) / 100;
