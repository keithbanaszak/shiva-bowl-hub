import path from "node:path";
import { z } from "zod";
import { readJson, readJsonIfExists, listFiles } from "./fsx";
import {
  seasonDir,
  matchupsDir,
  transactionsDir,
  projectionsDir,
  playersPath,
  chainPath,
} from "./paths";
import {
  LeagueSchema,
  UserSchema,
  RosterSchema,
  MatchupSchema,
  TransactionSchema,
  TradedPickSchema,
  DraftSchema,
  DraftPickSchema,
  BracketGameSchema,
  SlimPlayerSchema,
} from "./sleeper/types";
import type { DraftBundle, Dynasty, SeasonData } from "./model";

type ChainEntry = { season: string; league_id: string; status: string | null; name: string | null };

/** Parse an array of items, dropping (and warning about) any that fail validation. */
function parseArray<T>(schema: z.ZodType<T>, data: unknown, label: string): T[] {
  if (!Array.isArray(data)) return [];
  const out: T[] = [];
  let bad = 0;
  for (const item of data) {
    const r = schema.safeParse(item);
    if (r.success) out.push(r.data);
    else bad++;
  }
  if (bad > 0) console.warn(`  ⚠ ${label}: ${bad}/${data.length} items failed validation`);
  return out;
}

const weekFromFile = (f: string): number => Number(f.replace(/^week_/, "").replace(/\.json$/, ""));

function loadWeekly<T>(dir: string, schema: z.ZodType<T>, label: string): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const f of listFiles(dir)) {
    const week = weekFromFile(f);
    if (!Number.isFinite(week)) continue;
    map.set(week, parseArray(schema, readJson(path.join(dir, f)), `${label} wk${week}`));
  }
  return map;
}

function loadProjections(season: string): Map<number, Record<string, number>> {
  const map = new Map<number, Record<string, number>>();
  const dir = projectionsDir(season);
  for (const f of listFiles(dir)) {
    const week = weekFromFile(f);
    if (!Number.isFinite(week)) continue;
    map.set(week, readJson<Record<string, number>>(path.join(dir, f)));
  }
  return map;
}

function loadSeason(entry: ChainEntry): SeasonData {
  const dir = seasonDir(entry.season);
  const league = LeagueSchema.parse(readJson(path.join(dir, "league.json")));
  const users = parseArray(UserSchema, readJsonIfExists(path.join(dir, "users.json")), "users");
  const rosters = parseArray(RosterSchema, readJsonIfExists(path.join(dir, "rosters.json")), "rosters");
  const tradedPicks = parseArray(
    TradedPickSchema,
    readJsonIfExists(path.join(dir, "traded_picks.json")),
    "traded_picks",
  );
  const winnersBracket = parseArray(
    BracketGameSchema,
    readJsonIfExists(path.join(dir, "winners_bracket.json")),
    "winners_bracket",
  );
  const losersBracket = parseArray(
    BracketGameSchema,
    readJsonIfExists(path.join(dir, "losers_bracket.json")),
    "losers_bracket",
  );

  const rawDrafts = (readJsonIfExists(path.join(dir, "drafts.json")) ?? []) as Array<{
    draft: unknown;
    picks: unknown;
    traded_picks: unknown;
  }>;
  const drafts: DraftBundle[] = rawDrafts.map((b) => ({
    draft: DraftSchema.parse(b.draft),
    picks: parseArray(DraftPickSchema, b.picks, "draft picks"),
    traded_picks: parseArray(TradedPickSchema, b.traded_picks, "draft traded_picks"),
  }));

  return {
    season: entry.season,
    leagueId: entry.league_id,
    name: league.name,
    status: league.status,
    settings: league.settings,
    rosterPositions: league.roster_positions,
    playoffWeekStart: league.settings.playoff_week_start ?? 15,
    scoringSettings: league.scoring_settings,
    league,
    users,
    rosters,
    matchupsByWeek: loadWeekly(matchupsDir(entry.season), MatchupSchema, "matchups"),
    transactionsByWeek: loadWeekly(transactionsDir(entry.season), TransactionSchema, "transactions"),
    projectionsByWeek: loadProjections(entry.season),
    tradedPicks,
    drafts,
    winnersBracket,
    losersBracket,
  };
}

export function loadDynasty(): Dynasty {
  const chain = readJsonIfExists<ChainEntry[]>(chainPath);
  if (!chain || chain.length === 0) {
    throw new Error("data/league_chain.json missing — run `npm run ingest:backfill` first");
  }
  const seasons = chain.map(loadSeason); // already newest -> oldest
  const players = parseRecord(readJsonIfExists(playersPath) ?? {});
  return { seasons, players };
}

function parseRecord(data: unknown): Dynasty["players"] {
  const out: Dynasty["players"] = {};
  if (data && typeof data === "object") {
    for (const [id, v] of Object.entries(data as Record<string, unknown>)) {
      const r = SlimPlayerSchema.safeParse(v);
      if (r.success) out[id] = r.data;
    }
  }
  return out;
}
