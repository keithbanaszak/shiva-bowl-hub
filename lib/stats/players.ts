import type { PlayerWeekIndex } from "./playerWeeks";
import type { BenchLeader, PlayerStartRecord, PlayerStats } from "./types";
import { round2 } from "./util";

/** Min starts to qualify for the start-record leaderboard (filters out flukes). */
const MIN_STARTS = 10;

export function computePlayerStats(index: PlayerWeekIndex): PlayerStats {
  const startRecords: PlayerStartRecord[] = [];
  const benchLeaders: BenchLeader[] = [];

  for (const [playerId, log] of index.byPlayer) {
    // ---- starts (W/L while in someone's starting lineup)
    let starts = 0;
    let wins = 0;
    let losses = 0;
    let ties = 0;
    let pointsWhileStarting = 0;
    const startsByManager = new Map<string, number>();

    // ---- bench
    let benchPoints = 0;
    let benchWeeks = 0;
    const benchByManager = new Map<string, number>();

    for (const pw of log) {
      if (pw.started) {
        starts++;
        pointsWhileStarting += pw.points;
        startsByManager.set(pw.userId, (startsByManager.get(pw.userId) ?? 0) + 1);
        if (pw.result === "W") wins++;
        else if (pw.result === "L") losses++;
        else if (pw.result === "T") ties++;
      } else {
        if (pw.points > 0) {
          benchPoints += pw.points;
          benchWeeks++;
          benchByManager.set(pw.userId, (benchByManager.get(pw.userId) ?? 0) + pw.points);
        }
      }
    }

    if (starts >= MIN_STARTS) {
      const decided = wins + losses;
      const [topMgr, topStarts] = topEntry(startsByManager);
      startRecords.push({
        playerId,
        starts,
        wins,
        losses,
        ties,
        winPct: decided > 0 ? round2(wins / decided) : 0,
        pointsWhileStarting: round2(pointsWhileStarting),
        topManagerUserId: topMgr,
        topManagerStarts: topStarts,
      });
    }

    if (benchPoints > 0) {
      const [topMgr, topPts] = topEntry(benchByManager);
      benchLeaders.push({
        playerId,
        benchPoints: round2(benchPoints),
        benchWeeks,
        topManagerUserId: topMgr,
        topManagerBenchPoints: round2(topPts),
      });
    }
  }

  startRecords.sort((a, b) => b.winPct - a.winPct || b.starts - a.starts);
  benchLeaders.sort((a, b) => b.benchPoints - a.benchPoints);

  return {
    startRecords,
    benchLeaders: benchLeaders.slice(0, 60),
  };
}

function topEntry(m: Map<string, number>): [string | null, number] {
  let bestK: string | null = null;
  let bestV = -Infinity;
  for (const [k, v] of m) {
    if (v > bestV) {
      bestV = v;
      bestK = k;
    }
  }
  return [bestK, bestK == null ? 0 : bestV];
}
