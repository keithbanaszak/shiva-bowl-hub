/**
 * Materialize the ACTIVE league into the canonical paths the app imports.
 *
 * The app statically imports @/data/marts/*, @/data/players.json,
 * @/data/league-config.json and fetches public/search-index.json — fixed paths,
 * no league awareness. This copies the league chosen by the LEAGUE env var
 * (default: DEFAULT_LEAGUE) from its committed source at data/leagues/<slug>/
 * into those canonical spots, and writes data/active-league.json for branding.
 *
 * Runs in `predev` and `prebuild` (see package.json), so `npm run dev` and
 * `next build` always see the right league. The canonical copies it writes are
 * gitignored — only the per-league source under data/leagues/ is committed.
 *
 * Plain Node, no TS toolchain: it must run before anything else in the build.
 */
import fs from "node:fs";
import path from "node:path";
import { activeLeague } from "../leagues.config.mjs";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "data");
const PUBLIC = path.join(ROOT, "public");

const league = activeLeague();
const src = path.join(DATA, "leagues", league.slug);

if (!fs.existsSync(src)) {
  console.error(
    `[select-league] No data for "${league.slug}" at ${path.relative(ROOT, src)}.\n` +
      `Backfill it first:  LEAGUE=${league.slug} npm run data:all`,
  );
  process.exit(1);
}

const copyDir = (from, to) => {
  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(to, { recursive: true });
  fs.cpSync(from, to, { recursive: true });
};

const copyFile = (from, to, { optional = false } = {}) => {
  if (!fs.existsSync(from)) {
    if (optional) return false;
    throw new Error(`[select-league] missing required source: ${path.relative(ROOT, from)}`);
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  return true;
};

// 1) marts — the 27 JSON files the app imports
copyDir(path.join(src, "marts"), path.join(DATA, "marts"));

// 2) the player dictionary
copyFile(path.join(src, "players.json"), path.join(DATA, "players.json"));

// 3) the ⌘K search index (served as a static asset)
copyFile(path.join(src, "search-index.json"), path.join(PUBLIC, "search-index.json"));

// 4) league config (rules + manager profiles). Optional: a league with no sheet
//    yet has none, so fall back to an empty doc rather than break the import.
const cfgOut = path.join(DATA, "league-config.json");
if (!copyFile(path.join(src, "league-config.json"), cfgOut, { optional: true })) {
  fs.writeFileSync(cfgOut, JSON.stringify({ fetchedAtMs: 0, rules: [], profiles: [] }, null, 2));
}

// 5) branding + ids for the app shim (league.config.ts imports this)
const active = {
  slug: league.slug,
  currentLeagueId: league.currentLeagueId,
  sport: league.sport,
  maxWeek: league.maxWeek,
  name: league.name,
  shortName: league.shortName,
  tagline: league.tagline,
  configSheet: league.configSheet,
};
fs.writeFileSync(path.join(DATA, "active-league.json"), JSON.stringify(active, null, 2) + "\n");

console.log(`[select-league] active league: ${league.name} (${league.slug})`);
