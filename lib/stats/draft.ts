import type { Dynasty } from "../model";
import type { Identity } from "../identity";
import { userForRoster } from "../identity";
import type { DraftPickROI, DrafterRow, DraftStats } from "./types";
import { playerName, round2 } from "./util";
import { realizedFor, type PlayerWeekIndex } from "./playerWeeks";

/** Neighbouring picks pooled either side when learning what a slot is worth. */
const SMOOTH_WINDOW = 2;

export function computeDraft(dynasty: Dynasty, identity: Identity, index: PlayerWeekIndex): DraftStats {
  const picks: DraftPickROI[] = [];
  // oldest season in the chain = the inaugural startup draft
  const startupSeason = dynasty.seasons[dynasty.seasons.length - 1]?.season;

  for (const s of dynasty.seasons) {
    // Skip a season that hasn't played a game yet. Its rookie draft is already
    // complete on Sleeper (36 real picks), but with zero realized points every
    // pick would look like a −350 bust: it would poison the per-slot expected
    // value curve, sink every drafter's grade, and dominate the busts list. A
    // season with no played weeks has an empty matchupsByWeek (see keepPlayedWeeks).
    if (s.matchupsByWeek.size === 0) continue;
    for (const bundle of s.drafts) {
      // picks per round — needed to turn an overall pick number into Sleeper's
      // round.pick notation ("3.01" rather than a raw overall "3.25")
      const teams =
        bundle.draft.settings?.teams ||
        Object.keys(bundle.draft.slot_to_roster_id ?? {}).length ||
        s.rosters.length;

      for (const p of bundle.picks) {
        if (!p.player_id) continue;
        const userId =
          p.picked_by && identity.byUserId.has(p.picked_by)
            ? p.picked_by
            : userForRoster(identity, s.season, Number(p.roster_id));
        // from week 0 so the entire draft season counts (draft is preseason)
        const r = realizedFor(index, userId, p.player_id, s.season, 0);
        const seasonsRostered = new Set(
          (index.byPlayer.get(p.player_id) ?? []).filter((pw) => pw.userId === userId).map((pw) => pw.season),
        ).size;

        const pickInRound = teams > 0 ? ((p.pick_no - 1) % teams) + 1 : p.draft_slot;

        picks.push({
          season: s.season,
          round: p.round,
          pickNo: p.pick_no,
          pickInRound,
          pickLabel: `${p.round}.${String(pickInRound).padStart(2, "0")}`,
          draftSlot: p.draft_slot,
          userId,
          playerId: p.player_id,
          name: playerName(dynasty.players, p.player_id),
          position: dynasty.players[p.player_id]?.position ?? null,
          realizedCareer: r.realizedCareer,
          starterCareer: r.starterCareer,
          seasonsRostered,
          stealScore: 0,
          expected: 0,
          isStartup: s.season === startupSeason,
        });
      }
    }
  }

  /*
   * What a draft slot is normally worth, learned from ROOKIE drafts only (the
   * startup draft was veterans — a different market entirely).
   *
   * Averaging each exact pick number on its own gives n=3, one sample per rookie
   * draft, which is far too noisy to call anyone a good drafter on. Pooling a
   * small window of neighbouring picks lifts that to n≈15 while keeping the shape
   * of the curve, since adjacent slots really are worth about the same.
   */
  const rookie = picks.filter((p) => !p.isStartup);
  const byPick = new Map<number, number[]>();
  for (const p of rookie) {
    const arr = byPick.get(p.pickNo) ?? [];
    arr.push(p.realizedCareer);
    byPick.set(p.pickNo, arr);
  }

  const expectedAt = (pickNo: number): number => {
    const pool: number[] = [];
    for (let d = -SMOOTH_WINDOW; d <= SMOOTH_WINDOW; d++) pool.push(...(byPick.get(pickNo + d) ?? []));
    if (pool.length === 0) return 0;
    return pool.reduce((a, b) => a + b, 0) / pool.length;
  };

  for (const p of rookie) {
    p.expected = round2(expectedAt(p.pickNo));
    p.stealScore = round2(p.realizedCareer - p.expected);
  }

  // ---- drafter leaderboard, ROOKIE drafts only
  const byUser = new Map<string, DrafterRow & { _hits: number }>();
  for (const p of rookie) {
    let row = byUser.get(p.userId);
    if (!row) {
      row = {
        userId: p.userId,
        picks: 0,
        totalRealized: 0,
        pointsPerPick: 0,
        totalSteal: 0,
        stealPerPick: 0,
        hitRate: 0,
        bestPick: null,
        worstPick: null,
        _hits: 0,
      };
      byUser.set(p.userId, row);
    }
    row.picks++;
    row.totalRealized += p.realizedCareer;
    row.totalSteal += p.stealScore;
    if (p.stealScore > 0) row._hits++;
    if (!row.bestPick || p.stealScore > row.bestPick.stealScore) row.bestPick = p;
    if (!row.worstPick || p.stealScore < row.worstPick.stealScore) row.worstPick = p;
  }

  const drafters = [...byUser.values()]
    .map(({ _hits, ...r }) => ({
      ...r,
      totalRealized: round2(r.totalRealized),
      pointsPerPick: r.picks > 0 ? round2(r.totalRealized / r.picks) : 0,
      totalSteal: round2(r.totalSteal),
      // the headline: value added PER PICK, so volume alone can't top the table
      stealPerPick: r.picks > 0 ? round2(r.totalSteal / r.picks) : 0,
      hitRate: r.picks > 0 ? round2(_hits / r.picks) : 0,
    }))
    .sort((a, b) => b.stealPerPick - a.stealPerPick);

  return { picks, drafters };
}
