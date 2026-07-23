import data from "@/data/marts/playoffPicture.json";
import type { PlayoffPictureMart } from "@/lib/stats/types";

export const playoffPicture = data as unknown as PlayoffPictureMart | null;
