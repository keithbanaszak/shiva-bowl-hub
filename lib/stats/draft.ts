import type { Dynasty } from "../model";
import type { Identity } from "../identity";
import { userForRoster } from "../identity";
import type { DraftPickROI, DrafterRow, DraftStats } from "./types";
import { playerName, round2 } from "./util";
import { realizedFor, type PlayerWeekIndex } from "./playerWeeks";

export function computeDraft(
  dynasty: Dynasty,
  identity: Identity,
  index: PlayerWeekIndex,
): DraftStats {
  const picks: DraftPickROI[] = [];
  // oldest season in the chain = the inaugural startup draft
  const startupSeason = dynasty.seasons[dynasty.seasons.length - 1]?.season;

  for (const s of dynasty.seasons) {
    for (const bundle of s.drafts) {
      for (const p of bundle.picks) {
        if (!p.player_id) continue;
        const userId =
          p.picked_by && identity.byUserId.has(p.picked_by)
            ? p.picked_by
            : userForRoster(identity, s.season, Number(p.roster_id));
        // from week 0 so the entire draft season counts (draft is preseason)
        const r = realizedFor(index, userId, p.player_id, s.season, 0);
        const seasonsRostered = new Set(
          (index.byPlayer.get(p.player_id) ?? [])
            .filter((pw) => pw.userId === userId)
            .map((pw) => pw.season),
        ).size;
        picks.push({
          season: s.season,
          round: p.round,
          pickNo: p.pick_no,
          draftSlot: p.draft_slot,
          userId,
          playerId: p.player_id,
          name: playerName(dynasty.players, p.player_id),
          position: dynasty.players[p.player_id]?.position ?? null,
          realizedCareer: r.realizedCareer,
          starterCareer: r.starterCareer,
          seasonsRostered,
          stealScore: 0,
          isStartup: s.season === startupSeason,
        });
      }
    }
  }

  // Expected production per overall pick number, learned from ROOKIE drafts only
  // (the startup draft is a different beast — vets, not rookie value).
  const sumByPick = new Map<number, { total: number; n: number }>();
  for (const p of picks) {
    if (p.isStartup) continue;
    const e = sumByPick.get(p.pickNo) ?? { total: 0, n: 0 };
    e.total += p.realizedCareer;
    e.n++;
    sumByPick.set(p.pickNo, e);
  }
  for (const p of picks) {
    if (p.isStartup) continue; // steal score only meaningful for rookie picks
    const e = sumByPick.get(p.pickNo);
    if (!e) continue;
    p.stealScore = round2(p.realizedCareer - e.total / e.n);
  }

  // drafter leaderboard — ROOKIE drafts only (startup draft was veterans)
  const byUser = new Map<string, DrafterRow>();
  for (const p of picks) {
    if (p.isStartup) continue;
    let row = byUser.get(p.userId);
    if (!row) {
      row = { userId: p.userId, picks: 0, totalRealized: 0, pointsPerPick: 0, bestPick: null };
      byUser.set(p.userId, row);
    }
    row.picks++;
    row.totalRealized += p.realizedCareer;
    if (!row.bestPick || p.realizedCareer > row.bestPick.realizedCareer) row.bestPick = p;
  }
  const drafters = [...byUser.values()]
    .map((r) => ({
      ...r,
      totalRealized: round2(r.totalRealized),
      pointsPerPick: r.picks > 0 ? round2(r.totalRealized / r.picks) : 0,
    }))
    .sort((a, b) => b.totalRealized - a.totalRealized);

  return { picks, drafters };
}
