import { Card, PageHeader } from "@/components/ui";
import type { ReactNode } from "react";

function Term({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <h3 className="mb-2 font-semibold text-[var(--accent)]">{title}</h3>
      <div className="space-y-2 text-sm leading-relaxed text-[var(--muted)]">
        {children}
      </div>
    </Card>
  );
}

export default function GlossaryPage() {
  return (
    <div>
      <PageHeader
        kicker="How it all works"
        title="Glossary & Methodology"
        subtitle="Every number on this site comes from our actual Sleeper data. Here's exactly how each metric is built — so you can settle any argument."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Term title="All-play record">
          <p>
            Instead of just your one scheduled opponent each week, pretend you
            played <strong>all 11</strong> other teams that week. You “beat”
            everyone who scored less than you and “lose” to everyone who scored
            more.
          </p>
          <p>
            Over a season that’s a huge sample (14 weeks × 11 opponents = 154
            games), so it’s a schedule-proof power ranking. Your{" "}
            <strong>all-play win %</strong> is how good your scoring really was,
            independent of who the schedule happened to throw at you.
          </p>
        </Term>

        <Term title="Schedule luck">
          <p>
            We turn all-play into <strong>expected wins</strong>: each week you
            earn (teams you outscored ÷ 11) of a win. Add those up across the
            season for your expected win total — what your scoring “deserved.”
          </p>
          <p>
            <strong>Luck = actual wins − expected wins.</strong> +2 means you
            won two more games than your scoring earned (a soft schedule, or you
            timed your big weeks well). −2 means you got robbed by the schedule.
          </p>
        </Term>

        <Term title="Median record">
          <p>
            Each week we take the league’s median score. You get a “median win”
            if you scored above it, a loss if below. It’s a simpler cousin of
            all-play and another way to see who was genuinely good week to week.
          </p>
        </Term>

        <Term title="Realized points (trades & waivers)">
          <p>
            When you acquire a player, his <strong>realized points</strong> are
            the fantasy points he actually scored{" "}
            <strong>while on your roster</strong> from that moment forward.
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Rest-of-season</strong> — capped to that season.
            </li>
            <li>
              <strong>Career</strong> — follows him across seasons for as long
              as you kept him.
            </li>
            <li>
              <strong>Starter</strong> — only the weeks you actually started him
              (points you truly used).
            </li>
          </ul>
          <p>
            It’s a <em>receipt</em> of what you got — not a claim about dynasty
            market value. Selling veterans for picks can be a smart rebuild even
            when realized points say you “lost.”
          </p>
        </Term>

        <Term title="Optimal lineup & points on the bench">
          <p>
            Each week we compute the highest-scoring legal lineup you{" "}
            <em>could</em> have started from your roster (respecting
            QB/RB/WR/TE/FLEX/SUPER_FLEX/K/DEF slots).{" "}
            <strong>Points on bench</strong> = that optimal total minus what you
            actually scored.
          </p>
          <p>
            Our optimal-lineup math matches Sleeper’s own “max points” figure to
            the decimal for virtually every team-season, so the “what you left
            on the bench” numbers are exact.
          </p>
        </Term>

        <Term title="Rivalry heat">
          <p>
            A 0–100 score for how good a rivalry is. It rewards rivalries that
            are <strong>frequent</strong> (lots of meetings),{" "}
            <strong>even</strong> (neither team dominates the series),{" "}
            <strong>close</strong> (small average margins), and{" "}
            <strong>high-stakes</strong> (playoff meetings count extra).
          </p>
        </Term>

        <Term title="Game of the Week">
          <p>
            Every matchup gets a “vitality” score combining rivalry heat,
            whether the two managers had <strong>recently traded</strong> with
            each other, <strong>championship-rematch</strong> history, both
            being <strong>top scorers</strong> that year,{" "}
            <strong>playoff stakes</strong>, and how close the final margin was.
            The highest each week is crowned Game of the Week.
          </p>
        </Term>

        <Term title="Draft steal score">
          <p>
            A pick’s career points minus the <strong>average</strong> career
            points of all picks taken at that same slot. A late pick who
            produces like a star is a bigger steal than an obvious early hit.
            The inaugural startup draft is excluded — that was drafting
            veterans, not rookies.
          </p>
        </Term>

        <Term title="Waiver grading">
          <p>
            For each pickup we credit the manager with the points that player
            scored afterward while rostered. We track total points gained,
            points per FAAB dollar spent, points from free ($0) adds, and a “hit
            rate” — the share of adds that went on to score 20+ points.
          </p>
        </Term>

        <Term title="Where the data comes from">
          <p>
            Everything is pulled from the free, public Sleeper API across all of
            our league’s seasons — every matchup, lineup, transaction, draft,
            and playoff bracket. Managers are tracked by their Sleeper account,
            so records follow you even if you rename your team. Nothing here is
            an outside projection or ranking.
          </p>
        </Term>
      </div>
    </div>
  );
}
