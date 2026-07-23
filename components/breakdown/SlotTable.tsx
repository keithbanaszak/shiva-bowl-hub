"use client";

import { useMemo, useState } from "react";
import type { SlotScoringMart, SlotScoringRow } from "@/lib/stats/types";
import { posColor } from "@/lib/positions";

type Mgr = { userId: string; label: string };

/** FLEX/SUPER_FLEX have no Sleeper color of their own; give them the accent. */
const slotColor = (slot: string): string =>
  slot === "FLEX" || slot === "SUPER_FLEX" ? "var(--accent-2)" : posColor(slot);

const slotLabel = (slot: string): string =>
  slot === "SUPER_FLEX" ? "SFLEX" : slot;

export function SlotTable({
  mart,
  managers,
}: {
  mart: SlotScoringMart;
  managers: Mgr[];
}) {
  const [scope, setScope] = useState("all");
  const [metric, setMetric] = useState<
    "avgPerWeek" | "avgPerStart" | "totalPoints"
  >("avgPerWeek");
  const [sortSlot, setSortSlot] = useState<string | null>(null);

  const nameOf = useMemo(
    () => new Map(managers.map((m) => [m.userId, m.label])),
    [managers],
  );

  const { rows, best, worst } = useMemo(() => {
    const scoped = mart.rows.filter((r) => r.scope === scope);
    const byUser = new Map<string, Map<string, SlotScoringRow>>();
    for (const r of scoped) {
      const m = byUser.get(r.userId) ?? new Map();
      m.set(r.slot, r);
      byUser.set(r.userId, m);
    }
    // best/worst per slot drive the color scale
    const best = new Map<string, number>();
    const worst = new Map<string, number>();
    for (const s of mart.slots) {
      const vals = scoped.filter((r) => r.slot === s).map((r) => r[metric]);
      if (vals.length) {
        best.set(s, Math.max(...vals));
        worst.set(s, Math.min(...vals));
      }
    }
    const rows = [...byUser.entries()]
      .map(([userId, slots]) => ({ userId, slots }))
      .sort((a, b) => {
        if (sortSlot)
          return (
            (b.slots.get(sortSlot)?.[metric] ?? 0) -
            (a.slots.get(sortSlot)?.[metric] ?? 0)
          );
        return (nameOf.get(a.userId) ?? "").localeCompare(
          nameOf.get(b.userId) ?? "",
        );
      });
    return { rows, best, worst };
  }, [mart, scope, metric, sortSlot, nameOf]);

  /** 0 = league worst, 1 = league best, at that slot. */
  const heat = (slot: string, v: number): number => {
    const hi = best.get(slot) ?? 0;
    const lo = worst.get(slot) ?? 0;
    return hi === lo ? 0.5 : (v - lo) / (hi - lo);
  };

  const seg = (on: boolean) =>
    `rounded-md px-2.5 py-1.5 text-xs transition ${
      on
        ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
        : "text-[var(--muted)] hover:text-[var(--foreground)]"
    }`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap rounded-lg border border-[var(--border)] p-0.5">
          {mart.scopes.map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={seg(scope === s)}
            >
              {s === "all" ? "All-time" : s}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-[var(--border)] p-0.5">
          {(
            [
              [
                "avgPerWeek",
                "Per week",
                "Points this slot group added per team-week (RB covers two slots)",
              ],
              [
                "avgPerStart",
                "Per start",
                "Points per individual slot start — comparable across slots",
              ],
              ["totalPoints", "Total", "Total points from this slot"],
            ] as const
          ).map(([k, lab, title]) => (
            <button
              key={k}
              onClick={() => setMetric(k)}
              className={seg(metric === k)}
              title={title}
            >
              {lab}
            </button>
          ))}
        </div>
        {sortSlot && (
          <button
            onClick={() => setSortSlot(null)}
            className="text-xs text-[var(--muted)] hover:underline"
          >
            clear sort ({slotLabel(sortSlot)})
          </button>
        )}
      </div>

      <div className="scroll-thin overflow-x-auto rounded-2xl border border-[var(--border)]">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--muted)]">
              <th className="p-2.5 text-left">Manager</th>
              {mart.slots.map((s) => (
                <th key={s} className="p-2.5 text-right">
                  <button
                    onClick={() => setSortSlot(sortSlot === s ? null : s)}
                    className="hover:text-[var(--foreground)]"
                    style={{ color: sortSlot === s ? slotColor(s) : undefined }}
                    title={`Sort by ${slotLabel(s)}`}
                  >
                    {slotLabel(s)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ userId, slots }) => (
              <tr
                key={userId}
                className="border-b border-[var(--border)] last:border-0"
              >
                <td className="whitespace-nowrap p-2.5 font-medium">
                  {nameOf.get(userId) ?? userId}
                </td>
                {mart.slots.map((s) => {
                  const r = slots.get(s);
                  if (!r)
                    return (
                      <td
                        key={s}
                        className="p-2.5 text-right text-[var(--faint)]"
                      >
                        —
                      </td>
                    );
                  const h = heat(s, r[metric]);
                  return (
                    <td
                      key={s}
                      className="p-2.5 text-right font-mono tabular-nums"
                      title={`${slotLabel(s)} · rank ${r.rank} of ${rows.length} · ${r.starts} starts${
                        r.topPlayer ? ` · most points: ${r.topPlayer.name}` : ""
                      }`}
                      style={{
                        // tint toward the slot's color as the number approaches league best
                        backgroundColor:
                          h > 0.5
                            ? `color-mix(in oklab, ${slotColor(s)} ${(h - 0.5) * 40}%, transparent)`
                            : undefined,
                        color: r.rank === 1 ? slotColor(s) : undefined,
                        fontWeight: r.rank === 1 ? 600 : undefined,
                      }}
                    >
                      {r[metric]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Click a slot header to sort by it. Brighter = better at that slot. Hover
        a cell for rank, starts and the player who produced most there.
      </p>
    </div>
  );
}
