/**
 * League registry — the ONE source of truth for every league this hub serves.
 *
 * The whole app is one codebase deployed once per league. Which league a given
 * build is for is chosen by the LEAGUE env var (default "shiva"); everything
 * downstream — ingest, transform, the prebuild materializer, and the app's
 * branding — resolves through activeLeague() here.
 *
 * Standing up another league = add an entry below, backfill it
 * (LEAGUE=<slug> npm run data:all), and create a Vercel project on this same
 * repo with LEAGUE=<slug> set. No page code changes.
 *
 * This is a plain .mjs (not .ts) on purpose: the prebuild materializer
 * (scripts/select-league.mjs) runs under plain Node with no TS toolchain, and
 * the tsx-run ingest/transform scripts import it just as happily.
 */

/**
 * @typedef {Object} LeagueDef
 * @property {string} slug          folder + env-var key (data/leagues/<slug>)
 * @property {string} currentLeagueId  current-season Sleeper league_id
 * @property {string} sport
 * @property {number} maxWeek       weeks to attempt per season on ingest
 * @property {string} name          full title (tab + home hero)
 * @property {string} shortName     bare league name (monogram + champion line)
 * @property {string} tagline       kicker above the title
 * @property {{sheetId:string,rulesGid:string,managersGid:string}} configSheet
 */

/** @type {Record<string, LeagueDef>} */
export const leagues = {
  shiva: {
    slug: "shiva",
    currentLeagueId: "1315853532460498944",
    sport: "nfl",
    maxWeek: 18,
    name: "The Shiva Bowl",
    shortName: "Shiva Bowl",
    tagline: "Dynasty Hub",
    configSheet: { sheetId: "", rulesGid: "0", managersGid: "" },
  },
  pioneer: {
    slug: "pioneer",
    currentLeagueId: "1345194878245556224",
    sport: "nfl",
    maxWeek: 18,
    name: "Pioneer Futbol Liga",
    shortName: "Pioneer",
    tagline: "Dynasty Hub",
    configSheet: { sheetId: "", rulesGid: "0", managersGid: "" },
  },
};

export const DEFAULT_LEAGUE = "shiva";

/** The slug for this process, from LEAGUE (falls back to the default). */
export function activeSlug() {
  const s = process.env.LEAGUE;
  return s && leagues[s] ? s : DEFAULT_LEAGUE;
}

/** The full definition for this process's league. */
export function activeLeague() {
  return leagues[activeSlug()];
}
