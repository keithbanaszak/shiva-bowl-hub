import Link from "next/link";
import { Avatar } from "@/components/Manager";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { FitText } from "@/components/FitText";
import { label, getManager } from "@/lib/marts";
import { pname } from "@/lib/data/players-dict";

/**
 * Server-rendered cell bodies for DataTable.
 *
 * DataTable is a client component, so its cells cannot call server-only helpers.
 * Pages build rows containing these nodes on the SERVER and pass them down —
 * which also keeps data/players.json (128KB) out of the client bundle.
 */

/** Manager avatar + name, always on one line, name shrinks rather than wrapping. */
export function ManagerCell({
  userId,
  size = 20,
  href = true,
}: {
  userId: string | null | undefined;
  size?: number;
  href?: boolean;
}) {
  if (!userId) return <span className="text-[var(--faint)]">—</span>;
  const former = getManager(userId)?.active === false;
  const inner = (
    <span className="flex min-w-0 items-center gap-1.5">
      <Avatar userId={userId} size={size} />
      <FitText>{label(userId)}</FitText>
      {former && (
        <span
          aria-hidden
          title="No longer in the league"
          className="shrink-0 text-[10px] leading-none text-[var(--faint)]"
        >
          ✦
        </span>
      )}
    </span>
  );
  return href ? (
    <Link href={`/managers/${userId}`} className="block min-w-0 hover:text-[var(--accent)]">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/** Player headshot + name on one line. */
export function PlayerCell({
  playerId,
  size = 20,
  href = true,
  sub,
}: {
  playerId: string;
  size?: number;
  href?: boolean;
  sub?: string | null;
}) {
  const inner = (
    <span className="flex min-w-0 items-center gap-1.5">
      <PlayerAvatar playerId={playerId} size={size} />
      <span className="min-w-0">
        <FitText>{pname(playerId)}</FitText>
        {sub && <span className="block truncate text-[10px] text-[var(--muted)]">{sub}</span>}
      </span>
    </span>
  );
  return href ? (
    <Link href={`/players/${playerId}`} className="block min-w-0 hover:text-[var(--accent)]">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/**
 * Season + week, always one line, always the same shape. Previously these wrapped
 * to two lines only when the opponent name happened to be long, so the column
 * looked ragged down the page.
 */
export function WhenCell({ season, week, isPlayoff }: { season: string; week: number; isPlayoff?: boolean }) {
  return (
    <span className="whitespace-nowrap font-mono text-xs tabular-nums text-[var(--muted)]">
      {season} <span className="text-[var(--faint)]">·</span> wk{week}
      {isPlayoff && <span className="ml-1 text-[var(--gold)]">★</span>}
    </span>
  );
}

/** Sort key that orders (season, week) chronologically. */
export const whenOrder = (season: string, week: number): number => Number(season) * 100 + week;
