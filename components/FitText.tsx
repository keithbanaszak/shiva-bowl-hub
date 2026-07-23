/**
 * Text that shrinks to fit its box instead of overflowing or being cut off.
 *
 * League team names range from "Mia Cat" to "Pickens on Downs kids", so a single
 * font size either wastes space on the short ones or clips the long ones. This
 * steps the size down in `em` — relative to whatever the parent sets — so the
 * same component works in a 300px sidebar row and in a full-width card.
 *
 * Truncation is still the last resort for pathological input, hence `truncate` +
 * a `title`, but for real team names the shrink alone is enough.
 */
export function FitText({
  children,
  fits = 18,
  min = 0.78,
  className = "",
  title,
  as: Tag = "span",
}: {
  children: string;
  /** Characters that sit comfortably at the parent's font size. */
  fits?: number;
  /** Floor for the scale factor, so text never becomes unreadable. */
  min?: number;
  className?: string;
  title?: string;
  as?: "span" | "div";
}) {
  const len = children?.length ?? 0;
  // linear shrink past the comfortable length, clamped at `min`
  const scale = len <= fits ? 1 : Math.max(min, fits / len);

  return (
    <Tag
      className={`block min-w-0 truncate ${className}`}
      style={scale < 1 ? { fontSize: `${scale.toFixed(3)}em` } : undefined}
      title={title ?? (len > fits ? children : undefined)}
    >
      {children}
    </Tag>
  );
}
