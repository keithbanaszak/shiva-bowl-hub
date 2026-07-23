import data from "@/data/marts/playerLegacy.json";
import type { PlayerLegacy, PlayerLegacyMart } from "@/lib/stats/types";

export const playerLegacy = data as unknown as PlayerLegacyMart;

const byId = new Map(playerLegacy.players.map((p) => [p.playerId, p]));

export const legacyFor = (id: string | null | undefined): PlayerLegacy | undefined =>
  id ? byId.get(id) : undefined;
export const hasLegacy = (id: string | null | undefined): boolean => (id ? byId.has(id) : false);
export const legacyIds = (): string[] => playerLegacy.players.map((p) => p.playerId);
