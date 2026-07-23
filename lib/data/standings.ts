import data from "@/data/marts/standings.json";
import type { SeasonStanding } from "@/lib/stats/types";

export const standings = data as unknown as SeasonStanding[];

export const standingsForSeason = (season: string): SeasonStanding[] =>
  standings
    .filter((r) => r.season === season)
    .sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor);

export const standingFor = (season: string, userId: string): SeasonStanding | undefined =>
  standings.find((r) => r.season === season && r.userId === userId);

export const standingsForUser = (userId: string): SeasonStanding[] =>
  standings.filter((r) => r.userId === userId).sort((a, b) => Number(b.season) - Number(a.season));
