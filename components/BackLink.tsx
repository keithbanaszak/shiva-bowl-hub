"use client";

import { useRouter } from "next/navigation";

/**
 * A back control that returns the user to wherever they actually came from
 * (browser history) rather than a fixed parent page. The old links were static
 * — "← All players" on a player page always went to /players even if you'd
 * arrived from a manager page — which is not what "back" should do.
 *
 * `fallback` is where to go when there is no in-app history to pop (a direct
 * load, a shared link, or a new tab), so the button is never a dead end.
 */
export function BackLink({
  fallback,
  label = "Back",
}: {
  fallback: string;
  label?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        // history.length > 1 means there's somewhere to go back to in this tab.
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--accent)]"
    >
      <span aria-hidden>←</span> {label}
    </button>
  );
}
