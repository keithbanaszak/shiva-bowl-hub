"use client";

import { useState, type ReactNode } from "react";

export function BoardCarousel({
  labels,
  children,
  defaultIndex = 0,
}: {
  labels: string[];
  children: ReactNode[];
  defaultIndex?: number;
}) {
  const nodes = Array.isArray(children) ? children : [children];
  const [i, setI] = useState(Math.min(Math.max(defaultIndex, 0), nodes.length - 1));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        {labels.map((l, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              idx === i ? "bg-emerald-400/20 text-emerald-200" : "border border-[var(--border)] text-[var(--muted)] hover:bg-white/5 hover:text-white"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      {nodes[i]}
    </div>
  );
}
