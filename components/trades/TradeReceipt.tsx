"use client";

import type { Trade, TradeAsset } from "@/lib/stats/types";
import { PickBadge, roundColor } from "@/components/trades/PickBadge";
import { posColor } from "@/lib/positions";

export type Mgr = { userId: string; label: string; avatarUrl: string | null };
export type Basis = "career" | "ros";

const playerPic = (id: string) =>
  /^\d+$/.test(id)
    ? `https://sleepercdn.com/content/nfl/players/thumb/${id}.jpg`
    : `https://sleepercdn.com/images/team_logos/nfl/${id.toLowerCase()}.png`;

const fmtDate = (ms: number | null) =>
  ms
    ? new Date(ms).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

function Pic({
  url,
  pos,
  size = 24,
}: {
  url: string | null;
  pos?: string | null;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        backgroundImage: url ? `url(${url})` : undefined,
        borderColor: pos ? posColor(pos) : "var(--border)",
      }}
      className="inline-block shrink-0 rounded-full border-2 bg-[var(--card-2)] bg-cover bg-top"
    />
  );
}

/**
 * One asset a manager RECEIVED. Only the gained side is listed — showing both
 * gained and lost doubled every card's height and made the two boxes read as
 * near-duplicates, since what one side gains the other loses.
 */
function GotRow({ a, mgrMap }: { a: TradeAsset; mgrMap: Map<string, Mgr> }) {
  const plus = (
    <span
      aria-hidden
      className="w-2.5 shrink-0 text-center font-mono text-[var(--accent)]"
    >
      +
    </span>
  );

  if (a.kind === "pick") {
    const via = a.originalUserId ? mgrMap.get(a.originalUserId)?.label : null;
    return (
      <li className="flex min-w-0 items-center gap-1.5 text-xs">
        {plus}
        <PickBadge round={a.round} size={24} />
        <span className="min-w-0 flex-1 leading-tight">
          <span
            className="block truncate"
            style={{ color: roundColor(a.round) }}
          >
            {a.season} Round {a.round}
          </span>
          <span className="block truncate text-[10px] text-[var(--muted)]">
            {via ? `via ${via}` : "pick"}
            {a.becameName ? ` → ${a.becameName}` : ""}
          </span>
        </span>
      </li>
    );
  }

  return (
    <li className="flex min-w-0 items-center gap-1.5 text-xs">
      {plus}
      <Pic url={playerPic(a.playerId)} pos={a.position} />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate">{a.name}</span>
        <span className="block truncate text-[10px] text-[var(--muted)]">
          {a.rankLabel ? (
            <>
              <span style={{ color: posColor(a.position) }}>{a.rankLabel}</span>
              {a.ppg != null ? ` · ${a.ppg} ppg` : ""}
            </>
          ) : (
            (a.position ?? "—")
          )}
        </span>
      </span>
    </li>
  );
}

export function TradeReceipt({
  t,
  mgrMap,
  basis,
}: {
  t: Trade;
  mgrMap: Map<string, Mgr>;
  basis: Basis;
}) {
  const key = basis === "career" ? "career" : "season";
  const twoSide = t.sides.length === 2 && !!t.realized;

  let aShare = 50;
  let verdict: { text: string; cls: string } | null = null;
  if (twoSide && t.realized) {
    const [s1, s2] = t.sides;
    const c1 = t.realized[s1.userId]?.[key] ?? 0;
    const c2 = t.realized[s2.userId]?.[key] ?? 0;
    const tot = c1 + c2;
    aShare = tot > 0 ? (c1 / tot) * 100 : 50;
    const diffPct = tot > 0 ? Math.abs(c1 - c2) / tot : 0;
    verdict =
      tot === 0
        ? { text: "No points yet", cls: "text-[var(--muted)]" }
        : diffPct < 0.15
          ? { text: "Even swap", cls: "text-[var(--accent)]" }
          : diffPct > 0.5
            ? { text: "Lopsided", cls: "text-[var(--bad)]" }
            : { text: "Competitive", cls: "text-[var(--gold)]" };
  }

  const proposer = t.creatorUserId ? mgrMap.get(t.creatorUserId) : null;

  return (
    <div className="mb-3 break-inside-avoid rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 transition hover:border-[var(--border-glow)]">
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-[var(--muted)]">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 rounded-full bg-[var(--chip)] px-2 py-0.5 font-medium">
            {t.season} · wk{t.week}
            {t.dateMs ? ` · ${fmtDate(t.dateMs)}` : ""}
          </span>
          {proposer && (
            <span
              className="flex min-w-0 items-center gap-1"
              title={`Proposed by ${proposer.label}`}
            >
              <Pic url={proposer.avatarUrl} size={14} />
              <span className="truncate text-[10px]">proposed</span>
            </span>
          )}
        </span>
        {verdict && (
          <span
            className={`shrink-0 font-semibold uppercase tracking-wide ${verdict.cls}`}
          >
            {verdict.text}
          </span>
        )}
      </div>

      <div
        className={`grid gap-2 ${t.sides.length > 2 ? "sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-[1fr_auto_1fr]"}`}
      >
        {t.sides.map((s, i) => {
          const m = mgrMap.get(s.userId);
          const r = t.realized?.[s.userId];
          const isProposer =
            t.creatorUserId != null && s.userId === t.creatorUserId;
          return (
            <div key={s.userId} className="contents">
              <div
                className={`flex h-full min-w-0 flex-col rounded-xl border bg-[var(--inset)] p-2 ${
                  isProposer
                    ? "border-[var(--accent-2-border)]"
                    : "border-[var(--border)]"
                }`}
              >
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Pic url={m?.avatarUrl ?? null} size={18} />
                  <span className="min-w-0 truncate text-xs font-medium">
                    {m?.label ?? s.userId}
                  </span>
                </div>
                <ul className="flex-1 space-y-1">
                  {s.received.map((a, j) => (
                    <GotRow key={j} a={a} mgrMap={mgrMap} />
                  ))}
                  {s.faabReceived > 0 && (
                    <li className="flex items-center gap-1.5 text-[11px] text-[var(--gold)]">
                      <span className="w-2.5 text-center font-mono">+</span>$
                      {s.faabReceived} FAAB
                    </li>
                  )}
                  {s.received.length === 0 && s.faabReceived === 0 && (
                    <li className="pl-4 text-[11px] text-[var(--faint)]">
                      nothing
                    </li>
                  )}
                </ul>
                {r && (
                  <div className="mt-1.5 border-t border-[var(--border)] pt-1 text-[10px] text-[var(--muted)]">
                    <span className="font-mono text-xs font-semibold text-[var(--foreground)]">
                      {r[key]}
                    </span>{" "}
                    {basis === "career" ? "career" : "ROS"}
                  </div>
                )}
              </div>

              {/* swap gutter between the two sides */}
              {t.sides.length === 2 && i === 0 && (
                <div
                  aria-hidden
                  className="hidden place-items-center px-0.5 text-sm text-[var(--faint)] sm:grid"
                >
                  ⇄
                </div>
              )}
            </div>
          );
        })}
      </div>

      {twoSide && (
        <div className="mt-2">
          <div className="flex h-1.5 overflow-hidden rounded-full bg-[var(--chip)]">
            <div
              className="bg-[var(--accent-2)]"
              style={{ width: `${aShare}%` }}
            />
            <div
              className="bg-[var(--bad)]"
              style={{ width: `${100 - aShare}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
