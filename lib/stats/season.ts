import type { SeasonData, Dynasty } from "../model";
import { pts } from "../model";
import type { Identity } from "../identity";
import { userForRoster } from "../identity";
import { optimalLineup } from "../optimal-lineup";
import type { SeasonStanding, TeamWeek } from "./types";
import {
  eligibilityFn,
  matchupPoints,
  pairByMatchup,
  regularSeasonWeeks,
  resultOf,
  median,
  round2,
} from "./util";

export type SeasonComputed = {
  teamWeeks: TeamWeek[];
  standings: SeasonStanding[];
  validation: { season: string; userId: string; computedOptimal: number; sleeperPpts: number; diff: number }[];
};

export function computeSeason(s: SeasonData, identity: Identity, dynasty: Dynasty): SeasonComputed {
  const elig = eligibilityFn(dynasty.players);
  const numTeams = s.rosters.length;
  const rosterById = new Map(s.rosters.map((r) => [r.roster_id, r]));
  const uid = (rosterId: number) => userForRoster(identity, s.season, rosterId);

  const teamWeeks: TeamWeek[] = [];
  const optimalSum = new Map<number, number>(); // rosterId -> sum optimal across all played weeks

  const allWeeks = [...s.matchupsByWeek.keys()].sort((a, b) => a - b);
  for (const week of allWeeks) {
    const entries = s.matchupsByWeek.get(week) ?? [];
    if (entries.length === 0) continue;
    const isPlayoff = week >= s.playoffWeekStart;
    const pairs = pairByMatchup(entries);
    const weekPoints = entries.map(matchupPoints);
    const med = median(weekPoints);
    const projWeek = s.projectionsByWeek.get(week);

    for (const m of entries) {
      const my = matchupPoints(m);

      // projected starting total
      let proj: number | null = null;
      if (projWeek && m.starters) {
        let tot = 0;
        let any = false;
        for (const pid of m.starters) {
          const pp = projWeek[pid];
          if (typeof pp === "number") {
            tot += pp;
            any = true;
          }
        }
        proj = any ? round2(tot) : null;
      }

      // opponent via shared matchup_id
      let oppPoints: number | null = null;
      let oppUserId: string | null = null;
      if (m.matchup_id != null) {
        const group = pairs.get(m.matchup_id) ?? [];
        const opp = group.find((e) => e.roster_id !== m.roster_id);
        if (opp) {
          oppPoints = matchupPoints(opp);
          oppUserId = uid(opp.roster_id);
        }
      }
      const result = oppPoints == null ? null : resultOf(my, oppPoints);
      const margin = oppPoints == null ? null : round2(my - oppPoints);

      // optimal lineup (needs per-player points)
      let optimalPoints: number | null = null;
      let benchPoints: number | null = null;
      if (m.players_points && Object.keys(m.players_points).length > 0) {
        const opt = optimalLineup(s.rosterPositions, m.players_points, elig);
        optimalPoints = round2(opt.total);
        benchPoints = round2(Math.max(0, opt.total - my));
        // Sleeper's ppts/fpts cover the regular season only, so sum optimal over
        // regular-season weeks for an apples-to-apples validation against ppts.
        if (!isPlayoff) {
          optimalSum.set(m.roster_id, (optimalSum.get(m.roster_id) ?? 0) + opt.total);
        }
      }

      // all-play within the week
      let apW = 0;
      let apL = 0;
      for (const other of entries) {
        if (other.roster_id === m.roster_id) continue;
        const op = matchupPoints(other);
        if (my > op) apW++;
        else if (my < op) apL++;
      }

      teamWeeks.push({
        season: s.season,
        week,
        isPlayoff,
        userId: uid(m.roster_id),
        rosterId: m.roster_id,
        points: round2(my),
        proj,
        optimalPoints,
        benchPoints,
        opponentUserId: oppUserId,
        opponentPoints: oppPoints == null ? null : round2(oppPoints),
        result,
        margin,
        allPlayWins: apW,
        allPlayLosses: apL,
        aboveMedian: my > med ? true : my < med ? false : null,
      });
    }
  }

  // ---- regular-season aggregates -> standings
  const regWeeks = new Set(regularSeasonWeeks(s));
  const agg = new Map<number, SeasonStanding>();
  for (const r of s.rosters) {
    agg.set(r.roster_id, {
      season: s.season,
      userId: uid(r.roster_id),
      rosterId: r.roster_id,
      wins: 0,
      losses: 0,
      ties: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      seasonFpts: round2(pts(r.settings.fpts, r.settings.fpts_decimal)),
      seasonPpts: round2(pts(r.settings.ppts, r.settings.ppts_decimal)),
      benchPoints: round2(pts(r.settings.ppts, r.settings.ppts_decimal) - pts(r.settings.fpts, r.settings.fpts_decimal)),
      efficiency: 0,
      allPlayWins: 0,
      allPlayLosses: 0,
      allPlayWinPct: 0,
      medianWins: 0,
      medianLosses: 0,
      expectedWins: 0,
      luck: 0,
      pfRank: 0,
      seed: null,
      finish: null,
      madePlayoffs: false,
      champion: false,
      regSeasonChamp: false,
    });
  }

  for (const tw of teamWeeks) {
    if (!regWeeks.has(tw.week)) continue;
    const a = agg.get(tw.rosterId);
    if (!a) continue;
    a.pointsFor += tw.points;
    a.pointsAgainst += tw.opponentPoints ?? 0;
    if (tw.result === "W") a.wins++;
    else if (tw.result === "L") a.losses++;
    else if (tw.result === "T") a.ties++;
    a.allPlayWins += tw.allPlayWins;
    a.allPlayLosses += tw.allPlayLosses;
    if (tw.aboveMedian === true) a.medianWins++;
    else if (tw.aboveMedian === false) a.medianLosses++;
    a.expectedWins += tw.allPlayWins / Math.max(1, numTeams - 1);
  }

  const standings = [...agg.values()].map((a) => {
    a.pointsFor = round2(a.pointsFor);
    a.pointsAgainst = round2(a.pointsAgainst);
    a.expectedWins = round2(a.expectedWins);
    a.luck = round2(a.wins - a.expectedWins);
    a.allPlayWinPct =
      a.allPlayWins + a.allPlayLosses > 0
        ? round2(a.allPlayWins / (a.allPlayWins + a.allPlayLosses))
        : 0;
    a.efficiency = a.seasonPpts > 0 ? round2(a.seasonFpts / a.seasonPpts) : 0;
    return a;
  });

  // rank by regular-season points-for
  [...standings]
    .sort((x, y) => y.pointsFor - x.pointsFor)
    .forEach((a, i) => (a.pfRank = i + 1));

  // regular-season champ: best record then PF
  const regChamp = [...standings].sort(
    (x, y) => y.wins - x.wins || y.pointsFor - x.pointsFor,
  )[0];
  if (regChamp && (regChamp.wins > 0 || regChamp.pointsFor > 0)) regChamp.regSeasonChamp = true;

  // validation: computed optimal vs Sleeper ppts
  const validation: SeasonComputed["validation"] = [];
  for (const r of s.rosters) {
    const computed = optimalSum.get(r.roster_id);
    const sleeper = pts(r.settings.ppts, r.settings.ppts_decimal);
    if (computed != null && sleeper > 0) {
      validation.push({
        season: s.season,
        userId: uid(r.roster_id),
        computedOptimal: round2(computed),
        sleeperPpts: round2(sleeper),
        diff: round2(computed - sleeper),
      });
    }
  }

  // only emit standings for seasons that actually played regular-season games
  const played = regWeeks.size > 0 && teamWeeks.some((t) => regWeeks.has(t.week));
  return { teamWeeks, standings: played ? standings : [], validation };
}
