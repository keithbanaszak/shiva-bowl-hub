"use client";

import { useState } from "react";
import Link from "next/link";
import { PosBadge } from "@/components/Pos";
import { posColor } from "@/lib/positions";

type Pos = "QB" | "RB" | "WR" | "TE";
export type CompareDatum = {
  positions: Record<Pos, { startedPpg: number; benchPpg: number; strength: number }>;
  picks: { capital: number };
};
const POS: Pos[] = ["QB", "RB", "WR", "TE"];

function Row({
  pos,
  a,
  b,
  color,
  isPicks = false,
}: {
  pos: string;
  a: { val: number; str?: number };
  b: { val: number; str?: number };
  color: string;
  isPicks?: boolean;
}) {
  const max = Math.max(a.val, b.val, 1) * 1.1;
  const w = (v: number) => `${Math.max(3, (v / max) * 100)}%`;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <div className="flex items-center justify-end gap-2">
        <span className="font-mono text-xs tabular-nums">
          {a.val.toFixed(isPicks ? 0 : 1)}
          {a.str != null && <span className="ml-1 text-[10px] text-[var(--muted)]">·{Math.round(a.str)}</span>}
        </span>
        <div className="h-3 rounded" style={{ width: w(a.val), backgroundColor: `${color}cc` }} />
      </div>
      <div className="w-14 text-center">
        {isPicks ? (
          <span className="rounded border border-cyan-400/40 bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-cyan-300">
            Picks
          </span>
        ) : (
          <PosBadge pos={pos} />
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 rounded" style={{ width: w(b.val), backgroundColor: `${color}cc` }} />
        <span className="font-mono text-xs tabular-nums">
          {b.str != null && <span className="mr-1 text-[10px] text-[var(--muted)]">{Math.round(b.str)}·</span>}
          {b.val.toFixed(isPicks ? 0 : 1)}
        </span>
      </div>
    </div>
  );
}

export function PosCompare({
  managers,
  data,
}: {
  managers: { userId: string; label: string }[];
  data: Record<string, CompareDatum>;
}) {
  const [a, setA] = useState(managers[0]?.userId ?? "");
  const [b, setB] = useState(managers[1]?.userId ?? "");
  const da = data[a];
  const db = data[b];

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
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <div className="mb-1 text-xs uppercase tracking-wider text-[var(--muted)]">Manager A</div>
          {select(a, setA)}
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center self-center rounded-full bg-white/10 text-xs font-bold">VS</div>
        <div className="flex-1">
          <div className="mb-1 text-xs uppercase tracking-wider text-[var(--muted)]">Manager B</div>
          {select(b, setB)}
        </div>
      </div>

      {da && db && a !== b ? (
        <>
          <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--muted)]">
            <div className="text-right">started PPG · str</div>
            <div className="w-14" />
            <div>str · started PPG</div>
          </div>
          <div className="space-y-2.5">
            {POS.map((p) => (
              <Row
                key={p}
                pos={p}
                color={posColor(p)}
                a={{ val: da.positions[p].startedPpg, str: da.positions[p].strength }}
                b={{ val: db.positions[p].startedPpg, str: db.positions[p].strength }}
              />
            ))}
            <Row pos="PICKS" isPicks color="#22d3ee" a={{ val: da.picks.capital }} b={{ val: db.picks.capital }} />
          </div>
          <Link href={`/compare/${a}/${b}`} className="mt-4 inline-block text-xs text-emerald-300 hover:underline">
            Full head-to-head →
          </Link>
        </>
      ) : (
        <div className="text-sm text-[var(--muted)]">Pick two different managers to compare.</div>
      )}
    </div>
  );
}
