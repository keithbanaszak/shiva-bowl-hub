import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader, SectionTitle, Note, Card } from "@/components/ui";
import {
  DataTable,
  type ColumnSpec,
  type TableRow,
} from "@/components/DataTable";
import { ManagerCell } from "@/components/cells";
import { StandingsTimeline } from "@/components/charts/StandingsTimeline";
import { PlayoffBracket } from "@/components/PlayoffBracket";
import { playoffPicture } from "@/lib/data/playoffPicture";
import { playoffsForSeason } from "@/lib/data/playoffs";
import { getManager, label } from "@/lib/marts";

export const metadata = {
  title: "Playoff Picture — The Shiva Bowl",
  description:
    "Live seeding, the projected draft order, and week-by-week standings.",
};

const mono = (v: ReactNode, cls = "") => (
  <span className={`font-mono tabular-nums ${cls}`}>{v}</span>
);

export default function PlayoffsPage() {
  const p = playoffPicture;
  if (!p) {
    return (
      <div>
        <PageHeader kicker="Playoff picture" title="Playoff Picture" />
        <Card>
          <div className="text-sm text-[var(--muted)]">No season data yet.</div>
        </Card>
      </div>
    );
  }

  const po = playoffsForSeason(p.season);

  // ---- seeding table
  const seedCols: ColumnSpec[] = [
    {
      key: "mgr",
      header: "Manager",
      width: "30%",
      sortable: true,
      descFirst: false,
    },
    {
      key: "rec",
      header: "Record",
      width: "12%",
      align: "right",
      sortable: true,
    },
    {
      key: "pf",
      hideBelow: "sm",
      header: "PF",
      width: "12%",
      align: "right",
      sortable: true,
    },
    {
      key: "max",
      hideBelow: "sm",
      header: "Max PF",
      width: "12%",
      align: "right",
      sortable: true,
      headerTitle: "Every optimal lineup — what the roster could have scored",
    },
    {
      key: "eff",
      hideBelow: "sm",
      header: "Lineup IQ",
      width: "12%",
      align: "right",
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      width: "22%",
      sortable: true,
      descFirst: false,
    },
  ];

  const seedRows: TableRow[] = p.seeds.map((s) => ({
    key: s.userId,
    inactive: getManager(s.userId)?.active === false,
    cells: {
      mgr: <ManagerCell userId={s.userId} />,
      rec: mono(`${s.wins}-${s.losses}${s.ties ? `-${s.ties}` : ""}`),
      pf: mono(Math.round(s.pointsFor)),
      max: mono(Math.round(s.maxPointsFor), "text-[var(--muted)]"),
      eff: mono(`${(s.efficiency * 100).toFixed(0)}%`, "text-[var(--muted)]"),
      status: s.inPlayoffs ? (
        <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
          {s.finish === 1 ? "Champion" : `Playoffs · seed ${s.seed ?? s.rank}`}
        </span>
      ) : (
        <span className="rounded-full bg-[var(--chip)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
          {p.complete ? "Missed" : "Outside"}
        </span>
      ),
    },
    sort: {
      mgr: label(s.userId),
      rec: s.wins - s.losses,
      pf: s.pointsFor,
      max: s.maxPointsFor,
      eff: s.efficiency,
      status: s.inPlayoffs ? 1 : 0,
    },
  }));

  // ---- projected draft order
  const orderCols: ColumnSpec[] = [
    {
      key: "pick",
      header: "Pick",
      width: "10%",
      sortable: true,
      descFirst: false,
    },
    {
      key: "mgr",
      header: "Manager",
      width: "30%",
      sortable: true,
      descFirst: false,
    },
    { key: "why", header: "Why", width: "60%", sortable: false },
  ];

  const orderRows: TableRow[] = p.draftOrder.map((d) => ({
    key: `${d.pick}`,
    inactive: getManager(d.userId)?.active === false,
    cells: {
      pick: mono(
        `1.${String(d.pick).padStart(2, "0")}`,
        d.pick === 1 ? "font-semibold text-[var(--gold)]" : "",
      ),
      mgr: <ManagerCell userId={d.userId} />,
      why: <span className="text-xs text-[var(--muted)]">{d.reason}</span>,
    },
    sort: { pick: d.pick, mgr: label(d.userId) },
  }));

  const teams = p.seeds.map((s) => {
    const m = getManager(s.userId);
    return {
      userId: s.userId,
      label: m?.label ?? s.userId,
      avatarUrl: m?.avatarUrl ?? null,
    };
  });

  return (
    <div>
      <PageHeader
        kicker={`${p.season} · through week ${Math.min(p.lastWeek, p.regSeasonWeeks)} of ${p.regSeasonWeeks}`}
        title="Playoff Picture"
        subtitle="Where the season stands, how the draft order shakes out under the proposed rule, and every team's week-by-week position."
      />

      {!p.complete && (
        <div className="mb-6">
          <Note title="Season in progress">
            Seeding is live — record first, points-for breaking ties. The draft
            order below is a <strong>projection</strong>; the playoff tiers
            can’t be settled until the bracket is played.
          </Note>
        </div>
      )}

      <SectionTitle>📊 Seeding</SectionTitle>
      <div className="mb-8">
        <DataTable
          rows={seedRows}
          columns={seedCols}
          rank
          initialSort={{ key: "rec", dir: "desc" }}
          caption={`Top ${p.playoffTeams} make the playoffs.`}
        />
      </div>

      <SectionTitle>📈 Week-by-week standings</SectionTitle>
      <div className="mb-8">
        <StandingsTimeline rows={p.timeline} teams={teams} season={p.season} />
      </div>

      {po && po.games.some((g) => g.bracket === "winners") && (
        <>
          <SectionTitle>🏆 Bracket</SectionTitle>
          <div className="mb-8">
            <PlayoffBracket po={po} />
          </div>
        </>
      )}

      <SectionTitle>
        🎯 {p.draftOrderFinal ? "Draft order" : "Projected draft order"}
      </SectionTitle>
      <div className="mb-3">
        <Note title="Under the proposed rule">
          <strong>1.01</strong> goes to the non-playoff team with the{" "}
          <strong>lowest max PF</strong> — best possible lineup all season, not
          actual points — so a team can’t bench its way to the top pick.{" "}
          <strong>2–6</strong> are the rest of the non-playoff teams by reverse
          standings, <strong>7–8</strong> the two first-round losers, and{" "}
          <strong>9–12</strong> reverse playoff finish. This is still{" "}
          <Link href="/rules" className="text-[var(--accent)] hover:underline">
            on the ballot
          </Link>
          .
        </Note>
      </div>
      <DataTable
        rows={orderRows}
        columns={orderCols}
        initialSort={{ key: "pick", dir: "asc" }}
        minWidth="20rem"
      />
    </div>
  );
}
