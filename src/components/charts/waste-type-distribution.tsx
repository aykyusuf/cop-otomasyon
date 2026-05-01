"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useSimulationStore } from "@/lib/stores/simulation-store";
import {
  WASTE_TYPE_COLORS,
  WASTE_TYPE_LABELS,
} from "@/lib/simulation/site-config";

export function WasteTypeDistribution() {
  const bins = useSimulationStore((s) => s.bins);

  const typeCounts = bins.reduce(
    (acc, b) => {
      acc[b.waste_type] = (acc[b.waste_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const data = Object.entries(typeCounts).map(([type, count]) => ({
    name: WASTE_TYPE_LABELS[type as keyof typeof WASTE_TYPE_LABELS] || type,
    value: count,
    color: WASTE_TYPE_COLORS[type as keyof typeof WASTE_TYPE_COLORS] || "#6b7280",
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={4}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend
          formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
