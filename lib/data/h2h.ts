import data from "@/data/marts/h2h.json";
import type { H2HPair } from "@/lib/stats/types";

export const h2h = data as unknown as H2HPair[];

export const getPair = (a: string, b: string): H2HPair | undefined =>
  h2h.find(
    (p) => (p.aUserId === a && p.bUserId === b) || (p.aUserId === b && p.bUserId === a),
  );

export const rivalriesFor = (userId: string): H2HPair[] =>
  h2h.filter((p) => p.aUserId === userId || p.bUserId === userId).sort((a, b) => b.heat - a.heat);

export const topRivalries = (n: number): H2HPair[] =>
  [...h2h].sort((a, b) => b.heat - a.heat).slice(0, n);
