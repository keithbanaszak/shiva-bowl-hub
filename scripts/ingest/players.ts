import { api } from "../../lib/sleeper/client";
import { playersPath } from "../../lib/paths";
import { writeJson, fileAgeMs } from "../../lib/fsx";
import type { SlimPlayer } from "../../lib/sleeper/types";

const DAY_MS = 24 * 60 * 60 * 1000;

type RawPlayer = {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  position?: string | null;
  team?: string | null;
  fantasy_positions?: string[] | null;
  age?: number | null;
  years_exp?: number | null;
};

function slim(playerId: string, p: RawPlayer): SlimPlayer {
  const name =
    p.full_name ??
    [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ??
    null;
  return {
    player_id: playerId,
    full_name: name && name.length > 0 ? name : playerId,
    position: p.position ?? null,
    team: p.team ?? null,
    fantasy_positions: p.fantasy_positions ?? null,
    age: p.age ?? null,
    years_exp: p.years_exp ?? null,
  };
}

/**
 * Fetch the global player dump, slim it, and (when ids are given) filter to just
 * the players that appear in our league — keeps data/players.json tiny.
 * Skips the network call if the file is fresh (< 24h) unless `force`.
 */
export async function refreshPlayers(
  neededIds?: Set<string>,
  opts: { force?: boolean; nowMs?: number } = {},
): Promise<number> {
  const now = opts.nowMs ?? Date.now();
  if (!opts.force && fileAgeMs(playersPath, now) < DAY_MS) {
    console.log("  players.json is fresh (<24h), skipping player dump fetch");
    return 0;
  }

  console.log("  fetching /players/nfl (~14MB, once/day)…");
  const all = (await api.allPlayers()) as Record<string, RawPlayer> | null;
  if (!all) throw new Error("players/nfl returned empty");

  const out: Record<string, SlimPlayer> = {};
  for (const [id, raw] of Object.entries(all)) {
    if (neededIds && !neededIds.has(id)) continue;
    out[id] = slim(id, raw);
  }
  writeJson(playersPath, out, true);
  console.log(`  wrote ${Object.keys(out).length} players -> data/players.json`);
  return Object.keys(out).length;
}
