import data from "@/data/marts/activity.json";
import type { ActivityEvent, ActivityMart } from "@/lib/stats/types";

export const activity = data as unknown as ActivityMart;
export const events = activity.events;

export const seasons = (): string[] =>
  [...new Set(events.map((e) => e.season))].sort((a, b) => Number(b) - Number(a));

export const eventsForUser = (userId: string): ActivityEvent[] =>
  events.filter((e) => e.userIds.includes(userId));
