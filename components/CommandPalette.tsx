"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchDoc, SearchIndex } from "@/lib/stats/types";
import { posColor } from "@/lib/positions";

/**
 * ⌘K / Ctrl-K palette over every page, manager and player.
 *
 * The index is a static asset fetched on first open, so none of its ~70KB is in
 * the RSC payload of the ~600 prerendered pages.
 */

const KIND_ORDER: Record<SearchDoc["kind"], number> = {
  page: 0,
  manager: 1,
  player: 2,
};
const KIND_LABEL: Record<SearchDoc["kind"], string> = {
  page: "Pages",
  manager: "Managers",
  player: "Players",
};
const MAX_RESULTS = 24;

/** Higher is better; -1 means no match. */
function rank(doc: SearchDoc, q: string): number {
  const label = doc.label.toLowerCase();
  const sub = doc.sub.toLowerCase();
  if (label === q) return 1000;
  if (label.startsWith(q)) return 800;
  // start of any word in the label — "allen" should find "Josh Allen"
  if (label.includes(` ${q}`)) return 600;
  if (label.includes(q)) return 400;
  if (sub.includes(q)) return 200;
  return -1;
}

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // fetch once, on first open
  useEffect(() => {
    if (!open || docs) return;
    let cancelled = false;
    fetch("/search-index.json")
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(String(r.status))),
      )
      .then((data: SearchIndex) => {
        if (!cancelled) setDocs(data.docs);
      })
      .catch(() => {
        if (!cancelled) setDocs([]); // fail quiet — palette just shows "no results"
      });
    return () => {
      cancelled = true;
    };
  }, [open, docs]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!docs) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) {
      return docs.filter((d) => d.kind === "page").slice(0, MAX_RESULTS);
    }
    return docs
      .map((d) => ({ d, r: rank(d, needle) }))
      .filter((x) => x.r >= 0)
      .sort(
        (a, b) =>
          b.r - a.r ||
          KIND_ORDER[a.d.kind] - KIND_ORDER[b.d.kind] ||
          (b.d.score ?? 0) - (a.d.score ?? 0) ||
          a.d.label.localeCompare(b.d.label),
      )
      .slice(0, MAX_RESULTS)
      .map((x) => x.d);
  }, [docs, q]);

  const go = useCallback(
    (doc: SearchDoc | undefined) => {
      if (!doc) return;
      onClose();
      router.push(doc.href);
    },
    [onClose, router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // keep the highlighted row in view while arrowing
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  let lastKind: string | null = null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Search the league"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--overlay)] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4">
          <span aria-hidden className="text-[var(--muted)]">
            ⌕
          </span>
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search managers, players, pages…"
            aria-label="Search"
            className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-[var(--faint)]"
          />
          <kbd className="hidden shrink-0 rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted)] sm:block">
            esc
          </kbd>
        </div>

        <div
          ref={listRef}
          className="scroll-thin max-h-[52vh] overflow-y-auto p-1.5"
        >
          {docs === null && (
            <div className="px-3 py-6 text-center text-sm text-[var(--muted)]">
              Loading…
            </div>
          )}
          {docs !== null && results.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-[var(--muted)]">
              No matches.
            </div>
          )}
          {results.map((d, i) => {
            const header =
              d.kind !== lastKind
                ? ((lastKind = d.kind), KIND_LABEL[d.kind])
                : null;
            return (
              <div key={`${d.kind}:${d.id}`}>
                {header && (
                  <div className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-wider text-[var(--faint)]">
                    {header}
                  </div>
                )}
                <button
                  data-active={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(d)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition ${
                    i === active
                      ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                      : "hover:bg-[var(--card-2)]"
                  }`}
                >
                  {d.kind === "player" && d.pos ? (
                    <span
                      aria-hidden
                      style={{
                        backgroundColor: `${posColor(d.pos)}22`,
                        color: posColor(d.pos),
                      }}
                      className="grid h-6 w-8 shrink-0 place-items-center rounded text-[9px] font-bold"
                    >
                      {d.pos}
                    </span>
                  ) : (
                    <span
                      aria-hidden
                      className="grid h-6 w-8 shrink-0 place-items-center text-xs text-[var(--muted)]"
                    >
                      {d.kind === "manager" ? "◆" : "→"}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{d.label}</span>
                    <span className="block truncate text-[11px] text-[var(--muted)]">
                      {d.sub}
                    </span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--border)] px-4 py-2 text-[10px] text-[var(--faint)]">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span className="ml-auto">
            {results.length} result{results.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Registers the global ⌘K / Ctrl-K shortcut. Returns the open state + setters. */
export function usePaletteHotkey() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      // Escape is handled globally, not just on the input: if focus ever lands
      // outside the field the palette must still be dismissable.
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // lock body scroll while the palette owns the screen
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return { open, setOpen };
}
