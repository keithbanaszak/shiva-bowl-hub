/**
 * Real names and profile details for the league's managers.
 *
 * Sleeper only gives us a handle and a team name, both of which change. This is
 * the hand-maintained layer on top of that, keyed by Sleeper `user_id` — the one
 * identifier that is stable across seasons.
 *
 * FILL IN WHAT YOU WANT AND LEAVE THE REST BLANK. Every field is optional and
 * anything empty simply falls back to today's behaviour (team name, then handle).
 * After editing, run `npm run data:build` to bake it into the marts.
 *
 * The comment on each line is that manager's current Sleeper handle and team name
 * so you can tell who is who.
 */

export type ManagerProfile = {
  /** Shown as the headline on their manager page when set. */
  realName?: string;
  /** Short nickname the league actually calls them. */
  nickname?: string;
  /** First season in the league. Defaults to the earliest season we have data for. */
  joined?: string;
  /** NFL team they root for, e.g. "Chicago Bears". */
  favoriteTeam?: string;
  /** One or two lines for their profile card. */
  bio?: string;
};

export const managerProfiles: Record<string, ManagerProfile> = {
  // alexjmercurio · "Baking Bad" · 2022–2026
  "650373233920548864": { realName: "" },

  // chasten · "DangerRUSS team" · 2022–2026
  "855885125915906048": { realName: "" },

  // kbanaszak · "DeBRICK Henry" · 2022–2026
  "735645755372609536": { realName: "" },

  // Pusty15 · "Fútbol is Life" · 2022–2026
  "857665918958931968": { realName: "" },

  // mstopie · "I Chase Young Kids" · 2022–2023
  "795782253253885952": { realName: "" },

  // dannyzorn · "Mia Cat" · 2022–2026
  "855882865676771328": { realName: "" },

  // AveryStokes97 · "New World Order" · 2023–2026
  "932125238328909824": { realName: "" },

  // KMettlach13 · "Pass Me The HERBS" · 2022–2026
  "735594830985588736": { realName: "" },

  // BeardedCamel13254 · "Pickens on Downs kids" · 2024–2026
  "994452464092905472": { realName: "" },

  // mattmac151 · "soulja boy crew" · 2022–2026
  "855883586849595392": { realName: "" },

  // LBerto · "South Side Trash" · 2022–2026
  "855885013571473408": { realName: "" },

  // davidwcook · "Southern Charm" · 2022–2026
  "855532159518248960": { realName: "" },

  // tszczasny · (no team name) · 2022 only
  "855912641145729024": { realName: "" },

  // trevorjansma · "Tuten my way to the top" · 2022–2026
  "735586756648382464": { realName: "" },
};
