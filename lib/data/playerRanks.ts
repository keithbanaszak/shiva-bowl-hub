import data from "@/data/marts/playerRanks.json";
import type { PlayerRankMart, PlayerSeasonRank } from "@/lib/stats/types";

export const playerRanks = data as unknown as PlayerRankMart;

const byKey = new Map(playerRanks.rows.map((r) => [`${r.season}:${r.playerId}`, r]));

/** In-league positional rank for a player in one season. */
export const rankFor = (season: string, playerId: string): PlayerSeasonRank | undefined =>
  byKey.get(`${season}:${playerId}`);

/** `WR7` style label — always render this alongside the words "in-league". */
export const rankLabelFor = (season: string, playerId: string): string | null => {
  const r = byKey.get(`${season}:${playerId}`);
  return r?.position && r.posRank ? `${r.position}${r.posRank}` : null;
};
