"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useSimulationStore } from "@/lib/stores/simulation-store";
import { ZONE_OPTIONS } from "@/lib/simulation/site-config";

export function ZoneEfficiencyChart() {
  const bins = useSimulationStore((s) => s.bins);

  const data = ZONE_OPTIONS.map((zone) => {
    const zoneBins = bins.filter((b) => b.zone === zone.key);
    const avg =
      zoneBins.length > 0
        ? zoneBins.reduce((s, b) => s + b.current_fill_percent, 0) / zoneBins.length
        : 0;
    const critical = zoneBins.filter((b) => b.status === "critical").length;

    return {
      zone: zone.label,
      doluluk: parseFloat(avg.toFixed(1)),
      kritik: critical,
      fill: zone.color,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="zone" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="doluluk" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
