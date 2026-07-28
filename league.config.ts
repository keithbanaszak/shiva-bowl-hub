/**
 * Active-league config for the APP (server + client components).
 *
 * This resolves to whichever league THIS deployment serves. The value is
 * materialized into data/active-league.json by scripts/select-league.mjs from
 * the LEAGUE env var before every build, so the browser bundle carries the right
 * branding with no NEXT_PUBLIC_* plumbing. The committed default is the league
 * this repo builds when LEAGUE is unset (see leagues.config.mjs → DEFAULT_LEAGUE).
 *
 * SCRIPTS must NOT import this shim — they read the registry directly via
 * leagues.config.mjs (activeLeague()), which is keyed on the LEAGUE env var.
 */
import active from "@/data/active-league.json";

export const leagueConfig = active as {
  slug: string;
  currentLeagueId: string;
  sport: string;
  maxWeek: number;
  name: string;
  shortName: string;
  tagline: string;
  configSheet: { sheetId: string; rulesGid: string; managersGid: string };
};

export type LeagueConfig = typeof leagueConfig;
