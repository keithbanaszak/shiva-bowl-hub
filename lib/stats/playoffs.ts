import type { SeasonData } from "../model";
import type { Identity } from "../identity";
import { userForRoster } from "../identity";
import type { BracketGame } from "../sleeper/types";
import type { PlayoffGame, SeasonPlayoffs, SeasonStanding } from "./types";
import { matchupPoints, round2 } from "./util";

type SlotRef = number | Record<string, number> | null | undefined;

function resolveTeam(ref: SlotRef, byMatch: Map<number, BracketGame>): number | null {
  if (typeof ref === "number") return ref;
  if (ref && typeof ref === "object") {
    if ("w" in ref) return byMatch.get(ref.w)?.w ?? null;
    if ("l" in ref) return byMatch.get(ref.l)?.l ?? null;
  }
  return null;
}

export function computePlayoffs(
  s: SeasonData,
  identity: Identity,
  standings: SeasonStanding[],
): SeasonPlayoffs {
  const uid = (rosterId: number | null): string | null =>
    rosterId == null ? null : userForRoster(identity, s.season, rosterId);

  // week -> rosterId -> points (for resolving playoff game scores)
  const pointsByWeek = new Map<number, Map<number, number>>();
  for (const [week, entries] of s.matchupsByWeek) {
    const m = new Map<number, number>();
    for (const e of entries) m.set(e.roster_id, matchupPoints(e));
    pointsByWeek.set(week, m);
  }

  const buildGames = (bracket: BracketGame[], name: "winners" | "losers"): PlayoffGame[] => {
    const byMatch = new Map(bracket.map((g) => [g.m, g]));
    return bracket.map((g) => {
      const home = resolveTeam(g.t1, byMatch);
      const away = resolveTeam(g.t2, byMatch);
      const week = s.playoffWeekStart + (g.r - 1);
      const wk = pointsByWeek.get(week);
      return {
        season: s.season,
        bracket: name,
        round: g.r,
        week,
        homeUserId: uid(home),
        awayUserId: uid(away),
        homePoints: home != null && wk ? round2(wk.get(home) ?? 0) : null,
        awayPoints: away != null && wk ? round2(wk.get(away) ?? 0) : null,
        winnerUserId: uid(g.w ?? null),
        loserUserId: uid(g.l ?? null),
        placement: g.p ?? null,
      };
    });
  };

  const games = [
    ...buildGames(s.winnersBracket, "winners"),
    ...buildGames(s.losersBracket, "losers"),
  ];

  // Finishes from placement games. Winners bracket: place p -> winner, p+1 -> loser.
  const playoffTeams = s.settings.playoff_teams ?? 6;
  const finishes: Record<string, number> = {};
  for (const g of s.winnersBracket) {
    if (g.p == null) continue;
    if (g.w != null) {
      const u = uid(g.w);
      if (u) finishes[u] = g.p;
    }
    if (g.l != null) {
      const u = uid(g.l);
      if (u) finishes[u] = g.p + 1;
    }
  }

  // The consolation (losers) bracket ranks teams BELOW the playoff field. It can
  // be a normal consolation (win => 7th, best of the rest) OR a "toilet bowl"
  // (win => LAST place). Detect by seeding: if the byes go to the WORST
  // regular-season teams, winning advances you toward the bottom, so reverse it.
  const losersTeams = new Set<number>();
  for (const g of s.losersBracket) {
    if (typeof g.t1 === "number") losersTeams.add(g.t1);
    if (typeof g.t2 === "number") losersTeams.add(g.t2);
  }
  const maxConsolationPlace = playoffTeams + losersTeams.size;

  const rsRank = new Map<number, number>(); // rosterId -> regular-season rank (1 = best)
  [...standings]
    .sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor)
    .forEach((r, i) => rsRank.set(r.rosterId, i + 1));

  const toiletBowl = (() => {
    const r1 = new Set<number>();
    for (const g of s.losersBracket)
      if (g.r === 1) {
        if (typeof g.t1 === "number") r1.add(g.t1);
        if (typeof g.t2 === "number") r1.add(g.t2);
      }
    const byes = new Set<number>();
    for (const g of s.losersBracket)
      if ((g.r ?? 0) > 1) {
        if (typeof g.t1 === "number" && !r1.has(g.t1)) byes.add(g.t1);
        if (typeof g.t2 === "number" && !r1.has(g.t2)) byes.add(g.t2);
      }
    if (byes.size === 0 || r1.size === 0) return false;
    const avgRank = (set: Set<number>) =>
      [...set].reduce((sum, rid) => sum + (rsRank.get(rid) ?? 0), 0) / set.size;
    return avgRank(byes) > avgRank(r1); // byes seeded to the worst teams => toilet bowl
  })();

  for (const g of s.losersBracket) {
    if (g.p == null) continue;
    const wPlace = toiletBowl ? maxConsolationPlace - (g.p - 1) : playoffTeams + g.p;
    const lPlace = toiletBowl ? maxConsolationPlace - g.p : playoffTeams + g.p + 1;
    if (g.w != null) {
      const u = uid(g.w);
      if (u) finishes[u] = wPlace;
    }
    if (g.l != null) {
      const u = uid(g.l);
      if (u) finishes[u] = lPlace;
    }
  }

  // seeds: top-N regular-season teams by record then PF
  const seeds: Record<string, number> = {};
  [...standings]
    .sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor)
    .slice(0, playoffTeams)
    .forEach((row, i) => (seeds[row.userId] = i + 1));

  const placeToUser = (place: number): string | null =>
    Object.entries(finishes).find(([, p]) => p === place)?.[0] ?? null;

  const maxPlace = Object.values(finishes).reduce((m, p) => Math.max(m, p), 0);

  return {
    season: s.season,
    championUserId: placeToUser(1),
    runnerUpUserId: placeToUser(2),
    thirdUserId: placeToUser(3),
    toiletUserId: maxPlace > 0 ? placeToUser(maxPlace) : null,
    games,
    finishes,
    seeds,
  };
}
