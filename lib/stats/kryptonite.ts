import type { PlayerWeekIndex } from "./playerWeeks";
import type { KryptonitePair, KryptoniteStats } from "./types";
import { round2 } from "./util";

const MIN_OVERALL_STARTS = 8;
const MIN_VS = 3;
const score = (p: KryptonitePair) => p.diff * Math.sqrt(p.games);

/**
 * "Kryptonite": NFL players who score notably ABOVE their own average against one
 * specific manager (that manager's bogeyman). Only started games count.
 */
export function computeKryptonite(index: PlayerWeekIndex): KryptoniteStats {
  const nemeses: KryptonitePair[] = [];
  const byManager: Record<string, KryptonitePair> = {};

  for (const [playerId, log] of index.byPlayer) {
    const started = log.filter((pw) => pw.started && pw.opponentUserId);
    if (started.length < MIN_OVERALL_STARTS) continue;
    const overallAvg = started.reduce((s, p) => s + p.points, 0) / started.length;

    const byOpp = new Map<string, { games: number; total: number }>();
    for (const pw of started) {
      const k = pw.opponentUserId as string;
      const e = byOpp.get(k) ?? { games: 0, total: 0 };
      e.games++;
      e.total += pw.points;
      byOpp.set(k, e);
    }

    for (const [mgr, e] of byOpp) {
      if (e.games < MIN_VS) continue;
      const avgVs = e.total / e.games;
      const diff = avgVs - overallAvg;
      if (diff <= 0) continue;
      const pair: KryptonitePair = {
        playerId,
        managerUserId: mgr,
        games: e.games,
        avgVs: round2(avgVs),
        overallAvg: round2(overallAvg),
        diff: round2(diff),
        // how much better, as a share of his own norm — a +5 lift on a 6-point
        // player is a very different story from +5 on a 25-point player
        pctAbove: overallAvg > 0 ? round2(diff / overallAvg) : 0,
        totalVs: round2(e.total),
      };
      if (diff > 3) nemeses.push(pair);
      const cur = byManager[mgr];
      if (!cur || score(pair) > score(cur)) byManager[mgr] = pair;
    }
  }

  nemeses.sort((a, b) => score(b) - score(a));
  return { nemeses: nemeses.slice(0, 40), byManager };
}
