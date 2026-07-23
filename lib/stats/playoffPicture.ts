import type { Dynasty } from "../model";
import { round2 } from "./util";
import type {
  DraftOrderPick,
  PlayoffPictureMart,
  PlayoffSeedRow,
  SeasonPlayoffs,
  SeasonStanding,
  StandingsTimelineRow,
  TeamWeek,
} from "./types";

/**
 * Playoff picture, projected draft order, and the week-by-week standings
 * timeline — all for the most recent season that has actually been played.
 *
 * DRAFT ORDER follows the league's proposed rule (see /rules), which exists
 * precisely so a team can't tank into the top pick:
 *   1.01   the non-playoff team with the LOWEST MAX PF (best possible lineup all
 *          year), not the lowest actual points
 *   2–6    remaining non-playoff teams, worst regular-season record first
 *   7–8    the two teams knocked out in the opening playoff round, lower seed first
 *   9–12   the final four, reverse order of finish — champion picks last
 *
 * While a season is still running the last two tiers can't be known, so those
 * teams are ordered provisionally by seed and the whole thing is labelled a
 * projection.
 */

const PLAYOFF_TEAMS = 6;

export function computePlayoffPicture(
  dynasty: Dynasty,
  standings: SeasonStanding[],
  playoffs: SeasonPlayoffs[],
  teamWeeks: TeamWeek[],
): PlayoffPictureMart | null {
  // newest season that has real games
  const seasons = [...new Set(standings.map((s) => s.season))].sort((a, b) => Number(b) - Number(a));
  const season = seasons[0];
  if (!season) return null;

  const rows = standings.filter((s) => s.season === season);
  if (rows.length === 0) return null;

  const po = playoffs.find((p) => p.season === season) ?? null;
  const seasonMeta = dynasty.seasons.find((s) => s.season === season);
  const regSeasonWeeks = (seasonMeta?.playoffWeekStart ?? 15) - 1;

  const weeks = teamWeeks.filter((t) => t.season === season && t.opponentUserId != null);
  const lastWeek = weeks.reduce((m, t) => Math.max(m, t.week), 0);
  const complete = lastWeek >= regSeasonWeeks;

  // ---- seeding: record first, points-for breaks ties (league convention)
  const ranked = [...rows].sort(
    (a, b) => b.wins - a.wins || a.losses - b.losses || b.pointsFor - a.pointsFor,
  );

  const seeds: PlayoffSeedRow[] = ranked.map((r, i) => {
    const rank = i + 1;
    const inPlayoffs = po ? r.madePlayoffs : rank <= PLAYOFF_TEAMS;
    const gamesLeft = Math.max(0, regSeasonWeeks - (r.wins + r.losses + r.ties));
    return {
      userId: r.userId,
      rank,
      seed: r.seed,
      wins: r.wins,
      losses: r.losses,
      ties: r.ties,
      pointsFor: round2(r.pointsFor),
      maxPointsFor: round2(r.seasonPpts),
      efficiency: r.efficiency,
      inPlayoffs,
      // once the regular season is done there is nothing left to decide
      onBubble: !complete && Math.abs(rank - PLAYOFF_TEAMS) <= 1,
      gamesLeft,
      finish: r.finish,
    };
  });

  // ---- projected draft order
  const nonPlayoff = seeds.filter((s) => !s.inPlayoffs);
  const playoffTeams = seeds.filter((s) => s.inPlayoffs);

  const picks: DraftOrderPick[] = [];
  const add = (userId: string, reason: string) =>
    picks.push({ pick: picks.length + 1, userId, reason });

  if (nonPlayoff.length > 0) {
    // 1.01 — lowest MAX PF among teams that missed
    const byMaxPf = [...nonPlayoff].sort((a, b) => a.maxPointsFor - b.maxPointsFor);
    const first = byMaxPf[0];
    add(first.userId, `Lowest max PF of the teams that missed (${first.maxPointsFor})`);

    // 2–6 — the rest, worst record first
    const rest = nonPlayoff.filter((s) => s.userId !== first.userId).sort((a, b) => b.rank - a.rank);
    for (const s of rest) add(s.userId, `Missed the playoffs · ${s.wins}-${s.losses}, seed rank ${s.rank}`);
  }

  if (playoffTeams.length > 0) {
    const finishOf = (userId: string) => po?.finishes[userId] ?? null;
    const withFinish = playoffTeams.filter((s) => finishOf(s.userId) != null);

    if (po && withFinish.length === playoffTeams.length) {
      // season decided: 7–8 are the earliest eliminations, then reverse finish
      const sorted = [...playoffTeams].sort((a, b) => (finishOf(b.userId) ?? 0) - (finishOf(a.userId) ?? 0));
      const firstOut = sorted.slice(0, 2).sort((a, b) => b.rank - a.rank);
      for (const s of firstOut) add(s.userId, `Out in the first playoff round · seed ${s.seed ?? s.rank}`);
      for (const s of sorted.slice(2)) {
        const f = finishOf(s.userId);
        add(s.userId, f === 1 ? "Champion" : `Finished ${f}${f === 2 ? "nd" : f === 3 ? "rd" : "th"}`);
      }
    } else {
      // still running — provisional, by seed
      for (const s of [...playoffTeams].sort((a, b) => b.rank - a.rank)) {
        add(s.userId, `Currently seed ${s.rank} — playoff result pending`);
      }
    }
  }

  // ---- week-by-week standings position, for the bump chart
  const byWeek = new Map<number, TeamWeek[]>();
  for (const t of weeks) {
    const arr = byWeek.get(t.week) ?? [];
    arr.push(t);
    byWeek.set(t.week, arr);
  }

  const cume = new Map<string, { w: number; l: number; pf: number }>();
  const timeline: StandingsTimelineRow[] = [];
  const orderedWeeks = [...byWeek.keys()].sort((a, b) => a - b).filter((w) => w <= regSeasonWeeks);

  for (const week of orderedWeeks) {
    for (const t of byWeek.get(week) ?? []) {
      const c = cume.get(t.userId) ?? { w: 0, l: 0, pf: 0 };
      if (t.result === "W") c.w++;
      else if (t.result === "L") c.l++;
      c.pf += t.points;
      cume.set(t.userId, c);
    }
    // rank on the same criteria the league seeds on
    const snapshot = [...cume.entries()].sort(
      (a, b) => b[1].w - a[1].w || a[1].l - b[1].l || b[1].pf - a[1].pf,
    );
    snapshot.forEach(([userId, c], i) => {
      timeline.push({
        season,
        week,
        userId,
        rank: i + 1,
        wins: c.w,
        losses: c.l,
        pointsFor: round2(c.pf),
      });
    });
  }

  return {
    season,
    lastWeek,
    regSeasonWeeks,
    complete,
    playoffTeams: PLAYOFF_TEAMS,
    seeds,
    draftOrder: picks,
    draftOrderFinal: complete && picks.length > 0 && !!po,
    timeline,
  };
}
