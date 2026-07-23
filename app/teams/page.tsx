import Link from "next/link";
import {
  Card,
  PageHeader,
  SectionTitle,
  Badge,
  Note,
  Tag,
} from "@/components/ui";
import { Avatar, ManagerChip } from "@/components/Manager";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { label } from "@/lib/marts";
import { teamPower } from "@/lib/data/teamPower";
import type { TeamPower } from "@/lib/stats/types";

function Bar({
  value,
  tone = "accent",
}: {
  value: number;
  tone?: "accent" | "accent2" | "muted";
}) {
  const color =
    tone === "accent"
      ? "bg-[var(--accent)]"
      : tone === "accent2"
        ? "bg-[var(--accent-2)]"
        : "bg-[var(--chip)]";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--card-2)]">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.max(2, value)}%` }}
      />
    </div>
  );
}

/** -100..100 axis: rebuild (left) ↔ contend (right). */
function AxisSlider({ axis }: { axis: number }) {
  const left = (axis + 100) / 2; // 0..100
  const tone =
    axis > 20
      ? "bg-[var(--accent)]"
      : axis < -20
        ? "bg-[var(--accent-2)]"
        : "bg-[var(--gold)]";
  return (
    <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-[var(--accent-2-soft)] via-[var(--border)] to-[var(--accent-soft)]">
      <div
        className="absolute top-1/2 h-1 w-px -translate-y-1/2 bg-[var(--chip)]"
        style={{ left: "50%" }}
      />
      <div
        className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${tone} ring-2 ring-[var(--background)]`}
        style={{ left: `${left}%` }}
      />
    </div>
  );
}

function axisLabel(axis: number) {
  if (axis > 20) return { text: "Contender", tone: "good" as const };
  if (axis < -20) return { text: "Rebuilder", tone: "accent2" as const };
  return { text: "Balanced", tone: "gold" as const };
}

function TeamCard({ t }: { t: TeamPower }) {
  const a = axisLabel(t.contenderAxis);
  return (
    <Card>
      <div className="mb-3 flex items-center gap-3">
        <Avatar userId={t.userId} size={36} />
        <div className="min-w-0 flex-1">
          <Link
            href={`/managers/${t.userId}`}
            className="block truncate font-display font-semibold hover:text-[var(--accent)]"
          >
            {label(t.userId)}
          </Link>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--muted)]">
            <Badge tone={a.tone}>{a.text}</Badge>
            <span className="font-mono">Hub {t.hubValue}</span>
          </div>
        </div>
      </div>

      {/* win-now vs future */}
      <div className="mb-3 space-y-2">
        <div>
          <div className="mb-1 flex justify-between text-[11px] text-[var(--muted)]">
            <span>Win-now</span>
            <span className="font-mono tabular-nums">{t.winNow}</span>
          </div>
          <Bar value={t.winNow} tone="accent" />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-[11px] text-[var(--muted)]">
            <span>Future capital</span>
            <span className="font-mono tabular-nums">{t.futureCapital}</span>
          </div>
          <Bar value={t.futureCapital} tone="accent2" />
        </div>
      </div>

      {/* positional strength */}
      <div className="mb-3 grid grid-cols-4 gap-2">
        {(["QB", "RB", "WR", "TE"] as const).map((pos) => (
          <div key={pos}>
            <div
              className={`mb-1 flex justify-between text-[10px] ${
                pos === t.weakestPos
                  ? "text-[var(--bad)]"
                  : "text-[var(--muted)]"
              }`}
            >
              <span>{pos}</span>
              <span className="font-mono tabular-nums">
                {Math.round(t.posStrength[pos])}
              </span>
            </div>
            <Bar value={t.posStrength[pos]} tone="muted" />
          </div>
        ))}
      </div>

      {/* top assets */}
      <div className="mb-3">
        <div className="mb-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
          Top assets
        </div>
        <div className="flex flex-wrap gap-1.5">
          {t.topAssets.map((p) => (
            <span
              key={p.playerId}
              className="flex items-center gap-1.5 rounded-full bg-[var(--card-2)] px-2 py-1 text-xs"
            >
              <PlayerAvatar playerId={p.playerId} size={18} />
              <span className="truncate">{p.name}</span>
              <span className="font-mono text-[10px] text-[var(--muted)]">
                {p.score}
              </span>
              {p.unproven && <Tag>unproven</Tag>}
            </span>
          ))}
        </div>
      </div>

      {/* future picks + age */}
      <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
        <div className="flex flex-wrap gap-1">
          {t.futurePicks.length === 0 ? (
            <span className="text-xs text-[var(--muted)]">no future picks</span>
          ) : (
            t.futurePicks.map((pk, i) => (
              <span
                key={i}
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  pk.fromUserId
                    ? "bg-[var(--accent-2-soft)] text-[var(--accent-2)]"
                    : "bg-[var(--card-2)] text-[var(--muted)]"
                }`}
                title={
                  pk.fromUserId ? `via ${label(pk.fromUserId)}` : undefined
                }
              >
                {pk.season.slice(2)} R{pk.round}
              </span>
            ))
          )}
        </div>
        <div className="shrink-0 text-right text-[10px] text-[var(--muted)]">
          {t.avgAge != null ? `avg age ${t.avgAge}` : `tenure ${t.avgTenure}y`}
        </div>
      </div>
    </Card>
  );
}

export default function TeamsPage() {
  const teams = teamPower.teams;

  return (
    <div>
      <PageHeader
        kicker="Power index"
        title="Team Power"
        subtitle={`Current-roster strength for ${teamPower.season} — win-now production, future draft capital, and where each team sits on the contender ↔ rebuilder axis.`}
      />

      <div className="mb-6">
        <Note title="How Hub Value works">
          <strong>Hub Value</strong> is a homegrown index (
          {Math.round(teamPower.weights.winNow * 100)}% win-now +{" "}
          {Math.round(teamPower.weights.futureCapital * 100)}% future capital),
          scored <strong>relative</strong> to the rest of the league on a 0–100
          scale. Win-now uses each player’s actual production{" "}
          <em>inside our league</em>; future capital uses a synthetic pick-value
          curve. Players with no league history (rookies) are flagged{" "}
          <Tag>unproven</Tag> and get a positional baseline. This is{" "}
          <strong>not</strong> a real dynasty trade-market value.
        </Note>
      </div>

      {/* leaderboard */}
      <SectionTitle>🏁 Power rankings</SectionTitle>
      <Card className="mb-8">
        <div className="space-y-3">
          {teams.map((t, i) => (
            <div key={t.userId} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-right font-mono text-xs text-[var(--muted)]">
                {i + 1}
              </span>
              <div className="w-40 shrink-0 truncate">
                <ManagerChip
                  userId={t.userId}
                  href={`/managers/${t.userId}`}
                  size={20}
                />
              </div>
              <div className="flex-1">
                <Bar value={t.hubValue} tone="accent" />
              </div>
              <span className="w-12 shrink-0 text-right font-mono text-sm font-semibold tabular-nums text-[var(--accent)]">
                {t.hubValue}
              </span>
              <div className="hidden w-28 shrink-0 sm:block">
                <AxisSlider axis={t.contenderAxis} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* per-team cards */}
      <SectionTitle>🛠️ Front offices</SectionTitle>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => (
          <TeamCard key={t.userId} t={t} />
        ))}
      </div>
    </div>
  );
}
