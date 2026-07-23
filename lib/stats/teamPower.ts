import type { Dynasty } from "../model";
import type { Identity } from "../identity";
import { userForRoster } from "../identity";
import type { PlayerWeek, PlayerWeekIndex } from "./playerWeeks";
import { round2 } from "./util";
import type { TeamFuturePick, TeamPlayerAsset, TeamPower, TeamPowerMart } from "./types";

const WEIGHTS = { winNow: 0.7, futureCapital: 0.3 };
const PICK_BASE: Record<number, number> = { 1: 30, 2: 14, 3: 6 };
const SEASON_DISCOUNT = [1.0, 0.85, 0.72]; // offset from current season
const FUTURE_SEASONS = SEASON_DISCOUNT.length;

// starting-slot → eligible positions
const ELIG: Record<string, string[]> = {
  QB: ["QB"],
  RB: ["RB"],
  WR: ["WR"],
  TE: ["TE"],
  K: ["K"],
  DEF: ["DEF"],
  FLEX: ["RB", "WR", "TE"],
  WRRB_FLEX: ["RB", "WR"],
  REC_FLEX: ["WR", "TE"],
  SUPER_FLEX: ["QB", "RB", "WR", "TE"],
};

const POS_DEMAND: Record<"QB" | "RB" | "WR" | "TE", number> = { QB: 2, RB: 3, WR: 3, TE: 2 };

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const SHRINK_K = 6; // pseudo-games pulling small samples toward the positional mean

/** PPG + sample size over a set of weeks: started weeks when ≥4 of them, else all weeks. */
function ppgN(rows: PlayerWeek[]): { ppg: number; n: number } | null {
  if (rows.length === 0) return null;
  const started = rows.filter((r) => r.started);
  const use = started.length >= 4 ? started : rows;
  return { ppg: round2(mean(use.map((r) => r.points))), n: use.length };
}

/** Regress a rate toward a prior so a 2-game fluke doesn't outrank a 30-game stud. */
const shrink = (ppg: number, n: number, prior: number) => (n * ppg + SHRINK_K * prior) / (n + SHRINK_K);

function percentile(sortedAsc: number[], q: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.floor(q * (sortedAsc.length - 1));
  return sortedAsc[idx];
}

/** Returns a normalizer mapping raw values to 0-100 across the league. */
function normalizer(raws: number[]): (v: number) => number {
  const min = Math.min(...raws);
  const max = Math.max(...raws);
  if (!Number.isFinite(min) || max === min) return () => 50;
  return (v: number) => round2(((v - min) / (max - min)) * 100);
}

export function computeTeamPower(
  dynasty: Dynasty,
  identity: Identity,
  index: PlayerWeekIndex,
): TeamPowerMart {
  const s = dynasty.seasons[0];
  if (!s) {
    return {
      season: "—",
      generatedNote: "no current season",
      weights: WEIGHTS,
      pickCurve: PICK_BASE as unknown as Record<string, number>,
      teams: [],
    };
  }
  const curNum = Number(s.season);
  const rounds = s.settings.draft_rounds ?? 3;
  const primaryPos = (pid: string): string | null =>
    dynasty.players[pid]?.position ?? dynasty.players[pid]?.fantasy_positions?.[0] ?? null;

  // ---- raw production rates per player (from prior-season league history)
  type RawRate = { careerPPG: number | null; careerN: number; recentPPG: number | null; recentN: number };
  const rawCache = new Map<string, RawRate>();
  const rawOf = (pid: string): RawRate => {
    let c = rawCache.get(pid);
    if (c) return c;
    const log = index.byPlayer.get(pid) ?? [];
    const career = ppgN(log);
    let recent: { ppg: number; n: number } | null = null;
    if (log.length) {
      const seasons = [...new Set(log.map((r) => r.season))].sort((a, b) => Number(b) - Number(a)).slice(0, 2);
      recent = ppgN(log.filter((r) => seasons.includes(r.season)));
    }
    c = {
      careerPPG: career?.ppg ?? null,
      careerN: career?.n ?? 0,
      recentPPG: recent?.ppg ?? null,
      recentN: recent?.n ?? 0,
    };
    rawCache.set(pid, c);
    return c;
  };

  // ---- positional prior = mean career PPG of proven rostered players at that position
  const rosteredIds = [...new Set(s.rosters.flatMap((r) => r.players ?? []))];
  const posPrior = new Map<string, number>();
  {
    const byPos = new Map<string, number[]>();
    for (const pid of rosteredIds) {
      const { careerPPG } = rawOf(pid);
      const pos = primaryPos(pid);
      if (careerPPG == null || !pos) continue;
      (byPos.get(pos) ?? byPos.set(pos, []).get(pos)!).push(careerPPG);
    }
    for (const [pos, arr] of byPos) posPrior.set(pos, mean(arr));
  }

  // ---- shrunk PlayerScore (null when no league history → unproven)
  const scoreOf = (pid: string): number | null => {
    const raw = rawOf(pid);
    if (raw.careerPPG == null) return null;
    const pos = primaryPos(pid);
    const prior = (pos && posPrior.get(pos)) || raw.careerPPG;
    const careerAdj = shrink(raw.careerPPG, raw.careerN, prior);
    const recentAdj = raw.recentPPG != null ? shrink(raw.recentPPG, raw.recentN, prior) : careerAdj;
    return round2(0.6 * recentAdj + 0.4 * careerAdj);
  };

  // ---- positional replacement baselines (40th pct of proven shrunk scores)
  const baselineByPos = new Map<string, number>();
  {
    const byPos = new Map<string, number[]>();
    for (const pid of rosteredIds) {
      const sc = scoreOf(pid);
      const pos = primaryPos(pid);
      if (sc == null || !pos) continue;
      (byPos.get(pos) ?? byPos.set(pos, []).get(pos)!).push(sc);
    }
    for (const [pos, arr] of byPos) baselineByPos.set(pos, percentile([...arr].sort((a, b) => a - b), 0.4));
  }

  const assetFor = (pid: string): TeamPlayerAsset => {
    const raw = rawOf(pid);
    const sc = scoreOf(pid);
    const pos = primaryPos(pid);
    const unproven = sc == null;
    const eff = sc ?? (pos ? baselineByPos.get(pos) ?? 0 : 0);
    return {
      playerId: pid,
      name: dynasty.players[pid]?.full_name ?? pid,
      position: pos,
      slot: null,
      score: round2(eff),
      recentPPG: raw.recentPPG,
      careerPPG: raw.careerPPG,
      unproven,
      age: dynasty.players[pid]?.age ?? null,
    };
  };

  // ---- starting-lineup template (fill tightest-eligibility slots first)
  const slots = s.rosterPositions
    .map((p, i) => ({ label: p, elig: ELIG[p], i }))
    .filter((x): x is { label: string; elig: string[]; i: number } => Array.isArray(x.elig))
    .sort((a, b) => a.elig.length - b.elig.length || a.i - b.i);

  // ---- future draft-pick ownership (native picks, overridden by traded picks)
  const pickOwner = new Map<string, number>(); // `${season}:${round}:${origRoster}` -> current owner roster
  for (const r of s.rosters) {
    for (let off = 0; off < FUTURE_SEASONS; off++) {
      const season = String(curNum + off);
      for (let round = 1; round <= rounds; round++) pickOwner.set(`${season}:${round}:${r.roster_id}`, r.roster_id);
    }
  }
  for (const tp of s.tradedPicks) {
    const off = Number(tp.season) - curNum;
    if (off < 0 || off >= FUTURE_SEASONS) continue;
    if (tp.round < 1 || tp.round > rounds) continue;
    pickOwner.set(`${tp.season}:${tp.round}:${tp.roster_id}`, tp.owner_id);
  }

  // ---- per-team aggregation
  type Raw = {
    userId: string;
    rosterId: number;
    starters: TeamPlayerAsset[];
    bench: TeamPlayerAsset[];
    assets: TeamPlayerAsset[];
    winNowRaw: number;
    posRaw: { QB: number; RB: number; WR: number; TE: number };
    futureRaw: number;
    futurePicks: TeamFuturePick[];
    avgAge: number | null;
    avgTenure: number;
  };

  const raws: Raw[] = [];
  for (const r of s.rosters) {
    const userId = userForRoster(identity, s.season, r.roster_id);
    const assets = (r.players ?? []).map(assetFor);

    // optimal starters
    const used = new Set<string>();
    const starters: TeamPlayerAsset[] = [];
    for (const slot of slots) {
      const pick = assets
        .filter((a) => !used.has(a.playerId) && a.position && slot.elig.includes(a.position))
        .sort((a, b) => b.score - a.score)[0];
      if (pick) {
        used.add(pick.playerId);
        starters.push({ ...pick, slot: slot.label });
      }
    }
    const bench = assets.filter((a) => !used.has(a.playerId));
    const winNowRaw = round2(starters.reduce((acc, a) => acc + a.score, 0));

    const posRaw = { QB: 0, RB: 0, WR: 0, TE: 0 };
    for (const pos of ["QB", "RB", "WR", "TE"] as const) {
      const top = assets
        .filter((a) => a.position === pos)
        .sort((a, b) => b.score - a.score)
        .slice(0, POS_DEMAND[pos]);
      posRaw[pos] = round2(top.reduce((acc, a) => acc + a.score, 0));
    }

    // future picks owned by this roster
    const futurePicks: TeamFuturePick[] = [];
    let futureRaw = 0;
    for (let off = 0; off < FUTURE_SEASONS; off++) {
      const season = String(curNum + off);
      for (let round = 1; round <= rounds; round++) {
        for (const orig of s.rosters) {
          const owner = pickOwner.get(`${season}:${round}:${orig.roster_id}`);
          if (owner !== r.roster_id) continue;
          const value = round2((PICK_BASE[round] ?? 2) * SEASON_DISCOUNT[off]);
          futureRaw += value;
          futurePicks.push({
            season,
            round,
            value,
            fromUserId: orig.roster_id === r.roster_id ? null : userForRoster(identity, s.season, orig.roster_id),
          });
        }
      }
    }
    futurePicks.sort((a, b) => Number(a.season) - Number(b.season) || a.round - b.round);

    const ages = assets.map((a) => a.age).filter((x): x is number => x != null);
    const tenures = (r.players ?? []).map((pid) => new Set((index.byPlayer.get(pid) ?? []).map((w) => w.season)).size);

    raws.push({
      userId,
      rosterId: r.roster_id,
      starters,
      bench,
      assets,
      winNowRaw,
      posRaw,
      futureRaw: round2(futureRaw),
      futurePicks,
      avgAge: ages.length ? round2(mean(ages)) : null,
      avgTenure: round2(mean(tenures)),
    });
  }

  // ---- normalize across teams
  const winNowN = normalizer(raws.map((r) => r.winNowRaw));
  const futureN = normalizer(raws.map((r) => r.futureRaw));
  const posN = {
    QB: normalizer(raws.map((r) => r.posRaw.QB)),
    RB: normalizer(raws.map((r) => r.posRaw.RB)),
    WR: normalizer(raws.map((r) => r.posRaw.WR)),
    TE: normalizer(raws.map((r) => r.posRaw.TE)),
  };

  const teams: TeamPower[] = raws.map((r) => {
    const winNow = winNowN(r.winNowRaw);
    const futureCapital = futureN(r.futureRaw);
    const posStrength = {
      QB: posN.QB(r.posRaw.QB),
      RB: posN.RB(r.posRaw.RB),
      WR: posN.WR(r.posRaw.WR),
      TE: posN.TE(r.posRaw.TE),
    };
    const weakestPos = (Object.keys(posStrength) as Array<keyof typeof posStrength>).sort(
      (a, b) => posStrength[a] - posStrength[b],
    )[0];
    const topAssets = [...r.assets].sort((a, b) => b.score - a.score).slice(0, 3);
    return {
      userId: r.userId,
      hubValue: round2(WEIGHTS.winNow * winNow + WEIGHTS.futureCapital * futureCapital),
      winNow,
      futureCapital,
      contenderAxis: round2(winNow - futureCapital),
      posStrength,
      weakestPos,
      topAssets,
      starters: r.starters,
      bench: r.bench,
      futurePicks: r.futurePicks,
      avgAge: r.avgAge,
      avgTenure: r.avgTenure,
      rosterSize: r.assets.length,
    };
  });

  teams.sort((a, b) => b.hubValue - a.hubValue);

  return {
    season: s.season,
    generatedNote:
      "Hub Value is a homegrown index from in-league production + a synthetic pick curve — not a real dynasty market value.",
    weights: WEIGHTS,
    pickCurve: { "1": PICK_BASE[1], "2": PICK_BASE[2], "3": PICK_BASE[3] },
    teams,
  };
}
