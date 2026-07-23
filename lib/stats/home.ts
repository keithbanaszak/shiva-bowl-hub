import type { Dynasty } from "../model";
import { round2 } from "./util";
import type { PlayerWeekIndex } from "./playerWeeks";
import type { HomeAward, HomeFeed, HomeTopPerformer, TeamWeek } from "./types";

const POS_ORDER = ["QB", "RB", "WR", "TE", "K", "DEF"];
const orderOf = (season: string, week: number) => Number(season) * 100 + week;

/**
 * "Around the league" feed for the home page: the single most-recently-played
 * week's top performer at each position and a handful of weekly manager awards.
 * Everything else on the home page reads from existing marts.
 */
export function computeHome(dynasty: Dynasty, index: PlayerWeekIndex, teamWeeks: TeamWeek[]): HomeFeed {
  // anchor on the most recent FULL regular-season week (whole slate plays, so
  // top-performer and median-based awards are representative of the league)
  let bestOrder = -1;
  let lastPlayed: HomeFeed["lastPlayed"] = null;
  for (const tw of teamWeeks) {
    if (tw.points == null || tw.isPlayoff) continue;
    const o = orderOf(tw.season, tw.week);
    if (o > bestOrder) {
      bestOrder = o;
      lastPlayed = { season: tw.season, week: tw.week, isPlayoff: tw.isPlayoff };
    }
  }
  if (!lastPlayed) return { lastPlayed: null, topPerformers: [], weeklyAwards: [] };

  const primaryPos = (pid: string): string | null =>
    dynasty.players[pid]?.position ?? dynasty.players[pid]?.fantasy_positions?.[0] ?? null;

  // top started performer at each position that week
  const byPos = new Map<string, HomeTopPerformer>();
  for (const pw of index.all) {
    if (pw.order !== bestOrder || !pw.started) continue;
    const pos = primaryPos(pw.playerId);
    if (!pos || !POS_ORDER.includes(pos)) continue;
    const cur = byPos.get(pos);
    if (!cur || pw.points > cur.points) {
      byPos.set(pos, {
        pos,
        playerId: pw.playerId,
        name: dynasty.players[pw.playerId]?.full_name ?? pw.playerId,
        points: round2(pw.points),
        userId: pw.userId,
      });
    }
  }
  const topPerformers = POS_ORDER.map((p) => byPos.get(p)).filter((x): x is HomeTopPerformer => !!x);

  // weekly manager awards
  const wk = teamWeeks.filter((tw) => orderOf(tw.season, tw.week) === bestOrder);
  const awards: HomeAward[] = [];
  const top = [...wk].sort((a, b) => b.points - a.points)[0];
  if (top) awards.push({ key: "top", title: "Top Scorer", emoji: "🔥", userId: top.userId, value: `${round2(top.points)} pts`, detail: top.opponentUserId });
  const blow = [...wk]
    .filter((t) => t.result === "W" && t.margin != null)
    .sort((a, b) => (b.margin ?? 0) - (a.margin ?? 0))[0];
  if (blow) awards.push({ key: "blowout", title: "Biggest Blowout", emoji: "💥", userId: blow.userId, value: `+${round2(blow.margin ?? 0)}`, detail: blow.opponentUserId });
  const cursed = [...wk]
    .filter((t) => t.result === "L" && t.aboveMedian === true)
    .sort((a, b) => b.points - a.points)[0];
  if (cursed) awards.push({ key: "cursed", title: "Cursed", emoji: "😱", userId: cursed.userId, value: `${round2(cursed.points)} in a loss`, detail: cursed.opponentUserId });
  const fraud = [...wk]
    .filter((t) => t.result === "W" && t.aboveMedian === false)
    .sort((a, b) => a.points - b.points)[0];
  if (fraud) awards.push({ key: "fraud", title: "Fraud", emoji: "🎭", userId: fraud.userId, value: `${round2(fraud.points)} and won`, detail: fraud.opponentUserId });

  return { lastPlayed, topPerformers, weeklyAwards: awards };
}
