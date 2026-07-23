"use client";

import { useState, type ReactNode } from "react";

export function WeekCarousel({
  labels,
  children,
  defaultIndex,
}: {
  labels: string[];
  children: ReactNode[];
  defaultIndex?: number;
}) {
  const nodes = Array.isArray(children) ? children : [children];
  const start = Math.min(
    Math.max(defaultIndex ?? nodes.length - 1, 0),
    nodes.length - 1,
  );
  const [i, setI] = useState(start);

  return (
    <div>
      <div className="mb-4 flex items-center justify-center gap-4">
        <button
          onClick={() => setI((x) => Math.max(0, x - 1))}
          disabled={i === 0}
          className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] text-lg transition hover:bg-[var(--chip)] disabled:opacity-30"
          aria-label="Previous week"
        >
          ‹
        </button>
        <div className="min-w-40 text-center text-xl font-semibold tracking-tight">
          {labels[i]}
        </div>
        <button
          onClick={() => setI((x) => Math.min(nodes.length - 1, x + 1))}
          disabled={i === nodes.length - 1}
          className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] text-lg transition hover:bg-[var(--chip)] disabled:opacity-30"
          aria-label="Next week"
        >
          ›
        </button>
      </div>
      {nodes[i]}
    </div>
  );
}
