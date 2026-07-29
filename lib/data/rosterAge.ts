import data from "@/data/marts/rosterAge.json";
import type { RosterAgeMart } from "@/lib/stats/types";

export const rosterAge = data as unknown as RosterAgeMart;

export const currentRosterFor = (userId: string) =>
  rosterAge.teams.find((t) => t.userId === userId);
