import { Avatar } from "@/components/Manager";
import { FitText } from "@/components/FitText";
import { label } from "@/lib/marts";
import type { PlayoffGame, SeasonPlayoffs } from "@/lib/stats/types";

/**
 * Winners-bracket ladder for one season.
 *
 * Rounds become columns, so the path to the title reads left to right. Only the
 * championship side is drawn — the consolation bracket decides nothing and would
 * double the width for no payoff. Placement games (3rd, 5th) are labelled where
 * Sleeper marks them.
 */

const PLACEMENT_LABEL: Record<number, string> = {
  1: "Championship",
  3: "3rd place",
  5: "5th place",
  7: "7th place",
};

function Side({
  userId,
  points,
  won,
  seed,
}: {
  userId: string | null;
  points: number | null;
  won: boolean;
  seed?: number;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 ${won ? "" : "opacity-55"}`}
    >
      {seed != null && (
        <span className="w-3.5 shrink-0 text-center font-mono text-[9px] text-[var(--faint)]">
          {seed}
        </span>
      )}
      <Avatar userId={userId} size={18} />
      <span className="min-w-0 flex-1 text-[11px]">
        <FitText fits={15}>{label(userId)}</FitText>
      </span>
      <span
        className={`shrink-0 font-mono text-[11px] tabular-nums ${won ? "font-semibold text-[var(--accent)]" : "text-[var(--muted)]"}`}
      >
        {points ?? "—"}
      </span>
    </div>
  );
}

function Game({ g, seeds }: { g: PlayoffGame; seeds: Record<string, number> }) {
  const homeWon = g.winnerUserId != null && g.winnerUserId === g.homeUserId;
  const awayWon = g.winnerUserId != null && g.winnerUserId === g.awayUserId;
  const title = g.placement ? PLACEMENT_LABEL[g.placement] : null;

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-[var(--card)] ${
        g.placement === 1
          ? "border-[var(--gold-border)]"
          : "border-[var(--border)]"
      }`}
    >
      {title && (
        <div
          className={`px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
            g.placement === 1
              ? "bg-[var(--gold-soft)] text-[var(--gold)]"
              : "bg-[var(--chip)] text-[var(--muted)]"
          }`}
        >
          {title}
        </div>
      )}
      <Side
        userId={g.homeUserId}
        points={g.homePoints}
        won={homeWon}
        seed={g.homeUserId ? seeds[g.homeUserId] : undefined}
      />
      <div className="border-t border-[var(--border)]" />
      <Side
        userId={g.awayUserId}
        points={g.awayPoints}
        won={awayWon}
        seed={g.awayUserId ? seeds[g.awayUserId] : undefined}
      />
    </div>
  );
}

export function PlayoffBracket({ po }: { po: SeasonPlayoffs }) {
  const games = po.games.filter((g) => g.bracket === "winners");
  if (games.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-[var(--muted)]">
        No bracket recorded for {po.season}.
      </div>
    );
  }

  const rounds = [...new Set(games.map((g) => g.round))].sort((a, b) => a - b);

  return (
    <div
      className="grid gap-3"
      style={{
        gridTemplateColumns: `repeat(${rounds.length}, minmax(0, 1fr))`,
      }}
    >
      {rounds.map((r) => {
        const inRound = games.filter((g) => g.round === r);
        const week = inRound[0]?.week;
        return (
          <div key={r} className="min-w-0">
            <div className="mb-1.5 text-center text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Round {r}
              {week != null && (
                <span className="text-[var(--faint)]"> · wk{week}</span>
              )}
            </div>
            {/* centred so later rounds line up against the pair that fed them */}
            <div className="flex h-[calc(100%-1.5rem)] flex-col justify-around gap-2">
              {inRound.map((g, i) => (
                <Game key={`${r}:${i}`} g={g} seeds={po.seeds} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
