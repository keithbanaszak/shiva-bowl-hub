"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { leagueConfig } from "@/league.config";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CommandPalette, usePaletteHotkey } from "@/components/CommandPalette";

type Item = { href: string; label: string; desc?: string };
type Group = { label: string; items: Item[] };

/**
 * Five top-level destinations. The old nav had three groups where "League Info"
 * alone held ten links, and no mobile treatment at all — items simply wrapped.
 */
const GROUPS: Group[] = [
  {
    label: "Activity",
    items: [
      {
        href: "/activity",
        label: "League Activity",
        desc: "Every move, newest first",
      },
      { href: "/trades", label: "Trade Receipts", desc: "Every trade, graded" },
      { href: "/waivers", label: "Waiver Wire", desc: "Adds, drops and FAAB" },
    ],
  },
  {
    label: "Managers",
    items: [
      { href: "/managers", label: "All Managers", desc: "Career table" },
      { href: "/compare", label: "Compare", desc: "Head to head" },
      { href: "/rivalries", label: "Rivalries", desc: "Ranked by heat" },
    ],
  },
  {
    label: "Seasons",
    items: [
      { href: "/schedule", label: "Schedule & GOTW", desc: "Week by week" },
      { href: "/awards", label: "Awards", desc: "Season superlatives" },
      { href: "/wrapped", label: "Dynasty Wrapped", desc: "Per-manager recap" },
      {
        href: "/luck",
        label: "Schedule Luck",
        desc: "All-play and Fraud Detector",
      },
    ],
  },
  {
    label: "Stats",
    items: [
      {
        href: "/records",
        label: "Record Book",
        desc: "Top weeks and blowouts",
      },
      {
        href: "/breakdown",
        label: "League Breakdown",
        desc: "By position and lineup slot",
      },
      { href: "/teams", label: "Team Power", desc: "Contender vs rebuilder" },
      { href: "/draft", label: "Draft Room", desc: "Rookie boards" },
      { href: "/players", label: "Players", desc: "Every player's legacy" },
      { href: "/integrity", label: "Lineup Integrity", desc: "Tank watch" },
      { href: "/glossary", label: "Glossary", desc: "What every stat means" },
    ],
  },
];

const SLEEPER_URL = `https://sleeper.com/leagues/${leagueConfig.currentLeagueId}`;

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const { open: paletteOpen, setOpen: setPaletteOpen } = usePaletteHotkey();
  const navRef = useRef<HTMLElement>(null);

  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const groupActive = (g: Group) => g.items.some((i) => active(i.href));

  // close menus on navigation
  useEffect(() => {
    setOpen(null);
    setDrawer(false);
  }, [pathname]);

  // close the dropdown on Escape or a click outside the header
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node))
        setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawer]);

  const linkCls = (isActive: boolean) =>
    `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${
      isActive
        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
        : "text-[var(--muted)] hover:bg-[var(--card-2)] hover:text-[var(--foreground)]"
    }`;

  return (
    <>
      <header
        ref={navRef}
        className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur"
      >
        <nav className="mx-auto flex w-full max-w-[110rem] items-center gap-1 px-4 py-3">
          <Link
            href="/"
            className="mr-1 flex items-center gap-2 font-display font-bold tracking-tight"
          >
            <span className="scanline grid h-7 w-7 place-items-center rounded-lg bg-[var(--accent-soft)] text-[11px] font-bold text-[var(--accent)] glow-border">
              SB
            </span>
            <span className="hidden text-glow sm:inline">The Shiva Bowl</span>
          </Link>

          {/* ---- desktop ---- */}
          <div className="ml-1 hidden flex-1 items-center gap-0.5 md:flex">
            <Link href="/" className={linkCls(pathname === "/")}>
              Home
            </Link>

            {GROUPS.map((g) => (
              <div key={g.label} className="relative">
                <button
                  onClick={() => setOpen(open === g.label ? null : g.label)}
                  aria-expanded={open === g.label}
                  aria-haspopup="true"
                  className={`flex items-center gap-1 ${linkCls(groupActive(g) || open === g.label)}`}
                >
                  {g.label}
                  <span
                    aria-hidden
                    className={`text-[10px] transition ${open === g.label ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
                </button>
                {open === g.label && (
                  <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-[var(--border)] bg-[var(--overlay)] p-1.5 shadow-xl glow-border">
                    {g.items.map((i) => (
                      <Link
                        key={i.href}
                        href={i.href}
                        className={`block rounded-lg px-3 py-2 transition ${
                          active(i.href)
                            ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                            : "hover:bg-[var(--card-2)]"
                        }`}
                      >
                        <span className="block text-sm">{i.label}</span>
                        {i.desc && (
                          <span className="block text-[11px] text-[var(--muted)]">
                            {i.desc}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ---- right rail ---- */}
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="Search the league"
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--muted)] transition hover:bg-[var(--card-2)] hover:text-[var(--foreground)]"
            >
              <span aria-hidden>⌕</span>
              <span className="hidden lg:inline">Search</span>
              <kbd className="hidden rounded border border-[var(--border)] px-1 py-0.5 text-[10px] lg:block">
                ⌘K
              </kbd>
            </button>

            <ThemeToggle />

            <a
              href={SLEEPER_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm text-[var(--muted)] transition hover:bg-[var(--card-2)] hover:text-[var(--foreground)] sm:block"
            >
              Sleeper ↗
            </a>

            {/* ---- mobile trigger ---- */}
            <button
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              aria-expanded={drawer}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:bg-[var(--card-2)] hover:text-[var(--foreground)] md:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* ---- mobile drawer ---- */}
      {drawer && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDrawer(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="scroll-thin ml-auto flex h-full w-[86%] max-w-sm flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--overlay)]"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-[var(--overlay)] px-4 py-3">
              <span className="font-display text-sm font-semibold">Menu</span>
              <button
                onClick={() => setDrawer(false)}
                aria-label="Close menu"
                className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)]"
              >
                ✕
              </button>
            </div>

            <div className="p-3">
              <Link
                href="/"
                className={`mb-2 block rounded-lg px-3 py-2 text-sm ${
                  pathname === "/"
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "hover:bg-[var(--card-2)]"
                }`}
              >
                Home
              </Link>

              {GROUPS.map((g) => (
                <div key={g.label} className="mb-3">
                  <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-[var(--faint)]">
                    {g.label}
                  </div>
                  {g.items.map((i) => (
                    <Link
                      key={i.href}
                      href={i.href}
                      className={`block rounded-lg px-3 py-2 transition ${
                        active(i.href)
                          ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                          : "hover:bg-[var(--card-2)]"
                      }`}
                    >
                      <span className="block text-sm">{i.label}</span>
                      {i.desc && (
                        <span className="block text-[11px] text-[var(--muted)]">
                          {i.desc}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ))}

              <a
                href={SLEEPER_URL}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--card-2)]"
              >
                Open in Sleeper ↗
              </a>
            </div>
          </div>
        </div>
      )}

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </>
  );
}
