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
  const { identity, teamWeeks, standings, h2h, trades } = input;
  const label = (uid: string) => identity.byUserId.get(uid)?.label ?? uid;

  const seasons = [...new Set(standings.map((s) => s.season))];
  const awards: Record<string, Award[]> = {};
  const cards: ManagerCard[] = [];

  // realized trade value per (season,user) — rest-of-season points from acquired players
  const tradeValue = new Map<string, number>(); // `${season}:${user}` -> realized received
  for (const t of trades) {
    if (!t.realized) continue;
    for (const [uid, v] of Object.entries(t.realized)) {
      const k = `${t.season}:${uid}`;
      tradeValue.set(k, (tradeValue.get(k) ?? 0) + v.season);
    }
  }

  for (const season of seasons) {
    const rows = standings.filter((s) => s.season === season);
    const tws = teamWeeks.filter((t) => t.season === season);
    const list: Award[] = [];

    const champ = rows.find((r) => r.champion);
    if (champ) {
      list.push({
        key: "champion",
        title: "League Champion",
        kind: "serious",
        userId: champ.userId,
        value: `${champ.wins}-${champ.losses}${champ.ties ? `-${champ.ties}` : ""}`,
        blurb: `${label(champ.userId)} took the title.`,
      });
    }

    const juggernaut = argBest(rows, (r) => r.allPlayWinPct);
    if (juggernaut) {
      list.push({
        key: "juggernaut",
        title: "Regular-Season Juggernaut",
        kind: "serious",
        userId: juggernaut.userId,
        value: `${(juggernaut.allPlayWinPct * 100).toFixed(0)}% all-play`,
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
        userId: moty.userId,
        value: `${moty.wins}-${moty.losses}`,
        blurb: `Wins + all-play + lineup efficiency${moty.finish ? ` + a #${moty.finish} finish` : ""}.`,
      });
    }

    const trader = argBest(rows, (r) => tradeValue.get(`${season}:${r.userId}`) ?? -Infinity);
    const traderVal = trader ? tradeValue.get(`${season}:${trader.userId}`) : undefined;
    if (trader && traderVal != null && traderVal > 0) {
      list.push({
        key: "best_trader",
        title: "Best Trader",
        kind: "serious",
        userId: trader.userId,
        value: `${round2(traderVal)} pts acquired`,
        blurb: `Most rest-of-season production from players acquired via trade.`,
      });
    }

    // ----- funny
    const merchant = argBest(rows, (r) => r.luck);
    if (merchant && merchant.luck > 0) {
      list.push({
        key: "schedule_merchant",
        title: "Schedule Merchant",
        kind: "funny",
        userId: merchant.userId,
        value: `+${merchant.luck} wins`,
        blurb: `Won ${merchant.luck} more games than expected from their scoring.`,
      });
    }

    const cursed = argBest(rows, (r) => -r.luck);
    if (cursed && cursed.luck < 0) {
      list.push({
        key: "most_cursed",
        title: "Most Cursed",
        kind: "funny",
        userId: cursed.userId,
        value: `${cursed.luck} wins`,
        blurb: `Deserved ${Math.abs(cursed.luck)} more wins — the schedule said no.`,
      });
    }

    const benchKing = argBest(rows, (r) => r.benchPoints);
    if (benchKing) {
      list.push({
        key: "bench_billionaire",
        title: "Bench-Points Billionaire",
        kind: "funny",
        userId: benchKing.userId,
        value: `${benchKing.benchPoints} pts`,
        blurb: `Left ${benchKing.benchPoints} points rotting on the bench all year.`,
      });
    }

    const criminal = argBest(rows, (r) => -r.efficiency);
    if (criminal) {
      list.push({
        key: "lineup_criminal",
        title: "Lineup Criminal",
        kind: "funny",
        userId: criminal.userId,
        value: `${(criminal.efficiency * 100).toFixed(1)}% efficient`,
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
        userId: glass.userId,
        value: `#${glass.pfRank} PF, ${glass.wins}-${glass.losses}`,
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
        userId: fraud.userId,
        value: `${fraud.wins}-${fraud.losses}, ${(fraud.allPlayWinPct * 100).toFixed(0)}% all-play`,
        blurb: `Record says contender; all-play says pretender.`,
      });
    }

    // Cardiac Kids: most games decided by < 5
    const close5ByUser = new Map<string, number>();
    for (const t of tws) {
      if (t.margin != null && Math.abs(t.margin) < 5) {
        close5ByUser.set(t.userId, (close5ByUser.get(t.userId) ?? 0) + 1);
      }
    }
    const cardiac = argBest(rows, (r) => close5ByUser.get(r.userId) ?? 0);
    const cardiacN = cardiac ? close5ByUser.get(cardiac.userId) ?? 0 : 0;
    if (cardiac && cardiacN >= 2) {
      list.push({
        key: "cardiac",
        title: "Cardiac Kids",
        kind: "funny",
        userId: cardiac.userId,
        value: `${cardiacN} nail-biters`,
        blurb: `${cardiacN} games decided by under 5 points.`,
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
