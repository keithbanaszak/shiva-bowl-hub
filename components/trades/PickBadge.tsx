/**
 * Draft picks used to render as bare text ("2026 R1"), which read as just another
 * player row. This gives them an unmistakable icon: a rounded SQUARE (players are
 * circles) stamped with the round, tinted by round so a 1st reads hotter than a 4th.
 */

const ROUND_COLOR: Record<number, string> = {
  1: "#fbbf24", // gold
  2: "#a3a3a3", // silver
  3: "#b45309", // bronze
  4: "#6b7280",
};

export const roundColor = (round: number): string =>
  ROUND_COLOR[round] ?? "#6b7280";

export function PickBadge({
  round,
  size = 30,
}: {
  round: number;
  size?: number;
}) {
  const c = roundColor(round);
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        color: c,
        backgroundColor: `${c}1f`,
        borderColor: `${c}66`,
      }}
      className="grid shrink-0 place-items-center rounded-md border-2 font-mono text-[11px] font-bold leading-none"
      title={`Round ${round} pick`}
    >
      R{round}
    </span>
  );
}
