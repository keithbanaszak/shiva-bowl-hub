import data from "@/data/marts/trades.json";
import type { Trade } from "@/lib/stats/types";

export const trades = data as unknown as Trade[];

export const tradesForSeason = (season: string): Trade[] =>
  trades.filter((t) => t.season === season);

export const tradesBetween = (a: string, b: string): Trade[] =>
  trades.filter((t) => {
    const u = t.sides.map((s) => s.userId);
    return u.includes(a) && u.includes(b);
  });

export const getTrade = (id: string): Trade | undefined => trades.find((t) => t.id === id);

export const tradesForUser = (userId: string): Trade[] =>
  trades.filter((t) => t.sides.some((s) => s.userId === userId));
