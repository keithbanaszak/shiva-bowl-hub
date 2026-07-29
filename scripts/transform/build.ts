/**
 * Transform: read data/raw -> compute all derived stats -> write per-domain marts
 * under data/marts/. Pure in-memory aggregation; the app reads only the marts.
 *
 *   npm run data:build
 */
import path from "node:path";
import { loadDynasty } from "../../lib/raw";
import { buildIdentity } from "../../lib/identity";
import { writeJson } from "../../lib/fsx";
import { MARTS_DIR, searchIndexPath } from "../../lib/paths";
import { computeSeason } from "../../lib/stats/season";
import { computePlayoffs } from "../../lib/stats/playoffs";
import { computeH2H } from "../../lib/stats/h2h";
import { computeTrades } from "../../lib/stats/trades";
import { buildAwardsAndCards } from "../../lib/stats/awards";
import { buildPlayerWeeks } from "../../lib/stats/playerWeeks";
import { computePlayerStats } from "../../lib/stats/players";
import { computeWaivers } from "../../lib/stats/acquisitions";
import { computeDraft } from "../../lib/stats/draft";
import { computeSchedule } from "../../lib/stats/schedule";
import { computeLineups } from "../../lib/stats/lineups";
import { computeRecords } from "../../lib/stats/records";
import { computeKryptonite } from "../../lib/stats/kryptonite";
import { computeDraftBoards } from "../../lib/stats/draftBoards";
import { computePlayerLegacy } from "../../lib/stats/playerLegacy";
import { computeTeamPower } from "../../lib/stats/teamPower";
import { computeHome } from "../../lib/stats/home";
import { computePosBreakdown } from "../../lib/stats/posBreakdown";
import { buildSearchIndex } from "../../lib/stats/searchIndex";
import { computePlayerRanks } from "../../lib/stats/playerRanks";
import { computeActivity } from "../../lib/stats/activity";
import { computeIntegrity } from "../../lib/stats/integrity";
import { computeSlotScoring } from "../../lib/stats/slotScoring";
import { computeRosterAge } from "../../lib/stats/rosterAge";
import { computeWhatIf } from "../../lib/stats/whatIf";
import { computeUpcoming } from "../../lib/stats/upcoming";
import { computePlayoffPicture } from "../../lib/stats/playoffPicture";
import type { AllTimeRow, SeasonPlayoffs, SeasonStanding, TeamWeek } from "../../lib/stats/types";
import { round2 } from "../../lib/stats/util";

function buildAllTime(standings: SeasonStanding[], playoffs: SeasonPlayoffs[]): AllTimeRow[] {
  const champs = new Map<string, number>();
  const poW = new Map<string, number>();
  const poL = new Map<string, number>();
  const runners = new Map<string, number>();
  const apps = new Map<string, number>();
  const best = new Map<string, number>();
  const finishSum = new Map<string, { sum: number; n: number }>();
  for (const p of playoffs) {
    for (const [uid, place] of Object.entries(p.finishes)) {
      if (place === 1) champs.set(uid, (champs.get(uid) ?? 0) + 1);
      if (place === 2) runners.set(uid, (runners.get(uid) ?? 0) + 1);
      const b = best.get(uid);
      if (b == null || place < b) best.set(uid, place);
      const f = finishSum.get(uid) ?? { sum: 0, n: 0 };
      f.sum += place;
      f.n++;
      finishSum.set(uid, f);
    }
    for (const uid of Object.keys(p.seeds)) apps.set(uid, (apps.get(uid) ?? 0) + 1);
    // only the winners bracket counts as "playoffs"; the losers bracket is consolation
    for (const g of p.games) {
      if (g.bracket !== "winners") continue;
      if (g.winnerUserId) poW.set(g.winnerUserId, (poW.get(g.winnerUserId) ?? 0) + 1);
      if (g.loserUserId) poL.set(g.loserUserId, (poL.get(g.loserUserId) ?? 0) + 1);
    }
  }

  type Acc = AllTimeRow & { _fpts: number; _ppts: number };
  const byUser = new Map<string, Acc>();
  for (const s of standings) {
    let row = byUser.get(s.userId);
    if (!row) {
      row = {
        userId: s.userId,
        seasons: 0,
        games: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        winPct: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointsPerGame: 0,
        championships: champs.get(s.userId) ?? 0,
        runnerUps: runners.get(s.userId) ?? 0,
        playoffAppearances: apps.get(s.userId) ?? 0,
        playoffWins: poW.get(s.userId) ?? 0,
        playoffLosses: poL.get(s.userId) ?? 0,
        playoffWinPct: 0,
        bestFinish: best.get(s.userId) ?? null,
        avgFinish: null,
        allPlayWins: 0,
        allPlayLosses: 0,
        allPlayWinPct: 0,
        totalLuck: 0,
        careerEfficiency: 0,
        benchPointsTotal: 0,
        _fpts: 0,
        _ppts: 0,
      };
      byUser.set(s.userId, row);
    }
    row.seasons++;
    row.wins += s.wins;
    row.losses += s.losses;
    row.ties += s.ties;
    row.pointsFor += s.pointsFor;
    row.pointsAgainst += s.pointsAgainst;
    row.allPlayWins += s.allPlayWins;
    row.allPlayLosses += s.allPlayLosses;
    row.totalLuck += s.luck;
    row.benchPointsTotal += s.benchPoints;
    row._fpts += s.seasonFpts;
    row._ppts += s.seasonPpts;
  }

  return [...byUser.values()]
    .map((r) => {
      r.games = r.wins + r.losses + r.ties;
      r.winPct = r.games > 0 ? round2((r.wins + r.ties * 0.5) / r.games) : 0;
      r.pointsFor = round2(r.pointsFor);
      r.pointsAgainst = round2(r.pointsAgainst);
      r.pointsPerGame = r.games > 0 ? round2(r.pointsFor / r.games) : 0;
      const ap = r.allPlayWins + r.allPlayLosses;
      r.allPlayWinPct = ap > 0 ? round2(r.allPlayWins / ap) : 0;
      r.totalLuck = round2(r.totalLuck);
      r.benchPointsTotal = round2(r.benchPointsTotal);
      r.careerEfficiency = r._ppts > 0 ? round2(r._fpts / r._ppts) : 0;
      const pg = r.playoffWins + r.playoffLosses;
      r.playoffWinPct = pg > 0 ? round2(r.playoffWins / pg) : 0;
      const f = finishSum.get(r.userId);
      r.avgFinish = f && f.n > 0 ? round2(f.sum / f.n) : null;
      const { _fpts, _ppts, ...rest } = r;
      void _fpts;
      void _ppts;
      return rest;
    })
    .sort((a, b) => b.winPct - a.winPct || b.pointsFor - a.pointsFor);
}

function main() {
  const start = Date.now();
  console.log("Loading raw dynasty data…");
  const dynasty = loadDynasty();
  const identity = buildIdentity(dynasty);
  console.log(`  ${dynasty.seasons.length} seasons, ${identity.managers.length} managers, ${Object.keys(dynasty.players).length} players`);

  console.log("Indexing player-weeks…");
  const index = buildPlayerWeeks(dynasty, identity);
  console.log(`  ${index.all.length} player-week rows, ${index.byPlayer.size} players`);

  const teamWeeks: TeamWeek[] = [];
  const standings: SeasonStanding[] = [];
  const playoffs: SeasonPlayoffs[] = [];
  const validation: { season: string; userId: string; computedOptimal: number; sleeperPpts: number; diff: number }[] = [];

  for (const s of dynasty.seasons) {
    const c = computeSeason(s, identity, dynasty);
    teamWeeks.push(...c.teamWeeks);
    validation.push(...c.validation);
    if (c.standings.length === 0) continue;
    const po = computePlayoffs(s, identity, c.standings);
    playoffs.push(po);
    for (const row of c.standings) {
      row.seed = po.seeds[row.userId] ?? null;
      row.finish = po.finishes[row.userId] ?? null;
      row.madePlayoffs = row.seed != null;
      row.champion = row.finish === 1;
    }
    standings.push(...c.standings);
  }

  console.log("Computing stats…");
  const h2h = computeH2H(teamWeeks);
  const playerRanks = computePlayerRanks(dynasty, index);
  const trades = computeTrades(dynasty, identity, index, playerRanks);
  const allTime = buildAllTime(standings, playoffs);
  const { awards, cards } = buildAwardsAndCards({ dynasty, identity, teamWeeks, standings, playoffs, h2h, trades });
  const playerStats = computePlayerStats(index);
  const waivers = computeWaivers(dynasty, identity, index);
  const draft = computeDraft(dynasty, identity, index);
  const schedule = computeSchedule(teamWeeks, h2h, trades, playoffs, standings);
  const lineups = computeLineups(dynasty, identity);
  const records = computeRecords(teamWeeks);
  const kryptonite = computeKryptonite(index);
  const draftBoards = computeDraftBoards(dynasty, identity);
  const playerLegacy = computePlayerLegacy(index, dynasty, identity);
  const teamPower = computeTeamPower(dynasty, identity, index);
  const home = computeHome(dynasty, index, teamWeeks);
  const posBreakdown = computePosBreakdown(dynasty, index, teamWeeks);
  const activity = computeActivity(trades, waivers);
  const integrity = computeIntegrity(dynasty, identity, teamWeeks);
  const slotScoring = computeSlotScoring(dynasty, identity);
  const rosterAge = computeRosterAge(dynasty, identity);
  const whatIf = computeWhatIf(dynasty, identity);
  const upcoming = computeUpcoming(dynasty, identity);
  const playoffPicture = computePlayoffPicture(dynasty, standings, playoffs, teamWeeks);

  // ---- write per-domain marts
  const w = (name: string, data: unknown) => writeJson(path.join(MARTS_DIR, `${name}.json`), data);
  w("core", {
    generatedAtMs: start,
    managers: identity.managers,
    chain: dynasty.seasons.map((s) => ({ season: s.season, leagueId: s.leagueId, status: s.status, name: s.name })),
    allTime,
    validation,
  });
  w("standings", standings);
  w("playoffs", playoffs);
  w("teamWeeks", teamWeeks);
  w("h2h", h2h);
  w("trades", trades);
  w("awards", awards);
  w("cards", cards);
  w("playerStats", playerStats);
  w("waivers", waivers);
  w("draft", draft);
  w("schedule", schedule);
  w("lineups", lineups);
  w("records", records);
  w("kryptonite", kryptonite);
  w("draftBoards", draftBoards);
  w("playerLegacy", playerLegacy);
  w("teamPower", teamPower);
  w("home", home);
  w("posBreakdown", posBreakdown);
  w("playerRanks", playerRanks);
  w("activity", activity);
  w("integrity", integrity);
  w("slotScoring", slotScoring);
  w("rosterAge", rosterAge);
  w("whatIf", whatIf);
  w("upcoming", upcoming);
  w("playoffPicture", playoffPicture);

  // Written into the per-league source dir; select-league.mjs copies it to
  // public/search-index.json (served as a static asset, not imported) for the
  // active league at build time.
  const searchIndex = buildSearchIndex(identity, playerLegacy);
  searchIndex.generatedAtMs = start;
  writeJson(searchIndexPath, searchIndex);

  console.log(
    `\nMarts written: ${teamWeeks.length} team-weeks · ${standings.length} standings · ${h2h.length} rivalries · ${trades.length} trades · ${playerStats.startRecords.length} start-records · ${waivers.acquisitions.length} key adds · ${draft.picks.length} picks · ${schedule.length} matchups · ${lineups.length} lineups · ${playerLegacy.players.length} player legacies · ${teamPower.teams.length} team power.`,
  );

  if (validation.length > 0) {
    const within = validation.filter((v) => Math.abs(v.diff) <= 0.5).length;
    const maxDiff = Math.max(...validation.map((v) => Math.abs(v.diff)));
    console.log(`Optimal-lineup validation vs ppts: ${within}/${validation.length} within 0.5, max abs diff ${round2(maxDiff)}`);
  }
  console.log(`Done in ${((Date.now() - start) / 1000).toFixed(1)}s.`);
}

main();
