import type { H2HPair, TeamWeek } from "./types";
import { round2 } from "./util";

type Acc = {
  aUserId: string;
  bUserId: string;
  games: number;
  aWins: number;
  bWins: number;
  ties: number;
  aPoints: number;
  bPoints: number;
  marginSum: number;
  playoffAWins: number;
  playoffBWins: number;
  biggest: H2HPair["biggest"];
  closest: H2HPair["closest"];
  order: { season: string; week: number; winner: "a" | "b" | "t" }[];
};

const seasonWeekKey = (season: string, week: number) => Number(season) * 100 + week;

export function computeH2H(teamWeeks: TeamWeek[]): H2HPair[] {
  const map = new Map<string, Acc>();

  for (const tw of teamWeeks) {
    if (!tw.opponentUserId || tw.result == null || tw.opponentPoints == null) continue;
    // count each game once, from the smaller-id manager's perspective
    if (!(tw.userId < tw.opponentUserId)) continue;

    const key = `${tw.userId}|${tw.opponentUserId}`;
    let acc = map.get(key);
    if (!acc) {
      acc = {
        aUserId: tw.userId,
        bUserId: tw.opponentUserId,
        games: 0,
        aWins: 0,
        bWins: 0,
        ties: 0,
        aPoints: 0,
        bPoints: 0,
        marginSum: 0,
        playoffAWins: 0,
        playoffBWins: 0,
        biggest: null,
        closest: null,
        order: [],
      };
      map.set(key, acc);
    }

    const aPts = tw.points;
    const bPts = tw.opponentPoints;
    const margin = aPts - bPts;
    acc.games++;
    acc.aPoints += aPts;
    acc.bPoints += bPts;
    acc.marginSum += Math.abs(margin);

    let winner: "a" | "b" | "t" = "t";
    if (margin > 0) {
      acc.aWins++;
      winner = "a";
      if (tw.isPlayoff) acc.playoffAWins++;
    } else if (margin < 0) {
      acc.bWins++;
      winner = "b";
      if (tw.isPlayoff) acc.playoffBWins++;
    } else {
      acc.ties++;
    }
    acc.order.push({ season: tw.season, week: tw.week, winner });

    const detail = { season: tw.season, week: tw.week, aPoints: aPts, bPoints: bPts, margin: round2(margin) };
    if (!acc.biggest || Math.abs(margin) > Math.abs(acc.biggest.margin)) acc.biggest = detail;
    if (!acc.closest || Math.abs(margin) < Math.abs(acc.closest.margin)) acc.closest = detail;
  }

  const pairs: H2HPair[] = [];
  for (const acc of map.values()) {
    // current streak (most recent consecutive same winner)
    const chrono = [...acc.order].sort(
      (x, y) => seasonWeekKey(x.season, x.week) - seasonWeekKey(y.season, y.week),
    );
    let streak: H2HPair["currentStreak"] = null;
    if (chrono.length > 0) {
      const last = chrono[chrono.length - 1].winner;
      if (last !== "t") {
        let len = 0;
        for (let i = chrono.length - 1; i >= 0; i--) {
          if (chrono[i].winner === last) len++;
          else break;
        }
        streak = { holder: last === "a" ? acc.aUserId : acc.bUserId, length: len };
      }
    }

    const playoffGames = acc.playoffAWins + acc.playoffBWins;

    // heat: volume + competitiveness + playoff stakes, scaled to ~0-100
    const balance = acc.games > 0 ? 1 - Math.abs(acc.aWins - acc.bWins) / acc.games : 0;
    const avgMargin = acc.games > 0 ? acc.marginSum / acc.games : 0;
    const closenessBonus = Math.max(0, 20 - avgMargin); // tighter average -> more heat
    const raw =
      acc.games * 4 + balance * 25 + playoffGames * 12 + closenessBonus;
    const heat = Math.max(0, Math.min(100, Math.round(raw)));

    pairs.push({
      aUserId: acc.aUserId,
      bUserId: acc.bUserId,
      games: acc.games,
      aWins: acc.aWins,
      bWins: acc.bWins,
      ties: acc.ties,
      aPoints: round2(acc.aPoints),
      bPoints: round2(acc.bPoints),
      avgMargin: round2(avgMargin),
      biggest: acc.biggest,
      closest: acc.closest,
      playoffAWins: acc.playoffAWins,
      playoffBWins: acc.playoffBWins,
      currentStreak: streak,
      heat,
    });
  }

  return pairs.sort((a, b) => b.heat - a.heat);
}
