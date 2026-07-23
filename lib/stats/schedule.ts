import type {
  H2HPair,
  ScheduleMatchup,
  SeasonPlayoffs,
  SeasonStanding,
  TeamWeek,
  Trade,
} from "./types";
import { round2 } from "./util";

const pairKey = (x: string, y: string) => (x < y ? `${x}|${y}` : `${y}|${x}`);

type Ctx = {
  heat: Map<string, number>;
  tradesByPair: Map<string, Trade[]>;
  pfRank: Map<string, number>; // `${season}:${userId}` -> pfRank
  finalsPrior: Map<string, string[]>; // pairKey -> seasons (any) they met in a final
  champPair: Map<string, string>; // season -> pairKey of that season's final
};

function pickReason(
  m: ScheduleMatchup,
  ctx: Ctx,
  factors: { heat: number; recentTrade: Trade | null; tradeGap: number; rematchYear: string | null; combined: number; bothTop: boolean },
): string {
  const key = pairKey(m.aUserId, m.bUserId);
  const isFinal = ctx.champPair.get(m.season) === key && m.isPlayoff;
  if (isFinal) return `🏆 The ${m.season} championship`;
  if (m.isPlayoff) return `Playoff showdown`;
  if (factors.rematchYear) return `Rematch of the ${factors.rematchYear} final`;
  if (factors.recentTrade) {
    return factors.tradeGap <= 0
      ? `They swung a trade this very week`
      : `Fresh off a trade ${factors.tradeGap} week${factors.tradeGap === 1 ? "" : "s"} earlier`;
  }
  if (factors.bothTop && factors.combined >= 260) return `Two heavyweights — ${Math.round(factors.combined)} combined points`;
  if (factors.heat >= 70) return `Bad blood — rivalry heat ${factors.heat}`;
  if (Math.abs(m.margin) <= 3) return `Instant classic — decided by ${Math.abs(m.margin)}`;
  if (factors.bothTop) return `Two of the season's top scorers`;
  return `Match of the week`;
}

export function computeSchedule(
  teamWeeks: TeamWeek[],
  h2h: H2HPair[],
  trades: Trade[],
  playoffs: SeasonPlayoffs[],
  standings: SeasonStanding[],
): ScheduleMatchup[] {
  // ---- context maps
  const heat = new Map<string, number>();
  for (const p of h2h) heat.set(pairKey(p.aUserId, p.bUserId), p.heat);

  const tradesByPair = new Map<string, Trade[]>();
  for (const t of trades) {
    const users = t.sides.map((s) => s.userId);
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const k = pairKey(users[i], users[j]);
        const arr = tradesByPair.get(k) ?? [];
        arr.push(t);
        tradesByPair.set(k, arr);
      }
    }
  }

  const pfRank = new Map<string, number>();
  for (const s of standings) pfRank.set(`${s.season}:${s.userId}`, s.pfRank);

  const champPair = new Map<string, string>();
  const finalsPrior = new Map<string, string[]>();
  for (const po of playoffs) {
    if (po.championUserId && po.runnerUpUserId) {
      const k = pairKey(po.championUserId, po.runnerUpUserId);
      champPair.set(po.season, k);
      const arr = finalsPrior.get(k) ?? [];
      arr.push(po.season);
      finalsPrior.set(k, arr);
    }
  }

  const ctx: Ctx = { heat, tradesByPair, pfRank, finalsPrior, champPair };

  // ---- build matchups (one row per game), chronological, with running H2H
  const games = teamWeeks
    .filter((t) => t.opponentUserId && t.result != null && t.opponentPoints != null && t.userId < t.opponentUserId)
    .sort((a, b) => Number(a.season) - Number(b.season) || a.week - b.week);

  // projected starting totals keyed by `${season}:${week}:${userId}`
  const projMap = new Map<string, number | null>();
  for (const t of teamWeeks) projMap.set(`${t.season}:${t.week}:${t.userId}`, t.proj);

  const running = new Map<string, { aWins: number; bWins: number }>(); // keyed by a|b (a=min id)
  const out: ScheduleMatchup[] = [];

  for (const t of games) {
    const a = t.userId; // min id
    const b = t.opponentUserId!;
    const key = pairKey(a, b);
    const before = running.get(key) ?? { aWins: 0, bWins: 0 };
    const seriesBefore = { aWins: before.aWins, bWins: before.bWins };

    const aPts = t.points;
    const bPts = t.opponentPoints!;
    const margin = round2(aPts - bPts);
    const winner = aPts > bPts ? a : aPts < bPts ? b : null;

    // ---- vitality factors
    const hv = heat.get(key) ?? 0;
    const rankA = pfRank.get(`${t.season}:${a}`) ?? 99;
    const rankB = pfRank.get(`${t.season}:${b}`) ?? 99;
    const bothTop = rankA <= 6 && rankB <= 6;
    const combined = aPts + bPts;

    // most recent trade between them at/just before this game (same season)
    let recentTrade: Trade | null = null;
    let tradeGap = 99;
    let everTraded = false;
    for (const tr of ctx.tradesByPair.get(key) ?? []) {
      everTraded = true;
      if (tr.season === t.season && tr.week != null && tr.week <= t.week) {
        const gap = t.week - tr.week;
        if (gap < tradeGap) {
          tradeGap = gap;
          recentTrade = tr;
        }
      }
    }

    // championship rematch (met in a final in a PRIOR season)
    let rematchYear: string | null = null;
    for (const fy of ctx.finalsPrior.get(key) ?? []) {
      if (Number(fy) < Number(t.season)) rematchYear = fy;
    }

    const isFinal = champPair.get(t.season) === key && t.isPlayoff;

    let vitality = 0;
    vitality += hv * 0.6;
    if (recentTrade) vitality += Math.max(0, 45 - tradeGap * 4);
    else if (everTraded) vitality += 10;
    if (bothTop) vitality += 22;
    vitality += Math.max(0, (combined - 230) / 4);
    if (t.isPlayoff) vitality += 40;
    if (isFinal) vitality += 90;
    if (rematchYear) vitality += 35;
    vitality += Math.max(0, 16 - Math.abs(margin));

    const m: ScheduleMatchup = {
      season: t.season,
      week: t.week,
      isPlayoff: t.isPlayoff,
      matchupId: null,
      aUserId: a,
      bUserId: b,
      aPoints: aPts,
      bPoints: bPts,
      aProj: projMap.get(`${t.season}:${t.week}:${a}`) ?? null,
      bProj: projMap.get(`${t.season}:${t.week}:${b}`) ?? null,
      winnerUserId: winner,
      margin,
      seriesBefore,
      vitality: round2(vitality),
      reason: null,
      isGameOfWeek: false,
    };
    m.reason = pickReason(m, ctx, { heat: hv, recentTrade, tradeGap, rematchYear, combined, bothTop });
    out.push(m);

    // update running series
    if (winner === a) before.aWins++;
    else if (winner === b) before.bWins++;
    running.set(key, before);
  }

  // ---- flag Game of the Week (max vitality per season+week)
  const bestKey = new Map<string, ScheduleMatchup>();
  for (const m of out) {
    const wk = `${m.season}:${m.week}`;
    const cur = bestKey.get(wk);
    if (!cur || m.vitality > cur.vitality) bestKey.set(wk, m);
  }
  for (const m of bestKey.values()) m.isGameOfWeek = true;

  return out;
}
