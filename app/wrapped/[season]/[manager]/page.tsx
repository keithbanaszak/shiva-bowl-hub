import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, Stat, Badge, signed } from "@/components/ui";
import { Avatar } from "@/components/Manager";
import { label, ordinal } from "@/lib/marts";
import { cards, getCard } from "@/lib/data/cards";

export function generateStaticParams() {
  return cards.map((c) => ({ season: c.season, manager: c.userId }));
}

export default async function WrappedCardPage({
  params,
}: {
  params: Promise<{ season: string; manager: string }>;
}) {
  const { season, manager } = await params;
  const c = getCard(season, manager);
  if (!c) notFound();

  return (
    <div>
      <Link
        href={`/wrapped/${season}`}
        className="mb-4 inline-block text-sm text-[var(--muted)] hover:text-[var(--accent)]"
      >
        ← {season} Wrapped
      </Link>

      <Card className="relative overflow-hidden border-[var(--border-glow)]">
        <div className="pointer-events-none absolute -right-10 -top-16 text-[12rem] opacity-[0.06]">
          {c.champion ? "🏆" : "🏈"}
        </div>

        {/* hero */}
        <div className="flex items-center gap-4">
          <Avatar userId={c.userId} size={64} />
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--accent)]">
              {season} Dynasty Wrapped
            </div>
            <div className="text-2xl font-bold tracking-tight">{c.label}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
              <span>{c.record}</span>
              <span>·</span>
              <span>{c.finish ? ordinal(c.finish) : "—"} place</span>
              {c.seed && (
                <>
                  <span>·</span>
                  <span>{ordinal(c.seed)} seed</span>
                </>
              )}
              {c.champion && <Badge tone="gold">Champion 🏆</Badge>}
            </div>
          </div>
        </div>

        {/* stat grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat
            label="Points for"
            value={c.pointsFor}
            sub={`#${c.pfRank} in league`}
          />
          <Stat
            label="Schedule luck"
            value={signed(c.luck)}
            sub="wins vs expected"
            tone={c.luck > 0 ? "good" : c.luck < 0 ? "bad" : "default"}
          />
          <Stat
            label="Lineup efficiency"
            value={`${(c.efficiency * 100).toFixed(1)}%`}
            sub={`${c.benchPoints} pts benched`}
          />
        </div>

        {/* highlights */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {c.biggestWin && (
            <div className="rounded-xl border border-[var(--border-glow)] bg-[var(--accent-soft)] p-3">
              <div className="text-xs uppercase tracking-wider text-[var(--accent)]">
                Biggest win
              </div>
              <div className="mt-1 text-sm">
                Week {c.biggestWin.week} · beat{" "}
                {label(c.biggestWin.opponentUserId)} by{" "}
                <span className="font-semibold text-[var(--accent)]">
                  {Math.abs(c.biggestWin.margin)}
                </span>
              </div>
            </div>
          )}
          {c.worstLoss && (
            <div className="rounded-xl border border-[var(--bad-border)] bg-[var(--bad-soft)] p-3">
              <div className="text-xs uppercase tracking-wider text-[var(--bad)]">
                Most painful loss
              </div>
              <div className="mt-1 text-sm">
                Week {c.worstLoss.week} · lost to{" "}
                {label(c.worstLoss.opponentUserId)} by{" "}
                <span className="font-semibold text-[var(--bad)]">
                  {Math.abs(c.worstLoss.margin)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* footnotes */}
        <div className="mt-4 space-y-1 text-sm text-[var(--muted)]">
          {c.bestTrade && c.bestTrade.net > 0 && (
            <div>
              💼 Best trade haul:{" "}
              <span className="text-[var(--foreground)]">
                {c.bestTrade.net} realized points
              </span>{" "}
              from acquired players.{" "}
              <Link
                href="/trades"
                className="text-[var(--accent)] hover:underline"
              >
                see trades →
              </Link>
            </div>
          )}
          {c.rivalNote && <div>⚔️ Top rivalry: {c.rivalNote}.</div>}
          <div>🪑 Left {c.benchPoints} points on the bench all season.</div>
        </div>
      </Card>

      <p className="mt-4 text-xs text-[var(--muted)]">
        Screenshot-friendly — share it in the league chat.
      </p>
    </div>
  );
}
