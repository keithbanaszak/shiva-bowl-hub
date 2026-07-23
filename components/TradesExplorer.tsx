"use client";

import { useMemo, useState } from "react";
import type { Trade, TradeAsset } from "@/lib/stats/types";

type Mgr = { userId: string; label: string; avatarUrl: string | null };

const playerPic = (id: string) =>
  /^\d+$/.test(id)
    ? `https://sleepercdn.com/content/nfl/players/thumb/${id}.jpg`
    : `https://sleepercdn.com/images/team_logos/nfl/${id.toLowerCase()}.png`;

function Pic({ url, size = 24 }: { url: string | null; size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, backgroundImage: url ? `url(${url})` : undefined }}
      className="inline-block shrink-0 rounded-full border border-white/10 bg-white/[0.06] bg-cover bg-top"
    />
  );
}

function assetText(a: TradeAsset): string {
  return a.kind === "player" ? a.name : `${a.season} R${a.round}${a.becameName ? ` → ${a.becameName}` : ""}`;
}

export function TradesExplorer({ trades, managers }: { trades: Trade[]; managers: Mgr[] }) {
  const mgrMap = useMemo(() => new Map(managers.map((m) => [m.userId, m])), [managers]);
  const seasons = useMemo(() => [...new Set(trades.map((t) => t.season))].sort((a, b) => Number(b) - Number(a)), [trades]);

  const [q, setQ] = useState("");
  const [season, setSeason] = useState("all");
  const [sort, setSort] = useState<"new" | "lopsided" | "even">("new");

  const careerDiff = (t: Trade): number | null => {
    if (!t.realized) return null;
    const vals = Object.values(t.realized).map((r) => r.career);
    if (vals.length < 2) return null;
    return Math.max(...vals) - Math.min(...vals);
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = trades.filter((t) => {
      if (season !== "all" && t.season !== season) return false;
      if (!needle) return true;
      const inAssets = t.sides.some((s) =>
        s.received.some((a) => assetText(a).toLowerCase().includes(needle)),
      );
      const inMgr = t.sides.some((s) => (mgrMap.get(s.userId)?.label ?? "").toLowerCase().includes(needle));
      return inAssets || inMgr;
    });
    if (sort === "new") list = [...list].sort((a, b) => (b.dateMs ?? 0) - (a.dateMs ?? 0));
    if (sort === "lopsided")
      list = [...list].filter((t) => careerDiff(t) != null).sort((a, b) => (careerDiff(b) ?? 0) - (careerDiff(a) ?? 0));
    if (sort === "even")
      list = [...list]
        .filter((t) => careerDiff(t) != null && Object.values(t.realized!).every((r) => r.career > 0))
        .sort((a, b) => (careerDiff(a) ?? 0) - (careerDiff(b) ?? 0));
    return list;
  }, [trades, q, season, sort, mgrMap]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a player or manager…"
          className="w-full rounded-xl border border-[var(--border)] bg-[#11131a] px-4 py-2.5 text-sm outline-none focus:border-emerald-400/50 sm:max-w-xs"
        />
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[#11131a] px-3 py-2 text-sm"
          >
            <option value="all">All seasons</option>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg border border-[var(--border)] p-0.5 text-xs">
            {([["new", "Newest"], ["lopsided", "Most lopsided"], ["even", "Most even"]] as const).map(([k, lab]) => (
              <button
                key={k}
                onClick={() => setSort(k)}
                className={`rounded-md px-2.5 py-1.5 transition ${sort === k ? "bg-emerald-400/20 text-emerald-200" : "text-[var(--muted)] hover:text-white"}`}
              >
                {lab}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-[var(--muted)]">{filtered.length} trades</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {filtered.map((t) => (
          <TradeCard key={t.id} t={t} mgrMap={mgrMap} />
        ))}
      </div>
      {filtered.length === 0 && <div className="py-12 text-center text-sm text-[var(--muted)]">No trades match.</div>}
    </div>
  );
}

function TradeCard({ t, mgrMap }: { t: Trade; mgrMap: Map<string, Mgr> }) {
  const twoSide = t.sides.length === 2 && t.realized;
  let aShare = 50;
  let verdict: { text: string; tone: string } | null = null;
  if (twoSide && t.realized) {
    const [s1, s2] = t.sides;
    const c1 = t.realized[s1.userId]?.career ?? 0;
    const c2 = t.realized[s2.userId]?.career ?? 0;
    const tot = c1 + c2;
    aShare = tot > 0 ? (c1 / tot) * 100 : 50;
    const diffPct = tot > 0 ? Math.abs(c1 - c2) / tot : 0;
    verdict =
      tot === 0
        ? { text: "No points yet", tone: "text-[var(--muted)]" }
        : diffPct < 0.15
          ? { text: "Even swap", tone: "text-emerald-300" }
          : diffPct > 0.5
            ? { text: "Lopsided", tone: "text-red-300" }
            : { text: "Competitive", tone: "text-amber-300" };
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-b from-white/[0.04] to-transparent p-4 transition hover:border-emerald-400/30">
      <div className="mb-3 flex items-center justify-between text-[11px] text-[var(--muted)]">
        <span className="rounded-full bg-white/10 px-2 py-0.5 font-medium">
          {t.season} · Wk {t.week}
        </span>
        {verdict && <span className={`font-semibold uppercase tracking-wide ${verdict.tone}`}>{verdict.text}</span>}
      </div>

      <div className={`grid gap-3 ${t.sides.length > 2 ? "sm:grid-cols-3" : "grid-cols-2"}`}>
        {t.sides.map((s) => {
          const m = mgrMap.get(s.userId);
          const r = t.realized?.[s.userId];
          return (
            <div key={s.userId} className="min-w-0 rounded-xl border border-[var(--border)] bg-black/20 p-2.5">
              <div className="mb-2 flex items-center gap-1.5">
                <Pic url={m?.avatarUrl ?? null} size={20} />
                <span className="min-w-0 truncate text-xs font-medium">{m?.label ?? s.userId}</span>
              </div>
              <ul className="space-y-1">
                {s.received.map((a, i) => (
                  <li key={i} className="flex min-w-0 items-center gap-1.5 text-xs">
                    <Pic url={a.kind === "player" ? playerPic(a.playerId) : a.becamePlayerId ? playerPic(a.becamePlayerId) : null} size={20} />
                    <span className="min-w-0 truncate">{assetText(a)}</span>
                  </li>
                ))}
                {s.faabReceived > 0 && <li className="text-[11px] text-[var(--muted)]">💵 ${s.faabReceived} FAAB</li>}
              </ul>
              {r && (
                <div className="mt-2 text-[10px] text-[var(--muted)]">
                  {r.season} rest · <span className="text-white">{r.career}</span> career
                </div>
              )}
            </div>
          );
        })}
      </div>

      {twoSide && (
        <div className="mt-3">
          <div className="flex h-2 overflow-hidden rounded-full bg-white/5">
            <div className="bg-blue-500/60" style={{ width: `${aShare}%` }} />
            <div className="bg-red-500/60" style={{ width: `${100 - aShare}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-[var(--muted)]">
            <span>{mgrMap.get(t.sides[0].userId)?.label}</span>
            <span>career realized split</span>
            <span>{mgrMap.get(t.sides[1].userId)?.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}
