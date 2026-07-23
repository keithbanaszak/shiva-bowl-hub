import data from "@/data/marts/integrity.json";
import type { IntegrityMart, IntegrityWeek } from "@/lib/stats/types";

export const integrity = data as unknown as IntegrityMart;

/** Only weeks worth discussing — "minor" is noise for a governance conversation. */
export const flagged = (): IntegrityWeek[] =>
  integrity.weeks.filter((w) => w.level === "notable" || w.level === "severe");

export const weeksForUser = (userId: string): IntegrityWeek[] =>
  integrity.weeks.filter((w) => w.userId === userId);
