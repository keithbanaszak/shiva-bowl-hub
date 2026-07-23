import type { Dynasty } from "../model";
import type { Identity } from "../identity";
import { userForRoster } from "../identity";
import { matchupPoints, pairByMatchup, resultOf } from "./util";
import type { Result } from "./types";

/** One player's stat line for one week, with who rostered him and the matchup result. */
export type PlayerWeek = {
  season: string;
  week: number;
  order: number; // chronological key: Number(season)*100 + week
  playerId: string;
  userId: string;
  rosterId: number;
  opponentUserId: string | null; // manager the player's team faced
  points: number;
  started: boolean;
  result: Result | null; // result of the matchup the player's team was in
  isPlayoff: boolean;
};

export type PlayerWeekIndex = {
  all: PlayerWeek[];
  byPlayer: Map<string, PlayerWeek[]>;
};

export const orderOf = (season: string, week: number) => Number(season) * 100 + week;

export function buildPlayerWeeks(dynasty: Dynasty, identity: Identity): PlayerWeekIndex {
  const all: PlayerWeek[] = [];

  for (const s of dynasty.seasons) {
    for (const [week, entries] of s.matchupsByWeek) {
      const isPlayoff = week >= s.playoffWeekStart;
      const pairs = pairByMatchup(entries);
      for (const m of entries) {
        if (!m.players_points) continue;
        const my = matchupPoints(m);
        let result: Result | null = null;
        let opponentUserId: string | null = null;
        if (m.matchup_id != null) {
          const opp = (pairs.get(m.matchup_id) ?? []).find((e) => e.roster_id !== m.roster_id);
          if (opp) {
            result = resultOf(my, matchupPoints(opp));
            opponentUserId = userForRoster(identity, s.season, opp.roster_id);
          }
        }
        const userId = userForRoster(identity, s.season, m.roster_id);
        const starters = new Set(m.starters ?? []);
        for (const [pid, points] of Object.entries(m.players_points)) {
          all.push({
            season: s.season,
            week,
            order: orderOf(s.season, week),
            playerId: pid,
            userId,
            rosterId: m.roster_id,
            opponentUserId,
            points,
            started: starters.has(pid),
            result,
            isPlayoff,
          });
        }
      }
    }
  }

  const byPlayer = new Map<string, PlayerWeek[]>();
  for (const pw of all) {
    const arr = byPlayer.get(pw.playerId) ?? [];
    arr.push(pw);
    byPlayer.set(pw.playerId, arr);
  }
  for (const arr of byPlayer.values()) arr.sort((a, b) => a.order - b.order);

  return { all, byPlayer };
}

export type Realized = {
  realizedSeason: number;
  realizedCareer: number;
  starterSeason: number;
  starterCareer: number;
  weeksRosteredCareer: number;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Points an acquired player produced WHILE ON the acquiring manager's roster,
 * counting only weeks strictly after the acquisition.
 * - season scope: capped to the acquisition season.
 * - career scope: follows the player across seasons for as long as that manager
 *   kept rostering him (naturally pauses if he's traded away and resumes if reacquired).
 */
export function realizedFor(
  index: PlayerWeekIndex,
  managerUserId: string,
  playerId: string,
  fromSeason: string,
  fromWeek: number,
): Realized {
  const fromOrder = orderOf(fromSeason, fromWeek);
  const log = index.byPlayer.get(playerId) ?? [];
  let realizedSeason = 0;
  let realizedCareer = 0;
  let starterSeason = 0;
  let starterCareer = 0;
  let weeksRosteredCareer = 0;
  for (const pw of log) {
    if (pw.order <= fromOrder) continue;
    if (pw.userId !== managerUserId) continue;
    weeksRosteredCareer++;
    realizedCareer += pw.points;
    if (pw.started) starterCareer += pw.points;
    if (pw.season === fromSeason) {
      realizedSeason += pw.points;
      if (pw.started) starterSeason += pw.points;
    }
  }
  return {
    realizedSeason: r2(realizedSeason),
    realizedCareer: r2(realizedCareer),
    starterSeason: r2(starterSeason),
    starterCareer: r2(starterCareer),
    weeksRosteredCareer,
  };
}
