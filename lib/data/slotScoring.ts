import data from "@/data/marts/slotScoring.json";
import type { SlotScoringMart, SlotScoringRow } from "@/lib/stats/types";

export const slotScoring = data as unknown as SlotScoringMart;

export const rowsForScope = (scope: string): SlotScoringRow[] =>
  slotScoring.rows.filter((r) => r.scope === scope);

export const rowsForUser = (userId: string, scope = "all"): SlotScoringRow[] =>
  slotScoring.rows.filter((r) => r.userId === userId && r.scope === scope);
