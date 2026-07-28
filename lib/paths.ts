import path from "node:path";
import { activeSlug } from "../leagues.config.mjs";

/**
 * Data layout for a one-codebase, many-leagues hub.
 *
 * Committed SOURCE of truth lives per-league under data/leagues/<slug>/. Scripts
 * (ingest, transform) read and write there, chosen by the LEAGUE env var.
 *
 * The APP, however, imports fixed paths (@/data/marts, @/data/players.json,
 * @/data/league-config.json, public/search-index.json). Those canonical spots
 * are MATERIALIZED build artifacts: scripts/select-league.mjs copies the active
 * league's source into them before `next build`, so no page code is league-aware
 * and the two deployments differ only by env var. The canonical copies are
 * gitignored — the per-league source is what's committed.
 *
 * Scripts are always run via npm from the project root, so process.cwd() is the
 * package directory.
 */
export const ROOT = process.cwd();
export const DATA_DIR = path.join(ROOT, "data");
export const PUBLIC_DIR = path.join(ROOT, "public");

/** The active league for this process (LEAGUE env var; defaults to shiva). */
export const LEAGUE = activeSlug();
/** Committed per-league source root. */
export const LEAGUE_DIR = path.join(DATA_DIR, "leagues", LEAGUE);

// ---- per-league SOURCE (scripts read/write here) ----
export const RAW_DIR = path.join(LEAGUE_DIR, "raw");
export const MARTS_DIR = path.join(LEAGUE_DIR, "marts");
export const searchIndexPath = path.join(LEAGUE_DIR, "search-index.json");
export const playersPath = path.join(LEAGUE_DIR, "players.json");
export const manifestPath = path.join(LEAGUE_DIR, "last_refreshed.json");
export const chainPath = path.join(LEAGUE_DIR, "league_chain.json");
export const leagueConfigPath = path.join(LEAGUE_DIR, "league-config.json");

// ---- canonical MATERIALIZED targets (select-league.mjs writes; the app reads) ----
export const ACTIVE_MARTS_DIR = path.join(DATA_DIR, "marts");
export const ACTIVE_PLAYERS_PATH = path.join(DATA_DIR, "players.json");
export const ACTIVE_LEAGUE_CONFIG_PATH = path.join(DATA_DIR, "league-config.json");
export const ACTIVE_SEARCH_INDEX_PATH = path.join(PUBLIC_DIR, "search-index.json");
export const ACTIVE_LEAGUE_PATH = path.join(DATA_DIR, "active-league.json");

export const seasonDir = (season: string) => path.join(RAW_DIR, season);
export const matchupsDir = (season: string) => path.join(seasonDir(season), "matchups");
export const transactionsDir = (season: string) => path.join(seasonDir(season), "transactions");
export const projectionsDir = (season: string) => path.join(seasonDir(season), "projections");
