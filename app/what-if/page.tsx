import { PageHeader, Note } from "@/components/ui";
import { WhatIfExplorer } from "@/components/whatif/WhatIfExplorer";
import { whatIf } from "@/lib/data/whatIf";

export const metadata = {
  title: "What If — The Shiva Bowl",
  description:
    "The perfect-lineup counterfactual: every game a flawless start/sit would have won, and the record you'd have if you were an oracle.",
};

export default function WhatIfPage() {
  return (
    <div>
      <PageHeader
        kicker="Counterfactual"
        title="What If?"
        subtitle="If you'd been a flawless start/sit oracle every week — perfect hindsight, best possible lineup — what would your record be, and which losses would flip to wins?"
      />

      <div className="mb-8">
        <Note title="This is hindsight — and that's the point">
          The &ldquo;perfect&rdquo; lineup is scored on <strong>actual</strong>{" "}
          points, so it&rsquo;s the impossible after-the-fact best, not what you
          could have known before lock. We hold the opponent&rsquo;s real score
          fixed and ask whether your own best possible lineup would have cleared
          it. For the fair, pre-game version — who left a{" "}
          <em>knowable</em> win on the table — see{" "}
          <a href="/integrity" className="text-[var(--accent)] hover:underline">
            Lineup Integrity
          </a>
          . Regular season only.
        </Note>
      </div>

      <WhatIfExplorer
        seasons={whatIf.seasons}
        managerSeasons={whatIf.managerSeasons}
        flipWeeks={whatIf.flipWeeks}
      />
    </div>
  );
}
