/**
 * League configuration for The Shiva Bowl dynasty hub.
 *
 * Only `currentLeagueId` is required: the full dynasty history is discovered at
 * ingest time by walking `previous_league_id` backward from this league.
 */
export const leagueConfig = {
  /** Current-season Sleeper league_id (the long number in the league's URL). */
  currentLeagueId: "1315853532460498944",
  sport: "nfl",
  /**
   * Weeks to attempt per season when pulling matchups/transactions.
   * Empty/future weeks simply return [] and are skipped — pulling through 18
   * covers the regular season + playoffs for any reasonable config.
   */
  maxWeek: 18,
} as const;

export type LeagueConfig = typeof leagueConfig;
