"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

export type LuckPoint = {
  label: string;
  pointsFor: number;
  wins: number;
  luck: number;
};

type TooltipPayload = { payload: LuckPoint };

function LuckTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[#0a0b0f] px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold">{p.label}</div>
      <div className="text-[var(--muted)]">PF {p.pointsFor} · {p.wins} wins</div>
      <div className={p.luck > 0 ? "text-emerald-300" : p.luck < 0 ? "text-red-400" : ""}>
        luck {p.luck > 0 ? "+" : ""}
        {p.luck}
      </div>
    </div>
  );
}

export function LuckScatter({ points, avgPf }: { points: LuckPoint[]; avgPf: number }) {
  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
          <XAxis
            type="number"
            dataKey="pointsFor"
            name="Points For"
            tick={{ fill: "#9aa3b2", fontSize: 11 }}
            domain={["dataMin - 50", "dataMax + 50"]}
            label={{ value: "Points For →", position: "insideBottom", offset: -15, fill: "#9aa3b2", fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="wins"
            name="Wins"
            tick={{ fill: "#9aa3b2", fontSize: 11 }}
            label={{ value: "Wins →", angle: -90, position: "insideLeft", fill: "#9aa3b2", fontSize: 11 }}
          />
          <ZAxis range={[80, 80]} />
          <ReferenceLine x={avgPf} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
          <Tooltip content={<LuckTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.2)" }} />
          <Scatter
            data={points}
            fill="#34d399"
            shape="circle"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
