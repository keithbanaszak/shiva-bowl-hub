/**
 * Weekly in-season refresh: re-pull only the CURRENT season (cheap, ~40 calls)
 * to catch new transactions, roster moves, and Monday-night stat corrections.
 * Completed prior seasons are immutable and left untouched.
 *
 *   npm run ingest:refresh
 */
import { leagueConfig } from "../../league.config";
import { api } from "../../lib/sleeper/client";
import { writeJson, readJsonIfExists, listFiles } from "../../lib/fsx";
import { manifestPath, matchupsDir } from "../../lib/paths";
import { pullSeason, type LooseLeague } from "./pull";
import { refreshPlayers } from "./players";
import { pullProjections } from "./projections";

type NflState = { season: string; season_type: string; display_week?: number; week?: number };

async function main() {
  const start = Date.now();
  const state = (await api.state()) as NflState | null;
  console.log(`NFL state: season=${state?.season} type=${state?.season_type} week=${state?.display_week ?? state?.week}`);

  const lg = (await api.league(leagueConfig.currentLeagueId)) as LooseLeague | null;
  if (!lg) throw new Error(`Current league ${leagueConfig.currentLeagueId} not found`);

  const neededIds = new Set<string>();
  // Re-pull the whole current season (it's a single season; this is cheap and
  // guarantees corrections + offseason trades are captured).
  await pullSeason(lg, neededIds);

  // Players: only fetch the dump if our slim file is stale (>24h).
  await refreshPlayers(neededIds, { force: false, nowMs: start });

  // Projections for the current season's played weeks.
  const weeks = listFiles(matchupsDir(lg.season))
    .map((f) => Number(f.replace(/^week_/, "").replace(/\.json$/, "")))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  const scoring = (lg as { scoring_settings?: Record<string, number> }).scoring_settings ?? {};
  if (weeks.length > 0) {
    const n = await pullProjections(lg.season, scoring, weeks, neededIds);
    console.log(`  ${n} projection-weeks refreshed`);
  }

  const prev = readJsonIfExists<Record<string, unknown>>(manifestPath) ?? {};
  writeJson(
    manifestPath,
    {
      ...prev,
      last_refresh_ms: start,
      refreshed_season: lg.season,
      nfl_state: state ?? null,
    },
    true,
  );

  console.log(`\nRefresh done in ${((Date.now() - start) / 1000).toFixed(1)}s.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
