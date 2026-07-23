import data from "@/data/marts/waivers.json";
import type { WaiverStats } from "@/lib/stats/types";

export const waivers = data as unknown as WaiverStats;
