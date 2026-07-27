"use client";

import { useEffect, useState } from "react";

const BP = { sm: 640, md: 768 } as const;

/**
 * True when the viewport is narrower than the given Tailwind breakpoint.
 *
 * Initial state is `false` (desktop) on purpose: it must match what the server
 * rendered, so SSR and the first client paint agree — the effect flips it after
 * mount. A component using this therefore renders its FULL desktop form on the
 * server and during hydration, then collapses to the mobile form once mounted.
 * That guarantees no hydration mismatch and no desktop regression.
 */
export function useBelow(bp: "sm" | "md"): boolean {
  const [below, setBelow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${BP[bp] - 0.02}px)`);
    const on = () => setBelow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [bp]);

  return below;
}
