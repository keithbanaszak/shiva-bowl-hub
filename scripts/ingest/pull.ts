import path from "node:path";
import { leagueConfig } from "../../league.config";
import { api } from "../../lib/sleeper/client";
import { writeJson } from "../../lib/fsx";
import { seasonDir, matchupsDir, transactionsDir } from "../../lib/paths";

export type LooseLeague = {
  league_id: string;
  season: string;
  name?: string;
  status?: string;
  previous_league_id?: string | null;
  draft_id?: string | null;
};

type LooseRoster = { players?: string[] | null };
type LooseMatchup = { players?: string[] | null };
type LooseTxn = { adds?: Record<string, number> | null; drops?: Record<string, number> | null };
type LooseDraftPick = { player_id?: string | null };

export const isPlayerId = (id: unknown): id is string =>
  typeof id === "string" && id.length > 0 && id !== "0";

/** Walk the dynasty chain newest -> oldest, following previous_league_id. */
export async function walkChain(currentId: string): Promise<LooseLeague[]> {
  const chain: LooseLeague[] = [];
  let id: string | null | undefined = currentId;
  const seen = new Set<string>();
  while (id && id !== "0" && !seen.has(id)) {
    seen.add(id);
    const lg = (await api.league(id)) as LooseLeague | null;
    if (!lg) break;
    chain.push(lg);
    id = lg.previous_league_id;
  }
  return chain;
}

/**
 * Pull every endpoint for a single season into data/raw/<season>/ and add any
 * player ids encountered to `neededIds` (so the player dump can be filtered).
 * `weeks` lets refresh re-pull only the current weeks; backfill passes 1..maxWeek.
 */
export async function pullSeason(
  lg: LooseLeague,
  neededIds: Set<string>,
  weeks: number[] = Array.from({ length: leagueConfig.maxWeek }, (_, i) => i + 1),
): Promise<void> {
  const { league_id: id, season } = lg;
  const dir = seasonDir(season);
  console.log(`\n== ${season} (${lg.status}) league_id=${id} ==`);

  writeJson(path.join(dir, "league.json"), lg);

  const [users, rosters, tradedPicks, drafts, winners, losers] = await Promise.all([
    api.users(id),
    api.rosters(id),
    api.tradedPicks(id),
    api.drafts(id),
    api.winnersBracket(id),
    api.losersBracket(id),
  ]);

  writeJson(path.join(dir, "users.json"), users ?? []);
  writeJson(path.join(dir, "rosters.json"), rosters ?? []);
  writeJson(path.join(dir, "traded_picks.json"), tradedPicks ?? []);
  writeJson(path.join(dir, "winners_bracket.json"), winners ?? []);
  writeJson(path.join(dir, "losers_bracket.json"), losers ?? []);

  for (const r of (rosters ?? []) as LooseRoster[]) {
    (r.players ?? []).forEach((p) => isPlayerId(p) && neededIds.add(p));
  }

  const draftBundles: Array<{ draft: unknown; picks: unknown[]; traded_picks: unknown[] }> = [];
  for (const d of (drafts ?? []) as Array<{ draft_id: string }>) {
    const [draft, picks, tp] = await Promise.all([
      api.draft(d.draft_id),
      api.draftPicks(d.draft_id),
      api.draftTradedPicks(d.draft_id),
    ]);
    for (const pk of (picks ?? []) as LooseDraftPick[]) {
      if (isPlayerId(pk.player_id)) neededIds.add(pk.player_id as string);
    }
    draftBundles.push({ draft: draft ?? d, picks: picks ?? [], traded_picks: tp ?? [] });
  }
  writeJson(path.join(dir, "drafts.json"), draftBundles);
  console.log(
    `  core: ${(users ?? []).length} users, ${(rosters ?? []).length} rosters, ${draftBundles.length} drafts`,
  );

  let mWeeks = 0;
  let tWeeks = 0;
  for (const week of weeks) {
    const [matchups, txns] = await Promise.all([
      api.matchups(id, week),
      api.transactions(id, week),
    ]);
    if (matchups && matchups.length > 0) {
      writeJson(path.join(matchupsDir(season), `week_${week}.json`), matchups);
      mWeeks++;
      for (const m of matchups as LooseMatchup[]) {
        (m.players ?? []).forEach((p) => isPlayerId(p) && neededIds.add(p));
      }
    }
    if (txns && txns.length > 0) {
      writeJson(path.join(transactionsDir(season), `week_${week}.json`), txns);
      tWeeks++;
      for (const t of txns as LooseTxn[]) {
        Object.keys(t.adds ?? {}).forEach((p) => isPlayerId(p) && neededIds.add(p));
        Object.keys(t.drops ?? {}).forEach((p) => isPlayerId(p) && neededIds.add(p));
      }
    }
  }
  console.log(`  weekly: ${mWeeks} matchup-weeks, ${tWeeks} transaction-weeks`);
}
