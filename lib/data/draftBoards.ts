import data from "@/data/marts/draftBoards.json";
import type { DraftBoard } from "@/lib/stats/types";

export const draftBoards = data as unknown as DraftBoard[];

export const boardSeasons = (): string[] => draftBoards.map((b) => b.season);

export const boardForSeason = (season: string): DraftBoard | undefined =>
  draftBoards.find((b) => b.season === season);
