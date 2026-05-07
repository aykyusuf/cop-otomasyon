"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useSimulationStore } from "@/lib/stores/simulation-store";

const STATUS_COLORS: Record<string, string> = {
  normal: "#22c55e",
  warning: "#eab308",
  critical: "#ef4444",
  offline: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  normal: "Normal",
  warning: "Uyarı",
  critical: "Kritik",
  offline: "Çevrimdışı",
};

export function BinStatusOverview() {
  const bins = useSimulationStore((s) => s.bins);

  const statusCounts = bins.reduce(
    (acc, bin) => {
      const status = bin.status === "collecting" ? "normal" : bin.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const data = Object.entries(statusCounts).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    color: STATUS_COLORS[status] || "#6b7280",
  }));

  if (data.length === 0) return null;

  return (
    <div className="flex items-center gap-6">
      <div className="w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={55}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
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
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-semibold ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
