import { PageHeader, Note } from "@/components/ui";
import { TradesExplorer } from "@/components/TradesExplorer";
import { trades } from "@/lib/data/trades";
import { managers } from "@/lib/marts";

export default function TradesPage() {
  const mgrs = managers.map((m) => ({
    userId: m.userId,
    label: m.label,
    avatarUrl: m.avatarUrl,
  }));

  return (
    <div>
      <PageHeader
        kicker="Receipts"
        title="Trade Receipts"
        subtitle="Every trade in league history — search a player, filter by season, and sort by how the realized points actually shook out."
      />
      <div className="mb-6">
        <Note title="Reading the receipt">
          Each box lists only what that manager <strong>received</strong> — a{" "}
          <span className="font-mono text-[var(--accent)]">+</span> per asset.
          What one side got, the other gave up. <strong>ROS</strong> =
          rest-of-season points; <strong>Career</strong> = every point since,
          across seasons — toggle which one grades the trade. Player ranks like{" "}
          <strong>TE5</strong> are <strong>in-league</strong> finishes for that
          season (among players rostered in this league), not NFL-wide.
          “Lopsided” vs “Even swap” is points-only — a rebuild trade can be
          smart even when the points say you lost.
        </Note>
      </div>
      <TradesExplorer trades={trades} managers={mgrs} />
    </div>
  );
}
