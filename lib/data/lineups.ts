import data from "@/data/marts/lineups.json";
import type { MatchupLineup } from "@/lib/stats/types";

export const lineups = data as unknown as MatchupLineup[];

const byKey = new Map(lineups.map((l) => [l.key, l]));
export const getLineup = (key: string): MatchupLineup | undefined => byKey.get(key);

/** Lineup for a specific season/week game between two managers. */
export const lineupForMeeting = (
  season: string,
  week: number,
  uA: string,
  uB: string,
): MatchupLineup | undefined =>
  lineups.find(
    (l) =>
      l.season === season &&
      l.week === week &&
      l.teams.some((t) => t.userId === uA) &&
      l.teams.some((t) => t.userId === uB),
  );
