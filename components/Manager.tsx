import Link from "next/link";
import { getManager } from "@/lib/marts";

function initials(label: string): string {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function Avatar({ userId, size = 28 }: { userId: string | null | undefined; size?: number }) {
  const m = getManager(userId);
  const url = m?.avatarUrl;
  const dim = { width: size, height: size };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        style={dim}
        className="shrink-0 rounded-full border border-[var(--border)] object-cover"
      />
    );
  }
  return (
    <div
      style={dim}
      className="grid shrink-0 place-items-center rounded-full border border-[var(--border)] bg-white/10 text-[10px] font-semibold text-white/70"
    >
      {m ? initials(m.label) : "?"}
    </div>
  );
}

export function ManagerChip({
  userId,
  size = 24,
  href,
  className = "",
}: {
  userId: string | null | undefined;
  size?: number;
  href?: string;
  className?: string;
}) {
  const m = getManager(userId);
  const label = m?.label ?? "—";
  const inner = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Avatar userId={userId} size={size} />
      <span className="truncate">{label}</span>
    </span>
  );
  if (href && userId) {
    return (
      <Link href={href} className="hover:text-emerald-300">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function ManagerName({ userId }: { userId: string | null | undefined }) {
  return <>{getManager(userId)?.label ?? "—"}</>;
}
