import { ppos } from "@/lib/data/players-dict";
import { posColor } from "@/lib/positions";

/**
 * Player headshot via Sleeper's CDN. Uses a background-image div so a missing
 * image degrades to a subtle placeholder (no broken-image icon, works in SSG).
 * Team defenses (non-numeric ids) fall back to the team logo. The border is
 * tinted in the player's Sleeper position color for quick recognition.
 */
export function PlayerAvatar({
  playerId,
  size = 32,
  ring = true,
}: {
  playerId: string;
  size?: number;
  ring?: boolean;
}) {
  const pos = ppos(playerId);
  const isDST = !/^\d+$/.test(playerId) || pos === "DEF";
  const url = isDST
    ? `https://sleepercdn.com/images/team_logos/nfl/${playerId.toLowerCase()}.png`
    : `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`;
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${url})`,
        borderColor: ring ? posColor(pos) : undefined,
        borderWidth: ring ? 2 : undefined,
        borderStyle: ring ? "solid" : undefined,
      }}
      className={`inline-block shrink-0 rounded-full bg-[var(--card-2)] bg-cover bg-top ${ring ? "" : "border border-[var(--border)]"}`}
    />
  );
}
