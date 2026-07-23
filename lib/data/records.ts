import data from "@/data/marts/records.json";
import type { Records } from "@/lib/stats/types";

export const records = data as unknown as Records;
