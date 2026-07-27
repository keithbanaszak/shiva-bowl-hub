import Link from "next/link";
import { Avatar } from "@/components/Manager";
import { FitText } from "@/components/FitText";
import { label } from "@/lib/marts";

/** 3+ in a row is a streak worth flagging; below that it's noise. */
function StreakIcon({ streak }: { streak: number }) {
  if (streak >= 3)
    return (
      <span
        aria-label={`${streak}-game win streak`}
        title={`Won ${streak} straight coming in`}
        className="shrink-0 text-[11px] leading-none"
      >
        🔥
      </span>
    );
  if (streak <= -3)
    return (
      <span
        aria-label={`${Math.abs(streak)}-game losing streak`}
        title={`Lost ${Math.abs(streak)} straight coming in`}
        className="shrink-0 text-[11px] leading-none"
      >
        🧊
      </span>
    );
  return null;
}

/**
 * A matchup row.
 *
 * Laid out as a 3-column grid — team | scores | team — rather than two flexed
 * halves. With two halves the score sat at each half's INNER edge, so two names
 * of different lengths pushed the scores out of alignment and squeezed the
 * right-hand avatar off the end. A centre track that sizes to the scores keeps
 * them dead centre and gives both names exactly the same width, whatever they
 * are called.
 */
export function MatchupBar({
  aUserId,
  bUserId,
  aPoints,
  bPoints,
  aProj,
  bProj,
  aStreak = 0,
  bStreak = 0,
  winnerUserId,
  href,
  featured = false,
}: {
  aUserId: string;
  bUserId: string;
  aPoints: number;
  bPoints: number;
  aProj?: number | null;
  bProj?: number | null;
  /** Signed run carried into the game (+3 = won three straight). */
  aStreak?: number;
  bStreak?: number;
  winnerUserId?: string | null;
  href?: string;
  featured?: boolean;
}) {
  const aWon = winnerUserId === aUserId;
  const bWon = winnerUserId === bUserId;
  const av = featured ? 36 : 24;
  const scoreCls = featured ? "text-xl sm:text-2xl" : "text-base";

  // left = blue family, right = red family; the winner's side is more saturated
  const leftTint = aWon
    ? "bg-gradient-to-r from-blue-600/45 via-blue-600/20 to-transparent"
    : "bg-gradient-to-r from-blue-700/15 to-transparent";
  const rightTint = bWon
    ? "bg-gradient-to-l from-red-700/45 via-red-700/20 to-transparent"
    : "bg-gradient-to-l from-red-800/15 to-transparent";

  const nameCls = (won: boolean) =>
    won ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted)]";

  const body = (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] transition group-hover:border-[var(--border-strong)]">
      {/* left team */}
      <div
        className={`flex min-w-0 items-center gap-2 py-2.5 pl-3 pr-2 ${leftTint}`}
      >
        <Avatar userId={aUserId} size={av} />
        <StreakIcon streak={aStreak} />
        <span className={`min-w-0 flex-1 ${nameCls(aWon)}`}>
          <FitText>{label(aUserId)}</FitText>
        </span>
      </div>

      {/* scores — the centre track, so they never drift */}
      <div className="flex shrink-0 items-center justify-center gap-2 px-2 font-mono leading-none">
        <span className="text-right">
          <span
            className={`${scoreCls} tabular-nums ${aWon ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}
          >
            {aPoints}
          </span>
          {aProj != null && (
            <span className="mt-0.5 block text-[10px] text-[var(--faint)]">
              {aProj}
            </span>
          )}
        </span>
        <span aria-hidden className="text-xs text-[var(--faint)]">
          –
        </span>
        <span className="text-left">
          <span
            className={`${scoreCls} tabular-nums ${bWon ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}
          >
            {bPoints}
          </span>
          {bProj != null && (
            <span className="mt-0.5 block text-[10px] text-[var(--faint)]">
              {bProj}
            </span>
          )}
        </span>
      </div>

      {/* right team */}
      <div
        className={`flex min-w-0 items-center justify-end gap-2 py-2.5 pl-2 pr-3 ${rightTint}`}
      >
        <span className={`min-w-0 flex-1 text-right ${nameCls(bWon)}`}>
          <FitText>{label(bUserId)}</FitText>
        </span>
        <StreakIcon streak={bStreak} />
        <Avatar userId={bUserId} size={av} />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block">
        {body}
      </Link>
    );
  }
  return <div className="group">{body}</div>;
}
