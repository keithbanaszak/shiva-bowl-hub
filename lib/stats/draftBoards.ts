import type { Dynasty } from "../model";
import type { Identity } from "../identity";
import { userForRoster } from "../identity";
import type { DraftBoard, DraftBoardCell } from "./types";
import { playerName } from "./util";

export function computeDraftBoards(dynasty: Dynasty, identity: Identity): DraftBoard[] {
  const startupSeason = dynasty.seasons[dynasty.seasons.length - 1]?.season;
  const boards: DraftBoard[] = [];

  for (const s of dynasty.seasons) {
    for (const bundle of s.drafts) {
      const draft = bundle.draft;
      const slotMap = draft.slot_to_roster_id ?? {};
      const slots = Object.keys(slotMap).length || 12;
      const roundsFromPicks = bundle.picks.reduce((m, p) => Math.max(m, p.round), 0);
      const rounds = draft.settings?.rounds ?? roundsFromPicks ?? 3;
      const isFuture = bundle.picks.length === 0;
      const isStartup = s.season === startupSeason;

      const slotOwnerRoster = (slot: number): number | undefined => slotMap[String(slot)];
      const ownerUser = (roster: number | undefined): string | null =>
        roster != null ? userForRoster(identity, s.season, roster) : null;

      const order = Array.from({ length: slots }, (_, i) => {
        const slot = i + 1;
        return { slot, userId: ownerUser(slotOwnerRoster(slot)) };
      });

      // traded picks within this draft: (round, originalRoster) -> currentOwnerRoster
      const tradedMap = new Map<string, number>();
      for (const tp of bundle.traded_picks) tradedMap.set(`${tp.round}:${tp.roster_id}`, tp.owner_id);

      const pickMap = new Map<string, (typeof bundle.picks)[number]>();
      for (const p of bundle.picks) pickMap.set(`${p.round}:${p.draft_slot}`, p);

      const cells: DraftBoardCell[] = [];
      for (let round = 1; round <= rounds; round++) {
        for (let slot = 1; slot <= slots; slot++) {
          const origRoster = slotOwnerRoster(slot);
          const slotOwnerUserId = ownerUser(origRoster);
          const pick = pickMap.get(`${round}:${slot}`);
          if (pick) {
            const pickerUser =
              pick.picked_by && identity.byUserId.has(pick.picked_by)
                ? pick.picked_by
                : ownerUser(Number(pick.roster_id));
            cells.push({
              round,
              slot,
              pickNo: pick.pick_no,
              playerId: pick.player_id ?? null,
              name: pick.player_id ? playerName(dynasty.players, pick.player_id) : null,
              position: pick.player_id
                ? dynasty.players[pick.player_id]?.position ?? null
                : pick.metadata?.position ?? null,
              ownerUserId: pickerUser,
              slotOwnerUserId,
              isTraded: !!slotOwnerUserId && pickerUser !== slotOwnerUserId,
            });
          } else {
            let ownerRoster = origRoster;
            const traded = origRoster != null ? tradedMap.get(`${round}:${origRoster}`) : undefined;
            if (traded != null) ownerRoster = traded;
            const ownerUserId = ownerUser(ownerRoster);
            cells.push({
              round,
              slot,
              pickNo: null,
              playerId: null,
              name: null,
              position: null,
              ownerUserId,
              slotOwnerUserId,
              isTraded: !!slotOwnerUserId && ownerUserId !== slotOwnerUserId,
            });
          }
        }
      }

      boards.push({ season: s.season, isStartup, isFuture, rounds, slots, order, cells });
    }
  }

  return boards.sort((a, b) => Number(b.season) - Number(a.season));
}
