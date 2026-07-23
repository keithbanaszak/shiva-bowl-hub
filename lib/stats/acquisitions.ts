import type { Dynasty } from "../model";
import type { Identity } from "../identity";
import { userForRoster } from "../identity";
import type {
  Acquisition,
  DropRegret,
  ManagerChurn,
  ManagerWaiverGrade,
  WaiverMove,
  WaiverSeasonLeaders,
  WaiverStats,
} from "./types";
import { round2 } from "./util";
import { orderOf, realizedFor, type PlayerWeekIndex } from "./playerWeeks";

const HIT_THRESHOLD = 20; // rest-of-season points that count an add as a "hit"

export function computeWaivers(
  dynasty: Dynasty,
  identity: Identity,
  index: PlayerWeekIndex,
): WaiverStats {
  const acquisitions: Acquisition[] = [];
  const moves: WaiverMove[] = [];

  for (const s of dynasty.seasons) {
    const uid = (rosterId: number) => userForRoster(identity, s.season, rosterId);
    for (const [week, txns] of s.transactionsByWeek) {
      for (const t of txns) {
        if (t.type !== "waiver" && t.type !== "free_agent") continue;
        if (t.status !== "complete") continue;
        const faabBid = t.type === "waiver" ? t.settings?.waiver_bid ?? 0 : 0;

        // one feed entry per PLAYER MOVEMENT, so multi-player moves and every
        // drop are represented rather than just the first of each.
        const dateMs = t.status_updated ?? t.created ?? null;
        const kind = t.type as "waiver" | "free_agent";
        for (const [pid, rid] of Object.entries(t.adds ?? {})) {
          moves.push({
            id: `${t.transaction_id}:add:${pid}`,
            dateMs,
            season: s.season,
            week,
            type: kind,
            action: "add",
            userId: uid(rid),
            playerId: pid,
            faab: faabBid,
          });
        }
        for (const [pid, rid] of Object.entries(t.drops ?? {})) {
          moves.push({
            id: `${t.transaction_id}:drop:${pid}`,
            dateMs,
            season: s.season,
            week,
            type: kind,
            action: "drop",
            userId: uid(rid),
            playerId: pid,
            faab: 0,
          });
        }

        for (const [pid, rid] of Object.entries(t.adds ?? {})) {
          const userId = uid(rid);
          const r = realizedFor(index, userId, pid, s.season, week);
          acquisitions.push({
            id: `${t.transaction_id}:${pid}`,
            season: s.season,
            week,
            dateMs: t.created ?? null,
            type: t.type as "waiver" | "free_agent",
            userId,
            rosterId: rid,
            playerId: pid,
            faab: faabBid,
            realizedSeason: r.realizedSeason,
            realizedCareer: r.realizedCareer,
            starterSeason: r.starterSeason,
            weeksRostered: r.weeksRosteredCareer,
            pointsPerFaab: faabBid > 0 ? round2(r.realizedSeason / faabBid) : null,
          });
        }
      }
    }
  }

  // ---- per-season leaders (computed on the full set)
  const seasons = [...new Set(acquisitions.map((a) => a.season))].sort((a, b) => Number(b) - Number(a));
  const seasonLeaders: WaiverSeasonLeaders[] = seasons.map((season) => {
    const inSeason = acquisitions.filter((a) => a.season === season);
    const free = inSeason.filter((a) => a.faab === 0 && a.realizedSeason > 0);
    const paid = inSeason.filter((a) => a.faab > 0);
    const bestFreeAdd = best(free, (a) => a.realizedSeason);
    const bestValue = best(
      paid.filter((a) => a.realizedSeason > 0),
      (a) => a.pointsPerFaab ?? 0,
    );
    const biggestBust = best(
      paid.filter((a) => a.faab >= 10),
      (a) => a.faab - a.realizedSeason, // high spend, low return
    );
    return { season, bestFreeAdd, bestValue, biggestBust };
  });

  // ---- manager grades (full set)
  const gradeMap = new Map<string, ManagerWaiverGrade>();
  for (const a of acquisitions) {
    let g = gradeMap.get(a.userId);
    if (!g) {
      g = {
        userId: a.userId,
        adds: 0,
        faabSpent: 0,
        pointsGained: 0,
        starterPointsGained: 0,
        pointsPerFaab: 0,
        freeAddPoints: 0,
        hitRate: 0,
      };
      gradeMap.set(a.userId, g);
    }
    g.adds++;
    g.faabSpent += a.faab;
    g.pointsGained += a.realizedSeason;
    g.starterPointsGained += a.starterSeason;
    if (a.faab === 0) g.freeAddPoints += a.realizedSeason;
  }
  const hitCounts = new Map<string, number>();
  for (const a of acquisitions) {
    if (a.realizedSeason >= HIT_THRESHOLD) hitCounts.set(a.userId, (hitCounts.get(a.userId) ?? 0) + 1);
  }
  const managerGrades = [...gradeMap.values()]
    .map((g) => ({
      ...g,
      pointsGained: round2(g.pointsGained),
      starterPointsGained: round2(g.starterPointsGained),
      freeAddPoints: round2(g.freeAddPoints),
      pointsPerFaab: g.faabSpent > 0 ? round2(g.pointsGained / g.faabSpent) : 0,
      hitRate: g.adds > 0 ? round2((hitCounts.get(g.userId) ?? 0) / g.adds) : 0,
    }))
    .sort((a, b) => b.pointsGained - a.pointsGained);

  // ---- drop regret: what a dropped player went on to do for someone else
  const dropRegrets: DropRegret[] = [];
  for (const m of moves) {
    if (m.action !== "drop") continue;
    const log = index.byPlayer.get(m.playerId) ?? [];
    const from = orderOf(m.season, m.week);

    let afterSeason = 0;
    let afterCareer = 0;
    let nextUserId: string | null = null;
    let reacquired = false;

    for (const pw of log) {
      if (pw.order <= from) continue;
      if (pw.userId === m.userId) {
        // he came back to the same manager — the "regret" window closes here
        reacquired = true;
        continue;
      }
      if (nextUserId === null) nextUserId = pw.userId;
      afterCareer += pw.points;
      if (pw.season === m.season) afterSeason += pw.points;
    }

    if (afterCareer <= 0) continue;
    dropRegrets.push({
      id: m.id,
      season: m.season,
      week: m.week,
      userId: m.userId,
      playerId: m.playerId,
      pointsAfterSeason: round2(afterSeason),
      pointsAfterCareer: round2(afterCareer),
      nextUserId,
      reacquired,
    });
  }
  dropRegrets.sort((a, b) => b.pointsAfterSeason - a.pointsAfterSeason || b.pointsAfterCareer - a.pointsAfterCareer);

  // ---- roster churn per manager
  const churnMap = new Map<string, ManagerChurn>();
  const churnFor = (userId: string): ManagerChurn => {
    let c = churnMap.get(userId);
    if (!c) {
      c = { userId, adds: 0, drops: 0, faabSpent: 0, regretPoints: 0 };
      churnMap.set(userId, c);
    }
    return c;
  };
  for (const m of moves) {
    const c = churnFor(m.userId);
    if (m.action === "add") {
      c.adds++;
      c.faabSpent += m.faab;
    } else {
      c.drops++;
    }
  }
  for (const d of dropRegrets) churnFor(d.userId).regretPoints += d.pointsAfterSeason;
  const churn = [...churnMap.values()]
    .map((c) => ({ ...c, regretPoints: round2(c.regretPoints) }))
    .sort((a, b) => b.adds + b.drops - (a.adds + a.drops));

  // store only meaningful acquisitions to keep the mart lean
  const meaningful = acquisitions
    .filter((a) => a.realizedCareer > 0)
    .sort((a, b) => b.realizedCareer - a.realizedCareer)
    .slice(0, 300);

  moves.sort((a, b) => (b.dateMs ?? 0) - (a.dateMs ?? 0));

  return { acquisitions: meaningful, seasonLeaders, managerGrades, moves, dropRegrets, churn };
}

function best<T>(items: T[], score: (t: T) => number): T | null {
  let b: T | null = null;
  let bv = -Infinity;
  for (const it of items) {
    const v = score(it);
    if (v > bv) {
      bv = v;
      b = it;
    }
  }
  return b;
}
