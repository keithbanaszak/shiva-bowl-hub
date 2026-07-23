import path from "node:path";
import { getProjections } from "../../lib/sleeper/client";
import { writeJson } from "../../lib/fsx";
import { projectionsDir } from "../../lib/paths";

/** Projected fantasy points = sum(stat * league scoring weight) over scored stats. */
function projectedPoints(stats: Record<string, number>, scoring: Record<string, number>): number {
  let pts = 0;
  for (const [k, weight] of Object.entries(scoring)) {
    const v = stats[k];
    if (typeof v === "number" && typeof weight === "number") pts += v * weight;
  }
  return Math.round(pts * 100) / 100;
}

/**
 * Pull rotowire projections for each given week, score them with the league's own
 * scoring settings, and store a compact { player_id: projectedPoints } map per week
 * (only players that appear in our league).
 */
export async function pullProjections(
  season: string,
  scoring: Record<string, number>,
  weeks: number[],
  neededIds: Set<string>,
): Promise<number> {
  let written = 0;
  for (const week of weeks) {
    const entries = await getProjections(season, week);
    if (!entries || entries.length === 0) continue;
    const out: Record<string, number> = {};
    for (const e of entries) {
      const pid = e.player_id;
      if (!pid || !neededIds.has(pid) || !e.stats) continue;
      const pts = projectedPoints(e.stats, scoring);
      if (pts !== 0) out[pid] = pts;
    }
    if (Object.keys(out).length > 0) {
      writeJson(path.join(projectionsDir(season), `week_${week}.json`), out);
      written++;
    }
  }
  return written;
}
