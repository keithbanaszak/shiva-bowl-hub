import { ManagerChip } from "@/components/Manager";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PosBadge } from "@/components/Pos";
import { ordinal } from "@/lib/marts";
import type { Trade, TradeAsset } from "@/lib/stats/types";

const fmtDate = (ms: number | null) =>
  ms ? new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

function PickChip({ a }: { a: Extract<TradeAsset, { kind: "pick" }> }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-cyan-400/25 bg-[var(--accent-2)]/[0.06] px-1.5 py-1 text-xs">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-[var(--accent-2-soft)] font-mono text-[10px] font-bold text-[var(--accent-2)]">
        {a.round}
      </span>
      <span className="shrink-0 text-[var(--muted)]">
        {a.season} {ordinal(a.round)}
      </span>
      {a.becameName && <span className="truncate">→ {a.becameName}</span>}
    </span>
  );
}

function Asset({ a }: { a: TradeAsset }) {
  if (a.kind === "pick") return <PickChip a={a} />;
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-sm">
      <PlayerAvatar playerId={a.playerId} size={22} />
      <span className="min-w-0 truncate">{a.name}</span>
      <PosBadge pos={a.position} />
    </span>
  );
}

/** A trade as a row of per-manager "received" hauls — clear for 2- and 3+-team deals. */
export function TradeCard({ t, realized = true }: { t: Trade; realized?: boolean }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">
      <div className="mb-2 flex items-center justify-between text-[11px] text-[var(--muted)]">
        <span className="font-display uppercase tracking-wider text-accent-2">⇄ Trade</span>
        <span>
          {fmtDate(t.dateMs)} · {t.season} Wk {t.week}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {t.sides.map((s) => {
          const net = realized ? t.realized?.[s.userId]?.career : undefined;
          return (
            <div key={s.userId} className="min-w-[170px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-2.5">
              <div className="mb-2 flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
                <ManagerChip userId={s.userId} href={`/managers/${s.userId}`} size={20} className="font-semibold" />
                {net != null && net > 0 && <span className="shrink-0 font-mono text-xs text-[var(--accent)]">{net} pts</span>}
              </div>
              <div className="space-y-1.5">
                {s.received.map((a, i) => (
                  <Asset key={i} a={a} />
                ))}
                {s.faabReceived > 0 && (
                  <span className="inline-flex items-center rounded-md border border-amber-400/25 bg-amber-400/[0.06] px-1.5 py-1 text-xs text-[var(--gold)]">
                    ${s.faabReceived} FAAB
                  </span>
                )}
                {s.received.length === 0 && s.faabReceived === 0 && (
                  <span className="text-xs text-[var(--muted)]">nothing</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
