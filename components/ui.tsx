import Link from "next/link";
import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  kicker,
}: {
  title: string;
  subtitle?: string;
  kicker?: string;
}) {
  return (
    <div className="mb-6">
      {kicker && (
        <div className="mb-1.5 flex items-center gap-1.5 font-display text-xs font-medium uppercase tracking-[0.25em] text-accent-2">
          <span aria-hidden className="text-accent-2/80">▍</span>
          {kicker}
        </div>
      )}
      <h1 className="font-display text-2xl font-bold tracking-tight text-glow sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-[var(--muted)]">{subtitle}</p>}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">{children}</h2>;
}

export function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "good" | "bad" | "gold";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-300"
      : tone === "bad"
        ? "text-red-400"
        : tone === "gold"
          ? "text-amber-300"
          : "text-white";
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3">
      <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">{label}</div>
      <div className={`mt-0.5 font-mono text-xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-[var(--muted)]">{sub}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "good" | "bad" | "gold" | "info" | "accent2";
}) {
  const map: Record<string, string> = {
    default: "bg-white/10 text-white/80 ring-white/10",
    good: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/20",
    bad: "bg-red-400/15 text-red-300 ring-red-400/20",
    gold: "bg-amber-400/15 text-amber-300 ring-amber-400/20",
    info: "bg-indigo-400/15 text-indigo-300 ring-indigo-400/20",
    accent2: "bg-cyan-400/15 text-cyan-300 ring-cyan-400/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export function TileLink({
  href,
  emoji,
  title,
  desc,
}: {
  href: string;
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group edge-accent rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-accent-2/40 hover:bg-[var(--card-2)]"
    >
      <div className="text-2xl">{emoji}</div>
      <div className="mt-2 font-display font-semibold tracking-tight group-hover:text-emerald-300">{title}</div>
      <div className="mt-1 text-sm text-[var(--muted)]">{desc}</div>
    </Link>
  );
}

export function signed(n: number): string {
  return `${n > 0 ? "+" : ""}${n}`;
}

export function Note({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-indigo-400/20 bg-indigo-400/[0.05] p-4 text-sm text-[var(--muted)]">
      {title && <div className="mb-1 font-medium text-indigo-200">{title}</div>}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

/** Dotted-underline term with a hover tooltip definition. */
export function Explain({ term, def }: { term: string; def: string }) {
  return (
    <abbr
      title={def}
      className="cursor-help underline decoration-dotted decoration-[var(--muted)] underline-offset-4"
    >
      {term}
    </abbr>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
      {children}
    </span>
  );
}
