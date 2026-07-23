"use client";

/**
 * Light/dark toggle.
 *
 * The rendered icon is chosen entirely by CSS (.theme-icon-light / .theme-icon-dark
 * in globals.css), not by React state. That means the button is already correct on
 * first paint — before hydration, and before this component's JS has even loaded —
 * so there is no flash and nothing to suppressHydrationWarning.
 *
 * On click we read the *effective* theme off the DOM rather than from state, so the
 * first click always flips what the user is actually looking at, whether that came
 * from their OS preference or a previous explicit choice.
 */

const STORAGE_KEY = "theme";

function effectiveTheme(): "light" | "dark" {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const toggle = () => {
    const next = effectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Safari private mode and friends — the toggle still works for this page view.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light or dark theme"
      title="Toggle theme"
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:bg-[var(--card-2)] hover:text-[var(--foreground)] ${className}`}
    >
      {/* sun — shown while the page is in light mode */}
      <svg
        className="theme-icon-light h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      {/* moon — shown while the page is in dark mode */}
      <svg
        className="theme-icon-dark h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  );
}
