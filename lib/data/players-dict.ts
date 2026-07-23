import dict from "@/data/players.json";
import type { SlimPlayer } from "@/lib/sleeper/types";

export const playerDict = dict as unknown as Record<string, SlimPlayer>;

export const pname = (id: string | null | undefined): string =>
  (id && playerDict[id]?.full_name) || id || "—";

export const ppos = (id: string | null | undefined): string | null =>
  (id && playerDict[id]?.position) || null;

export const pteam = (id: string | null | undefined): string | null =>
  (id && playerDict[id]?.team) || null;
