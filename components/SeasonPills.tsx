import Link from "next/link";

export function SeasonPills({
  base,
  active,
  seasons,
}: {
  base: string;
  active: string;
  seasons: string[];
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {seasons.map((s) => (
        <Link
          key={s}
          href={`${base}/${s}`}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            s === active
              ? "bg-emerald-400/20 text-emerald-200"
              : "border border-[var(--border)] text-[var(--muted)] hover:bg-white/5 hover:text-white"
          }`}
        >
          {s}
        </Link>
      ))}
    </div>
  );
}
