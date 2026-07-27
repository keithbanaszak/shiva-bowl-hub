import type { Dynasty, SeasonData } from "../model";
import type { Identity } from "../identity";
import { userForRoster } from "../identity";
import { round2 } from "./util";
import type {
  RosterAgeMart,
  RosterAgePlayer,
  RosterAgePos,
  RosterAgeTeam,
} from "./types";

const POS_ORDER = ["QB", "RB", "WR", "TE", "K", "DEF"];

/**
 * Fold a Sleeper position onto the canonical bucket set. Team defenses come
 * across as "DEF"/"DST"; anything unrecognised keeps its own tag so a stray IDP
 * slot is visible rather than silently dropped.
 */
function canonPos(raw: string | null | undefined): string | null {
  const p = (raw ?? "").toUpperCase();
  if (!p) return null;
  if (p === "DST" || p === "DEF") return "DEF";
  return p;
}

/**
 * Average roster age by position for the CURRENT dynasty holds.
 *
 * Anchored on the newest season that actually has rostered players — in the
 * offseason that's the upcoming season's carried-over dynasty rosters, which is
 * exactly "who each team holds right now". Ages come from data/players.json
 * (Sleeper's `age`); team defenses have no age and so count toward roster size
 * but not toward any age average (their bucket's avgAge is null).
 *
 * We publish the league mean per position too, so the UI can tint each cell by
 * how young or old a team is *relative to the league at that position* — the
 * only comparison that means anything (a 24-year-old QB room reads very
 * differently from a 24-year-old RB room).
 */
export function computeRosterAge(dynasty: Dynasty, identity: Identity): RosterAgeMart {
  const season: SeasonData | undefined = dynasty.seasons.find((s) =>
    s.rosters.some((r) => (r.players?.length ?? 0) > 0),
  );
  if (!season) {
    return { season: "", positions: [], leagueAvgByPos: {}, leagueAvgAge: null, teams: [] };
  }

  const seenPos = new Set<string>();
  const teams: RosterAgeTeam[] = [];
  // league-wide accumulators for the relative tint
  const leaguePos = new Map<string, { sum: number; n: number }>();
  let leagueSum = 0;
  let leagueN = 0;

  for (const roster of season.rosters) {
    const userId = userForRoster(identity, season.season, roster.roster_id);
    const ids = roster.players ?? [];

    const buckets = new Map<string, RosterAgePlayer[]>();
    const counts = new Map<string, number>();
    let agedPlayers = 0;
    let ageSum = 0;

    for (const pid of ids) {
      const player = dynasty.players[pid];
      const pos = canonPos(player?.position ?? player?.fantasy_positions?.[0]);
      if (!pos) continue;
      seenPos.add(pos);
      counts.set(pos, (counts.get(pos) ?? 0) + 1);

      const age = player?.age;
      if (age != null) {
        const entry: RosterAgePlayer = { playerId: pid, name: player?.full_name ?? pid, age };
        (buckets.get(pos) ?? buckets.set(pos, []).get(pos)!).push(entry);
        agedPlayers++;
        ageSum += age;
        leagueSum += age;
        leagueN++;
        const lp = leaguePos.get(pos) ?? { sum: 0, n: 0 };
        lp.sum += age;
        lp.n++;
        leaguePos.set(pos, lp);
      }
    }

    const byPos: RosterAgePos[] = [];
    for (const pos of new Set([...counts.keys(), ...buckets.keys()])) {
      const ages = (buckets.get(pos) ?? []).slice().sort((a, b) => a.age - b.age);
      byPos.push({
        pos,
        count: counts.get(pos) ?? ages.length,
        avgAge: ages.length ? round2(ages.reduce((s, x) => s + x.age, 0) / ages.length) : null,
        youngest: ages[0] ?? null,
        oldest: ages[ages.length - 1] ?? null,
      });
    }

    teams.push({
      userId,
      players: ids.length,
      agedPlayers,
      avgAge: agedPlayers > 0 ? round2(ageSum / agedPlayers) : null,
      byPos,
    });
  }

  const positions = [...seenPos].sort((a, b) => {
    const ia = POS_ORDER.indexOf(a);
    const ib = POS_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });

  const leagueAvgByPos: Record<string, number> = {};
  for (const [pos, { sum, n }] of leaguePos) if (n > 0) leagueAvgByPos[pos] = round2(sum / n);

  // youngest roster first — the read the page opens on ("who's building young")
  teams.sort((a, b) => (a.avgAge ?? 99) - (b.avgAge ?? 99));

  return {
    season: season.season,
    positions,
    leagueAvgByPos,
    leagueAvgAge: leagueN > 0 ? round2(leagueSum / leagueN) : null,
    teams,
  };
}
