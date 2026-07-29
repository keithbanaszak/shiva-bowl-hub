/** Shapes of the precomputed JSON "marts" the Next.js app reads. */
import type { Manager } from "../model";

export type Result = "W" | "L" | "T";

export type TeamWeek = {
  season: string;
  week: number;
  isPlayoff: boolean;
  userId: string;
  rosterId: number;
  points: number;
  proj: number | null; // projected starting total
  optimalPoints: number | null;
  benchPoints: number | null; // optimal - actual (this week)
  opponentUserId: string | null;
  opponentPoints: number | null;
  result: Result | null;
  margin: number | null; // points - opponentPoints
  allPlayWins: number;
  allPlayLosses: number;
  aboveMedian: boolean | null;
};

export type SeasonStanding = {
  season: string;
  userId: string;
  rosterId: number;
  // regular-season actual record
  wins: number;
  losses: number;
  ties: number;
  // regular-season points (computed from weekly)
  pointsFor: number;
  pointsAgainst: number;
  // full-season authoritative totals from roster.settings
  seasonFpts: number;
  seasonPpts: number;
  benchPoints: number; // seasonPpts - seasonFpts
  efficiency: number; // seasonFpts / seasonPpts
  // luck / all-play (regular season)
  allPlayWins: number;
  allPlayLosses: number;
  allPlayWinPct: number;
  medianWins: number;
  medianLosses: number;
  expectedWins: number;
  luck: number; // actualWins - expectedWins
  pfRank: number; // 1 = most points
  // playoffs
  seed: number | null;
  finish: number | null; // 1 = champion
  madePlayoffs: boolean;
  champion: boolean;
  regSeasonChamp: boolean; // best regular-season record/PF
};

export type PlayoffGame = {
  season: string;
  bracket: "winners" | "losers";
  round: number;
  week: number | null;
  homeUserId: string | null;
  awayUserId: string | null;
  homePoints: number | null;
  awayPoints: number | null;
  winnerUserId: string | null;
  loserUserId: string | null;
  placement: number | null;
};

export type SeasonPlayoffs = {
  season: string;
  championUserId: string | null;
  runnerUpUserId: string | null;
  thirdUserId: string | null;
  toiletUserId: string | null; // last place (losers bracket bottom)
  games: PlayoffGame[];
  finishes: Record<string, number>; // userId -> final place
  seeds: Record<string, number>; // userId -> playoff seed
};

export type H2HPair = {
  aUserId: string;
  bUserId: string;
  games: number;
  aWins: number;
  bWins: number;
  ties: number;
  aPoints: number;
  bPoints: number;
  avgMargin: number; // mean |margin|
  biggest: { season: string; week: number; aPoints: number; bPoints: number; margin: number } | null;
  closest: { season: string; week: number; aPoints: number; bPoints: number; margin: number } | null;
  playoffAWins: number;
  playoffBWins: number;
  currentStreak: { holder: string; length: number } | null;
  heat: number; // rivalry heat score 0-100
};

export type TradeAsset =
  | {
      kind: "player";
      playerId: string;
      name: string;
      position: string | null;
      /** In-league positional finish in the trade's season, e.g. "WR7". */
      rankLabel?: string | null;
      /** Points per game that season, for a quick quality read. */
      ppg?: number | null;
    }
  | {
      kind: "pick";
      season: string;
      round: number;
      becamePlayerId: string | null;
      becameName: string | null;
      /** Whose original pick this was — enables "2026 R1 (via Southern Charm)". */
      originalUserId?: string | null;
      rankLabel?: string | null;
      ppg?: number | null;
    };

export type TradeSide = {
  userId: string;
  rosterId: number;
  received: TradeAsset[];
  /** What this side gave up. Mirrors `received` on the other side(s). */
  sent: TradeAsset[];
  faabReceived: number;
};

export type TradeRealized = {
  season: number; // rest-of-season realized
  career: number; // realized across seasons while kept
  starterSeason: number;
  starterCareer: number;
};

export type Trade = {
  id: string;
  season: string;
  week: number | null;
  dateMs: number | null;
  /** Sleeper's `creator` — the manager who proposed the deal. */
  creatorUserId: string | null;
  sides: TradeSide[];
  // realized points overlay (null when per-player points unavailable)
  realized: Record<string, TradeRealized> | null; // userId -> realized breakdown
};

export type ManagerCard = {
  season: string;
  userId: string;
  label: string;
  record: string;
  pointsFor: number;
  pfRank: number;
  finish: number | null;
  seed: number | null;
  champion: boolean;
  luck: number;
  benchPoints: number;
  efficiency: number;
  biggestWin: { week: number; opponentUserId: string | null; margin: number } | null;
  worstLoss: { week: number; opponentUserId: string | null; margin: number } | null;
  bestTrade: { tradeId: string; net: number } | null;
  rivalNote: string | null;
};

export type Award = {
  key: string;
  title: string;
  kind: "serious" | "funny";
  userId: string | null;
  value: string;
  blurb: string;
};

export type AllTimeRow = {
  userId: string;
  seasons: number;
  games: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsPerGame: number;
  championships: number;
  runnerUps: number;
  playoffAppearances: number;
  // postseason record, kept separate from the regular-season W-L above
  playoffWins: number;
  playoffLosses: number;
  playoffWinPct: number;
  bestFinish: number | null;
  avgFinish: number | null;
  // schedule-luck-adjusted
  allPlayWins: number;
  allPlayLosses: number;
  allPlayWinPct: number;
  totalLuck: number;
  // lineup IQ
  careerEfficiency: number; // sum fpts / sum ppts
  benchPointsTotal: number;
};

// ------------------------------------------------------------- kryptonite
export type KryptonitePair = {
  playerId: string;
  managerUserId: string;
  games: number;
  avgVs: number;
  overallAvg: number;
  diff: number; // avgVs - overallAvg
  pctAbove: number; // diff / overallAvg
  totalVs: number;
};
export type KryptoniteStats = {
  nemeses: KryptonitePair[]; // players who torch a specific manager
  byManager: Record<string, KryptonitePair>; // each manager's worst kryptonite
};

// ------------------------------------------------------------- draft boards
export type DraftBoardCell = {
  round: number;
  slot: number;
  pickNo: number | null;
  playerId: string | null;
  name: string | null;
  position: string | null;
  ownerUserId: string | null; // who picked (or currently owns a future pick)
  slotOwnerUserId: string | null; // original slot owner
  isTraded: boolean;
};
export type DraftBoard = {
  season: string;
  isStartup: boolean;
  isFuture: boolean;
  rounds: number;
  slots: number;
  order: Array<{ slot: number; userId: string | null }>;
  cells: DraftBoardCell[];
};

// ---------------------------------------------------------------- players
export type PlayerStartRecord = {
  playerId: string;
  starts: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  pointsWhileStarting: number;
  topManagerUserId: string | null; // manager who started him most
  topManagerStarts: number;
  // that manager's W/L in the weeks they started him
  topManagerWins: number;
  topManagerLosses: number;
};

export type BenchLeader = {
  playerId: string;
  benchPoints: number;
  benchWeeks: number;
  topManagerUserId: string | null; // manager who benched the most of his points
  topManagerBenchPoints: number;
};

export type PlayerStats = { startRecords: PlayerStartRecord[]; benchLeaders: BenchLeader[] };

// ------------------------------------------------------------- acquisitions
export type Acquisition = {
  id: string;
  season: string;
  week: number | null;
  dateMs: number | null;
  type: "waiver" | "free_agent";
  userId: string;
  rosterId: number;
  playerId: string;
  faab: number;
  realizedSeason: number;
  realizedCareer: number;
  starterSeason: number;
  weeksRostered: number;
  pointsPerFaab: number | null;
  /** Games played for this manager in the add season. */
  weeksAfter: number;
  /** Points per game while rostered — comparable across a week 1 and week 12 add. */
  ppgAfter: number;
  /** Points in the four weeks right after the add. */
  next4: number;
};

export type WaiverSeasonLeaders = {
  season: string;
  bestFreeAdd: Acquisition | null; // $0 add, most rest-of-season points
  bestValue: Acquisition | null; // most points per FAAB $ (faab > 0)
  biggestBust: Acquisition | null; // high FAAB, low realized
};

export type ManagerWaiverGrade = {
  userId: string;
  adds: number;
  faabSpent: number;
  pointsGained: number; // rest-of-season realized from all adds
  starterPointsGained: number;
  pointsPerFaab: number; // over paid adds
  freeAddPoints: number; // points from $0 adds
  hitRate: number; // share of adds that produced > 20 pts
};

/**
 * One row per PLAYER MOVEMENT, not per transaction. The previous shape kept only
 * the first add and first drop of each transaction and truncated to 40 rows, so
 * most drops were invisible.
 */
export type WaiverMove = {
  id: string; // `${transactionId}:${action}:${playerId}`
  dateMs: number | null;
  season: string;
  week: number;
  type: "waiver" | "free_agent";
  action: "add" | "drop";
  userId: string;
  playerId: string;
  /** Winning bid; only meaningful on waiver adds. */
  faab: number;
};

/** A drop that aged badly — "the one that got away". */
export type DropRegret = {
  id: string;
  season: string;
  week: number;
  userId: string; // who dropped him
  playerId: string;
  /** Points he scored for ANYONE after the drop, within the same season. */
  pointsAfterSeason: number;
  /** Games he actually played after the drop — the denominator that was missing. */
  weeksAfter: number;
  /** Points per game after the drop. Time-invariant, so a week 12 cut competes. */
  ppgAfter: number;
  /** Points in the FOUR WEEKS right after — did he go off immediately? */
  next4: number;
  /** His per-game average BEFORE the drop, for an is-this-actually-new read. */
  ppgBefore: number;
  /** …and across the rest of his career in this league. */
  pointsAfterCareer: number;
  /** Who picked him up next, if anyone did. */
  nextUserId: string | null;
  /** True when the same manager re-acquired him later — much less embarrassing. */
  reacquired: boolean;
};

export type ManagerChurn = {
  userId: string;
  adds: number;
  drops: number;
  faabSpent: number;
  /** Total points dropped players went on to score elsewhere that season. */
  regretPoints: number;
};

export type WaiverStats = {
  acquisitions: Acquisition[];
  seasonLeaders: WaiverSeasonLeaders[];
  managerGrades: ManagerWaiverGrade[];
  /** Every add and drop in league history, newest first. */
  moves: WaiverMove[];
  dropRegrets: DropRegret[];
  churn: ManagerChurn[];
};

// -------------------------------------------------------------------- draft
export type DraftPickROI = {
  season: string;
  round: number;
  pickNo: number;
  /** Pick number WITHIN the round — the ".01" part of Sleeper's "3.01". */
  pickInRound: number;
  /** Sleeper-style label: round, dot, zero-padded pick-in-round ("3.01"). */
  pickLabel: string;
  draftSlot: number;
  userId: string;
  playerId: string;
  name: string;
  position: string | null;
  realizedCareer: number;
  starterCareer: number;
  seasonsRostered: number;
  stealScore: number; // realized minus expected-for-slot (rookie drafts only)
  expected: number; // smoothed expected career points for that draft slot
  isStartup: boolean; // inaugural startup draft (excluded from steal rankings)
};

export type DrafterRow = {
  userId: string;
  picks: number;
  totalRealized: number;
  pointsPerPick: number;
  /** Sum of (realized - expected) across their rookie picks. */
  totalSteal: number;
  /** The fair "is this manager good at drafting?" number: value added PER PICK,
   *  so it doesn't just reward whoever accumulated the most picks. */
  stealPerPick: number;
  /** Share of picks that beat what that slot normally returns. */
  hitRate: number;
  bestPick: DraftPickROI | null;
  worstPick: DraftPickROI | null;
};

export type DraftStats = { picks: DraftPickROI[]; drafters: DrafterRow[] };

// ----------------------------------------------------------------- schedule
export type ScheduleMatchup = {
  season: string;
  week: number;
  isPlayoff: boolean;
  matchupId: number | null;
  aUserId: string;
  bUserId: string;
  aPoints: number;
  bPoints: number;
  aProj: number | null;
  bProj: number | null;
  winnerUserId: string | null;
  margin: number;
  seriesBefore: { aWins: number; bWins: number } | null; // h2h coming in (a/b orientation)
  /** Signed run each side carried INTO the game (+3 = won three straight). */
  aStreak: number;
  bStreak: number;
  vitality: number;
  reason: string | null;
  isGameOfWeek: boolean;
};

export type WeekSchedule = {
  season: string;
  week: number;
  isPlayoff: boolean;
  matchups: ScheduleMatchup[];
};

// ----------------------------------------------------------------- lineups
export type LineupPlayer = { playerId: string; points: number; proj: number | null; slot: string | null };
export type MatchupLineup = {
  key: string; // `${season}:${week}:${matchupId}`
  season: string;
  week: number;
  isPlayoff: boolean;
  teams: Array<{
    userId: string;
    rosterId: number;
    points: number;
    proj: number | null;
    starters: LineupPlayer[];
  }>;
};

// ----------------------------------------------------------------- records
export type RecordEntry = {
  season: string;
  week: number;
  userId: string;
  opponentUserId: string | null;
  opponentPoints: number | null;
  isPlayoff: boolean;
  value: number;
  note?: string;
};
export type Records = {
  topWeeks: RecordEntry[];
  lowWeeks: RecordEntry[];
  biggestBlowouts: RecordEntry[];
  bestBenchWeeks: RecordEntry[];
  highestCombined: RecordEntry[];
};

// ----------------------------------------------------------- player legacy
export type PlayerGameRef = {
  season: string;
  week: number;
  points: number;
  opponentUserId: string | null;
};

/** A continuous span during which one manager rostered a player. */
export type PlayerOwnerStint = {
  userId: string;
  fromSeason: string;
  fromWeek: number;
  toSeason: string;
  toWeek: number;
  seasons: string[];
  weeks: number;
  points: number;
  starterPoints: number;
  acquisition: "draft" | "trade" | "waiver" | "—"; // best-effort
};

/** All-time totals for one manager who rostered a player (across stints). */
export type PlayerOwnerTotals = {
  userId: string;
  weeks: number;
  starts: number;
  points: number;
  starterPoints: number;
  ppg: number;
  /** Team record in the weeks this manager STARTED him (real games only). */
  wins: number;
  losses: number;
  ties: number;
  bestGame: PlayerGameRef | null;
};

export type PlayerRevengeGame = {
  season: string;
  week: number;
  points: number;
  forUserId: string; // who he scored for
  formerOwnerUserId: string; // a prior owner he faced
};

export type PlayerLegacy = {
  playerId: string;
  name: string;
  position: string | null;
  team: string | null;
  firstSeen: string;
  lastSeen: string;
  careerPoints: number;
  careerStarterPoints: number;
  totalWeeks: number;
  totalStarts: number;
  /** Team record in weeks he was started (real games only). */
  record: { w: number; l: number; t: number };
  /** Average points per start (careerStarterPoints ÷ totalStarts). */
  startedPpg: number;
  /** Times he changed hands: trades + waiver/FA adds + drops (excludes his draft). */
  timesMoved: number;
  ownerTotals: PlayerOwnerTotals[]; // sorted by points desc
  timeline: PlayerOwnerStint[]; // chronological stints
  revengeGames: PlayerRevengeGame[];
  boomWeeks: Array<PlayerGameRef & { userId: string; started: boolean }>;
  mostPainfulDrop: { droppedByUserId: string; season: string; week: number; afterPoints: number } | null;
  currentOwnerUserId: string | null;
};

export type PlayerLegacyMart = { players: PlayerLegacy[] };

// -------------------------------------------------------------- team power
export type TeamPlayerAsset = {
  playerId: string;
  name: string;
  position: string | null;
  slot: string | null; // assigned lineup slot when a starter
  score: number; // PlayerScore (or replacement-baseline fallback)
  recentPPG: number | null;
  careerPPG: number | null;
  unproven: boolean; // no in-league history → fallback baseline
  age: number | null;
};

export type TeamFuturePick = {
  season: string;
  round: number;
  value: number;
  fromUserId: string | null; // original owner if acquired via trade, else null
};

export type TeamPower = {
  userId: string;
  hubValue: number; // 0-100
  winNow: number; // 0-100
  futureCapital: number; // 0-100
  contenderAxis: number; // -100 (rebuild) .. +100 (contend)
  posStrength: { QB: number; RB: number; WR: number; TE: number }; // 0-100 each
  weakestPos: "QB" | "RB" | "WR" | "TE";
  topAssets: TeamPlayerAsset[];
  starters: TeamPlayerAsset[];
  bench: TeamPlayerAsset[];
  futurePicks: TeamFuturePick[];
  avgAge: number | null;
  avgTenure: number; // mean # of seasons rostered players have appeared in our league
  rosterSize: number;
};

export type TeamPowerMart = {
  season: string;
  generatedNote: string;
  weights: { winNow: number; futureCapital: number };
  pickCurve: Record<string, number>; // round -> base value
  teams: TeamPower[]; // sorted by hubValue desc
};

// ------------------------------------------------------- positional breakdown
export type BreakdownPos = "QB" | "RB" | "WR" | "TE";

export type PosBreakdownRow = {
  userId: string;
  season: string; // "all" for the all-time scope, else "2025" etc.
  position: BreakdownPos;
  teamWeeks: number; // denominator: # team-weeks this manager played in scope
  totalPoints: number; // started + bench at this position
  startedPoints: number;
  benchPoints: number;
  avgStartedPerWeek: number;
  avgBenchPerWeek: number;
  avgTotalPerWeek: number;
  gamesStarted: number;
  topPlayer: { playerId: string; name: string; points: number } | null;
};

export type PosBreakdownMart = {
  scopes: string[]; // ["all", "2025", "2024", ...]
  rows: PosBreakdownRow[];
};

// ---------------------------------------------------------------- home hub
export type HomeTopPerformer = {
  pos: string;
  playerId: string;
  name: string;
  points: number;
  userId: string;
};

export type HomeAward = {
  key: string;
  title: string;
  emoji: string;
  userId: string;
  value: string;
  detail: string | null; // opponent userId, when relevant
};

export type HomeFeed = {
  lastPlayed: { season: string; week: number; isPlayoff: boolean } | null;
  topPerformers: HomeTopPerformer[];
  weeklyAwards: HomeAward[];
};

export type Marts = {
  generatedAtMs: number;
  managers: Manager[];
  chain: Array<{ season: string; leagueId: string; status: string; name: string }>;
  teamWeeks: TeamWeek[];
  standings: SeasonStanding[];
  playoffs: SeasonPlayoffs[];
  h2h: H2HPair[];
  trades: Trade[];
  awards: Record<string, Award[]>; // season -> awards
  cards: ManagerCard[];
  allTime: AllTimeRow[];
  validation: { season: string; userId: string; computedOptimal: number; sleeperPpts: number; diff: number }[];
};

// ---- ⌘K command palette -----------------------------------------------------

export type SearchDoc = {
  kind: "page" | "manager" | "player";
  id: string;
  label: string;
  sub: string;
  href: string;
  pos?: string;
  /** Relevance tiebreaker (career points for players); higher sorts first. */
  score?: number;
};

export type SearchIndex = { generatedAtMs: number; docs: SearchDoc[] };

// ---- in-league positional ranks ---------------------------------------------

export type PlayerSeasonRank = {
  season: string;
  playerId: string;
  position: string | null;
  points: number;
  weeks: number;
  starts: number;
  ppg: number;
  /** 1 = most total points at that position, among players rostered in-league. */
  posRank: number;
  /** Rank by PPG; null when the player didn't clear the games threshold. */
  posRankPpg: number | null;
  posCount: number;
};

export type PlayerRankMart = { minWeeksForPpg: number; rows: PlayerSeasonRank[] };

// ---- unified league activity feed -------------------------------------------

export type ActivityKind = "trade" | "waiver" | "free_agent" | "drop";

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  dateMs: number | null;
  season: string;
  week: number | null;
  /** Everyone involved. Trades have 2+; adds and drops have exactly 1. */
  userIds: string[];
  playerIds: string[];
  /** Set for trades so the feed can link to the full receipt. */
  tradeId: string | null;
  faab: number;
};

export type ActivityMart = {
  events: ActivityEvent[];
  byKind: Record<string, number>;
  bySeason: Record<string, number>;
};

// ---- lineup integrity / tank watch ------------------------------------------

export type IntegrityLevel = "clean" | "minor" | "notable" | "severe";

/**
 * Why a week looks bad. "abandoned" is the kinder reading (a neglected roster)
 * and is kept distinct from a deliberate lineup choice.
 */
export type IntegrityReason = "lineup-choice" | "abandoned" | "empty-slot";

export type LineupSlotEntry = {
  slot: string;
  playerId: string | null;
  proj: number | null;
  /** False = Sleeper had no projection at all, i.e. he wasn't playing. */
  hasProjection: boolean;
  actual: number | null;
};

export type IntegrityWeek = {
  id: string;
  season: string;
  week: number;
  userId: string;
  level: IntegrityLevel;
  reason: IntegrityReason;
  /** Projected total of the lineup actually started. */
  startedProj: number;
  /** Projected total of the best legal lineup available that week. */
  bestProj: number;
  gapPts: number;
  gapPct: number;
  deadStarters: number;
  noProjStarters: number;
  emptySlots: number;
  actualPoints: number;
  /** What the best-BY-PROJECTION lineup would ACTUALLY have scored (hindsight). */
  bestActualPoints: number;
  /** Opponent's actual points that week (null if the pairing can't be resolved). */
  opponentPoints: number | null;
  /** The real result of the week: did the lineup they started win or lose? */
  result: "W" | "L" | "T" | null;
  /** They didn't win, but the best-projected lineup would have — a flippable loss. */
  flipsResult: boolean;
  recordBefore: { w: number; l: number } | null;
  started: LineupSlotEntry[];
  bestLineup: LineupSlotEntry[];
  benched: Array<{ playerId: string; proj: number; actual: number }>;
};

export type ManagerIntegrity = {
  userId: string;
  flaggedWeeks: number;
  severeWeeks: number;
  worstGapPct: number;
  worstWeek: { season: string; week: number } | null;
  totalGapPts: number;
};

export type IntegrityMart = {
  /** Regular-season team-weeks searched — the denominator for the flag rate. */
  scanned: number;
  thresholds: { notablePct: number; severePct: number; deadProj: number; minGapPts: number };
  weeks: IntegrityWeek[];
  managers: ManagerIntegrity[];
};

// ---- scoring by starting lineup slot ----------------------------------------

export type SlotScoringRow = {
  userId: string;
  /** A season, or "all" for career. */
  scope: string;
  /** QB | RB | WR | TE | FLEX | SUPER_FLEX | K | DEF */
  slot: string;
  totalPoints: number;
  /** Individual slot starts (RB counts twice per week when there are two RB slots). */
  starts: number;
  teamWeeks: number;
  /** Points this slot group contributed per team-week. */
  avgPerWeek: number;
  /** Points per individual slot start — comparable across slots. */
  avgPerStart: number;
  bestWeek: { season: string; week: number; points: number; playerId: string | null } | null;
  topPlayer: { playerId: string; name: string; points: number } | null;
  /** 1 = best avgPerWeek at this slot, within the scope. */
  rank: number;
};

export type SlotScoringMart = { scopes: string[]; slots: string[]; rows: SlotScoringRow[] };

// ---- roster age (current dynasty holds, by position) ------------------------

export type RosterAgePlayer = { playerId: string; name: string; age: number };

/** One rostered player (age may be unknown, e.g. a team defense). */
export type RosterEntry = {
  playerId: string;
  name: string;
  pos: string;
  age: number | null;
};

export type RosterAgePos = {
  pos: string;
  /** Players rostered at this position (whether or not their age is known). */
  count: number;
  /** Mean age over the players with a known age; null if none. */
  avgAge: number | null;
  youngest: RosterAgePlayer | null;
  oldest: RosterAgePlayer | null;
};

export type RosterAgeTeam = {
  userId: string;
  /** Total players rostered. */
  players: number;
  /** Players with a known age (the age averages' denominator). */
  agedPlayers: number;
  /** Mean age across the whole roster; null if no ages are known. */
  avgAge: number | null;
  byPos: RosterAgePos[];
  /** The full current roster, for a plain who's-on-the-team listing. */
  roster: RosterEntry[];
};

export type RosterAgeMart = {
  /** Season these rosters reflect — the current dynasty holds. */
  season: string;
  /** Positions actually present, in canonical order. */
  positions: string[];
  /** League-wide mean age per position (for relative tinting). */
  leagueAvgByPos: Record<string, number>;
  /** League-wide mean age across every rostered player. */
  leagueAvgAge: number | null;
  /** One row per team, youngest roster first. */
  teams: RosterAgeTeam[];
};

// ---- upcoming (scheduled-but-unplayed) matchups -----------------------------

export type UpcomingMatchup = {
  season: string;
  week: number;
  matchupId: number;
  aUserId: string;
  bUserId: string;
  /** Projected best-lineup total from each side's current roster. */
  aProj: number;
  bProj: number;
  /** The marquee matchup of its week (highest combined projection). */
  isGameOfWeek: boolean;
};

export type UpcomingMart = {
  /** The season these upcoming games belong to (null if none scheduled). */
  season: string | null;
  /** Soonest unplayed scheduled week. */
  nextWeek: number | null;
  /** All upcoming week numbers, ascending. */
  weeks: number[];
  matchups: UpcomingMatchup[];
};

// ---- what-if: perfect-lineup counterfactual --------------------------------

export type WhatIfSwap = {
  slot: string;
  /** Started player who sits in the optimal lineup (null = an empty slot got filled). */
  outPlayerId: string | null;
  outPoints: number;
  /** Bench player the optimal lineup starts instead. */
  inPlayerId: string;
  inPoints: number;
  /** inPoints − outPoints; the points this one change adds. */
  gain: number;
};

export type WhatIfWeek = {
  id: string;
  season: string;
  week: number;
  userId: string;
  opponentUserId: string | null;
  actualPoints: number;
  /** Highest legal total from the players rostered, scored on ACTUAL points. */
  optimalPoints: number;
  opponentPoints: number | null;
  actualResult: "W" | "L" | "T" | null;
  /** Optimal lineup vs the opponent's ACTUAL score. */
  optimalResult: "W" | "L" | "T" | null;
  /** Didn't win, but the perfect lineup beats the opponent — a stolen win. */
  flip: boolean;
  /** Sit→start changes turning the started lineup into the optimal one, biggest gain first. */
  swaps: WhatIfSwap[];
};

export type WhatIfManagerSeason = {
  userId: string;
  /** A season, or "all" for career. */
  scope: string;
  actualW: number;
  actualL: number;
  actualT: number;
  optimalW: number;
  optimalL: number;
  optimalT: number;
  /** Games a perfect lineup flips from not-a-win to a win. */
  flips: number;
  /** Points left on the bench across the scope (optimal − actual). */
  pointsLeftOnBench: number;
  /** actual ÷ optimal points, 0..1. */
  efficiency: number;
};

export type WhatIfMart = {
  seasons: string[];
  managerSeasons: WhatIfManagerSeason[];
  /** Stolen-win receipts (flips only), most impactful first. */
  flipWeeks: WhatIfWeek[];
};

// ---- league config, maintained in a Google Sheet ---------------------------

export type LeagueRule = {
  id: string;
  category: string;
  rule: string;
  detail: string;
  /** proposed = on the ballot; retired = kept for the record. */
  status: "active" | "proposed" | "retired";
  /** ISO date the vote closes, for proposed rules. */
  voteCloses: string | null;
  sortOrder: number;
  pinned: boolean;
};

export type ManagerProfileRow = {
  userId: string;
  realName?: string;
  nickname?: string;
  joined?: string;
  favoriteTeam?: string;
  bio?: string;
};

export type LeagueConfigMart = {
  fetchedAtMs: number;
  rules: LeagueRule[];
  profiles: ManagerProfileRow[];
};

// ---- playoff picture, projected draft order, standings timeline -------------

export type PlayoffSeedRow = {
  userId: string;
  /** Live seeding rank on record, then points-for. */
  rank: number;
  /** Final playoff seed once the season is decided. */
  seed: number | null;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  /** Max possible points — every optimal lineup. Drives the 1.01 rule. */
  maxPointsFor: number;
  efficiency: number;
  inPlayoffs: boolean;
  onBubble: boolean;
  gamesLeft: number;
  finish: number | null;
};

export type DraftOrderPick = {
  pick: number;
  userId: string;
  /** Plain-English justification, shown in the table. */
  reason: string;
};

export type StandingsTimelineRow = {
  season: string;
  week: number;
  userId: string;
  rank: number;
  wins: number;
  losses: number;
  pointsFor: number;
};

export type PlayoffPictureMart = {
  season: string;
  lastWeek: number;
  regSeasonWeeks: number;
  complete: boolean;
  playoffTeams: number;
  seeds: PlayoffSeedRow[];
  draftOrder: DraftOrderPick[];
  /** False while any tier is still undecided — the UI labels it a projection. */
  draftOrderFinal: boolean;
  timeline: StandingsTimelineRow[];
};
