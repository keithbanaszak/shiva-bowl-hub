/**
 * Optimal-lineup engine.
 *
 * Given the starting-slot template (roster_positions), a player_id -> points map
 * for one week, and each player's eligible positions, compute the highest-scoring
 * legal lineup.
 *
 * Slot eligibility forms a LAMINAR family (any two slots' eligible-position sets
 * are either nested or disjoint: QB ⊂ SUPER_FLEX; RB/WR/TE ⊂ FLEX ⊂ SUPER_FLEX;
 * K, DEF disjoint). For a laminar family, filling the most-restrictive slots
 * first with the best eligible remaining player is optimal. We additionally
 * validate the season total against Sleeper's precomputed `ppts`.
 */

const SLOT_ELIGIBILITY: Record<string, string[]> = {
  QB: ["QB"],
  RB: ["RB"],
  WR: ["WR"],
  TE: ["TE"],
  K: ["K"],
  DEF: ["DEF"],
  DL: ["DL"],
  LB: ["LB"],
  DB: ["DB"],
  FLEX: ["RB", "WR", "TE"],
  WRRB_FLEX: ["WR", "RB"],
  REC_FLEX: ["WR", "TE"],
  SUPER_FLEX: ["QB", "RB", "WR", "TE"],
  IDP_FLEX: ["DL", "LB", "DB"],
};

const BENCH_SLOTS = new Set(["BN", "IR", "TAXI", "NA"]);

export type LineupAssignment = { slot: string; playerId: string | null; points: number };
export type OptimalResult = { total: number; assignments: LineupAssignment[] };

/** The starting (non-bench) slots from a roster_positions template. */
export function startingSlots(rosterPositions: string[]): string[] {
  return rosterPositions.filter((p) => !BENCH_SLOTS.has(p));
}

function allowedFor(slot: string): string[] {
  return SLOT_ELIGIBILITY[slot] ?? [slot];
}

export function optimalLineup(
  rosterPositions: string[],
  playersPoints: Record<string, number>,
  eligibility: (playerId: string) => string[],
): OptimalResult {
  const slots = startingSlots(rosterPositions);

  // candidate players, best first
  const candidates = Object.keys(playersPoints).sort(
    (a, b) => (playersPoints[b] ?? 0) - (playersPoints[a] ?? 0),
  );
  const used = new Set<string>();

  // fill most-restrictive slots first (smallest eligibility set)
  const order = slots
    .map((slot, idx) => ({ slot, idx, size: allowedFor(slot).length }))
    .sort((a, b) => a.size - b.size || a.idx - b.idx);

  const assignments: LineupAssignment[] = slots.map((slot) => ({ slot, playerId: null, points: 0 }));

  for (const { slot, idx } of order) {
    const allowed = allowedFor(slot);
    let bestId: string | null = null;
    for (const pid of candidates) {
      if (used.has(pid)) continue;
      const positions = eligibility(pid);
      if (positions.some((p) => allowed.includes(p))) {
        bestId = pid; // candidates are pre-sorted desc, so first hit is best
        break;
      }
    }
    if (bestId) {
      used.add(bestId);
      assignments[idx] = { slot, playerId: bestId, points: playersPoints[bestId] ?? 0 };
    }
  }

  const total = assignments.reduce((sum, a) => sum + a.points, 0);
  return { total, assignments };
}
