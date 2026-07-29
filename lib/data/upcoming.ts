import data from "@/data/marts/upcoming.json";
import type { UpcomingMart, UpcomingMatchup } from "@/lib/stats/types";

export const upcoming = data as unknown as UpcomingMart;

export const upcomingForWeek = (week: number): UpcomingMatchup[] =>
  upcoming.matchups.filter((m) => m.week === week);
