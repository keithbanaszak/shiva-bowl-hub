import pLimit from "p-limit";

/**
 * Thin, polite Sleeper API client. Read-only, no auth.
 *
 * - Concurrency-limited (Sleeper asks to stay well under ~1000 calls/min).
 * - Retries on 429 / 5xx with exponential backoff.
 * - 404 / null bodies resolve to `null` (some endpoints return null when empty).
 *
 * Returns RAW parsed JSON so the ingest layer can persist everything verbatim;
 * validation/typing happens in the transform layer.
 */

const BASE = "https://api.sleeper.app/v1";

const limit = pLimit(6);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function rawFetch<T = unknown>(path: string, attempt = 0): Promise<T | null> {
  const url = `${BASE}${path}`;
  const maxAttempts = 5;
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (res.status === 404) return null;
    if (res.status === 429 || res.status >= 500) {
      if (attempt >= maxAttempts) {
        throw new Error(`Sleeper ${res.status} for ${path} after ${maxAttempts} attempts`);
      }
      const backoff = Math.min(1000 * 2 ** attempt, 15000);
      await sleep(backoff);
      return rawFetch<T>(path, attempt + 1);
    }
    if (!res.ok) throw new Error(`Sleeper ${res.status} for ${path}`);
    const body = (await res.json()) as T | null;
    return body;
  } catch (err) {
    // network blips: retry a few times before giving up
    if (attempt < maxAttempts) {
      await sleep(Math.min(1000 * 2 ** attempt, 15000));
      return rawFetch<T>(path, attempt + 1);
    }
    throw err;
  }
}

/** Throttled GET returning raw parsed JSON (or null when empty / 404). */
export function getJson<T = unknown>(path: string): Promise<T | null> {
  return limit(() => rawFetch<T>(path));
}

/** Projections live on api.sleeper.com (not /v1). One call returns all players for the week. */
const PROJ_BASE = "https://api.sleeper.com";
async function rawFetchAbs<T = unknown>(url: string, attempt = 0): Promise<T | null> {
  const maxAttempts = 5;
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (res.status === 404) return null;
    if (res.status === 429 || res.status >= 500) {
      if (attempt >= maxAttempts) throw new Error(`${res.status} for ${url}`);
      await sleep(Math.min(1000 * 2 ** attempt, 15000));
      return rawFetchAbs<T>(url, attempt + 1);
    }
    if (!res.ok) throw new Error(`${res.status} for ${url}`);
    return (await res.json()) as T | null;
  } catch (err) {
    if (attempt < maxAttempts) {
      await sleep(Math.min(1000 * 2 ** attempt, 15000));
      return rawFetchAbs<T>(url, attempt + 1);
    }
    throw err;
  }
}

export type ProjectionEntry = { player_id?: string; stats?: Record<string, number> };
export function getProjections(season: string, week: number): Promise<ProjectionEntry[] | null> {
  return limit(() =>
    rawFetchAbs<ProjectionEntry[]>(
      `${PROJ_BASE}/projections/nfl/${season}/${week}?season_type=regular`,
    ),
  );
}

// -------------------------------------------------------------- endpoints
export const api = {
  state: () => getJson<unknown>(`/state/nfl`),
  league: (id: string) => getJson<unknown>(`/league/${id}`),
  users: (id: string) => getJson<unknown[]>(`/league/${id}/users`),
  rosters: (id: string) => getJson<unknown[]>(`/league/${id}/rosters`),
  matchups: (id: string, week: number) => getJson<unknown[]>(`/league/${id}/matchups/${week}`),
  transactions: (id: string, week: number) =>
    getJson<unknown[]>(`/league/${id}/transactions/${week}`),
  tradedPicks: (id: string) => getJson<unknown[]>(`/league/${id}/traded_picks`),
  drafts: (id: string) => getJson<unknown[]>(`/league/${id}/drafts`),
  draft: (draftId: string) => getJson<unknown>(`/draft/${draftId}`),
  draftPicks: (draftId: string) => getJson<unknown[]>(`/draft/${draftId}/picks`),
  draftTradedPicks: (draftId: string) => getJson<unknown[]>(`/draft/${draftId}/traded_picks`),
  winnersBracket: (id: string) => getJson<unknown[]>(`/league/${id}/winners_bracket`),
  losersBracket: (id: string) => getJson<unknown[]>(`/league/${id}/losers_bracket`),
  /** ~14MB; fetch at most once per day. */
  allPlayers: () => getJson<Record<string, unknown>>(`/players/nfl`),
};
