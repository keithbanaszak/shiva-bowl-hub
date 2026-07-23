/**
 * Text that shrinks to fit the box it's actually in.
 *
 * The first version guessed from character count against an assumed "this many
 * characters fit" number, which was wrong whenever the real column was narrower
 * or wider than the guess — "Pass Me The HERBS" fitted in one table and clipped
 * in another.
 *
 * This version lets CSS do the measuring. The wrapper becomes a query container,
 * so `cqi` (1% of the container's inline size) tracks the real available width.
 * A proportional glyph averages a bit over half its font size, so N characters
 * need roughly `N * 0.55 * fontSize`; solving for fontSize gives
 * `fontSize ≈ 180cqi / N`. `clamp` keeps it between a readable floor and the
 * inherited size, so short names never inflate and long ones never vanish.
 *
 * Overflow still ellipsises as a final backstop for pathological input.
 */
export function FitText({
  children,
  min = 0.72,
  className = "",
  title,
  as: Tag = "span",
}: {
  children: string;
  /** Smallest allowed scale, relative to the inherited font size. */
  min?: number;
  className?: string;
  title?: string;
  as?: "span" | "div";
}) {
  const len = children?.length ?? 0;
  // 180 ≈ 100 / 0.55, the reciprocal of average glyph width in em
  const cqi = len > 0 ? (180 / len).toFixed(1) : "100";

  return (
    // flex-1 + min-w-0 matter: as a bare flex item this would size to its own
    // content, so `cqi` would measure the text rather than the space available
    // and nothing would ever shrink. Outside a flex row both are inert.
    <Tag className={`block min-w-0 flex-1 ${className}`} style={{ containerType: "inline-size" }}>
      <span
        className="block truncate"
        style={{ fontSize: `clamp(${min}em, ${cqi}cqi, 1em)` }}
        title={title ?? children}
      >
        {children}
      </span>
    </Tag>
  );
}
