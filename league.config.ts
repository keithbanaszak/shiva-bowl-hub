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

  /**
   * League rules + manager profiles live in a Google Sheet so they can be edited
   * without touching code. File > Share > Publish to web, then copy the id out
   * of the sheet URL and the gid out of each tab's URL.
   *
   *   https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit#gid=<GID>
   *
   * Leave sheetId empty and the site simply falls back to whatever is already in
   * data/league-config.json.
   */
  configSheet: {
    sheetId: "",
    rulesGid: "0",
    managersGid: "",
  },
} as const;

export type LeagueConfig = typeof leagueConfig;
