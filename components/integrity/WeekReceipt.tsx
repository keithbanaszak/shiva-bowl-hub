import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Avatar } from "@/components/Manager";
import { label } from "@/lib/marts";
import { pname } from "@/lib/data/players-dict";
import type { IntegrityWeek, LineupSlotEntry } from "@/lib/stats/types";

const LEVEL: Record<string, { text: string; cls: string }> = {
  severe: { text: "Severe", cls: "bg-[var(--bad-soft)] text-[var(--bad)] ring-[var(--bad-border)]" },
  notable: { text: "Notable", cls: "bg-[var(--gold-soft)] text-[var(--gold)] ring-[var(--gold-border)]" },
  minor: { text: "Minor", cls: "bg-[var(--chip)] text-[var(--muted)] ring-[var(--border)]" },
};

const REASON: Record<string, string> = {
  "lineup-choice": "Benched better options",
  abandoned: "Roster looks abandoned",
  "empty-slot": "Left a slot empty",
};

function SlotRow({ e, dim = false }: { e: LineupSlotEntry; dim?: boolean }) {
  return (
    <li className={`flex items-center gap-2 py-0.5 text-xs ${dim ? "opacity-70" : ""}`}>
      <span className="w-[74px] shrink-0 font-mono text-[10px] uppercase text-[var(--faint)]">{e.slot}</span>
      {e.playerId ? (
        <>
          <PlayerAvatar playerId={e.playerId} size={18} />
          <span className="min-w-0 flex-1 truncate">{pname(e.playerId)}</span>
          {!e.hasProjection && (
            <span
              title="Sleeper had no projection — he wasn't playing (bye, inactive or IR)"
              className="shrink-0 rounded bg-[var(--bad-soft)] px-1 text-[9px] uppercase text-[var(--bad)]"
            >
              out
            </span>
          )}
          <span className="w-11 shrink-0 text-right font-mono tabular-nums text-[var(--muted)]">{e.proj}</span>
        </>
      ) : (
        <span className="min-w-0 flex-1 truncate text-[var(--bad)]">— empty slot —</span>
      )}
    </li>
  );
}

export function WeekReceipt({ w }: { w: IntegrityWeek }) {
  const lv = LEVEL[w.level] ?? LEVEL.minor;

  return (
    <details className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] open:bg-[var(--panel)]">
      <summary className="flex cursor-pointer flex-wrap items-center gap-2 p-4 [&::-webkit-details-marker]:hidden">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ring-inset ${lv.cls}`}>
          {lv.text}
        </span>
        <Avatar userId={w.userId} size={22} />
        <span className="font-medium">{label(w.userId)}</span>
        <span className="text-xs text-[var(--muted)]">
          {w.season} · Wk {w.week}
          {w.recordBefore && ` · ${w.recordBefore.w}-${w.recordBefore.l} at the time`}
        </span>
        <span className="ml-auto flex items-center gap-3">
          <span className="text-right">
            <span className="block font-mono text-sm font-semibold text-[var(--bad)]">−{w.gapPts}</span>
            <span className="block text-[10px] text-[var(--muted)]">{w.gapPct}% below best</span>
          </span>
          <span aria-hidden className="text-[var(--faint)] transition group-open:rotate-180">
            ▾
          </span>
        </span>
      </summary>

      <div className="border-t border-[var(--border)] p-4 pt-3">
        <div className="mb-3 text-xs text-[var(--muted)]">
          {REASON[w.reason]} · projected {w.startedProj} with the lineup started vs {w.bestProj} with the best legal
          lineup available · actually scored {w.actualPoints}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--bad)]">
              What they started
            </div>
            <ul className="rounded-xl border border-[var(--border)] p-2">
              {w.started.map((e, i) => (
                <SlotRow key={i} e={e} />
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              Best lineup available
            </div>
            <ul className="rounded-xl border border-[var(--border)] p-2">
              {w.bestLineup.map((e, i) => (
                <SlotRow key={i} e={e} dim />
              ))}
            </ul>
          </div>
        </div>

        {w.benched.length > 0 && (
          <div className="mt-3">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Sat on the bench
            </div>
            <div className="flex flex-wrap gap-2">
              {w.benched.map((b) => (
                <span
                  key={b.playerId}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--chip)] py-1 pl-1 pr-2.5 text-xs"
                >
                  <PlayerAvatar playerId={b.playerId} size={18} />
                  <span>{pname(b.playerId)}</span>
                  <span className="font-mono text-[10px] text-[var(--muted)]">
                    {b.proj} proj → {b.actual}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
