import data from "@/data/marts/playoffs.json";
import type { SeasonPlayoffs } from "@/lib/stats/types";

export const playoffs = data as unknown as SeasonPlayoffs[];

export const playoffsForSeason = (season: string): SeasonPlayoffs | undefined =>
  playoffs.find((p) => p.season === season);
