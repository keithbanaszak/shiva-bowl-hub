import data from "@/data/marts/awards.json";
import type { Award } from "@/lib/stats/types";

export const awards = data as unknown as Record<string, Award[]>;

export const awardsForSeason = (season: string): Award[] => awards[season] ?? [];

export const awardsForUser = (userId: string): Array<{ season: string; award: Award }> =>
  Object.entries(awards).flatMap(([season, list]) =>
    list.filter((a) => a.userId === userId).map((award) => ({ season, award })),
  );
