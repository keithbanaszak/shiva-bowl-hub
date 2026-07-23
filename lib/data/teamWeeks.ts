import data from "@/data/marts/teamWeeks.json";
import type { TeamWeek } from "@/lib/stats/types";

export const teamWeeks = data as unknown as TeamWeek[];

/** Games for manager a vs manager b, from a's perspective, chronological. */
export const meetings = (a: string, b: string): TeamWeek[] =>
  teamWeeks
    .filter((t) => t.userId === a && t.opponentUserId === b && t.result != null)
    .sort((x, y) => Number(x.season) - Number(y.season) || x.week - y.week);
