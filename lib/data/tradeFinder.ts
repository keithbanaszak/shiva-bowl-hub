import { teamPower } from "@/lib/data/teamPower";
import { label } from "@/lib/marts";
import type { BreakdownPos } from "@/lib/stats/types";

const POSITIONS: BreakdownPos[] = ["QB", "RB", "WR", "TE"];
const POS_DEMAND: Record<BreakdownPos, number> = { QB: 2, RB: 3, WR: 3, TE: 2 };

// tunable thresholds
const SURPLUS_STRENGTH = 58;
const NEED_STRENGTH = 42;
const CONTEND_AXIS = 20;
const REBUILD_AXIS = -20;
const PICK_RICH = 55;
const PICK_POOR = 35;

export type Stance = "surplus" | "need" | "balanced";
export type PosStance = { pos: BreakdownPos; label: Stance; strength: number; benchDepth: number; rostered: number };
export type PickStance = { label: Stance; strength: number; axis: number };
export type ManagerStances = { userId: string; positions: Record<BreakdownPos, PosStance>; picks: PickStance };
export type Fit = { partnerId: string; score: number; rationale: string };

const median = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// a "startable" bench player clears the league median starter score
const BENCH_STARTABLE = median(teamPower.teams.flatMap((t) => t.starters.map((s) => s.score)));

function stancesFor(userId: string): ManagerStances {
  const t = teamPower.teams.find((x) => x.userId === userId)!;
  const all = [...t.starters, ...t.bench];
  const positions = {} as Record<BreakdownPos, PosStance>;
  for (const pos of POSITIONS) {
    const strength = t.posStrength[pos];
    const benchDepth = t.bench.filter((a) => a.position === pos && a.score >= BENCH_STARTABLE).length;
    const rostered = all.filter((a) => a.position === pos).length;
    let lbl: Stance = "balanced";
    if (strength >= SURPLUS_STRENGTH && benchDepth >= 1) lbl = "surplus";
    else if (strength <= NEED_STRENGTH || rostered < POS_DEMAND[pos]) lbl = "need";
    positions[pos] = { pos, label: lbl, strength, benchDepth, rostered };
  }
  // picks: rebuilder with capital => surplus; rebuilder short on picks => need
  const axis = t.contenderAxis;
  let pickLbl: Stance = "balanced";
  if (t.futureCapital >= PICK_RICH) pickLbl = "surplus";
  else if (axis <= REBUILD_AXIS && t.futureCapital <= PICK_POOR) pickLbl = "need";
  return { userId, positions, picks: { label: pickLbl, strength: t.futureCapital, axis } };
}

let _cache: ManagerStances[] | null = null;
export function managerStances(): ManagerStances[] {
  if (!_cache) _cache = teamPower.teams.map((t) => stancesFor(t.userId));
  return _cache;
}

export function stancesOf(userId: string): ManagerStances | undefined {
  return managerStances().find((s) => s.userId === userId);
}

function positionalFit(a: ManagerStances, b: ManagerStances): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  for (const pos of POSITIONS) {
    if (a.positions[pos].label === "surplus" && b.positions[pos].label === "need") {
      score += Math.max(0, a.positions[pos].strength - b.positions[pos].strength);
      reasons.push(`your surplus ${pos} → their need`);
    }
    if (b.positions[pos].label === "surplus" && a.positions[pos].label === "need") {
      score += Math.max(0, b.positions[pos].strength - a.positions[pos].strength);
      reasons.push(`their ${pos} → your need`);
    }
  }
  return { score: score / 12, reasons };
}

function pickFit(a: ManagerStances, b: ManagerStances): { score: number; reason: string | null } {
  const aC = a.picks.axis >= CONTEND_AXIS;
  const aR = a.picks.axis <= REBUILD_AXIS;
  const bC = b.picks.axis >= CONTEND_AXIS;
  const bR = b.picks.axis <= REBUILD_AXIS;
  if (aC && bR) return { score: (Math.abs(a.picks.axis) + Math.abs(b.picks.axis)) / 12, reason: "you contend, they rebuild — picks for win-now" };
  if (aR && bC) return { score: (Math.abs(a.picks.axis) + Math.abs(b.picks.axis)) / 12, reason: "they contend, you rebuild — picks for win-now" };
  return { score: 0, reason: null };
}

/** Top trade partners for a manager, by mutual positional + contender/rebuilder fit. */
export function bestFits(userId: string, n = 3): Fit[] {
  const a = stancesOf(userId);
  if (!a) return [];
  const out: Fit[] = [];
  for (const b of managerStances()) {
    if (b.userId === userId) continue;
    const pos = positionalFit(a, b);
    const pick = pickFit(a, b);
    const score = pos.score + pick.score;
    if (score <= 0) continue;
    const reasons = [...pos.reasons];
    if (pick.reason) reasons.push(pick.reason);
    out.push({
      partnerId: b.userId,
      score: Math.round(score * 10) / 10,
      rationale: reasons.slice(0, 2).join("; ") || `complementary rosters with ${label(b.userId)}`,
    });
  }
  return out.sort((x, y) => y.score - x.score).slice(0, n);
}
