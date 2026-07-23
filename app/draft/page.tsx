import { Card, PageHeader, SectionTitle, Note, signed } from "@/components/ui";
import { ManagerChip } from "@/components/Manager";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { DraftBoard } from "@/components/DraftBoard";
import { BoardCarousel } from "@/components/BoardCarousel";
import { draft } from "@/lib/data/draft";
import { draftBoards } from "@/lib/data/draftBoards";

export default function DraftPage() {
  const drafters = draft.drafters;
  const rookiePicks = draft.picks.filter((p) => !p.isStartup);
  const steals = [...rookiePicks].sort((a, b) => b.stealScore - a.stealScore).slice(0, 15);
  const busts = rookiePicks
    .filter((p) => p.round <= 2)
    .sort((a, b) => a.realizedCareer - b.realizedCareer)
    .slice(0, 10);

  const boardLabel = (b: (typeof draftBoards)[number]) =>
    b.isFuture ? `${b.season} (Upcoming)` : b.isStartup ? `${b.season} Startup` : b.season;

  return (
    <div>
      <PageHeader
        kicker="Draft room"
        title="Draft Boards"
        subtitle="Click through every draft. Column headers are the original slot owners; cells are tinted by position."
      />

      <BoardCarousel labels={draftBoards.map(boardLabel)} defaultIndex={0}>
        {draftBoards.map((b) => (
          <DraftBoard key={b.season} board={b} />
        ))}
      </BoardCarousel>

      <div className="mb-8 mt-2 text-center text-xs text-[var(--muted)]">
        Amber-outlined cells are traded picks — the badge shows the team that now owns the pick.
      </div>

      <div className="mb-6">
        <Note title="How draft value works">
          Each pick is credited with the <strong>career fantasy points</strong> the player produced while on the
          drafting manager&rsquo;s roster. <strong>Steal score</strong> compares that to the average production of
          all picks at the same slot. The inaugural startup draft is excluded from steals and the drafter
          leaderboard — it was veterans, not rookies.
        </Note>
      </div>

      <SectionTitle>🧠 Best drafters (rookie picks, career value)</SectionTitle>
      <Card className="mb-8 overflow-x-auto scroll-thin">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
              <th className="py-2 pr-3">Manager</th>
              <th className="px-3">Picks</th>
              <th className="px-3">Career pts</th>
              <th className="px-3">Pts/pick</th>
              <th className="px-3">Best pick</th>
            </tr>
          </thead>
          <tbody>
            {drafters.map((d, i) => (
              <tr key={d.userId} className="border-t border-[var(--border)]">
                <td className="py-2 pr-3">
                  <span className="flex items-center gap-2">
                    <span className="w-5 text-right text-xs text-[var(--muted)]">{i + 1}</span>
                    <ManagerChip userId={d.userId} />
                  </span>
                </td>
                <td className="px-3 tabular-nums text-[var(--muted)]">{d.picks}</td>
                <td className="px-3 tabular-nums font-semibold text-[var(--accent)]">{d.totalRealized}</td>
                <td className="px-3 tabular-nums">{d.pointsPerPick}</td>
                <td className="px-3 text-[var(--muted)]">
                  {d.bestPick ? `${d.bestPick.name} (${d.bestPick.realizedCareer})` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle>💎 Biggest rookie-draft steals</SectionTitle>
          <Card className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
                  <th className="py-2 pr-3">Pick</th>
                  <th className="px-3">Player</th>
                  <th className="px-3">By</th>
                  <th className="px-3">Career</th>
                  <th className="px-3">Steal</th>
                </tr>
              </thead>
              <tbody>
                {steals.map((p) => (
                  <tr key={`${p.season}-${p.pickNo}`} className="border-t border-[var(--border)]">
                    <td className="py-2 pr-3 tabular-nums text-[var(--muted)]">
                      {p.season} R{p.round}.{p.pickNo}
                    </td>
                    <td className="px-3">
                      <span className="flex items-center gap-2">
                        <PlayerAvatar playerId={p.playerId} size={24} />
                        <span className="truncate">{p.name}</span>
                      </span>
                    </td>
                    <td className="px-3">
                      <ManagerChip userId={p.userId} size={18} />
                    </td>
                    <td className="px-3 tabular-nums text-[var(--muted)]">{p.realizedCareer}</td>
                    <td className="px-3 tabular-nums font-semibold text-[var(--accent)]">{signed(p.stealScore)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <div>
          <SectionTitle>🪦 Premium-pick busts (rounds 1–2)</SectionTitle>
          <Card className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
                  <th className="py-2 pr-3">Pick</th>
                  <th className="px-3">Player</th>
                  <th className="px-3">By</th>
                  <th className="px-3">Career</th>
                </tr>
              </thead>
              <tbody>
                {busts.map((p) => (
                  <tr key={`${p.season}-${p.pickNo}`} className="border-t border-[var(--border)]">
                    <td className="py-2 pr-3 tabular-nums text-[var(--muted)]">
                      {p.season} R{p.round}.{p.pickNo}
                    </td>
                    <td className="px-3">
                      <span className="flex items-center gap-2">
                        <PlayerAvatar playerId={p.playerId} size={24} />
                        <span className="truncate">{p.name}</span>
                      </span>
                    </td>
                    <td className="px-3">
                      <ManagerChip userId={p.userId} size={18} />
                    </td>
                    <td className="px-3 tabular-nums font-semibold text-[var(--bad)]">{p.realizedCareer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
