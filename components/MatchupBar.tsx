import Link from "next/link";
import { Avatar } from "@/components/Manager";
import { label } from "@/lib/marts";

/**
 * A modern matchup row: each team's half is tinted (winner emerald, loser red),
 * showing the actual score big and the projected score small underneath.
 */
export function MatchupBar({
  aUserId,
  bUserId,
  aPoints,
  bPoints,
  aProj,
  bProj,
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
  winnerUserId?: string | null;
  href?: string;
  featured?: boolean;
}) {
  const aWon = winnerUserId === aUserId;
  const bWon = winnerUserId === bUserId;
  const av = featured ? 40 : 26;
  const scoreCls = featured ? "text-2xl" : "text-base";

  // left = blue family, right = red family; the winner's side is darker/saturated
  const leftTint = aWon
    ? "bg-gradient-to-r from-blue-600/45 via-blue-600/20 to-transparent"
    : "bg-gradient-to-r from-blue-700/15 to-transparent";
  const rightTint = bWon
    ? "bg-gradient-to-l from-red-700/45 via-red-700/20 to-transparent"
    : "bg-gradient-to-l from-red-800/15 to-transparent";

  const body = (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] transition group-hover:border-[var(--border-strong)]">
      {/* left team (blue) */}
      <div className={`flex flex-1 items-center gap-2 px-3 py-2.5 ${leftTint}`}>
        <Avatar userId={aUserId} size={av} />
        <span className={`min-w-0 flex-1 truncate ${aWon ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted)]"}`}>
          {label(aUserId)}
        </span>
        <span className="shrink-0 text-right font-mono leading-none">
          <span className={`${scoreCls} tabular-nums ${aWon ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}>{aPoints}</span>
          {aProj != null && <span className="mt-0.5 block text-[10px] text-[var(--muted)]">{aProj}</span>}
        </span>
      </div>
      <div className="w-px bg-[var(--inset)]" />
      {/* right team (red) */}
      <div className={`flex flex-1 items-center gap-2 px-3 py-2.5 ${rightTint}`}>
        <span className="shrink-0 text-left font-mono leading-none">
          <span className={`${scoreCls} tabular-nums ${bWon ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}>{bPoints}</span>
          {bProj != null && <span className="mt-0.5 block text-[10px] text-[var(--muted)]">{bProj}</span>}
        </span>
        <span className={`min-w-0 flex-1 truncate text-right ${bWon ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted)]"}`}>
          {label(bUserId)}
        </span>
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
