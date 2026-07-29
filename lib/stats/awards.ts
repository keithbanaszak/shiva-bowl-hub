import type { Dynasty } from "../model";
import type { Identity } from "../identity";
import type {
  Award,
  H2HPair,
  ManagerCard,
  SeasonPlayoffs,
  SeasonStanding,
  TeamWeek,
  Trade,
  WaiverStats,
} from "./types";
import { round2 } from "./util";

type Input = {
  dynasty: Dynasty;
  identity: Identity;
  teamWeeks: TeamWeek[];
  standings: SeasonStanding[];
  playoffs: SeasonPlayoffs[];
  h2h: H2HPair[];
  trades: Trade[];
  waivers: WaiverStats;
};

function argBest<T>(items: T[], score: (t: T) => number): T | null {
  let best: T | null = null;
  let bestScore = -Infinity;
  for (const it of items) {
    const sc = score(it);
    if (sc > bestScore) {
      bestScore = sc;
      best = it;
    }
  }
  return best;
}

export function buildAwardsAndCards(input: Input): {
  awards: Record<string, Award[]>;
  cards: ManagerCard[];
} {
  const { identity, teamWeeks, standings, h2h, trades, waivers } = input;
  const label = (uid: string) => identity.byUserId.get(uid)?.label ?? uid;

  const seasons = [...new Set(standings.map((s) => s.season))];
  const awards: Record<string, Award[]> = {};
  const cards: ManagerCard[] = [];

  // NET trade value per (season,user): points from players acquired MINUS points
  // from players given up (the other side's realized). This grades trade QUALITY
  // — did you win the deal — instead of rewarding whoever simply traded the most
  // or traded earliest (more rest-of-season games to pile up raw totals).
  const tradeNet = new Map<string, number>(); // `${season}:${user}` -> net ROS pts
  const tradeRec = new Map<string, { w: number; n: number }>();
  for (const t of trades) {
    if (!t.realized) continue;
    const sides = Object.keys(t.realized);
    if (sides.length < 2) continue;
    const total = sides.reduce((s, u) => s + (t.realized![u]?.season ?? 0), 0);
    for (const u of sides) {
      const mine = t.realized![u]?.season ?? 0;
      const net = mine - (total - mine) / (sides.length - 1);
      const k = `${t.season}:${u}`;
      tradeNet.set(k, (tradeNet.get(k) ?? 0) + net);
      const rec = tradeRec.get(k) ?? { w: 0, n: 0 };
      rec.n++;
      if (net > 0) rec.w++;
      tradeRec.set(k, rec);
    }
  }

  for (const season of seasons) {
    const rows = standings.filter((s) => s.season === season);
    const tws = teamWeeks.filter((t) => t.season === season);
    const list: Award[] = [];

    // ---------------- serious ----------------
    const champ = rows.find((r) => r.champion);
    if (champ) {
      list.push({
        key: "champion",
        title: "League Champion",
        kind: "serious",
        emoji: "🏆",
        userId: champ.userId,
        value: `${champ.wins}-${champ.losses}${champ.ties ? `-${champ.ties}` : ""}`,
        metric: champ.seed ? `#${champ.seed} seed` : undefined,
        blurb: `${label(champ.userId)} took the title.`,
      });
    }

    const juggernaut = argBest(rows, (r) => r.allPlayWinPct);
    if (juggernaut) {
      list.push({
        key: "juggernaut",
        title: "Regular-Season Juggernaut",
        kind: "serious",
        emoji: "😤",
        userId: juggernaut.userId,
        value: `${(juggernaut.allPlayWinPct * 100).toFixed(0)}% all-play`,
        metric: `#${juggernaut.pfRank} in points for`,
        blurb: `Best week-in week-out scorer: beat ${(juggernaut.allPlayWinPct * 100).toFixed(0)}% of all opponents.`,
      });
    }

    const moty = argBest(
      rows,
      (r) => r.wins * 1.0 + r.allPlayWinPct * 6 + r.efficiency * 3 + (r.finish ? (13 - r.finish) * 0.3 : 0),
    );
    if (moty) {
      list.push({
        key: "moty",
        title: "Manager of the Year",
        kind: "serious",
        emoji: "🧠",
        userId: moty.userId,
        value: `${moty.wins}-${moty.losses}`,
        metric: `${(moty.efficiency * 100).toFixed(0)}% lineup IQ`,
        blurb: `Wins + all-play + lineup efficiency${moty.finish ? ` + a #${moty.finish} finish` : ""}.`,
      });
    }

    // Trade Winner — net value won, not raw volume
    const traderRow = argBest(rows, (r) => tradeNet.get(`${season}:${r.userId}`) ?? -Infinity);
    const traderNet = traderRow ? tradeNet.get(`${season}:${traderRow.userId}`) : undefined;
    if (traderRow && traderNet != null && traderNet > 0) {
      const rec = tradeRec.get(`${season}:${traderRow.userId}`);
      list.push({
        key: "best_trader",
        title: "Trade Winner",
        kind: "serious",
        emoji: "🤝",
        userId: traderRow.userId,
        value: `+${round2(traderNet)} net pts`,
        metric: rec ? `won ${rec.w} of ${rec.n} trades` : undefined,
        blurb: `Gained the most rest-of-season value beyond what they gave up.`,
      });
    }

    // Iron Lineup — best start/sit efficiency (a different manager than the champ)
    const iron = argBest(rows, (r) => r.efficiency);
    if (iron && iron.efficiency > 0) {
      list.push({
        key: "iron_lineup",
        title: "Iron Lineup",
        kind: "serious",
        emoji: "🎯",
        userId: iron.userId,
        value: `${(iron.efficiency * 100).toFixed(1)}% efficient`,
        metric: `only ${round2(iron.benchPoints)} pts benched`,
        blurb: `Squeezed the most out of their roster — the sharpest start/sit calls.`,
      });
    }

    // Waiver Wizard — best value per FAAB dollar (min spend so it's meaningful)
    const wGrades = waivers.seasonGrades.filter(
      (g) => g.season === season && g.faabSpent >= 10,
    );
    const wiz = argBest(wGrades, (g) => g.pointsPerFaab);
    if (wiz && wiz.pointsPerFaab > 0 && rows.some((r) => r.userId === wiz.userId)) {
      list.push({
        key: "waiver_wizard",
        title: "Waiver Wizard",
        kind: "serious",
        emoji: "🧲",
        userId: wiz.userId,
        value: `${wiz.pointsPerFaab} pts / $`,
        metric: `${round2(wiz.pointsGained)} pts on $${wiz.faabSpent} FAAB`,
        blurb: `Best bang for their FAAB — turned waiver dollars into points.`,
      });
    }

    // ---------------- funny ----------------
    // Points Explosion — highest single regular-season week
    const bigWeek = argBest(
      tws.filter((t) => !t.isPlayoff),
      (t) => t.points,
    );
    if (bigWeek) {
      list.push({
        key: "biggest_week",
        title: "Points Explosion",
        kind: "funny",
        emoji: "💥",
        userId: bigWeek.userId,
        value: `${round2(bigWeek.points)} pts`,
        metric: `Wk ${bigWeek.week}${bigWeek.opponentUserId ? ` vs ${label(bigWeek.opponentUserId)}` : ""}`,
        blurb: `The single highest-scoring week all season.`,
      });
    }

    const merchant = argBest(rows, (r) => r.luck);
    if (merchant && merchant.luck > 0) {
      list.push({
        key: "schedule_merchant",
        title: "Schedule Merchant",
        kind: "funny",
        emoji: "🃏",
        userId: merchant.userId,
        value: `+${merchant.luck} wins`,
        metric: `${merchant.wins}-${merchant.losses} on ${round2(merchant.expectedWins)} expected`,
        blurb: `Won ${merchant.luck} more games than expected from their scoring.`,
      });
    }

    const cursed = argBest(rows, (r) => -r.luck);
    if (cursed && cursed.luck < 0) {
      list.push({
        key: "most_cursed",
        title: "Most Cursed",
        kind: "funny",
        emoji: "💀",
        userId: cursed.userId,
        value: `${cursed.luck} wins`,
        metric: `${(cursed.allPlayWinPct * 100).toFixed(0)}% all-play, ${cursed.wins}-${cursed.losses}`,
        blurb: `Deserved ${Math.abs(cursed.luck)} more wins — the schedule said no.`,
      });
    }

    const benchKing = argBest(rows, (r) => r.benchPoints);
    if (benchKing) {
      list.push({
        key: "bench_billionaire",
        title: "Bench-Points Billionaire",
        kind: "funny",
        emoji: "🪑",
        userId: benchKing.userId,
        value: `${benchKing.benchPoints} pts`,
        metric: `${(benchKing.efficiency * 100).toFixed(0)}% lineup IQ`,
        blurb: `Left ${benchKing.benchPoints} points rotting on the bench all year.`,
      });
    }

    const criminal = argBest(rows, (r) => -r.efficiency);
    if (criminal) {
      list.push({
        key: "lineup_criminal",
        title: "Lineup Criminal",
        kind: "funny",
        emoji: "🚨",
        userId: criminal.userId,
        value: `${(criminal.efficiency * 100).toFixed(1)}% efficient`,
        metric: `${round2(criminal.benchPoints)} pts left on the bench`,
        blurb: `Worst start/sit decisions in the league.`,
      });
    }

    // Glass Cannon: high PF rank but poor record
    const glass = argBest(rows, (r) => (rows.length - r.pfRank) - r.wins * 1.5);
    if (glass && glass.pfRank <= 4 && glass.luck < 0) {
      list.push({
        key: "glass_cannon",
        title: "Glass Cannon",
        kind: "funny",
        emoji: "🥂",
        userId: glass.userId,
        value: `#${glass.pfRank} PF, ${glass.wins}-${glass.losses}`,
        metric: `${glass.luck} luck`,
        blurb: `Scored a ton, won little.`,
      });
    }

    // Fraud: good record, weak all-play
    const fraud = argBest(rows, (r) => r.wins - r.allPlayWinPct * 14);
    if (fraud && fraud.luck > 0) {
      list.push({
        key: "fraud",
        title: "Fraud of the Year",
        kind: "funny",
        emoji: "🎭",
        userId: fraud.userId,
        value: `${fraud.wins}-${fraud.losses}, ${(fraud.allPlayWinPct * 100).toFixed(0)}% all-play`,
        metric: `+${fraud.luck} lucky wins`,
        blurb: `Record says contender; all-play says pretender.`,
      });
    }

    // Cardiac Kids: most one-score games — plus the record IN them
    const close = new Map<string, { n: number; w: number; l: number }>();
    for (const t of tws) {
      if (t.margin != null && Math.abs(t.margin) < 5) {
        const c = close.get(t.userId) ?? { n: 0, w: 0, l: 0 };
        c.n++;
        if (t.result === "W") c.w++;
        else if (t.result === "L") c.l++;
        close.set(t.userId, c);
      }
    }
    const cardiac = argBest(rows, (r) => close.get(r.userId)?.n ?? 0);
    const cc = cardiac ? close.get(cardiac.userId) : undefined;
    if (cardiac && cc && cc.n >= 2) {
      list.push({
        key: "cardiac",
        title: "Cardiac Kids",
        kind: "funny",
        emoji: "❤️",
        userId: cardiac.userId,
        value: `${cc.n} nail-biters`,
        metric: `${cc.w}-${cc.l} in one-score games`,
        blurb: `${cc.n} games decided by under 5 points.`,
      });
    }

    awards[season] = list;

    // ----- manager cards (Dynasty Wrapped)
    for (const r of rows) {
      const myWeeks = tws.filter((t) => t.userId === r.userId && t.margin != null);
      const wins = myWeeks.filter((t) => t.result === "W");
      const losses = myWeeks.filter((t) => t.result === "L");
      const biggestWin = argBest(wins, (t) => t.margin ?? -Infinity);
      const worstLoss = argBest(losses, (t) => -(t.margin ?? Infinity));

      // best trade for this manager this season (by rest-of-season realized)
      let bestTrade: ManagerCard["bestTrade"] = null;
      for (const t of trades) {
        if (t.season !== season || !t.realized) continue;
        const net = t.realized[r.userId]?.season;
        if (net == null) continue;
        if (!bestTrade || net > bestTrade.net) bestTrade = { tradeId: t.id, net };
      }

      // rival note: highest-heat pair involving this manager
      const myPairs = h2h.filter((p) => p.aUserId === r.userId || p.bUserId === r.userId);
      const topRival = myPairs.sort((a, b) => b.heat - a.heat)[0];
      let rivalNote: string | null = null;
      if (topRival) {
        const isA = topRival.aUserId === r.userId;
        const oppId = isA ? topRival.bUserId : topRival.aUserId;
        const myW = isA ? topRival.aWins : topRival.bWins;
        const oppW = isA ? topRival.bWins : topRival.aWins;
        rivalNote = `${myW}-${oppW} all-time vs ${label(oppId)}`;
      }

      cards.push({
        season,
        userId: r.userId,
        label: label(r.userId),
        record: `${r.wins}-${r.losses}${r.ties ? `-${r.ties}` : ""}`,
        pointsFor: r.pointsFor,
        pfRank: r.pfRank,
        finish: r.finish,
        seed: r.seed,
        champion: r.champion,
        luck: r.luck,
        benchPoints: r.benchPoints,
        efficiency: r.efficiency,
        biggestWin: biggestWin
          ? { week: biggestWin.week, opponentUserId: biggestWin.opponentUserId, margin: biggestWin.margin! }
          : null,
        worstLoss: worstLoss
          ? { week: worstLoss.week, opponentUserId: worstLoss.opponentUserId, margin: worstLoss.margin! }
          : null,
        bestTrade,
        rivalNote,
      });
    }
  }

  return { awards, cards };
}
