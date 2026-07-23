"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { leagueConfig } from "@/league.config";

type Item = { href: string; label: string; external?: boolean };
type Group = { label: string; items: Item[] };

const GROUPS: Group[] = [
  {
    label: "Matchups",
    items: [
      { href: "/schedule", label: "Schedule & GOTW" },
      { href: "/rivalries", label: "Rivalries" },
      { href: "/compare", label: "Compare Managers" },
    ],
  },
  {
    label: "Trades & Waivers",
    items: [
      { href: "/trades", label: "Trades" },
      { href: "/waivers", label: "Waiver Wire" },
    ],
  },
  {
    label: "League Info",
    items: [
      { href: "/managers", label: "Managers" },
      { href: "/teams", label: "Team Power" },
      { href: "/breakdown", label: "League Breakdown" },
      { href: "/records", label: "Records & Rankings" },
      { href: "/draft", label: "Draft Boards" },
      { href: "/players", label: "Players" },
      { href: "/luck", label: "Schedule Luck" },
      { href: "/awards", label: "Awards" },
      { href: "/wrapped", label: "Dynasty Wrapped" },
      { href: "/glossary", label: "Glossary" },
    ],
  },
];

const SLEEPER_URL = `https://sleeper.com/leagues/${leagueConfig.currentLeagueId}`;

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const groupActive = (g: Group) => g.items.some((i) => active(i.href));

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[#07090e]/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3">
        <Link href="/" onClick={() => setOpen(null)} className="mr-2 flex items-center gap-2 font-display font-bold tracking-tight">
          <span className="scanline grid h-7 w-7 place-items-center rounded-lg bg-emerald-400/15 text-[11px] font-bold text-emerald-300 glow-border">
            SB
          </span>
          <span className="hidden text-glow sm:inline">The Shiva Bowl</span>
        </Link>

        <div className="flex flex-1 flex-wrap items-center gap-0.5">
          <Link
            href="/"
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${
              pathname === "/" ? "bg-accent/15 text-accent" : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
            }`}
          >
            Home
          </Link>

          {GROUPS.map((g) => (
            <div key={g.label} className="relative">
              <button
                onClick={() => setOpen(open === g.label ? null : g.label)}
                className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${
                  groupActive(g) || open === g.label
                    ? "bg-accent/15 text-accent"
                    : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
                }`}
              >
                {g.label}
                <span className={`text-[10px] transition ${open === g.label ? "rotate-180" : ""}`}>▾</span>
              </button>
              {open === g.label && (
                <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-xl border border-[var(--border)] bg-[#0b0e15] p-1 shadow-xl glow-border">
                  {g.items.map((i) => (
                    <Link
                      key={i.href}
                      href={i.href}
                      onClick={() => setOpen(null)}
                      className={`block rounded-lg px-3 py-2 text-sm transition ${
                        active(i.href) ? "bg-emerald-400/15 text-emerald-200" : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {i.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          <a
            href={SLEEPER_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-auto whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] transition hover:bg-white/5 hover:text-white"
          >
            Sleeper ↗
          </a>
        </div>
      </nav>

      {/* click-away backdrop */}
      {open && <button aria-hidden tabIndex={-1} onClick={() => setOpen(null)} className="fixed inset-0 z-30 cursor-default" />}
    </header>
  );
}
