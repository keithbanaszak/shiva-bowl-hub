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
  | { kind: "player"; playerId: string; name: string; position: string | null }
  | { kind: "pick"; season: string; round: number; becamePlayerId: string | null; becameName: string | null };

export type TradeSide = {
  userId: string;
  rosterId: number;
  received: TradeAsset[];
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

export type WaiverMove = {
  id: string;
  dateMs: number | null;
  season: string;
  week: number | null;
  type: "waiver" | "free_agent";
  userId: string;
  addPlayerId: string | null;
  dropPlayerId: string | null;
  faab: number;
};

export type WaiverStats = {
  acquisitions: Acquisition[];
  seasonLeaders: WaiverSeasonLeaders[];
  managerGrades: ManagerWaiverGrade[];
  recentMoves: WaiverMove[];
};

// -------------------------------------------------------------------- draft
export type DraftPickROI = {
  season: string;
  round: number;
  pickNo: number;
  draftSlot: number;
  userId: string;
  playerId: string;
  name: string;
  position: string | null;
  realizedCareer: number;
  starterCareer: number;
  seasonsRostered: number;
  stealScore: number; // realized vs expected-for-slot (rookie drafts only)
  isStartup: boolean; // inaugural startup draft (excluded from steal rankings)
};

export type DrafterRow = {
  userId: string;
  picks: number;
  totalRealized: number;
  pointsPerPick: number;
  bestPick: DraftPickROI | null;
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
