import data from "@/data/league-config.json";
import type { LeagueConfigMart, LeagueRule } from "@/lib/stats/types";

export const leagueConfigData = data as unknown as LeagueConfigMart;
export const rules = leagueConfigData.rules;

export const rulesByCategory = (): Array<{ category: string; rules: LeagueRule[] }> => {
  const by = new Map<string, LeagueRule[]>();
  for (const r of rules) {
    const arr = by.get(r.category) ?? [];
    arr.push(r);
    by.set(r.category, arr);
  }
  return [...by.entries()].map(([category, rs]) => ({ category, rules: rs }));
};

export const proposedRules = (): LeagueRule[] => rules.filter((r) => r.status === "proposed");
