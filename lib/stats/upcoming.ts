import type { Dynasty } from "../model";
import type { Matchup } from "../sleeper/types";
import type { Identity } from "../identity";
import { userForRoster } from "../identity";
import { optimalLineup } from "../optimal-lineup";
import { eligibilityFn, pairByMatchup, round2 } from "./util";
import type { UpcomingMart, UpcomingMatchup } from "./types";

/**
 * The upcoming (scheduled-but-unplayed) matchups for the current season.
 *
 * Reads season.upcomingByWeek — the weeks keepPlayedWeeks pulled out of the
 * played data so they never counted as results — and projects each side's score
 * as its BEST possible lineup by Sleeper projection. Optimal-by-projection (not
 * the currently-set lineup) is used deliberately: early in a week managers often
 * haven't set lineups yet, so the set starters are stale; the projected ceiling
 * is a fair, always-available preview number.
 *
 * Regular season only — playoff matchups don't exist until the field is seeded.
 */
export function computeUpcoming(dynasty: Dynasty, identity: Identity): UpcomingMart {
  const elig = eligibilityFn(dynasty.players);
  const season = dynasty.seasons.find((s) => s.upcomingByWeek.size > 0);
  if (!season) return { season: null, nextWeek: null, weeks: [], matchups: [] };

  const uid = (rosterId: number) => userForRoster(identity, season.season, rosterId);
  const weeks = [...season.upcomingByWeek.keys()]
    .filter((w) => w < season.playoffWeekStart)
    .sort((a, b) => a - b);

  const matchups: UpcomingMatchup[] = [];
  for (const week of weeks) {
    const entries = season.upcomingByWeek.get(week) ?? [];
    const proj = season.projectionsByWeek.get(week);
    const projTotal = (m: Matchup): number => {
      if (!proj || !m.players) return 0;
      const map: Record<string, number> = {};
      for (const pid of m.players) map[pid] = proj[pid] ?? 0;
      return round2(optimalLineup(season.rosterPositions, map, elig).total);
    };

    const weekGames: UpcomingMatchup[] = [];
    for (const [matchupId, group] of pairByMatchup(entries)) {
      if (group.length < 2) continue;
      const [a, b] = group;
      weekGames.push({
        season: season.season,
        week,
        matchupId,
        aUserId: uid(a.roster_id),
        bUserId: uid(b.roster_id),
        aProj: projTotal(a),
        bProj: projTotal(b),
        isGameOfWeek: false,
      });
    }

    // Marquee game = highest combined projection (two strong teams).
    let best = -1;
    let bestIdx = -1;
    weekGames.forEach((g, i) => {
      const total = g.aProj + g.bProj;
      if (total > best) {
        best = total;
        bestIdx = i;
      }
    });
    if (bestIdx >= 0) weekGames[bestIdx].isGameOfWeek = true;

    matchups.push(...weekGames);
  }

  return { season: season.season, nextWeek: weeks[0] ?? null, weeks, matchups };
}
