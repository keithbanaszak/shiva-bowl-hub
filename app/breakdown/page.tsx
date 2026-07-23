import { PageHeader, SectionTitle, Card, Note } from "@/components/ui";
import { PosMatrix, type MatrixRow } from "@/components/breakdown/PosMatrix";
import {
  PosCompare,
  type CompareDatum,
} from "@/components/breakdown/PosCompare";
import { SlotTable } from "@/components/breakdown/SlotTable";
import { TradeFinder } from "@/components/breakdown/TradeFinder";
import { label, activeManagers } from "@/lib/marts";
import { teamPower } from "@/lib/data/teamPower";
import { posRow } from "@/lib/data/posBreakdown";
import { slotScoring } from "@/lib/data/slotScoring";
import { stancesOf } from "@/lib/data/tradeFinder";
import type { BreakdownPos } from "@/lib/stats/types";

const POS: BreakdownPos[] = ["QB", "RB", "WR", "TE"];

export default function BreakdownPage() {
  const teams = teamPower.teams;
  const managers = teams
    .map((t) => ({ userId: t.userId, label: label(t.userId) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // slot scoring spans league history, so it includes managers who have left
  const slotManagers = activeManagers().map((m) => ({
    userId: m.userId,
    label: m.label,
  }));

  // matrix rows
  const rows: MatrixRow[] = teams.map((t) => {
    const st = stancesOf(t.userId);
    const cell = (pos: BreakdownPos) => {
      const r = posRow(t.userId, "all", pos);
      return {
        strength: t.posStrength[pos],
        startedPpg: r?.avgStartedPerWeek ?? 0,
        totalPpw: r?.avgTotalPerWeek ?? 0,
        stance: st?.positions[pos].label ?? "balanced",
      };
    };
    return {
      userId: t.userId,
      label: label(t.userId),
      cells: {
        QB: cell("QB"),
        RB: cell("RB"),
        WR: cell("WR"),
        TE: cell("TE"),
        PICKS: {
          strength: t.futureCapital,
          startedPpg: 0,
          totalPpw: 0,
          stance: st?.picks.label ?? "balanced",
        },
      },
    };
  });

  // compare payload
  const compareData: Record<string, CompareDatum> = {};
  for (const t of teams) {
    const positions = {} as CompareDatum["positions"];
    for (const p of POS) {
      const r = posRow(t.userId, "all", p);
      positions[p] = {
        startedPpg: r?.avgStartedPerWeek ?? 0,
        benchPpg: r?.avgBenchPerWeek ?? 0,
        strength: t.posStrength[p],
      };
    }
    compareData[t.userId] = { positions, picks: { capital: t.futureCapital } };
  }

  return (
    <div>
      <PageHeader
        kicker="League breakdown"
        title="League Breakdown"
        subtitle="Every roster by position and pick capital — compare teams at a glance and find trade partners whose surplus matches your need."
      />

      <div className="mb-6">
        <Note title="How to read this">
          <strong>Current strength</strong> is each team’s present roster at a
          position (0–100, relative to the league). <strong>Started PPG</strong>{" "}
          and <strong>Total/wk</strong> are all-time production per week the
          manager played. The <strong>PICKS</strong> column is future draft
          capital. Green ▲ = surplus, red ▼ = need — the trade finder pairs
          complementary teams (and contenders with rebuilders for
          picks-for-players).
        </Note>
      </div>

      <SectionTitle>🧮 Positional matrix</SectionTitle>
      <div className="mb-10">
        <PosMatrix rows={rows} />
      </div>

      <SectionTitle>🎰 By starting lineup slot</SectionTitle>
      <div className="mb-3">
        <Note title="Slot, not position">
          This buckets points by the{" "}
          <strong>slot a player was started in</strong>, not by his position —
          so kickers and defenses are included, and <strong>FLEX</strong> and{" "}
          <strong>SFLEX</strong> are their own columns. That answers “who
          actually plays the best defense / kicker / tight end?”. Slots come
          from each season’s own roster template: this league ran one FLEX
          through 2024 and added a second in 2025, so <strong>Per week</strong>{" "}
          for a two-slot group is roughly double a single slot — use{" "}
          <strong>Per start</strong> to compare across slots.
        </Note>
      </div>
      <div className="mb-10">
        <SlotTable mart={slotScoring} managers={slotManagers} />
      </div>

      <SectionTitle>🤝 Trade finder</SectionTitle>
      <div className="mb-10">
        <TradeFinder />
      </div>

      <SectionTitle>⚖️ Compare two managers</SectionTitle>
      <Card>
        <PosCompare managers={managers} data={compareData} />
      </Card>
    </div>
  );
}
