import data from "@/data/marts/whatIf.json";
import type { WhatIfManagerSeason, WhatIfMart } from "@/lib/stats/types";

export const whatIf = data as unknown as WhatIfMart;

export const whatIfForScope = (scope: string): WhatIfManagerSeason[] =>
  whatIf.managerSeasons.filter((r) => r.scope === scope);

export const flipsForScope = (scope: string) =>
  scope === "all" ? whatIf.flipWeeks : whatIf.flipWeeks.filter((w) => w.season === scope);
