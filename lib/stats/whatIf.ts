import type { Dynasty } from "../model";
import type { Identity } from "../identity";
import { userForRoster } from "../identity";
import { optimalLineup, startingSlots } from "../optimal-lineup";
import { matchupPoints, round2 } from "./util";
import type {
  WhatIfManagerSeason,
  WhatIfMart,
  WhatIfSwap,
  WhatIfWeek,
} from "./types";

type WLT = { w: number; l: number; t: number };

/**
 * The perfect-lineup counterfactual: "if you'd been a flawless start/sit oracle
 * every week, what would your record be?"
 *
 * This is the RETROSPECTIVE optimal — the best lineup available scored on ACTUAL
 * points, not projections — so it is explicitly hindsight, the fun "if I'd only
 * started Trey McBride" lens. That makes it the opposite of /integrity, which is
 * projection-based and only judges what a manager could have known before lock;
 * here we hold the opponent's real score fixed and ask whether the manager's own
 * best possible lineup would have cleared it.
 *
 *   flip = the manager did NOT win, but their optimal lineup beats the opponent.
 *
 * Regular season only (playoff weeks flip nothing for anyone else), and only
 * games with a real opponent.
 */
export function computeWhatIf(dynasty: Dynasty, identity: Identity): WhatIfMart {
  const eligibility = (pid: string): string[] => {
    const p = dynasty.players[pid];
    if (!p) return [];
    return p.fantasy_positions?.length ? p.fantasy_positions : p.position ? [p.position] : [];
  };

  const result = (mine: number, theirs: number | null): "W" | "L" | "T" | null =>
    theirs == null ? null : mine > theirs ? "W" : mine < theirs ? "L" : "T";

  // per (userId:scope) running record, actual and optimal
  const actual = new Map<string, WLT>();
  const optimal = new Map<string, WLT>();
  const bench = new Map<string, number>();
  const flips = new Map<string, number>();
  const totals = new Map<string, { actual: number; optimal: number }>();
  const bump = (map: Map<string, WLT>, key: string, r: "W" | "L" | "T" | null) => {
    if (!r) return;
    const cur = map.get(key) ?? { w: 0, l: 0, t: 0 };
    if (r === "W") cur.w++;
    else if (r === "L") cur.l++;
    else cur.t++;
    map.set(key, cur);
  };

  const flipWeeks: WhatIfWeek[] = [];
  const seasonsSeen = new Set<string>();

  for (const s of dynasty.seasons) {
    for (const [week, entries] of s.matchupsByWeek) {
      if (week >= s.playoffWeekStart) continue; // regular season only
      if (!entries.some((m) => m.matchup_id != null)) continue;

      for (const m of entries) {
        if (m.matchup_id == null || !m.players || !m.starters) continue;
        const userId = userForRoster(identity, s.season, m.roster_id);
        const opp = entries.find(
          (e) => e.matchup_id === m.matchup_id && e.roster_id !== m.roster_id,
        );
        if (!opp) continue; // no real opponent, nothing to flip
        seasonsSeen.add(s.season);

        const pointsOf = (pid: string): number => m.players_points?.[pid] ?? 0;
        const available: Record<string, number> = {};
        for (const pid of m.players) available[pid] = pointsOf(pid);

        const best = optimalLineup(s.rosterPositions, available, eligibility);
        const actualPoints = round2(matchupPoints(m));
        const optimalPoints = round2(best.total);
        const opponentPoints = round2(matchupPoints(opp));

        const actualResult = result(actualPoints, opponentPoints);
        const optimalResult = result(optimalPoints, opponentPoints);
        const flip = actualResult !== "W" && optimalResult === "W";

        for (const scope of [s.season, "all"]) {
          const key = `${userId}:${scope}`;
          bump(actual, key, actualResult);
          bump(optimal, key, optimalResult);
          bench.set(key, (bench.get(key) ?? 0) + Math.max(0, best.total - matchupPoints(m)));
          if (flip) flips.set(key, (flips.get(key) ?? 0) + 1);
          const t = totals.get(key) ?? { actual: 0, optimal: 0 };
          t.actual += matchupPoints(m);
          t.optimal += best.total;
          totals.set(key, t);
        }

        if (!flip) continue;

        // Reconstruct the sit→start changes. adds = optimal players who didn't
        // start; removes = started players the optimal lineup benches. Pairing
        // the best add with the worst removed starter reads as the obvious swap,
        // and the pair gains always sum to (optimal − actual) exactly.
        const startedIds = m.starters.filter((p): p is string => !!p && p !== "0");
        const startedSet = new Set(startedIds);
        const optIds = best.assignments.map((a) => a.playerId).filter((p): p is string => !!p);
        const optSet = new Set(optIds);
        const slotByPlayer = new Map(best.assignments.map((a) => [a.playerId, a.slot]));

        const adds = optIds
          .filter((pid) => !startedSet.has(pid))
          .sort((a, b) => pointsOf(b) - pointsOf(a));
        const removes = startedIds
          .filter((pid) => !optSet.has(pid))
          .sort((a, b) => pointsOf(a) - pointsOf(b)); // worst-scoring first

        const swaps: WhatIfSwap[] = adds.map((inPid, i) => {
          const outPid = removes[i] ?? null;
          const inPoints = round2(pointsOf(inPid));
          const outPoints = outPid ? round2(pointsOf(outPid)) : 0;
          return {
            slot: slotByPlayer.get(inPid) ?? "?",
            outPlayerId: outPid,
            outPoints,
            inPlayerId: inPid,
            inPoints,
            gain: round2(inPoints - outPoints),
          };
        });
        swaps.sort((a, b) => b.gain - a.gain);

        flipWeeks.push({
          id: `${s.season}:${week}:${m.roster_id}`,
          season: s.season,
          week,
          userId,
          opponentUserId: userForRoster(identity, s.season, opp.roster_id),
          actualPoints,
          optimalPoints,
          opponentPoints,
          actualResult,
          optimalResult,
          flip,
          swaps,
        });
      }
    }
  }

  const seasons = [...seasonsSeen].sort((a, b) => Number(b) - Number(a));

  const keys = new Set([...actual.keys(), ...optimal.keys()]);
  const managerSeasons: WhatIfManagerSeason[] = [...keys].map((key) => {
    const [userId, scope] = key.split(":");
    const a = actual.get(key) ?? { w: 0, l: 0, t: 0 };
    const o = optimal.get(key) ?? { w: 0, l: 0, t: 0 };
    const benchPts = round2(bench.get(key) ?? 0);
    return {
      userId,
      scope,
      actualW: a.w,
      actualL: a.l,
      actualT: a.t,
      optimalW: o.w,
      optimalL: o.l,
      optimalT: o.t,
      flips: flips.get(key) ?? 0,
      pointsLeftOnBench: benchPts,
      efficiency: 0,
    };
  });

  for (const row of managerSeasons) {
    const t = totals.get(`${row.userId}:${row.scope}`);
    row.efficiency = t && t.optimal > 0 ? round2(t.actual / t.optimal) : 0;
  }

  // most impactful stolen wins first (widest optimal margin over the opponent)
  flipWeeks.sort(
    (a, b) =>
      (b.optimalPoints - (b.opponentPoints ?? 0)) - (a.optimalPoints - (a.opponentPoints ?? 0)),
  );

  return { seasons, managerSeasons, flipWeeks };
}
