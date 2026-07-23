import type { Dynasty } from "../model";
import type { Identity } from "../identity";
import { userForRoster } from "../identity";
import type { PlayerRankMart, PlayerSeasonRank, Trade, TradeAsset, TradeRealized, TradeSide } from "./types";
import { playerName, round2 } from "./util";
import { realizedFor, type PlayerWeekIndex } from "./playerWeeks";
import { rankLabel } from "./playerRanks";

/** Resolve a traded pick (season, round, originalRosterId) to the player drafted in that slot. */
function resolvePick(
  dynasty: Dynasty,
  season: string,
  round: number,
  originalRosterId: number,
): { playerId: string | null; name: string | null } {
  const target = dynasty.seasons.find((s) => s.season === season);
  if (!target) return { playerId: null, name: null };
  for (const bundle of target.drafts) {
    const slotMap = bundle.draft.slot_to_roster_id ?? {};
    let slot: number | null = null;
    for (const [slotStr, rid] of Object.entries(slotMap)) {
      if (rid === originalRosterId) slot = Number(slotStr);
    }
    if (slot == null) continue;
    const pick = bundle.picks.find((p) => p.round === round && p.draft_slot === slot);
    if (pick?.player_id) {
      return { playerId: pick.player_id, name: playerName(dynasty.players, pick.player_id) };
    }
  }
  return { playerId: null, name: null };
}

export function computeTrades(
  dynasty: Dynasty,
  identity: Identity,
  index: PlayerWeekIndex,
  ranks: PlayerRankMart,
): Trade[] {
  const trades: Trade[] = [];

  // (season, playerId) -> in-league positional rank for that season
  const rankBy = new Map<string, PlayerSeasonRank>();
  for (const r of ranks.rows) rankBy.set(`${r.season}:${r.playerId}`, r);

  for (const s of dynasty.seasons) {
    const uid = (rosterId: number) => userForRoster(identity, s.season, rosterId);

    /** Player asset tagged with how good he actually was that season, in-league. */
    const playerAsset = (pid: string): TradeAsset => {
      const r = rankBy.get(`${s.season}:${pid}`);
      return {
        kind: "player",
        playerId: pid,
        name: playerName(dynasty.players, pid),
        position: dynasty.players[pid]?.position ?? null,
        rankLabel: rankLabel(r),
        ppg: r?.ppg ?? null,
      };
    };

    for (const [week, txns] of s.transactionsByWeek) {
      for (const t of txns) {
        if (t.type !== "trade" || t.status !== "complete") continue;
        const rosterIds = t.roster_ids ?? [];
        if (rosterIds.length === 0) continue;

        const sides: TradeSide[] = rosterIds.map((rid) => ({
          userId: uid(rid),
          rosterId: rid,
          received: [],
          sent: [],
          faabReceived: 0,
        }));
        const sideByRoster = new Map(sides.map((sd) => [sd.rosterId, sd]));

        // adds[pid] = roster that GOT him; drops[pid] = roster that GAVE HIM UP
        for (const [pid, rid] of Object.entries(t.adds ?? {})) {
          sideByRoster.get(rid)?.received.push(playerAsset(pid));
        }
        for (const [pid, rid] of Object.entries(t.drops ?? {})) {
          sideByRoster.get(rid)?.sent.push(playerAsset(pid));
        }

        for (const dp of t.draft_picks ?? []) {
          const became = resolvePick(dynasty, dp.season, dp.round, dp.roster_id);
          const r = became.playerId ? rankBy.get(`${dp.season}:${became.playerId}`) : undefined;
          const asset: TradeAsset = {
            kind: "pick",
            season: dp.season,
            round: dp.round,
            becamePlayerId: became.playerId,
            becameName: became.name,
            // dp.roster_id identifies WHOSE pick it is, which is what "via X" shows
            originalUserId: uid(dp.roster_id),
            rankLabel: rankLabel(r),
            ppg: r?.ppg ?? null,
          };
          sideByRoster.get(dp.owner_id)?.received.push(asset);
          if (dp.previous_owner_id != null) sideByRoster.get(dp.previous_owner_id)?.sent.push(asset);
        }

        for (const wb of t.waiver_budget ?? []) {
          const side = sideByRoster.get(wb.receiver);
          if (side) side.faabReceived += wb.amount;
        }

        // realized: production while on the receiving roster — for received players AND
        // for traded picks that became players (counted from that draft season onward).
        const realized: Record<string, TradeRealized> = {};
        let anyPoints = false;
        for (const side of sides) {
          const agg: TradeRealized = { season: 0, career: 0, starterSeason: 0, starterCareer: 0 };
          for (const asset of side.received) {
            let pid: string | null = null;
            let fromSeason = s.season;
            let fromWeek = week;
            if (asset.kind === "player") {
              pid = asset.playerId;
            } else if (asset.kind === "pick" && asset.becamePlayerId) {
              // a pick converts to a rookie at its draft; credit from that season's start
              pid = asset.becamePlayerId;
              fromSeason = asset.season;
              fromWeek = 0;
            }
            if (!pid) continue;
            const r = realizedFor(index, side.userId, pid, fromSeason, fromWeek);
            agg.season += r.realizedSeason;
            agg.career += r.realizedCareer;
            agg.starterSeason += r.starterSeason;
            agg.starterCareer += r.starterCareer;
            if (r.realizedCareer > 0) anyPoints = true;
          }
          realized[side.userId] = {
            season: round2(agg.season),
            career: round2(agg.career),
            starterSeason: round2(agg.starterSeason),
            starterCareer: round2(agg.starterCareer),
          };
        }

        trades.push({
          id: t.transaction_id,
          season: s.season,
          week,
          dateMs: t.created ?? t.status_updated ?? null,
          creatorUserId: t.creator ?? null,
          sides,
          realized: anyPoints ? realized : null,
        });
      }
    }
  }

  return trades.sort((a, b) => (b.dateMs ?? 0) - (a.dateMs ?? 0));
}
