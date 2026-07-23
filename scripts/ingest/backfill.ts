/**
 * One-time backfill: walk previous_league_id from the current league back to the
 * inaugural season and pull EVERY endpoint for each season into data/raw/.
 *
 *   npm run ingest:backfill
 *
 * Completed seasons are immutable, so this is normally run once; re-running is
 * safe (it overwrites with identical data).
 */
import { leagueConfig } from "../../league.config";
import { writeJson, listFiles } from "../../lib/fsx";
import { chainPath, manifestPath, matchupsDir } from "../../lib/paths";
import { walkChain, pullSeason } from "./pull";
import { refreshPlayers } from "./players";
import { pullProjections } from "./projections";

const weeksFromMatchups = (season: string): number[] =>
  listFiles(matchupsDir(season))
    .map((f) => Number(f.replace(/^week_/, "").replace(/\.json$/, "")))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

async function main() {
  const start = Date.now();
  console.log(`Backfilling dynasty history from league ${leagueConfig.currentLeagueId}…`);

  const chain = await walkChain(leagueConfig.currentLeagueId);
  if (chain.length === 0) throw new Error("Could not resolve any league in the chain");
  console.log(`Chain (${chain.length} seasons): ${chain.map((l) => l.season).join(" -> ")}`);

  const neededIds = new Set<string>();
  for (const lg of chain) {
    await pullSeason(lg, neededIds);
  }

  console.log(`\nCollected ${neededIds.size} unique player ids across the league.`);
  await refreshPlayers(neededIds, { force: true });

  console.log("\nPulling weekly projections (rotowire, scored with league settings)…");
  for (const lg of chain) {
    const weeks = weeksFromMatchups(lg.season);
    if (weeks.length === 0) continue;
    const scoring = ((lg as { scoring_settings?: Record<string, number> }).scoring_settings) ?? {};
    const n = await pullProjections(lg.season, scoring, weeks, neededIds);
    console.log(`  ${lg.season}: ${n} projection-weeks`);
  }

  const chainManifest = chain.map((l) => ({
    season: l.season,
    league_id: l.league_id,
    status: l.status ?? null,
    name: l.name ?? null,
  }));
  writeJson(chainPath, chainManifest, true);
  writeJson(
    manifestPath,
    { last_backfill_ms: start, seasons: chainManifest.map((c) => c.season) },
    true,
  );

  console.log(`\nDone in ${((Date.now() - start) / 1000).toFixed(1)}s.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
