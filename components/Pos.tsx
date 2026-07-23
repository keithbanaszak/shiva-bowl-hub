import { posColor } from "@/lib/positions";

/** Small position chip in the position's Sleeper color. */
export function PosBadge({
  pos,
  className = "",
}: {
  pos: string | null | undefined;
  className?: string;
}) {
  if (!pos) return null;
  const c = posColor(pos);
  return (
    <span
      style={{ color: c, backgroundColor: `${c}1f`, borderColor: `${c}55` }}
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}
    >
      {pos}
    </span>
  );
}
