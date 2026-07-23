import { Card, PageHeader, SectionTitle, Note, Stat } from "@/components/ui";
import { leagueConfigData, rulesByCategory, proposedRules } from "@/lib/data/leagueConfig";
import { leagueConfig } from "@/league.config";
import type { LeagueRule } from "@/lib/stats/types";

export const metadata = {
  title: "League Rules — The Shiva Bowl",
  description: "Every house rule, and what is currently on the ballot.",
};

const STATUS: Record<LeagueRule["status"], { label: string; cls: string }> = {
  active: { label: "In force", cls: "bg-[var(--accent-soft)] text-[var(--accent)]" },
  proposed: { label: "On the ballot", cls: "bg-[var(--gold-soft)] text-[var(--gold)]" },
  retired: { label: "Retired", cls: "bg-[var(--chip)] text-[var(--muted)]" },
};

function RuleRow({ r }: { r: LeagueRule }) {
  const s = STATUS[r.status];
  return (
    <div
      className={`rounded-xl border p-3 ${
        r.status === "proposed" ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-[var(--panel)]"
      } ${r.status === "retired" ? "opacity-60" : ""}`}
    >
      <div className="mb-1 flex flex-wrap items-center gap-2">
        {r.pinned && (
          <span aria-hidden title="Key rule" className="text-[var(--gold)]">
            ★
          </span>
        )}
        <span className="font-medium">{r.rule}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${s.cls}`}>
          {s.label}
        </span>
        {r.status === "proposed" && r.voteCloses && (
          <span className="text-[11px] text-[var(--muted)]">vote closes {r.voteCloses}</span>
        )}
      </div>
      {r.detail && <p className="text-sm leading-relaxed text-[var(--muted)]">{r.detail}</p>}
    </div>
  );
}

export default function RulesPage() {
  const groups = rulesByCategory();
  const proposed = proposedRules();
  const total = leagueConfigData.rules.length;
  const active = leagueConfigData.rules.filter((r) => r.status === "active").length;
  const fetched = leagueConfigData.fetchedAtMs;
  const linked = Boolean(leagueConfig.configSheet.sheetId);

  return (
    <div>
      <PageHeader
        kicker="The rulebook"
        title="League Rules"
        subtitle="Every house rule we have written down, plus whatever is currently on the ballot."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Rules in force" value={active} tone="good" />
        <Stat label="On the ballot" value={proposed.length} tone="gold" />
        <Stat label="Total recorded" value={total} />
        <Stat
          label="Last synced"
          value={fetched ? new Date(fetched).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
          sub={linked ? "from the sheet" : "sheet not linked"}
        />
      </div>

      {proposed.length > 0 && (
        <div className="mb-8">
          <Note title={`${proposed.length} rule${proposed.length === 1 ? "" : "s"} currently being voted on`}>
            Anything marked <strong>on the ballot</strong> is a proposal, not a rule yet. The draft-order proposal below
            is what the projected order on the{" "}
            <a href="/playoffs" className="text-[var(--accent)] hover:underline">
              playoff picture
            </a>{" "}
            page is calculated from, so you can see exactly what it would produce this year before voting.
          </Note>
        </div>
      )}

      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.category}>
            <SectionTitle>{g.category}</SectionTitle>
            <div className="space-y-2">
              {g.rules.map((r) => (
                <RuleRow key={r.id} r={r} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {groups.length === 0 && (
        <Card>
          <div className="text-sm text-[var(--muted)]">No rules recorded yet.</div>
        </Card>
      )}

      <div className="mt-10">
        <Note title="How to edit this page">
          {linked ? (
            <>
              These come from the league Google Sheet. Edit a row there, then run{" "}
              <code className="rounded bg-[var(--chip)] px-1">npm run config:pull</code> (or just wait for the weekly
              refresh) and the page updates. Columns: <strong>category</strong>, <strong>rule</strong>,{" "}
              <strong>detail</strong>, <strong>status</strong> (active / proposed / retired),{" "}
              <strong>vote_closes</strong>, <strong>sort_order</strong>, <strong>pinned</strong>.
            </>
          ) : (
            <>
              No sheet is linked yet, so these are the defaults committed in{" "}
              <code className="rounded bg-[var(--chip)] px-1">data/league-config.json</code>. To edit them in a
              spreadsheet instead: create a Google Sheet with a <strong>rules</strong> tab (columns{" "}
              <strong>category, rule, detail, status, vote_closes, sort_order, pinned</strong>) and a{" "}
              <strong>managers</strong> tab (columns{" "}
              <strong>user_id, real_name, nickname, joined, favorite_team, bio</strong>), publish it to the web, then put
              its id and tab gids into <code className="rounded bg-[var(--chip)] px-1">league.config.ts</code>.
            </>
          )}
        </Note>
      </div>
    </div>
  );
}
