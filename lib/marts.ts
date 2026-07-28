import coreJson from "@/data/marts/core.json";
import standingsJson from "@/data/marts/standings.json";
import type { AllTimeRow } from "@/lib/stats/types";
import type { Manager } from "@/lib/model";

type Core = {
  generatedAtMs: number;
  managers: Manager[];
  chain: Array<{ season: string; leagueId: string; status: string; name: string }>;
  allTime: AllTimeRow[];
  validation: { season: string; userId: string; computedOptimal: number; sleeperPpts: number; diff: number }[];
};

export const core = coreJson as unknown as Core;
export const managers = core.managers;
export const allTime = core.allTime;
export const chain = core.chain;
export const generatedAtMs = core.generatedAtMs;

const managerById = new Map(managers.map((m) => [m.userId, m]));

export function getManager(userId: string | null | undefined): Manager | undefined {
  return userId ? managerById.get(userId) : undefined;
}

export function label(userId: string | null | undefined): string {
  if (!userId) return "—";
  return managerById.get(userId)?.label ?? userId;
}

/**
 * Seasons that were actually played (have real results), newest first.
 *
 * Keyed on the standings mart, NOT the Sleeper chain status: a league that has
 * rolled over to its next season shows `in_season` the moment the schedule is
 * generated — weeks and months before kickoff — so trusting status would list a
 * season with zero games played. Standings only exist once a game has been
 * scored (see keepPlayedWeeks in lib/raw.ts), which is exactly "actually played".
 */
const RESULT_SEASONS = [...new Set((standingsJson as Array<{ season: string }>).map((r) => r.season))].sort(
  (a, b) => Number(b) - Number(a),
);

export function completedSeasons(): string[] {
  return RESULT_SEASONS;
}

export function activeManagers(): Manager[] {
  const played = new Set(allTime.map((r) => r.userId));
  return managers.filter((m) => played.has(m.userId)).sort((a, b) => a.label.localeCompare(b.label));
}

/** The most recent completed season a manager actually played (has a Wrapped card). */
export function latestPlayedSeason(userId: string): string | undefined {
  const m = managerById.get(userId);
  if (!m) return undefined;
  return completedSeasons().find((s) => m.seasons.includes(s));
}

export const ordinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
