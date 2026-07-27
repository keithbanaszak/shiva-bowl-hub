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

  /*
   * Final standing.
   *
   * Top-N (the playoff field) finish by their WINNERS-bracket result: placement
   * game place p -> winner, p+1 -> loser. Everyone who missed the playoffs is
   * ranked BELOW the field (places N+1 … 12) by regular-season standing — the
   * consolation/"losers" bracket is deliberately ignored for finish, because its
   * low-stakes games otherwise sink a first-team-out 8-6 squad to 10th and make
   * "best finish" read wrong. (The losers games are still kept in `games` for
   * display.) This also matches how the projected draft order ranks non-playoff
   * teams, so the two never disagree.
   */
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

  const bySeed = [...standings].sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor);
  const playoffSet = new Set(bySeed.slice(0, playoffTeams).map((r) => r.userId));

  // teams that missed the playoffs: places N+1… by regular-season order
  let nextNon = playoffTeams + 1;
  for (const row of bySeed) {
    if (playoffSet.has(row.userId)) continue;
    if (finishes[row.userId] == null) finishes[row.userId] = nextNon++;
  }
  // safety net: a playoff team the winners bracket never placed (missing
  // placement game) takes the lowest open top-N slot rather than falling to 7+
  const usedTop = new Set(Object.values(finishes).filter((p) => p <= playoffTeams));
  let openTop = 1;
  for (const row of bySeed) {
    if (!playoffSet.has(row.userId) || finishes[row.userId] != null) continue;
    while (usedTop.has(openTop)) openTop++;
    finishes[row.userId] = openTop;
    usedTop.add(openTop);
  }

  // seeds: top-N regular-season teams by record then PF
  const seeds: Record<string, number> = {};
  bySeed.slice(0, playoffTeams).forEach((row, i) => (seeds[row.userId] = i + 1));

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
