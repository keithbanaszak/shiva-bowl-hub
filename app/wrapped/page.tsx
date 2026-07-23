import { WrappedGrid } from "@/components/views/WrappedGrid";
import { completedSeasons } from "@/lib/marts";

export default function WrappedIndex() {
  return <WrappedGrid season={completedSeasons()[0]} />;
}
