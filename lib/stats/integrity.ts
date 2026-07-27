import type { Dynasty } from "../model";
import type { Identity } from "../identity";
import { userForRoster } from "../identity";
import { optimalLineup, startingSlots } from "../optimal-lineup";
import { matchupPoints, round2 } from "./util";
import type {
  IntegrityMart,
  IntegrityReason,
  IntegrityWeek,
  LineupSlotEntry,
  ManagerIntegrity,
  TeamWeek,
} from "./types";

/**
 * Lineup integrity — a defensible, projection-based tank signal.
 *
 * The league wants to act on blatant tanking, so this is deliberately built to
 * be ARGUABLE IN A LEAGUE CHAT, not just suggestive:
 *
 *  - It scores INTENT, not outcome. The measure is how far a lineup fell short of
 *    the best lineup available *by pre-game projection*. Losing with a good lineup
 *    is bad luck and scores zero here; benching a stud for a backup scores badly
 *    even if the backup happens to go off.
 *  - It is REGULAR SEASON ONLY. Week 18 has no real games and weeks 15–17 are the
 *    playoffs, so a "bad" lineup there costs nobody anything. Only weeks that
 *    affect other teams' playoff races are judged.
 *  - It separates an ABANDONED roster from a DELIBERATE one. Starting players who
 *    were never going to play is a different (and less malicious) problem than
 *    benching healthy studs, so they get different labels.
 *  - It publishes RECEIPTS. Every flagged week lists the lineup started and the
 *    lineup available, so a human makes the final call.
 *
 * A missing projection means Sleeper did not expect the player to play at all
 * (bye, inactive, IR). That is treated as 0 and surfaced separately, because
 * "started four players who weren't playing" is a materially different claim
 * from "started four players projected badly".
 */

// Tuned against this league's own distribution: across 672 regular-season
// team-weeks the median gap is 0.7% and the 95th percentile is 7.7%, so 15% is
// already well into the tail and 25% is exceptional.
const NOTABLE_PCT = 15;
const SEVERE_PCT = 25;
/** Projected at or below this = effectively a non-starter. */
const DEAD_PROJ = 2;
const SEVERE_DEAD = 3;
/** Ignore trivial absolute gaps so a low-scoring roster can't trip the % alone. */
const MIN_GAP_PTS = 10;

export function computeIntegrity(
  dynasty: Dynasty,
  identity: Identity,
  teamWeeks: TeamWeek[],
): IntegrityMart {
  const eligibility = (pid: string): string[] => {
    const p = dynasty.players[pid];
    if (!p) return [];
    return p.fantasy_positions?.length ? p.fantasy_positions : p.position ? [p.position] : [];
  };

  // running record before each week, so a flagged week can show motive
  const recordBefore = new Map<string, { w: number; l: number }>();
  const sortedTw = [...teamWeeks].sort((a, b) => Number(a.season) - Number(b.season) || a.week - b.week);
  const runningKey = (season: string, userId: string, week: number) => `${season}:${userId}:${week}`;
  const running = new Map<string, { w: number; l: number }>();
  for (const tw of sortedTw) {
    const k = `${tw.season}:${tw.userId}`;
    const cur = running.get(k) ?? { w: 0, l: 0 };
    recordBefore.set(runningKey(tw.season, tw.userId, tw.week), { ...cur });
    if (tw.result === "W") cur.w++;
    else if (tw.result === "L") cur.l++;
    running.set(k, cur);
  }

  const weeks: IntegrityWeek[] = [];
  /** Population searched — every regular-season team-week we could score. */
  let scanned = 0;

  for (const s of dynasty.seasons) {
    const slots = startingSlots(s.rosterPositions);
    for (const [week, entries] of s.matchupsByWeek) {
      // regular season, real games only
      if (week >= s.playoffWeekStart) continue;
      const proj = s.projectionsByWeek.get(week);
      if (!proj || Object.keys(proj).length === 0) continue;
      if (!entries.some((m) => m.matchup_id != null)) continue;

      for (const m of entries) {
        if (m.matchup_id == null || !m.players || !m.starters) continue;
        scanned++;

        const projOf = (pid: string): number => proj[pid] ?? 0;
        const hasProj = (pid: string): boolean => Object.prototype.hasOwnProperty.call(proj, pid);

        // projections restricted to what this manager actually rostered that week
        const available: Record<string, number> = {};
        for (const pid of m.players) available[pid] = projOf(pid);

        const startedIds = m.starters.filter((p): p is string => !!p && p !== "0");
        const startedProj = startedIds.reduce((sum, pid) => sum + projOf(pid), 0);
        const best = optimalLineup(s.rosterPositions, available, eligibility);
        const gapPts = best.total - startedProj;
        const gapPct = best.total > 0 ? (gapPts / best.total) * 100 : 0;

        const emptySlots = m.starters.filter((p) => !p || p === "0").length;
        const deadStarters = startedIds.filter((pid) => projOf(pid) <= DEAD_PROJ).length;
        const noProjStarters = startedIds.filter((pid) => !hasProj(pid)).length;

        // classify before deciding whether to keep the row
        let level: IntegrityWeek["level"] = "clean";
        if (gapPts >= MIN_GAP_PTS && (gapPct >= SEVERE_PCT || deadStarters >= SEVERE_DEAD)) level = "severe";
        else if (gapPts >= MIN_GAP_PTS && gapPct >= NOTABLE_PCT) level = "notable";
        else if (gapPts >= MIN_GAP_PTS && gapPct >= 8) level = "minor";

        const userId = userForRoster(identity, s.season, m.roster_id);

        if (level === "clean") continue;

        const started: LineupSlotEntry[] = m.starters.map((pid, i) => ({
          slot: slots[i] ?? "?",
          playerId: pid && pid !== "0" ? pid : null,
          proj: pid && pid !== "0" ? round2(projOf(pid)) : null,
          hasProjection: pid && pid !== "0" ? hasProj(pid) : false,
          actual: pid && pid !== "0" ? round2(m.players_points?.[pid] ?? 0) : null,
        }));

        const bestLineup: LineupSlotEntry[] = best.assignments.map((a) => ({
          slot: a.slot,
          playerId: a.playerId,
          proj: a.playerId ? round2(projOf(a.playerId)) : null,
          hasProjection: a.playerId ? hasProj(a.playerId) : false,
          actual: a.playerId ? round2(m.players_points?.[a.playerId] ?? 0) : null,
        }));

        // players who sat despite outprojecting someone who played
        const startedSet = new Set(startedIds);
        const benched = m.players
          .filter((pid) => !startedSet.has(pid))
          .map((pid) => ({ playerId: pid, proj: round2(projOf(pid)), actual: round2(m.players_points?.[pid] ?? 0) }))
          .filter((b) => b.proj > 0)
          .sort((a, b) => b.proj - a.proj)
          .slice(0, 5);

        /**
         * Why this week looks bad. "abandoned" is the kinder reading and takes
         * precedence — a roster full of players who weren't playing is neglect,
         * not a scheme.
         */
        let reason: IntegrityReason = "lineup-choice";
        if (noProjStarters >= SEVERE_DEAD) reason = "abandoned";
        else if (emptySlots > 0) reason = "empty-slot";

        const rec = recordBefore.get(runningKey(s.season, userId, week)) ?? null;

        // Hindsight: what the best-BY-PROJECTION lineup ACTUALLY scored, and
        // whether that alone would have flipped the week's result. This scores
        // the honest counterfactual "if you'd just started who the projections
        // told you to, do you win?" — not the retrospective perfect lineup.
        const bestActualPoints = round2(
          best.assignments.reduce(
            (sum, a) => sum + (a.playerId ? (m.players_points?.[a.playerId] ?? 0) : 0),
            0,
          ),
        );
        const opp = entries.find(
          (e) => e.matchup_id === m.matchup_id && e.roster_id !== m.roster_id,
        );
        const opponentPoints = opp ? round2(matchupPoints(opp)) : null;
        const actualPoints = round2(matchupPoints(m));
        let result: IntegrityWeek["result"] = null;
        if (opponentPoints != null)
          result =
            actualPoints > opponentPoints ? "W" : actualPoints < opponentPoints ? "L" : "T";
        const flipsResult =
          result !== "W" && opponentPoints != null && bestActualPoints > opponentPoints;

        weeks.push({
          id: `${s.season}:${week}:${m.roster_id}`,
          season: s.season,
          week,
          userId,
          level,
          reason,
          startedProj: round2(startedProj),
          bestProj: round2(best.total),
          gapPts: round2(gapPts),
          gapPct: round2(gapPct),
          deadStarters,
          noProjStarters,
          emptySlots,
          actualPoints,
          bestActualPoints,
          opponentPoints,
          result,
          flipsResult,
          recordBefore: rec,
          started,
          bestLineup,
          benched,
        });
      }
    }
  }

  weeks.sort((a, b) => b.gapPct - a.gapPct);

  // ---- per-manager rollup. `weeks` is already sorted by gapPct desc, so the
  // first row seen for a manager is their worst.
  const totals = new Map<string, ManagerIntegrity>();
  for (const w of weeks) {
    let t = totals.get(w.userId);
    if (!t) {
      t = {
        userId: w.userId,
        flaggedWeeks: 0,
        severeWeeks: 0,
        worstGapPct: w.gapPct,
        worstWeek: { season: w.season, week: w.week },
        totalGapPts: 0,
      };
      totals.set(w.userId, t);
    }
    t.flaggedWeeks++;
    if (w.level === "severe") t.severeWeeks++;
    t.totalGapPts += w.gapPts;
  }

  const managers: ManagerIntegrity[] = [...totals.values()]
    .map((t) => ({ ...t, totalGapPts: round2(t.totalGapPts) }))
    .sort((a, b) => b.severeWeeks - a.severeWeeks || b.flaggedWeeks - a.flaggedWeeks || b.worstGapPct - a.worstGapPct);

  return {
    scanned,
    thresholds: { notablePct: NOTABLE_PCT, severePct: SEVERE_PCT, deadProj: DEAD_PROJ, minGapPts: MIN_GAP_PTS },
    weeks,
    managers,
  };
}
