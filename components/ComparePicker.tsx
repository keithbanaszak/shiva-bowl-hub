"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Manager";

type M = { userId: string; label: string; handle?: string };

/** Two lines of identity: team name over @handle. */
function Identity({ m, size }: { m: M; size: number }) {
  return (
    <>
      <Avatar userId={m.userId} size={size} />
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-sm font-medium">{m.label}</span>
        {m.handle && m.handle !== m.label && (
          <span className="truncate text-[11px] text-[var(--muted)]">
            @{m.handle}
          </span>
        )}
      </span>
    </>
  );
}

/** Searchable single-select showing each manager's avatar, team, and @handle. */
function ManagerSelect({
  managers,
  value,
  onChange,
}: {
  managers: M[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const sel = managers.find((m) => m.userId === value) ?? null;
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n
      ? managers.filter(
          (m) =>
            m.label.toLowerCase().includes(n) ||
            (m.handle ?? "").toLowerCase().includes(n),
        )
      : managers;
  }, [managers, q]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-left transition hover:border-[var(--border-glow)]"
      >
        {sel ? (
          <Identity m={sel} size={26} />
        ) : (
          <span className="flex-1 text-sm text-[var(--muted)]">Pick a manager…</span>
        )}
        <span
          aria-hidden
          className={`shrink-0 text-[10px] text-[var(--muted)] transition ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      {open && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div className="scroll-thin absolute left-0 right-0 top-full z-40 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--overlay)] p-1.5 shadow-xl">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search team or @handle…"
              className="mb-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--border-glow)]"
            />
            {filtered.map((m) => (
              <button
                key={m.userId}
                onClick={() => {
                  onChange(m.userId);
                  setOpen(false);
                  setQ("");
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-[var(--card-2)] ${
                  m.userId === value ? "bg-[var(--accent-soft)]" : ""
                }`}
              >
                <Identity m={m} size={24} />
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-2 py-3 text-center text-xs text-[var(--muted)]">
                No match.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function ComparePicker({ managers }: { managers: M[] }) {
  const router = useRouter();
  const [a, setA] = useState(managers[0]?.userId ?? "");
  const [b, setB] = useState(managers[1]?.userId ?? "");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <div className="mb-1 text-xs uppercase tracking-wider text-[var(--muted)]">
          Manager A
        </div>
        <ManagerSelect managers={managers} value={a} onChange={setA} />
      </div>
      <div className="grid h-9 w-9 shrink-0 place-items-center self-center rounded-full bg-[var(--chip)] text-xs font-bold sm:mb-1">
        VS
      </div>
      <div className="flex-1">
        <div className="mb-1 text-xs uppercase tracking-wider text-[var(--muted)]">
          Manager B
        </div>
        <ManagerSelect managers={managers} value={b} onChange={setB} />
      </div>
      <button
        onClick={() => a && b && a !== b && router.push(`/compare/${a}/${b}`)}
        disabled={a === b}
        className="min-h-11 rounded-lg bg-[var(--accent-soft)] px-5 py-2 text-sm font-medium text-[var(--accent-strong)] transition hover:bg-[var(--accent)]/30 disabled:opacity-40"
      >
        Compare
      </button>
    </div>
  );
}
