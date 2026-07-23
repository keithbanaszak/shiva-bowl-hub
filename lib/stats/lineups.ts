import type { Dynasty } from "../model";
import type { Identity } from "../identity";
import { userForRoster } from "../identity";
import type { LineupPlayer, MatchupLineup } from "./types";
import { matchupPoints, pairByMatchup, round2 } from "./util";
import { startingSlots } from "../optimal-lineup";

export function computeLineups(dynasty: Dynasty, identity: Identity): MatchupLineup[] {
  const out: MatchupLineup[] = [];

  for (const s of dynasty.seasons) {
    const slots = startingSlots(s.rosterPositions);
    for (const [week, entries] of s.matchupsByWeek) {
      const isPlayoff = week >= s.playoffWeekStart;
      const pairs = pairByMatchup(entries);
      const proj = s.projectionsByWeek.get(week);
      for (const [matchupId, group] of pairs) {
        if (group.length < 2) continue;
        const teams = group.map((m) => {
          let projTotal = 0;
          let anyProj = false;
          const starters: LineupPlayer[] = (m.starters ?? []).map((pid, i) => {
            const pp = proj?.[pid];
            if (typeof pp === "number") {
              projTotal += pp;
              anyProj = true;
            }
            return {
              playerId: pid,
              points: round2(m.starters_points?.[i] ?? m.players_points?.[pid] ?? 0),
              proj: typeof pp === "number" ? round2(pp) : null,
              slot: slots[i] ?? null,
            };
          });
          return {
            userId: userForRoster(identity, s.season, m.roster_id),
            rosterId: m.roster_id,
            points: round2(matchupPoints(m)),
            proj: anyProj ? round2(projTotal) : null,
            starters,
          };
        });
        out.push({
          key: `${s.season}:${week}:${matchupId}`,
          season: s.season,
          week,
          isPlayoff,
          teams,
        });
      }
    }
  }

  return out;
}
