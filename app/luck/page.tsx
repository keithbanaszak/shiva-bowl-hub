import { LuckView } from "@/components/views/LuckView";
import { completedSeasons } from "@/lib/marts";

export default function LuckPage() {
  const latest = completedSeasons()[0];
  return <LuckView season={latest} />;
}
