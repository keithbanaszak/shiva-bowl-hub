import data from "@/data/marts/cards.json";
import type { ManagerCard } from "@/lib/stats/types";

export const cards = data as unknown as ManagerCard[];

export const cardsForSeason = (season: string): ManagerCard[] =>
  cards.filter((c) => c.season === season);

export const getCard = (season: string, userId: string): ManagerCard | undefined =>
  cards.find((c) => c.season === season && c.userId === userId);
