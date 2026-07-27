import { SectionTitle } from "@/components/ui";
import {
  DataTable,
  type ColumnSpec,
  type TableRow,
} from "@/components/DataTable";
import { ManagerCell, WhenCell, whenOrder } from "@/components/cells";
import { label } from "@/lib/marts";
import type { RecordEntry } from "@/lib/stats/types";

/**
 * Cells are rendered here on the SERVER and handed to the client DataTable as
 * plain nodes, so the manager dictionary never reaches the browser.
 */
export function RecordTable({
  title,
  emoji,
  rows,
  valueLabel,
  tone = "default",
  caption,
}: {
  title: string;
  emoji: string;
  rows: RecordEntry[];
  valueLabel: string;
  tone?: "default" | "good" | "bad" | "gold";
  caption?: string;
}) {
  const valueCls =
    tone === "good"
      ? "text-[var(--accent)]"
      : tone === "bad"
        ? "text-[var(--bad)]"
        : tone === "gold"
          ? "text-[var(--gold)]"
          : "text-[var(--foreground)]";

  const columns: ColumnSpec[] = [
    {
      key: "manager",
      header: "Manager",
      width: "34%",
      sortable: true,
      descFirst: false,
    },
    {
      key: "when",
      hideBelow: "sm",
      header: "When",
      width: "22%",
      sortable: true,
    },
    {
      key: "opponent",
      header: "Opponent",
      width: "28%",
      sortable: true,
      descFirst: false,
    },
    {
      key: "value",
      header: valueLabel,
      width: "16%",
      align: "right",
      sortable: true,
    },
  ];

  const data: TableRow[] = rows.map((r, i) => ({
    key: `${r.season}:${r.week}:${r.userId}:${i}`,
    cells: {
      manager: <ManagerCell userId={r.userId} />,
      when: (
        <WhenCell season={r.season} week={r.week} isPlayoff={r.isPlayoff} />
      ),
      opponent: <ManagerCell userId={r.opponentUserId} />,
      value: (
        <span className={`font-mono font-semibold tabular-nums ${valueCls}`}>
          {r.value}
        </span>
      ),
    },
    sort: {
      manager: label(r.userId),
      when: whenOrder(r.season, r.week),
      opponent: r.opponentUserId ? label(r.opponentUserId) : null,
      value: r.value,
    },
  }));

  return (
    <div>
      <SectionTitle>
        {emoji} {title}
      </SectionTitle>
      <DataTable
        rows={data}
        columns={columns}
        rank
        minWidth="21rem"
        caption={caption}
      />
    </div>
  );
}
