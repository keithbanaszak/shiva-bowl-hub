import Link from "next/link";
import { Card, Badge } from "@/components/ui";
import { Avatar, ManagerChip } from "@/components/Manager";
import { label } from "@/lib/marts";
import { managerStances, bestFits, type Stance } from "@/lib/data/tradeFinder";

const STANCE_STYLE: Record<Stance, string> = {
  surplus:
    "border-[var(--border-glow)] bg-[var(--accent-soft)] text-[var(--accent)]",
  need: "border-rose-400/30 bg-rose-400/10 text-[var(--bad)]",
  balanced: "border-[var(--border)] bg-[var(--panel)] text-[var(--muted)]",
};
const STANCE_MARK: Record<Stance, string> = {
  surplus: "▲",
  need: "▼",
  balanced: "·",
};

function axisBadge(axis: number) {
  if (axis > 20) return <Badge tone="good">Contender</Badge>;
  if (axis < -20) return <Badge tone="accent2">Rebuilder</Badge>;
  return <Badge tone="gold">Balanced</Badge>;
}

export function TradeFinder() {
  const stances = [...managerStances()].sort(
    (a, b) => b.picks.axis - a.picks.axis,
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stances.map((s) => {
        const fits = bestFits(s.userId, 3);
        const chips: Array<{ key: string; stance: Stance }> = [
          ...(["QB", "RB", "WR", "TE"] as const).map((p) => ({
            key: p,
            stance: s.positions[p].label,
          })),
          { key: "PICKS", stance: s.picks.label },
        ];
        return (
          <Card key={s.userId}>
            <div className="mb-3 flex items-center gap-2">
              <Avatar userId={s.userId} size={32} />
              <Link
                href={`/managers/${s.userId}`}
                className="min-w-0 flex-1 truncate font-display font-semibold hover:text-[var(--accent)]"
              >
                {label(s.userId)}
              </Link>
              {axisBadge(s.picks.axis)}
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <span
                  key={c.key}
                  className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${STANCE_STYLE[c.stance]}`}
                  title={c.stance}
                >
                  {c.key}{" "}
                  <span className="text-[9px]">{STANCE_MARK[c.stance]}</span>
                </span>
              ))}
            </div>

            <div className="border-t border-[var(--border)] pt-2">
              <div className="mb-1.5 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Best trade fits
              </div>
              {fits.length === 0 ? (
                <div className="text-xs text-[var(--muted)]">
                  No standout fits right now.
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {fits.map((f) => (
                    <li key={f.partnerId} className="text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <ManagerChip userId={f.partnerId} size={16} />
                        <Link
                          href={`/compare/${s.userId}/${f.partnerId}`}
                          className="shrink-0 text-[var(--accent)] hover:underline"
                        >
                          compare →
                        </Link>
                      </div>
                      <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                        {f.rationale}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
