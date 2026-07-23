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
              ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
              : "border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--card-2)] hover:text-[var(--foreground)]"
          }`}
        >
          {s}
        </Link>
      ))}
    </div>
  );
}
