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
  size = 26,
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

/** One asset row. `dir` shows which way it moved from this side's point of view. */
function AssetRow({
  a,
  dir,
  mgrMap,
}: {
  a: TradeAsset;
  dir: "in" | "out";
  mgrMap: Map<string, Mgr>;
}) {
  const gained = dir === "in";
  const arrow = gained ? "←" : "→";
  const arrowCls = gained ? "text-[var(--accent)]" : "text-[var(--muted)]";

  if (a.kind === "pick") {
    const via = a.originalUserId ? mgrMap.get(a.originalUserId)?.label : null;
    return (
      <li className="flex min-w-0 items-center gap-1.5 text-xs">
        <span aria-hidden className={`w-3 shrink-0 font-mono ${arrowCls}`}>
          {arrow}
        </span>
        <PickBadge round={a.round} size={26} />
        <span className="min-w-0 flex-1">
          <span
            className="block truncate"
            style={{ color: roundColor(a.round) }}
          >
            {a.season} Round {a.round}
          </span>
          <span className="block truncate text-[10px] text-[var(--muted)]">
            {via ? `via ${via}` : "pick"}
            {a.becameName ? ` · became ${a.becameName}` : ""}
          </span>
        </span>
      </li>
    );
  }

  return (
    <li className="flex min-w-0 items-center gap-1.5 text-xs">
      <span aria-hidden className={`w-3 shrink-0 font-mono ${arrowCls}`}>
        {arrow}
      </span>
      <Pic url={playerPic(a.playerId)} pos={a.position} />
      <span className="min-w-0 flex-1">
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
    // h-full + flex-col is what pins the split bar to the same y on every card
    <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--border-glow)]">
      <div className="mb-3 flex items-center justify-between gap-2 text-[11px] text-[var(--muted)]">
        <span className="rounded-full bg-[var(--chip)] px-2 py-0.5 font-medium">
          {t.season} · Wk {t.week}
          {t.dateMs ? ` · ${fmtDate(t.dateMs)}` : ""}
        </span>
        {verdict && (
          <span
            className={`font-semibold uppercase tracking-wide ${verdict.cls}`}
          >
            {verdict.text}
          </span>
        )}
      </div>

      {proposer && (
        <div className="mb-3 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
          <span>Proposed by</span>
          <Pic url={proposer.avatarUrl} size={16} />
          <span className="truncate font-medium text-[var(--foreground)]">
            {proposer.label}
          </span>
        </div>
      )}

      {/* content grows; the bar below stays anchored */}
      <div className="flex-1">
        <div
          className={`grid gap-2 ${t.sides.length > 2 ? "sm:grid-cols-3" : "grid-cols-[1fr_auto_1fr]"}`}
        >
          {t.sides.map((s, i) => {
            const m = mgrMap.get(s.userId);
            const r = t.realized?.[s.userId];
            const isProposer =
              t.creatorUserId != null && s.userId === t.creatorUserId;
            return (
              <div key={s.userId} className="contents">
                <div
                  className={`min-w-0 rounded-xl border bg-[var(--inset)] p-2.5 ${
                    isProposer
                      ? "border-[var(--accent-2-border)]"
                      : "border-[var(--border)]"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-1.5">
                    <Pic url={m?.avatarUrl ?? null} size={20} />
                    <span className="min-w-0 truncate text-xs font-medium">
                      {m?.label ?? s.userId}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {s.received.map((a, j) => (
                      <AssetRow key={`in${j}`} a={a} dir="in" mgrMap={mgrMap} />
                    ))}
                    {s.sent.map((a, j) => (
                      <AssetRow
                        key={`out${j}`}
                        a={a}
                        dir="out"
                        mgrMap={mgrMap}
                      />
                    ))}
                    {s.faabReceived > 0 && (
                      <li className="pl-4 text-[11px] text-[var(--gold)]">
                        ← ${s.faabReceived} FAAB
                      </li>
                    )}
                  </ul>
                  {r && (
                    <div className="mt-2 border-t border-[var(--border)] pt-1.5 text-[10px] text-[var(--muted)]">
                      <span className="font-mono text-sm font-semibold text-[var(--foreground)]">
                        {r[key]}
                      </span>{" "}
                      {basis === "career" ? "career pts" : "ROS pts"}
                    </div>
                  )}
                </div>

                {/* swap gutter, only between the two sides of a 2-team deal */}
                {t.sides.length === 2 && i === 0 && (
                  <div
                    aria-hidden
                    className="grid place-items-center px-0.5 text-sm text-[var(--faint)]"
                  >
                    ⇄
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* footer: fixed height, so bars line up across a row of cards */}
      <div className="mt-3 h-[34px] shrink-0">
        {twoSide && (
          <>
            <div className="flex h-2 overflow-hidden rounded-full bg-[var(--chip)]">
              <div
                className="bg-[var(--accent-2)]"
                style={{ width: `${aShare}%` }}
              />
              <div
                className="bg-[var(--bad)]"
                style={{ width: `${100 - aShare}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between gap-2 text-[10px] text-[var(--muted)]">
              <span className="min-w-0 truncate">
                {mgrMap.get(t.sides[0].userId)?.label}
              </span>
              <span className="shrink-0">
                {basis === "career" ? "career" : "ROS"} split
              </span>
              <span className="min-w-0 truncate text-right">
                {mgrMap.get(t.sides[1].userId)?.label}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
