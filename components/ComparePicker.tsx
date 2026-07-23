"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ComparePicker({
  managers,
}: {
  managers: { userId: string; label: string }[];
}) {
  const router = useRouter();
  const [a, setA] = useState(managers[0]?.userId ?? "");
  const [b, setB] = useState(managers[1]?.userId ?? "");

  const select = (value: string, onChange: (v: string) => void) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-[var(--border)] bg-[#11131a] px-3 py-2 text-sm"
    >
      {managers.map((m) => (
        <option key={m.userId} value={m.userId}>
          {m.label}
        </option>
      ))}
    </select>
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <div className="mb-1 text-xs uppercase tracking-wider text-[var(--muted)]">Manager A</div>
        {select(a, setA)}
      </div>
      <div className="grid h-9 w-9 shrink-0 place-items-center self-center rounded-full bg-white/10 text-xs font-bold">
        VS
      </div>
      <div className="flex-1">
        <div className="mb-1 text-xs uppercase tracking-wider text-[var(--muted)]">Manager B</div>
        {select(b, setB)}
      </div>
      <button
        onClick={() => a && b && a !== b && router.push(`/compare/${a}/${b}`)}
        disabled={a === b}
        className="rounded-lg bg-emerald-400/20 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/30 disabled:opacity-40"
      >
        Compare
      </button>
    </div>
  );
}
