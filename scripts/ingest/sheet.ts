/**
 * Pull league config (rules + manager profiles) from a Google Sheet.
 *
 *   npm run config:pull
 *
 * The sheet is the editing surface — a spreadsheet the commissioner already
 * knows how to use — and the JSON it produces is committed, so:
 *   - the site builds with no network access and no dependency on the sheet
 *     staying published, and
 *   - a bad edit is a reviewable diff rather than a silent change.
 *
 * FAIL-SOFT is deliberate: if the sheet is unreachable or malformed we keep the
 * last good copy and warn. A league-rules page going stale is a nuisance; a
 * failed deploy during the season is worse.
 */
import { activeLeague } from "../../leagues.config.mjs";
import { parseCsvObjects } from "../../lib/csv";
import { writeJson, readJsonIfExists } from "../../lib/fsx";
import { leagueConfigPath } from "../../lib/paths";
import type { LeagueRule, LeagueConfigMart, ManagerProfileRow } from "../../lib/stats/types";

const OUT = leagueConfigPath;

/** `gid` identifies the tab; `export?format=csv` works for any published sheet. */
function csvUrl(sheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

async function fetchCsv(url: string): Promise<Record<string, string>[] | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) {
      console.warn(`  ! sheet responded ${res.status} — keeping the committed copy`);
      return null;
    }
    const text = await res.text();
    // an unpublished sheet returns an HTML sign-in page, not CSV
    if (text.trimStart().startsWith("<")) {
      console.warn("  ! got HTML, not CSV — is the sheet published to the web?");
      return null;
    }
    return parseCsvObjects(text);
  } catch (err) {
    console.warn(`  ! could not reach the sheet (${(err as Error).message}) — keeping the committed copy`);
    return null;
  }
}

const truthy = (v: string) => /^(y|yes|true|1|x)$/i.test(v.trim());

function toRules(rows: Record<string, string>[]): LeagueRule[] {
  return rows
    .filter((r) => (r.rule ?? "").trim() !== "")
    .map((r, i) => {
      const status = (r.status ?? "active").toLowerCase().trim();
      return {
        id: r.id?.trim() || `rule-${i}`,
        category: r.category?.trim() || "General",
        rule: r.rule.trim(),
        detail: r.detail?.trim() || "",
        status: (["active", "proposed", "retired"].includes(status) ? status : "active") as LeagueRule["status"],
        voteCloses: r.vote_closes?.trim() || null,
        sortOrder: Number(r.sort_order) || i,
        pinned: truthy(r.pinned ?? ""),
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function toProfiles(rows: Record<string, string>[]): ManagerProfileRow[] {
  return rows
    .filter((r) => (r.user_id ?? "").trim() !== "")
    .map((r) => ({
      userId: r.user_id.trim(),
      realName: r.real_name?.trim() || undefined,
      nickname: r.nickname?.trim() || undefined,
      joined: r.joined?.trim() || undefined,
      favoriteTeam: r.favorite_team?.trim() || undefined,
      bio: r.bio?.trim() || undefined,
    }));
}

async function main() {
  const { sheetId, rulesGid, managersGid } = activeLeague().configSheet;
  const previous = readJsonIfExists<LeagueConfigMart>(OUT);

  if (!sheetId) {
    console.log("No configSheet.sheetId set for this league in leagues.config.mjs — skipping.");
    console.log("See README (League rules) for how to publish the sheet.");
    if (!previous) writeJson(OUT, { fetchedAtMs: 0, rules: [], profiles: [] }, true);
    return;
  }

  console.log("Fetching league config sheet…");
  const [ruleRows, mgrRows] = await Promise.all([
    fetchCsv(csvUrl(sheetId, rulesGid)),
    managersGid ? fetchCsv(csvUrl(sheetId, managersGid)) : Promise.resolve(null),
  ]);

  // partial success is fine — each tab falls back independently
  const rules = ruleRows ? toRules(ruleRows) : (previous?.rules ?? []);
  const profiles = mgrRows ? toProfiles(mgrRows) : (previous?.profiles ?? []);

  if (!ruleRows && !mgrRows) {
    console.warn("Nothing fetched; data/league-config.json left unchanged.");
    return;
  }

  writeJson(OUT, { fetchedAtMs: Date.now(), rules, profiles }, true);
  console.log(`  ${rules.length} rules, ${profiles.length} manager profiles -> data/league-config.json`);
}

main();
