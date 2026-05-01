"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useSimulationStore } from "@/lib/stores/simulation-store";
import { ZONE_OPTIONS } from "@/lib/simulation/site-config";

export function FillLevelTrend() {
  const bins = useSimulationStore((s) => s.bins);

  // Group bins by zone and calculate average fill
  const data = ZONE_OPTIONS.map((zone) => {
    const zoneBins = bins.filter((b) => b.zone === zone.key);
    const avg =
      zoneBins.length > 0
        ? zoneBins.reduce((s, b) => s + b.current_fill_percent, 0) / zoneBins.length
        : 0;
    return { zone: zone.label, doluluk: parseFloat(avg.toFixed(1)) };
  });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="zone" tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "Kritik", fill: "#ef4444", fontSize: 10 }} />
        <Area type="monotone" dataKey="doluluk" stroke="#3b82f6" fill="url(#fillGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
