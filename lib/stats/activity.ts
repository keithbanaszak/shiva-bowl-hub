import type { ActivityEvent, ActivityMart, Trade, WaiverStats } from "./types";

/**
 * One chronological stream over everything that happened in the league.
 *
 * Until now each kind of move lived in its own mart with its own shape, so there
 * was no way to answer "what has happened lately?" without visiting three pages.
 * This flattens trades, waiver claims, free-agent adds and drops into a single
 * time-ordered list the /activity feed renders directly.
 */
export function computeActivity(trades: Trade[], waivers: WaiverStats): ActivityMart {
  const events: ActivityEvent[] = [];

  for (const t of trades) {
    events.push({
      id: `trade:${t.id}`,
      kind: "trade",
      dateMs: t.dateMs,
      season: t.season,
      week: t.week,
      userIds: t.sides.map((s) => s.userId),
      // every player involved, so the feed is searchable by player
      playerIds: t.sides.flatMap((s) => s.received.filter((a) => a.kind === "player").map((a) => a.playerId)),
      tradeId: t.id,
      faab: t.sides.reduce((sum, s) => sum + s.faabReceived, 0),
    });
  }

  for (const m of waivers.moves) {
    events.push({
      id: m.id,
      kind: m.action === "add" ? (m.type === "waiver" ? "waiver" : "free_agent") : "drop",
      dateMs: m.dateMs,
      season: m.season,
      week: m.week,
      userIds: [m.userId],
      playerIds: [m.playerId],
      tradeId: null,
      faab: m.faab,
    });
  }

  events.sort((a, b) => (b.dateMs ?? 0) - (a.dateMs ?? 0));

  const byKind: Record<string, number> = {};
  const bySeason: Record<string, number> = {};
  for (const e of events) {
    byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
    bySeason[e.season] = (bySeason[e.season] ?? 0) + 1;
  }

  return { events, byKind, bySeason };
}
