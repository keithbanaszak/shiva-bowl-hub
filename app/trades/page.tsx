import { PageHeader, Note } from "@/components/ui";
import { TradesExplorer } from "@/components/TradesExplorer";
import { trades } from "@/lib/data/trades";
import { managers } from "@/lib/marts";

export default function TradesPage() {
  const mgrs = managers.map((m) => ({ userId: m.userId, label: m.label, avatarUrl: m.avatarUrl }));

  return (
    <div>
      <PageHeader
        kicker="Receipts"
        title="Trade Receipts"
        subtitle="Every trade in league history — search a player, filter by season, and sort by how the realized points actually shook out."
      />
      <div className="mb-6">
        <Note title="Reading the receipt">
          <strong>Realized</strong> = points the players you received scored while on your roster (rest-of-season &
          career). The bar shows the career split between the two sides. &ldquo;Lopsided&rdquo; vs &ldquo;Even
          swap&rdquo; is points-only — a rebuild trade can be smart even when the points say you lost.
        </Note>
      </div>
      <TradesExplorer trades={trades} managers={mgrs} />
    </div>
  );
}
