import type { Dynasty } from "../model";
import type { Identity } from "../identity";
import { userForRoster } from "../identity";
import { startingSlots } from "../optimal-lineup";
import { round2 } from "./util";
import type { SlotScoringMart, SlotScoringRow } from "./types";

/**
 * Scoring by STARTING LINEUP SLOT — who actually got production out of their
 * DEF, their K, their TE, their FLEX.
 *
 * This is different from lib/stats/posBreakdown.ts, which buckets by a player's
 * position and covers only QB/RB/WR/TE. Here the bucket is the slot he was
 * started in, which means K and DEF are included and FLEX / SUPER_FLEX become
 * first-class — you can finally ask "who plays the best superflex?".
 *
 * The mapping is positional: Sleeper's `starters` array is index-aligned with the
 * non-bench entries of `roster_positions`, and `starters_points[i]` is that
 * slot's score. IMPORTANT: the template is per-season — this league ran one FLEX
 * through 2024 and added a second in 2025 — so slots are always resolved against
 * that season's own roster_positions.
 *
 * Two averages are published because they answer different questions:
 *   avgPerWeek  — points this slot GROUP contributed per team-week. RB covers two
 *                 slots, so its number is roughly double a single-slot average.
 *   avgPerStart — points per individual slot start. Comparable across slots.
 */
export function computeSlotScoring(dynasty: Dynasty, identity: Identity): SlotScoringMart {
  type Acc = {
    total: number;
    starts: number;
    weeks: Set<string>;
    best: { season: string; week: number; points: number; playerId: string | null } | null;
    byPlayer: Map<string, number>;
  };

  // key: `${userId}:${scope}:${slot}` where scope is a season or "all"
  const acc = new Map<string, Acc>();
  const slotsSeen = new Set<string>();

  const bump = (
    userId: string,
    scope: string,
    slot: string,
    points: number,
    season: string,
    week: number,
    playerId: string | null,
  ) => {
    const key = `${userId}:${scope}:${slot}`;
    let a = acc.get(key);
    if (!a) {
      a = { total: 0, starts: 0, weeks: new Set(), best: null, byPlayer: new Map() };
      acc.set(key, a);
    }
    a.total += points;
    a.starts++;
    a.weeks.add(`${season}:${week}`);
    if (!a.best || points > a.best.points) a.best = { season, week, points: round2(points), playerId };
    if (playerId) a.byPlayer.set(playerId, (a.byPlayer.get(playerId) ?? 0) + points);
  };

  for (const s of dynasty.seasons) {
    const slots = startingSlots(s.rosterPositions);
    for (const [week, entries] of s.matchupsByWeek) {
      // only weeks with real games
      if (!entries.some((m) => m.matchup_id != null)) continue;
      for (const m of entries) {
        if (m.matchup_id == null || !m.starters) continue;
        const userId = userForRoster(identity, s.season, m.roster_id);
        m.starters.forEach((pid, i) => {
          const slot = slots[i];
          if (!slot) return;
          slotsSeen.add(slot);
          const pts = m.starters_points?.[i] ?? (pid ? (m.players_points?.[pid] ?? 0) : 0);
          const player = pid && pid !== "0" ? pid : null;
          bump(userId, s.season, slot, pts, s.season, week, player);
          bump(userId, "all", slot, pts, s.season, week, player);
        });
      }
    }
  }

  const rows: SlotScoringRow[] = [];
  for (const [key, a] of acc) {
    const [userId, scope, slot] = key.split(":");
    let topPlayer: SlotScoringRow["topPlayer"] = null;
    for (const [pid, pts] of a.byPlayer) {
      if (!topPlayer || pts > topPlayer.points) {
        topPlayer = { playerId: pid, name: dynasty.players[pid]?.full_name ?? pid, points: round2(pts) };
      }
    }
    const weeks = a.weeks.size;
    rows.push({
      userId,
      scope,
      slot,
      totalPoints: round2(a.total),
      starts: a.starts,
      teamWeeks: weeks,
      avgPerWeek: weeks > 0 ? round2(a.total / weeks) : 0,
      avgPerStart: a.starts > 0 ? round2(a.total / a.starts) : 0,
      bestWeek: a.best,
      topPlayer,
      rank: 0,
    });
  }

  // league rank within (scope, slot), best average first
  const groups = new Map<string, SlotScoringRow[]>();
  for (const r of rows) {
    const k = `${r.scope}:${r.slot}`;
    const g = groups.get(k) ?? [];
    g.push(r);
    groups.set(k, g);
  }
  for (const g of groups.values()) {
    g.sort((a, b) => b.avgPerWeek - a.avgPerWeek);
    g.forEach((r, i) => {
      r.rank = i + 1;
    });
  }

  const seasons = [...new Set(dynasty.seasons.map((s) => s.season))].sort((a, b) => Number(b) - Number(a));
  // canonical display order rather than discovery order
  const ORDER = ["QB", "RB", "WR", "TE", "FLEX", "SUPER_FLEX", "K", "DEF"];
  const slots = [...slotsSeen].sort((a, b) => {
    const ia = ORDER.indexOf(a);
    const ib = ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });

  return {
    scopes: ["all", ...seasons.filter((s) => rows.some((r) => r.scope === s))],
    slots,
    rows,
  };
}
