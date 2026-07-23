import data from "@/data/marts/kryptonite.json";
import type { KryptoniteStats } from "@/lib/stats/types";

export const kryptonite = data as unknown as KryptoniteStats;
