import path from "node:path";

/**
 * All data lives under <repo-root>/data. Scripts are always run via npm from the
 * project root, so process.cwd() is the package directory.
 */
export const ROOT = process.cwd();
export const DATA_DIR = path.join(ROOT, "data");
export const RAW_DIR = path.join(DATA_DIR, "raw");
export const MARTS_DIR = path.join(DATA_DIR, "marts");

export const seasonDir = (season: string) => path.join(RAW_DIR, season);
export const matchupsDir = (season: string) => path.join(seasonDir(season), "matchups");
export const transactionsDir = (season: string) => path.join(seasonDir(season), "transactions");
export const projectionsDir = (season: string) => path.join(seasonDir(season), "projections");

export const playersPath = path.join(DATA_DIR, "players.json");
export const manifestPath = path.join(DATA_DIR, "last_refreshed.json");
export const chainPath = path.join(DATA_DIR, "league_chain.json");
