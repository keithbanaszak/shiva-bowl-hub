import data from "@/data/marts/playerStats.json";
import type { PlayerStats } from "@/lib/stats/types";

export const playerStats = data as unknown as PlayerStats;
