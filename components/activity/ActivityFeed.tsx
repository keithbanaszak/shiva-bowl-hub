"use client";

import { useMemo, useState } from "react";
import type { ActivityEvent, ActivityKind } from "@/lib/stats/types";

type Mgr = { userId: string; label: string };

const KINDS: Array<{ key: ActivityKind | "all"; label: string }> = [
  { key: "all", label: "Everything" },
  { key: "trade", label: "Trades" },
  { key: "waiver", label: "Waivers" },
  { key: "free_agent", label: "Free agents" },
  { key: "drop", label: "Drops" },
];

const PAGE = 50;

/**
 * Filters + progressive reveal over the prerendered rows. The rows themselves are
 * server-rendered (they resolve player and manager names from the marts), so this
 * only decides which of them are visible — no data is shipped twice.
 */
export function ActivityFeed({
  events,
  rows,
  managers,
  seasons,
}: {
  events: ActivityEvent[];
  rows: React.ReactNode[];
  managers: Mgr[];
  seasons: string[];
}) {
  const [kind, setKind] = useState<ActivityKind | "all">("all");
  const [season, setSeason] = useState("all");
  const [user, setUser] = useState("all");
  const [page, setPage] = useState(0);

  const visible = useMemo(() => {
    const idx: number[] = [];
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (kind !== "all" && e.kind !== kind) continue;
      if (season !== "all" && e.season !== season) continue;
      if (user !== "all" && !e.userIds.includes(user)) continue;
      idx.push(i);
    }
    return idx;
  }, [events, kind, season, user]);

  // clamp rather than reset, so narrowing a filter can't strand you on a dead page
  const pages = Math.max(1, Math.ceil(visible.length / PAGE));
  const current = Math.min(page, pages - 1);
  const shown = visible.slice(current * PAGE, current * PAGE + PAGE);

  const seg = (on: boolean) =>
    `rounded-md px-2.5 py-1.5 text-xs transition ${
      on
        ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
        : "text-[var(--muted)] hover:text-[var(--foreground)]"
    }`;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap rounded-lg border border-[var(--border)] p-0.5">
          {KINDS.map((k) => (
            <button
              key={k.key}
              onClick={() => {
                setKind(k.key);
                setPage(0);
              }}
              className={seg(kind === k.key)}
            >
              {k.label}
            </button>
          ))}
        </div>

        <select
          value={season}
          onChange={(e) => {
            setSeason(e.target.value);
            setPage(0);
          }}
          aria-label="Filter by season"
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        >
          <option value="all">All seasons</option>
          {seasons.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={user}
          onChange={(e) => {
            setUser(e.target.value);
            setPage(0);
          }}
          aria-label="Filter by manager"
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        >
          <option value="all">All managers</option>
          {managers.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.label}
            </option>
          ))}
        </select>

        <span className="ml-auto text-xs text-[var(--muted)]">
          {visible.length} move{visible.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-1">{shown.map((i) => rows[i])}</div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={() => setPage(Math.max(0, current - 1))}
            disabled={current === 0}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] transition enabled:hover:bg-[var(--card-2)] enabled:hover:text-[var(--foreground)] disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-center text-xs text-[var(--muted)]">
            Page {current + 1} of {pages}
            <span className="hidden sm:inline">
              {" "}
              · {current * PAGE + 1}–{current * PAGE + shown.length} of{" "}
              {visible.length}
            </span>
          </span>
          <button
            onClick={() => setPage(Math.min(pages - 1, current + 1))}
            disabled={current >= pages - 1}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] transition enabled:hover:bg-[var(--card-2)] enabled:hover:text-[var(--foreground)] disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
      {visible.length === 0 && (
        <div className="py-12 text-center text-sm text-[var(--muted)]">
          No moves match.
        </div>
      )}
    </div>
  );
}
