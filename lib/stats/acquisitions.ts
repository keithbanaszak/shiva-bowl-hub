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
          // rate + immediacy, so a week-12 pickup is judged fairly against a week-1 one
          const log = index.byPlayer.get(pid) ?? [];
          const fromOrder = orderOf(s.season, week);
          let wAfter = 0;
          let first4 = 0;
          for (const pw of log) {
            if (pw.order <= fromOrder || pw.userId !== userId || pw.season !== s.season) continue;
            wAfter++;
            if (pw.week <= week + 4) first4 += pw.points;
          }
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
            weeksAfter: wAfter,
            ppgAfter: wAfter > 0 ? round2(r.realizedSeason / wAfter) : 0,
            next4: round2(first4),
          });
        }
      }
    }
  }

  // Offseason moves for a not-yet-played season are real activity (they belong
  // in the moves feed), but they have no realized points yet — so they must be
  // kept out of any PERFORMANCE rollup, or an unplayed season sprouts a "biggest
  // FAAB bust" and every manager's hit-rate is diluted by adds that simply
  // haven't had a chance to score. A played season has a non-empty matchupsByWeek.
  const playedSeasons = new Set(
    dynasty.seasons.filter((s) => s.matchupsByWeek.size > 0).map((s) => s.season),
  );

  // ---- per-season leaders (played seasons only)
  const seasons = [...new Set(acquisitions.map((a) => a.season))]
    .filter((s) => playedSeasons.has(s))
    .sort((a, b) => Number(b) - Number(a));
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

  // ---- manager grades (played seasons only — see playedSeasons above)
  const gradeMap = new Map<string, ManagerWaiverGrade>();
  for (const a of acquisitions) {
    if (!playedSeasons.has(a.season)) continue;
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
    if (!playedSeasons.has(a.season)) continue;
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

  /*
   * Drop regret.
   *
   * Ranking by rest-of-season TOTAL is badly biased toward week 1: a week-1 cut
   * has thirteen weeks to accumulate while a week-12 cut has two, so the table
   * filled up entirely with opening-week drops regardless of how bad they were.
   * We therefore also record the RATE (points per game after) and the IMMEDIATE
   * sting (the next four weeks), which are both time-invariant, plus his average
   * BEFORE the drop so you can tell a genuine breakout from a known quantity.
   */
  const dropRegrets: DropRegret[] = [];
  for (const m of moves) {
    if (m.action !== "drop") continue;
    const log = index.byPlayer.get(m.playerId) ?? [];
    const from = orderOf(m.season, m.week);

    let afterSeason = 0;
    let afterCareer = 0;
    let weeksAfter = 0;
    let next4 = 0;
    let beforePts = 0;
    let beforeWeeks = 0;
    let nextUserId: string | null = null;
    let reacquired = false;

    for (const pw of log) {
      if (pw.order <= from) {
        // his form before you cut him, same season only
        if (pw.season === m.season) {
          beforePts += pw.points;
          beforeWeeks++;
        }
        continue;
      }
      if (pw.userId === m.userId) {
        // he came back to the same manager — the "regret" window closes here
        reacquired = true;
        continue;
      }
      if (nextUserId === null) nextUserId = pw.userId;
      afterCareer += pw.points;
      if (pw.season === m.season) {
        afterSeason += pw.points;
        weeksAfter++;
        if (pw.week <= m.week + 4) next4 += pw.points;
      }
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
      weeksAfter,
      ppgAfter: weeksAfter > 0 ? round2(afterSeason / weeksAfter) : 0,
      next4: round2(next4),
      ppgBefore: beforeWeeks > 0 ? round2(beforePts / beforeWeeks) : 0,
      nextUserId,
      reacquired,
    });
  }
  /*
   * Default order is RATE, so a late-season cut of a genuinely good player
   * outranks a week-1 cut of a streamer who merely had time to pile up totals.
   * Two games minimum: a single big week after a drop is noise, not regret.
   */
  const MIN_GAMES_FOR_RATE = 2;
  dropRegrets.sort((a, b) => {
    const aOk = a.weeksAfter >= MIN_GAMES_FOR_RATE;
    const bOk = b.weeksAfter >= MIN_GAMES_FOR_RATE;
    if (aOk !== bOk) return aOk ? -1 : 1;
    return b.ppgAfter - a.ppgAfter || b.pointsAfterSeason - a.pointsAfterSeason;
  });

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
