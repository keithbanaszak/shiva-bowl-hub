import { PageHeader, Note, Stat } from "@/components/ui";
import { ActivityRow } from "@/components/activity/ActivityRow";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { activity, events, seasons } from "@/lib/data/activity";
import { activeManagers } from "@/lib/marts";

export default function ActivityPage() {
  const managers = activeManagers().map((m) => ({
    userId: m.userId,
    label: m.label,
  }));

  // Rows are rendered on the server (they resolve player + manager names from the
  // marts); the client component only picks which indices to show.
  const rows = events.map((e) => <ActivityRow key={e.id} e={e} />);

  const k = activity.byKind;

  return (
    <div>
      <PageHeader
        kicker="Everything, in order"
        title="League Activity"
        subtitle="Every trade, waiver claim, free-agent add and drop in league history — one chronological feed."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Trades" value={k.trade ?? 0} tone="good" />
        <Stat label="Waiver claims" value={k.waiver ?? 0} />
        <Stat label="Free agents" value={k.free_agent ?? 0} />
        <Stat label="Drops" value={k.drop ?? 0} tone="bad" />
      </div>

      <div className="mb-6">
        <Note title="Reading the feed">
          Rank chips like <strong>WR7</strong> are that player’s{" "}
          <strong>in-league</strong> positional finish for the season the move
          happened — how he actually scored among players rostered in this
          league, not an NFL-wide ranking. Dollar amounts are winning FAAB bids.
        </Note>
      </div>

      <ActivityFeed
        events={events}
        rows={rows}
        managers={managers}
        seasons={seasons()}
      />
    </div>
  );
}
