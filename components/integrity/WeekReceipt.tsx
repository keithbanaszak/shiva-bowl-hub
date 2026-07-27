import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Avatar } from "@/components/Manager";
import { label } from "@/lib/marts";
import { pname } from "@/lib/data/players-dict";
import type { IntegrityWeek, LineupSlotEntry } from "@/lib/stats/types";

const LEVEL: Record<string, { text: string; cls: string }> = {
  severe: {
    text: "Severe",
    cls: "bg-[var(--bad-soft)] text-[var(--bad)] ring-[var(--bad-border)]",
  },
  notable: {
    text: "Notable",
    cls: "bg-[var(--gold-soft)] text-[var(--gold)] ring-[var(--gold-border)]",
  },
  minor: {
    text: "Minor",
    cls: "bg-[var(--chip)] text-[var(--muted)] ring-[var(--border)]",
  },
};

const REASON: Record<string, string> = {
  "lineup-choice": "Benched better options",
  abandoned: "Roster looks abandoned",
  "empty-slot": "Left a slot empty",
};

function SlotRow({ e, dim = false }: { e: LineupSlotEntry; dim?: boolean }) {
  return (
    <li
      className={`flex items-center gap-2 py-0.5 text-xs ${dim ? "opacity-70" : ""}`}
    >
      <span className="w-[74px] shrink-0 font-mono text-[10px] uppercase text-[var(--faint)]">
        {e.slot}
      </span>
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
          <span className="w-11 shrink-0 text-right font-mono tabular-nums text-[var(--muted)]">
            {e.proj}
          </span>
        </>
      ) : (
        <span className="min-w-0 flex-1 truncate text-[var(--bad)]">
          — empty slot —
        </span>
      )}
    </li>
  );
}

/**
 * The honest counterfactual: what would have happened if the manager had simply
 * started the best lineup the projections pointed to. We compare that lineup's
 * ACTUAL points to the opponent's actual points — not to a hindsight-perfect
 * lineup — so the verdict answers "would playing the obvious lineup have won?".
 */
function hindsightVerdict(w: IntegrityWeek): { text: string; tone: string } | null {
  if (w.opponentPoints == null) return null;
  const best = w.bestActualPoints;
  const opp = w.opponentPoints;
  if (w.flipsResult)
    return {
      text: `Starting the best projected lineup flips this ${
        w.result === "T" ? "tie" : "loss"
      } into a win — it scores ${best} to the opponent's ${opp}.`,
      tone: "text-[var(--gold)]",
    };
  if (w.result === "W" && best <= opp)
    return {
      text: `They won it, but the by-the-projections lineup would actually have lost (${best} vs ${opp}) — the lineup they started overperformed.`,
      tone: "text-[var(--muted)]",
    };
  if (w.result === "W")
    return {
      text: `Won anyway — the best projected lineup (${best}) also clears the opponent's ${opp}.`,
      tone: "text-[var(--muted)]",
    };
  return {
    text: `Even the best projected lineup (${best}) falls short of the opponent's ${opp} — this one wasn't lost on the lineup card.`,
    tone: "text-[var(--muted)]",
  };
}

export function WeekReceipt({ w }: { w: IntegrityWeek }) {
  const lv = LEVEL[w.level] ?? LEVEL.minor;
  const verdict = hindsightVerdict(w);

  return (
    <details className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] open:bg-[var(--panel)]">
      <summary className="flex cursor-pointer flex-wrap items-center gap-2 p-4 [&::-webkit-details-marker]:hidden">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ring-inset ${lv.cls}`}
        >
          {lv.text}
        </span>
        <Avatar userId={w.userId} size={22} />
        <span className="font-medium">{label(w.userId)}</span>
        <span className="text-xs text-[var(--muted)]">
          {w.season} · Wk {w.week}
          {w.recordBefore &&
            ` · ${w.recordBefore.w}-${w.recordBefore.l} at the time`}
        </span>
        {w.flipsResult && (
          <span
            className="rounded-full bg-[var(--gold-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--gold)] ring-1 ring-inset ring-[var(--gold-border)]"
            title="The best lineup available by projection would actually have won this week"
          >
            🔁 cost them the win
          </span>
        )}
        <span className="ml-auto flex items-center gap-3">
          <span className="text-right">
            <span className="block font-mono text-sm font-semibold text-[var(--bad)]">
              −{w.gapPts}
            </span>
            <span className="block text-[10px] text-[var(--muted)]">
              {w.gapPct}% below best
            </span>
          </span>
          <span
            aria-hidden
            className="text-[var(--faint)] transition group-open:rotate-180"
          >
            ▾
          </span>
        </span>
      </summary>

      <div className="border-t border-[var(--border)] p-4 pt-3">
        <div className="mb-3 text-xs text-[var(--muted)]">
          {REASON[w.reason]} · projected {w.startedProj} with the lineup started
          vs {w.bestProj} with the best legal lineup available · actually scored{" "}
          {w.actualPoints}
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
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              <span>Best lineup available</span>
              <span
                className="font-mono text-[10px] normal-case text-[var(--muted)]"
                title="What this lineup ACTUALLY scored once the games were played"
              >
                actually {w.bestActualPoints}
              </span>
            </div>
            <ul className="rounded-xl border border-[var(--border)] p-2">
              {w.bestLineup.map((e, i) => (
                <SlotRow key={i} e={e} dim />
              ))}
            </ul>
          </div>
        </div>

        {verdict && (
          <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">
            <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs tabular-nums">
              <span className="text-[var(--muted)]">
                played{" "}
                <span className="font-semibold text-[var(--foreground)]">
                  {w.actualPoints}
                </span>
              </span>
              <span className="text-[var(--muted)]">
                best projected{" "}
                <span className="font-semibold text-[var(--accent)]">
                  {w.bestActualPoints}
                </span>
              </span>
              {w.opponentPoints != null && (
                <span className="text-[var(--muted)]">
                  opponent{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {w.opponentPoints}
                  </span>
                </span>
              )}
              {w.result && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                    w.result === "W"
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "bg-[var(--bad-soft)] text-[var(--bad)]"
                  }`}
                >
                  {w.result === "W"
                    ? "won"
                    : w.result === "T"
                      ? "tied"
                      : "lost"}
                </span>
              )}
            </div>
            <div className={`text-xs ${verdict.tone}`}>{verdict.text}</div>
          </div>
        )}

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
