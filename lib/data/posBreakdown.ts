import data from "@/data/marts/posBreakdown.json";
import type { PosBreakdownMart, PosBreakdownRow } from "@/lib/stats/types";

export const posBreakdown = data as unknown as PosBreakdownMart;

const byKey = new Map<string, PosBreakdownRow>();
for (const r of posBreakdown.rows) byKey.set(`${r.userId}:${r.season}:${r.position}`, r);

export const posRow = (userId: string, season: string, pos: string): PosBreakdownRow | undefined =>
  byKey.get(`${userId}:${season}:${pos}`);

export const posRowsForScope = (season: string): PosBreakdownRow[] =>
  posBreakdown.rows.filter((r) => r.season === season);
