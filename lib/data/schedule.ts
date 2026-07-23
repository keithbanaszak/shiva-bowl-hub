import data from "@/data/marts/schedule.json";
import type { ScheduleMatchup } from "@/lib/stats/types";

export const schedule = data as unknown as ScheduleMatchup[];

export const seasonsWithSchedule = (): string[] =>
  [...new Set(schedule.map((m) => m.season))].sort((a, b) => Number(b) - Number(a));

export const weeksForSeason = (season: string): number[] =>
  [...new Set(schedule.filter((m) => m.season === season).map((m) => m.week))].sort((a, b) => a - b);

export const matchupsForWeek = (season: string, week: number): ScheduleMatchup[] =>
  schedule
    .filter((m) => m.season === season && m.week === week)
    .sort((a, b) => b.vitality - a.vitality);

export const gameOfWeek = (season: string, week: number): ScheduleMatchup | undefined =>
  schedule.find((m) => m.season === season && m.week === week && m.isGameOfWeek);
