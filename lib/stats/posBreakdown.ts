import type { Dynasty } from "../model";
import type { PlayerWeekIndex } from "./playerWeeks";
import { round2 } from "./util";
import type { BreakdownPos, PosBreakdownMart, PosBreakdownRow, TeamWeek } from "./types";

const POSITIONS: BreakdownPos[] = ["QB", "RB", "WR", "TE"];
const isPos = (p: string | null): p is BreakdownPos => !!p && (POSITIONS as string[]).includes(p);

type Acc = {
  total: number;
  started: number;
  bench: number;
  gamesStarted: number;
  topByPlayer: Map<string, number>; // playerId -> started points
};

/**
 * Per (manager, position) production for every season and all-time, used by the
 * League Breakdown page. Denominator for the per-week averages is the number of
 * team-weeks the manager actually played (incl. playoffs), so PPG is consistent
 * with the rest of the hub.
 */
export function computePosBreakdown(
  dynasty: Dynasty,
  index: PlayerWeekIndex,
  teamWeeks: TeamWeek[],
): PosBreakdownMart {
  const primaryPos = (pid: string): BreakdownPos | null => {
    const p = dynasty.players[pid]?.position ?? dynasty.players[pid]?.fantasy_positions?.[0] ?? null;
    return isPos(p) ? p : null;
  };

  // denominators: team-weeks played, per (userId, season) and per (userId, "all")
  const twByScope = new Map<string, number>(); // `${userId}:${season}` and `${userId}:all`
  for (const tw of teamWeeks) {
    const a = `${tw.userId}:${tw.season}`;
    const b = `${tw.userId}:all`;
    twByScope.set(a, (twByScope.get(a) ?? 0) + 1);
    twByScope.set(b, (twByScope.get(b) ?? 0) + 1);
  }

  // accumulate points, keyed by `${userId}:${scope}:${pos}` for scope in {season, "all"}
  const acc = new Map<string, Acc>();
  const bump = (userId: string, scope: string, pos: BreakdownPos, points: number, started: boolean, pid: string) => {
    const key = `${userId}:${scope}:${pos}`;
    let a = acc.get(key);
    if (!a) {
      a = { total: 0, started: 0, bench: 0, gamesStarted: 0, topByPlayer: new Map() };
      acc.set(key, a);
    }
    a.total += points;
    if (started) {
      a.started += points;
      a.gamesStarted++;
      a.topByPlayer.set(pid, (a.topByPlayer.get(pid) ?? 0) + points);
    } else {
      a.bench += points;
    }
  };

  for (const pw of index.all) {
    const pos = primaryPos(pw.playerId);
    if (!pos) continue;
    bump(pw.userId, pw.season, pos, pw.points, pw.started, pw.playerId);
    bump(pw.userId, "all", pos, pw.points, pw.started, pw.playerId);
  }

  const rows: PosBreakdownRow[] = [];
  for (const [key, a] of acc) {
    const [userId, scope, pos] = key.split(":") as [string, string, BreakdownPos];
    const tw = twByScope.get(`${userId}:${scope}`) ?? 0;
    let topPlayer: PosBreakdownRow["topPlayer"] = null;
    for (const [pid, pts] of a.topByPlayer) {
      if (!topPlayer || pts > topPlayer.points) {
        topPlayer = { playerId: pid, name: dynasty.players[pid]?.full_name ?? pid, points: round2(pts) };
      }
    }
    rows.push({
      userId,
      season: scope,
      position: pos,
      teamWeeks: tw,
      totalPoints: round2(a.total),
      startedPoints: round2(a.started),
      benchPoints: round2(a.bench),
      avgStartedPerWeek: tw > 0 ? round2(a.started / tw) : 0,
      avgBenchPerWeek: tw > 0 ? round2(a.bench / tw) : 0,
      avgTotalPerWeek: tw > 0 ? round2(a.total / tw) : 0,
      gamesStarted: a.gamesStarted,
      topPlayer,
    });
  }

  const seasons = [...new Set(teamWeeks.map((t) => t.season))].sort((x, y) => Number(y) - Number(x));
  return { scopes: ["all", ...seasons], rows };
}
