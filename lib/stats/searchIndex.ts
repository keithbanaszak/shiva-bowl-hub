import type { Identity } from "../identity";
import type { PlayerLegacyMart, SearchDoc, SearchIndex } from "./types";

/**
 * Flat, tiny index powering the ⌘K palette: every manager, every player with a
 * page, and the static routes. Kept deliberately lean (id, label, sub, href,
 * kind) because it ships to the browser as one static JSON file.
 */

const ROUTES: Array<{ label: string; sub: string; href: string }> = [
  { label: "Home", sub: "Champion, activity, standings", href: "/" },
  { label: "League Activity", sub: "Every trade, add and drop", href: "/activity" },
  { label: "Trade Receipts", sub: "Every trade, graded", href: "/trades" },
  { label: "Waiver Wire", sub: "Adds, drops, FAAB", href: "/waivers" },
  { label: "Managers", sub: "All-time table", href: "/managers" },
  { label: "Compare Managers", sub: "Head to head", href: "/compare" },
  { label: "Rivalries", sub: "Ranked by heat", href: "/rivalries" },
  { label: "Schedule & GOTW", sub: "Every week", href: "/schedule" },
  { label: "Awards", sub: "Season superlatives", href: "/awards" },
  { label: "Dynasty Wrapped", sub: "Per-manager season recap", href: "/wrapped" },
  { label: "Schedule Luck", sub: "All-play and the Fraud Detector", href: "/luck" },
  { label: "Record Book", sub: "Top weeks and blowouts", href: "/records" },
  { label: "League Breakdown", sub: "Production by position and slot", href: "/breakdown" },
  { label: "Team Power", sub: "Contender vs rebuilder", href: "/teams" },
  { label: "Draft Room", sub: "Rookie draft boards", href: "/draft" },
  { label: "Players", sub: "Every player's league legacy", href: "/players" },
  { label: "Lineup Integrity", sub: "Tank watch and lineup gaps", href: "/integrity" },
  { label: "What If?", sub: "Perfect-lineup counterfactual and stolen wins", href: "/what-if" },
  { label: "League Rules", sub: "House rules and open votes", href: "/rules" },
  { label: "Playoff Picture", sub: "Seeding, projected draft order", href: "/playoffs" },
  { label: "Glossary", sub: "What every stat means", href: "/glossary" },
];

export function buildSearchIndex(identity: Identity, legacy: PlayerLegacyMart): SearchIndex {
  const docs: SearchDoc[] = [];

  for (const r of ROUTES) {
    docs.push({ kind: "page", id: r.href, label: r.label, sub: r.sub, href: r.href });
  }

  for (const m of identity.managers) {
    // both the team name and the Sleeper handle are searchable
    const sub = m.teamName && m.teamName !== m.label ? m.displayName : `@${m.displayName}`;
    docs.push({ kind: "manager", id: m.userId, label: m.label, sub, href: `/managers/${m.userId}` });
  }

  for (const p of legacy.players) {
    docs.push({
      kind: "player",
      id: p.playerId,
      label: p.name,
      sub: [p.position, p.team].filter(Boolean).join(" · "),
      href: `/players/${p.playerId}`,
      pos: p.position ?? undefined,
      // career points double as the relevance tiebreaker so stars rank first
      score: Math.round(p.careerPoints),
    });
  }

  return { generatedAtMs: 0, docs };
}
