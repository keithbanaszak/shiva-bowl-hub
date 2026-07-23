import { z } from "zod";

/**
 * Zod schemas for the Sleeper API responses we rely on.
 *
 * By default Zod object schemas STRIP unknown keys (they do not error), which is
 * exactly what the transform layer wants: raw JSON on disk keeps everything, and
 * parsing here yields typed objects with just the fields we use. Fields that are
 * observed-but-undocumented (players_points, starters_points, ppts, bracket p)
 * are marked optional/nullable so a future API change degrades gracefully.
 */

const num = z.number();
const str = z.string();

// ---------------------------------------------------------------- NFL state
export const NflStateSchema = z.object({
  week: num.optional(),
  display_week: num.optional(),
  leg: num.optional(),
  season: str,
  season_type: str, // "pre" | "regular" | "post" | "off"
  last_scored_leg: num.optional(),
});
export type NflState = z.infer<typeof NflStateSchema>;

// ------------------------------------------------------------------- League
export const LeagueSettingsSchema = z
  .object({
    type: num.optional(), // 0 redraft, 1 keeper, 2 dynasty
    playoff_week_start: num.optional(),
    playoff_teams: num.optional(),
    league_average_match: num.optional(), // 1 = built-in median game
    num_teams: num.optional(),
    waiver_budget: num.optional(),
    taxi_slots: num.optional(),
    trade_deadline: num.optional(),
    draft_rounds: num.optional(),
    last_scored_leg: num.optional(),
    leg: num.optional(),
  })
  .partial();
export type LeagueSettings = z.infer<typeof LeagueSettingsSchema>;

export const LeagueSchema = z.object({
  league_id: str,
  name: str,
  season: str,
  status: str, // pre_draft | drafting | in_season | complete
  sport: str.optional(),
  previous_league_id: str.nullable().optional(),
  draft_id: str.nullable().optional(),
  bracket_id: z.union([str, num]).nullable().optional(),
  loser_bracket_id: z.union([str, num]).nullable().optional(),
  total_rosters: num.optional(),
  roster_positions: z.array(str).default([]),
  settings: LeagueSettingsSchema.default({}),
  scoring_settings: z.record(str, num).default({}),
  avatar: str.nullable().optional(),
});
export type League = z.infer<typeof LeagueSchema>;

// -------------------------------------------------------------------- Users
export const UserSchema = z.object({
  user_id: str,
  display_name: str.nullable().optional(),
  username: str.nullable().optional(),
  avatar: str.nullable().optional(),
  is_owner: z.boolean().nullable().optional(),
  metadata: z
    .object({ team_name: str.nullable().optional() })
    .partial()
    .nullable()
    .optional(),
});
export type User = z.infer<typeof UserSchema>;

// ------------------------------------------------------------------ Rosters
export const RosterSettingsSchema = z
  .object({
    wins: num.optional(),
    losses: num.optional(),
    ties: num.optional(),
    fpts: num.optional(),
    fpts_decimal: num.optional(),
    fpts_against: num.optional(),
    fpts_against_decimal: num.optional(),
    ppts: num.optional(),
    ppts_decimal: num.optional(),
    total_moves: num.optional(),
    waiver_budget_used: num.optional(),
    waiver_position: num.optional(),
  })
  .partial();
export type RosterSettings = z.infer<typeof RosterSettingsSchema>;

export const RosterSchema = z.object({
  roster_id: num,
  owner_id: str.nullable().optional(),
  co_owners: z.array(str).nullable().optional(),
  players: z.array(str).nullable().optional(),
  starters: z.array(str).nullable().optional(),
  reserve: z.array(str).nullable().optional(),
  taxi: z.array(str).nullable().optional(),
  keepers: z.array(str).nullable().optional(),
  settings: RosterSettingsSchema.default({}),
});
export type Roster = z.infer<typeof RosterSchema>;

// ----------------------------------------------------------------- Matchups
export const MatchupSchema = z.object({
  roster_id: num,
  matchup_id: num.nullable().optional(),
  points: num.nullable().optional(),
  custom_points: num.nullable().optional(),
  starters: z.array(str).nullable().optional(),
  players: z.array(str).nullable().optional(),
  // observed-but-undocumented (present in The Shiva Bowl):
  starters_points: z.array(num).nullable().optional(),
  players_points: z.record(str, num).nullable().optional(),
});
export type Matchup = z.infer<typeof MatchupSchema>;

// ------------------------------------------------------------- Transactions
export const DraftPickTradeSchema = z.object({
  season: str,
  round: num,
  roster_id: num, // ORIGINAL owner of the pick (pick identity)
  previous_owner_id: num.nullable().optional(),
  owner_id: num, // new owner after this transaction
});
export type DraftPickTrade = z.infer<typeof DraftPickTradeSchema>;

export const WaiverBudgetMoveSchema = z.object({
  sender: num,
  receiver: num,
  amount: num,
});

export const TransactionSchema = z.object({
  transaction_id: str,
  type: str, // trade | waiver | free_agent | commissioner
  status: str, // complete | failed
  created: num.nullable().optional(),
  status_updated: num.nullable().optional(),
  leg: num.nullable().optional(),
  roster_ids: z.array(num).nullable().optional(),
  consenter_ids: z.array(num).nullable().optional(),
  adds: z.record(str, num).nullable().optional(),
  drops: z.record(str, num).nullable().optional(),
  draft_picks: z.array(DraftPickTradeSchema).default([]),
  waiver_budget: z.array(WaiverBudgetMoveSchema).default([]),
  settings: z
    .object({ waiver_bid: num.nullable().optional(), seq: num.nullable().optional() })
    .partial()
    .nullable()
    .optional(),
  creator: str.nullable().optional(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

// ------------------------------------------------------------- Traded picks
export const TradedPickSchema = z.object({
  season: str,
  round: num,
  roster_id: num, // original owner = pick identity
  previous_owner_id: num.nullable().optional(),
  owner_id: num, // current owner
});
export type TradedPick = z.infer<typeof TradedPickSchema>;

// ------------------------------------------------------------------- Drafts
export const DraftSchema = z.object({
  draft_id: str,
  league_id: str.nullable().optional(),
  season: str,
  status: str.optional(),
  type: str.optional(), // snake | linear | auction
  start_time: num.nullable().optional(),
  draft_order: z.record(str, num).nullable().optional(), // user_id -> slot
  slot_to_roster_id: z.record(str, num).nullable().optional(), // slot -> roster_id
  settings: z
    .object({ rounds: num.optional(), teams: num.optional() })
    .partial()
    .nullable()
    .optional(),
});
export type Draft = z.infer<typeof DraftSchema>;

export const DraftPickSchema = z.object({
  draft_id: str.optional(),
  player_id: str.nullable().optional(),
  picked_by: str.nullable().optional(), // user_id
  roster_id: z.union([str, num]).nullable().optional(),
  round: num,
  draft_slot: num,
  pick_no: num,
  is_keeper: z.boolean().nullable().optional(),
  metadata: z
    .object({
      first_name: str.nullable().optional(),
      last_name: str.nullable().optional(),
      position: str.nullable().optional(),
      team: str.nullable().optional(),
      years_exp: str.nullable().optional(),
    })
    .partial()
    .nullable()
    .optional(),
});
export type DraftPick = z.infer<typeof DraftPickSchema>;

// ----------------------------------------------------------------- Brackets
// t1/t2 are either a roster_id (number) or a pointer like {w: matchId}/{l: matchId}.
const BracketSlot = z.union([num, z.record(str, num)]).nullable().optional();

export const BracketGameSchema = z.object({
  r: num, // round
  m: num, // match id within this bracket
  t1: BracketSlot,
  t2: BracketSlot,
  w: num.nullable().optional(), // winner roster_id
  l: num.nullable().optional(), // loser roster_id
  t1_from: z.record(str, num).nullable().optional(),
  t2_from: z.record(str, num).nullable().optional(),
  p: num.nullable().optional(), // placement (1 = championship)
});
export type BracketGame = z.infer<typeof BracketGameSchema>;

// ------------------------------------------------------------------ Players
export const SlimPlayerSchema = z.object({
  player_id: str,
  full_name: str.nullable().optional(),
  position: str.nullable().optional(),
  team: str.nullable().optional(),
  fantasy_positions: z.array(str).nullable().optional(),
  age: num.nullable().optional(),
  years_exp: num.nullable().optional(),
});
export type SlimPlayer = z.infer<typeof SlimPlayerSchema>;

export const arrayOf = <T extends z.ZodTypeAny>(schema: T) => z.array(schema);
