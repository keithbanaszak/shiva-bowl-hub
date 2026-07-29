import type {
  League,
  LeagueSettings,
  User,
  Roster,
  Matchup,
  Transaction,
  TradedPick,
  Draft,
  DraftPick,
  BracketGame,
  SlimPlayer,
} from "./sleeper/types";

/** A draft plus its picks and pre-draft pick trades. */
export type DraftBundle = { draft: Draft; picks: DraftPick[]; traded_picks: TradedPick[] };

/** Everything we know about one season of the league. */
export type SeasonData = {
  season: string;
  leagueId: string;
  name: string;
  status: string;
  settings: LeagueSettings;
  rosterPositions: string[];
  playoffWeekStart: number;
  scoringSettings: Record<string, number>;
  league: League;
  users: User[];
  rosters: Roster[];
  matchupsByWeek: Map<number, Matchup[]>;
  /**
   * Scheduled-but-unplayed weeks (0 points), dropped from matchupsByWeek so they
   * never count as real games. Kept separately so the "upcoming" preview can show
   * next week's projected matchups without contaminating any result-based mart.
   */
  upcomingByWeek: Map<number, Matchup[]>;
  transactionsByWeek: Map<number, Transaction[]>;
  projectionsByWeek: Map<number, Record<string, number>>; // week -> playerId -> projected pts
  tradedPicks: TradedPick[];
  drafts: DraftBundle[];
  winnersBracket: BracketGame[];
  losersBracket: BracketGame[];
};

export type Dynasty = {
  seasons: SeasonData[]; // newest -> oldest
  players: Record<string, SlimPlayer>;
};

/** Stable cross-season manager identity (keyed on Sleeper user_id). */
export type Manager = {
  userId: string;
  displayName: string;
  teamName: string | null;
  /** Preferred display label: latest team name, falling back to handle. */
  label: string;
  avatar: string | null;
  avatarUrl: string | null;
  seasons: string[];
  /** Still in the league — has a roster in the most recent season. */
  active: boolean;
  // ---- hand-maintained, from league.managers.ts (all optional)
  /** The human behind the team, when we've been told. */
  realName?: string;
  nickname?: string;
  joined?: string;
  favoriteTeam?: string;
  bio?: string;
};

/** Recombine Sleeper's split integer/decimal point fields. */
export const pts = (whole?: number | null, decimal?: number | null): number =>
  (whole ?? 0) + (decimal ?? 0) / 100;

export const SLEEPER_CDN = "https://sleepercdn.com/avatars";
export const avatarUrl = (avatar?: string | null): string | null =>
  avatar ? `${SLEEPER_CDN}/thumbs/${avatar}` : null;
