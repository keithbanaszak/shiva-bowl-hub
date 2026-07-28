import type { Dynasty, Manager } from "./model";
import { avatarUrl } from "./model";
import { managerProfiles } from "../league.managers";
import { readJsonIfExists } from "./fsx";
import { leagueConfigPath } from "./paths";

// Read the ACTIVE league's sheet data at runtime (not a static import) so
// `LEAGUE=<slug> npm run data:build` uses that league's profiles. This module is
// transform-side only — the app reads the baked core.json mart, never identity —
// so a filesystem read here never reaches a browser bundle.
const leagueConfigJson =
  readJsonIfExists<{ profiles?: Array<Record<string, string>> }>(leagueConfigPath) ?? {};

/** Profiles pulled from the Google Sheet take precedence over the local file. */
const sheetProfiles = new Map(
  (leagueConfigJson.profiles ?? []).map((p) => [p.userId, p]),
);

/** Merge the hand-maintained profile onto a manager, ignoring blank fields. */
function withProfile(m: Manager): Manager {
  const sheet = sheetProfiles.get(m.userId);
  const local = managerProfiles[m.userId];
  const p = { ...local, ...(sheet ?? {}) };
  if (!local && !sheet) return m;
  const clean = <T,>(v: T | undefined): T | undefined =>
    typeof v === "string" ? ((v.trim() || undefined) as T | undefined) : v;
  return {
    ...m,
    realName: clean(p.realName),
    nickname: clean(p.nickname),
    joined: clean(p.joined) ?? m.seasons[0],
    favoriteTeam: clean(p.favoriteTeam),
    bio: clean(p.bio),
  };
}

export type Identity = {
  managers: Manager[];
  byUserId: Map<string, Manager>;
  /** key `${season}:${rosterId}` -> userId (synthetic id for orphan rosters) */
  rosterUser: Map<string, string>;
};

const rosterKey = (season: string, rosterId: number) => `${season}:${rosterId}`;
const orphanId = (season: string, rosterId: number) => `orphan:${season}:${rosterId}`;

/**
 * Build the cross-season identity layer. Managers are keyed on Sleeper user_id
 * (stable across seasons); roster_id is only stable within a season, so every
 * cross-season join must go through here.
 */
export function buildIdentity(dynasty: Dynasty): Identity {
  const byUserId = new Map<string, Manager>();
  const rosterUser = new Map<string, string>();

  // seasons are newest -> oldest, so the first time we see a user we capture
  // their most-recent display name / team name / avatar.
  for (const s of dynasty.seasons) {
    const userById = new Map(s.users.map((u) => [u.user_id, u]));

    for (const r of s.rosters) {
      const uid = r.owner_id ?? orphanId(s.season, r.roster_id);
      rosterUser.set(rosterKey(s.season, r.roster_id), uid);

      if (!byUserId.has(uid)) {
        const u = r.owner_id ? userById.get(r.owner_id) : undefined;
        const displayName = u?.display_name ?? (r.owner_id ? r.owner_id : `Orphan ${s.season} R${r.roster_id}`);
        const teamName = u?.metadata?.team_name ?? null;
        byUserId.set(uid, {
          userId: uid,
          displayName,
          teamName,
          label: teamName || displayName,
          avatar: u?.avatar ?? null,
          avatarUrl: avatarUrl(u?.avatar),
          seasons: [],
          active: false,
        });
      }
      const m = byUserId.get(uid)!;
      if (!m.seasons.includes(s.season)) m.seasons.push(s.season);
    }

    // also register users who may not currently hold a roster
    for (const u of s.users) {
      if (!byUserId.has(u.user_id)) {
        const teamName = u.metadata?.team_name ?? null;
        const displayName = u.display_name ?? u.user_id;
        byUserId.set(u.user_id, {
          userId: u.user_id,
          displayName,
          teamName,
          label: teamName || displayName,
          avatar: u.avatar ?? null,
          avatarUrl: avatarUrl(u.avatar),
          seasons: [],
          active: false,
        });
      }
    }
  }

  for (const m of byUserId.values()) m.seasons.sort();

  // dynasty.seasons is newest-first, so [0] is the current league year
  const currentSeason = dynasty.seasons[0]?.season;
  const currentRosterOwners = new Set(
    (dynasty.seasons[0]?.rosters ?? []).map((r) => r.owner_id).filter(Boolean) as string[],
  );
  for (const m of byUserId.values()) {
    m.active = currentRosterOwners.has(m.userId) || (currentSeason ? m.seasons.includes(currentSeason) : false);
  }
  // profiles are merged last, after seasons are known (joined defaults to the first)
  for (const [uid, m] of byUserId) byUserId.set(uid, withProfile(m));
  const managers = [...byUserId.values()].sort((a, b) => a.label.localeCompare(b.label));
  return { managers, byUserId, rosterUser };
}

export function userForRoster(id: Identity, season: string, rosterId: number): string {
  return id.rosterUser.get(rosterKey(season, rosterId)) ?? orphanId(season, rosterId);
}
