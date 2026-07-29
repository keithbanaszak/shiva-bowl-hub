import type { Dynasty } from "../model";
import type { Identity } from "../identity";
import { userForRoster } from "../identity";
import type { PlayerWeek, PlayerWeekIndex } from "./playerWeeks";
import { orderOf } from "./playerWeeks";
import { round2 } from "./util";
import type {
  PlayerLegacy,
  PlayerLegacyMart,
  PlayerOwnerStint,
  PlayerOwnerTotals,
  PlayerRevengeGame,
} from "./types";

const MIN_WEEKS = 8; // legacy threshold for players no longer rostered

type AcqType = PlayerOwnerStint["acquisition"];
type AcqEvent = { order: number; userId: string; type: AcqType };
type DropEvent = { order: number; userId: string; season: string; week: number };

/** Acquisition events (drafts + adds) and free-agent drops, keyed by playerId. */
function buildEvents(dynasty: Dynasty, identity: Identity) {
  const acq = new Map<string, AcqEvent[]>();
  const drops = new Map<string, DropEvent[]>();
  const pushAcq = (pid: string, e: AcqEvent) => {
    const a = acq.get(pid) ?? [];
    a.push(e);
    acq.set(pid, a);
  };
  const pushDrop = (pid: string, e: DropEvent) => {
    const a = drops.get(pid) ?? [];
    a.push(e);
    drops.set(pid, a);
  };

  for (const s of dynasty.seasons) {
    // drafts happen before week 1 → order at "week 0"
    for (const b of s.drafts) {
      for (const p of b.picks) {
        if (!p.player_id) continue;
        const uid =
          p.picked_by && identity.byUserId.has(p.picked_by)
            ? p.picked_by
            : userForRoster(identity, s.season, Number(p.roster_id));
        pushAcq(p.player_id, { order: orderOf(s.season, 0), userId: uid, type: "draft" });
      }
    }
    for (const [week, txns] of s.transactionsByWeek) {
      for (const t of txns) {
        if (t.status && t.status !== "complete") continue;
        const order = orderOf(s.season, week);
        if (t.adds) {
          for (const [pid, rosterId] of Object.entries(t.adds)) {
            const uid = userForRoster(identity, s.season, rosterId);
            const type: AcqType = t.type === "trade" ? "trade" : "waiver";
            pushAcq(pid, { order, userId: uid, type });
          }
        }
        if (t.drops && (t.type === "waiver" || t.type === "free_agent" || t.type === "commissioner")) {
          for (const [pid, rosterId] of Object.entries(t.drops)) {
            const uid = userForRoster(identity, s.season, rosterId);
            pushDrop(pid, { order, userId: uid, season: s.season, week });
          }
        }
      }
    }
  }
  for (const a of acq.values()) a.sort((x, y) => x.order - y.order);
  return { acq, drops };
}

/** The acquisition type for a stint = the latest matching add/draft at/before its start. */
function acqFor(events: AcqEvent[] | undefined, userId: string, fromOrder: number): AcqType {
  if (!events) return "—";
  let best: AcqEvent | null = null;
  for (const e of events) {
    if (e.userId !== userId) continue;
    if (e.order > fromOrder) continue;
    if (!best || e.order > best.order) best = e;
  }
  return best?.type ?? "—";
}

function ownerTotalsFor(log: PlayerWeek[]): PlayerOwnerTotals[] {
  const by = new Map<string, PlayerOwnerTotals>();
  for (const pw of log) {
    let t = by.get(pw.userId);
    if (!t) {
      t = {
        userId: pw.userId,
        weeks: 0,
        starts: 0,
        points: 0,
        starterPoints: 0,
        ppg: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        bestGame: null,
      };
      by.set(pw.userId, t);
    }
    t.weeks++;
    t.points += pw.points;
    // a "start" counts only a real head-to-head game (see the /players fix),
    // so the record and start total reconcile.
    if (pw.started && pw.result != null) {
      t.starts++;
      t.starterPoints += pw.points;
      if (pw.result === "W") t.wins++;
      else if (pw.result === "L") t.losses++;
      else t.ties++;
    }
    if (!t.bestGame || pw.points > t.bestGame.points) {
      t.bestGame = { season: pw.season, week: pw.week, points: round2(pw.points), opponentUserId: pw.opponentUserId };
    }
  }
  return [...by.values()]
    .map((t) => ({
      ...t,
      points: round2(t.points),
      starterPoints: round2(t.starterPoints),
      ppg: t.weeks > 0 ? round2(t.points / t.weeks) : 0,
    }))
    .sort((a, b) => b.points - a.points);
}

function stintsFor(log: PlayerWeek[], acq: Map<string, AcqEvent[]>, playerId: string): PlayerOwnerStint[] {
  const stints: PlayerOwnerStint[] = [];
  let cur: PlayerOwnerStint | null = null;
  for (const pw of log) {
    if (!cur || cur.userId !== pw.userId) {
      if (cur) stints.push(cur);
      cur = {
        userId: pw.userId,
        fromSeason: pw.season,
        fromWeek: pw.week,
        toSeason: pw.season,
        toWeek: pw.week,
        seasons: [pw.season],
        weeks: 0,
        points: 0,
        starterPoints: 0,
        acquisition: acqFor(acq.get(playerId), pw.userId, pw.order),
      };
    }
    cur.toSeason = pw.season;
    cur.toWeek = pw.week;
    if (!cur.seasons.includes(pw.season)) cur.seasons.push(pw.season);
    cur.weeks++;
    cur.points += pw.points;
    if (pw.started) cur.starterPoints += pw.points;
  }
  if (cur) stints.push(cur);
  for (const s of stints) {
    s.points = round2(s.points);
    s.starterPoints = round2(s.starterPoints);
  }
  return stints;
}

function revengeFor(log: PlayerWeek[]): PlayerRevengeGame[] {
  // threshold from this player's started-game distribution
  const startedPts = log.filter((p) => p.started).map((p) => p.points);
  const mean = startedPts.length ? startedPts.reduce((a, b) => a + b, 0) / startedPts.length : 0;
  const variance = startedPts.length
    ? startedPts.reduce((a, b) => a + (b - mean) ** 2, 0) / startedPts.length
    : 0;
  const threshold = Math.max(15, mean + Math.sqrt(variance));

  const out: PlayerRevengeGame[] = [];
  const ownersSoFar = new Set<string>();
  for (const pw of log) {
    if (
      pw.started &&
      pw.opponentUserId &&
      pw.opponentUserId !== pw.userId &&
      ownersSoFar.has(pw.opponentUserId) &&
      pw.points >= threshold
    ) {
      out.push({
        season: pw.season,
        week: pw.week,
        points: round2(pw.points),
        forUserId: pw.userId,
        formerOwnerUserId: pw.opponentUserId,
      });
    }
    ownersSoFar.add(pw.userId);
  }
  return out.sort((a, b) => b.points - a.points).slice(0, 6);
}

function painfulDrop(
  log: PlayerWeek[],
  drops: DropEvent[] | undefined,
): PlayerLegacy["mostPainfulDrop"] {
  if (!drops || drops.length === 0) return null;
  let best: PlayerLegacy["mostPainfulDrop"] = null;
  for (const d of drops) {
    let after = 0;
    for (const pw of log) {
      if (pw.order > d.order && pw.userId !== d.userId) after += pw.points;
    }
    if (after > 0 && (!best || after > best.afterPoints)) {
      best = { droppedByUserId: d.userId, season: d.season, week: d.week, afterPoints: round2(after) };
    }
  }
  return best;
}

export function computePlayerLegacy(
  index: PlayerWeekIndex,
  dynasty: Dynasty,
  identity: Identity,
): PlayerLegacyMart {
  const { acq, drops } = buildEvents(dynasty, identity);

  // current (newest season) roster ownership: playerId -> userId
  const currentSeason = dynasty.seasons[0];
  const currentOwner = new Map<string, string>();
  if (currentSeason) {
    for (const r of currentSeason.rosters) {
      const uid = userForRoster(identity, currentSeason.season, r.roster_id);
      for (const pid of r.players ?? []) currentOwner.set(pid, uid);
    }
  }

  const ids = new Set<string>([...index.byPlayer.keys(), ...currentOwner.keys()]);
  const players: PlayerLegacy[] = [];

  for (const pid of ids) {
    const log = index.byPlayer.get(pid) ?? [];
    const onCurrentRoster = currentOwner.has(pid);
    if (log.length < MIN_WEEKS && !onCurrentRoster) continue;

    const meta = dynasty.players[pid];
    const totals = ownerTotalsFor(log);
    const careerPoints = round2(log.reduce((a, p) => a + p.points, 0));
    // real-game starts only (a bye/consolation week is no start — see /players)
    const realStarts = log.filter((p) => p.started && p.result != null);
    const careerStarterPoints = round2(realStarts.reduce((a, p) => a + p.points, 0));
    const totalStarts = realStarts.length;
    let rw = 0;
    let rl = 0;
    let rt = 0;
    for (const p of realStarts) {
      if (p.result === "W") rw++;
      else if (p.result === "L") rl++;
      else rt++;
    }
    const startedPpg = totalStarts > 0 ? round2(careerStarterPoints / totalStarts) : 0;
    const timesMoved =
      (acq.get(pid) ?? []).filter((e) => e.type !== "draft").length +
      (drops.get(pid) ?? []).length;
    const boomWeeks = [...log]
      .sort((a, b) => b.points - a.points)
      .slice(0, 8)
      .map((p) => ({
        season: p.season,
        week: p.week,
        points: round2(p.points),
        opponentUserId: p.opponentUserId,
        userId: p.userId,
        started: p.started,
      }));

    players.push({
      playerId: pid,
      name: meta?.full_name ?? pid,
      position: meta?.position ?? null,
      team: meta?.team ?? null,
      firstSeen: log.length ? log[0].season : currentSeason?.season ?? "—",
      lastSeen: log.length ? log[log.length - 1].season : currentSeason?.season ?? "—",
      careerPoints,
      careerStarterPoints,
      totalWeeks: log.length,
      totalStarts,
      record: { w: rw, l: rl, t: rt },
      startedPpg,
      timesMoved,
      ownerTotals: totals,
      timeline: stintsFor(log, acq, pid),
      revengeGames: revengeFor(log),
      boomWeeks,
      mostPainfulDrop: painfulDrop(log, drops.get(pid)),
      currentOwnerUserId: currentOwner.get(pid) ?? null,
    });
  }

  players.sort((a, b) => b.careerPoints - a.careerPoints);
  return { players };
}
