import data from "@/data/marts/teamPower.json";
import type { TeamPowerMart } from "@/lib/stats/types";

export const teamPower = data as unknown as TeamPowerMart;

export const teamPowerFor = (userId: string) => teamPower.teams.find((t) => t.userId === userId);
