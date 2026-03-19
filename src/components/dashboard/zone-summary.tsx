"use client";

import { useSimulationStore } from "@/lib/stores/simulation-store";
import { FillLevelBar } from "./fill-level-bar";

const zoneConfig: Record<string, { label: string; color: string }> = {
  muhendislik: { label: "Muhendislik", color: "#3b82f6" },
  fen: { label: "Fen", color: "#8b5cf6" },
  edebiyat: { label: "Edebiyat", color: "#f59e0b" },
  yemekhane: { label: "Yemekhane", color: "#ef4444" },
  kutuphane: { label: "Kutuphane", color: "#10b981" },
  spor: { label: "Spor", color: "#06b6d4" },
};

export function ZoneSummary() {
  const bins = useSimulationStore((s) => s.bins);

  const zones = Object.entries(zoneConfig).map(([key, config]) => {
    const zoneBins = bins.filter((b) => b.zone === key);
    const avgFill =
      zoneBins.length > 0
        ? zoneBins.reduce((sum, b) => sum + b.current_fill_percent, 0) /
          zoneBins.length
        : 0;

    return {
      key,
      ...config,
      binCount: zoneBins.length,
      avgFill,
      criticalCount: zoneBins.filter((b) => b.status === "critical").length,
    };
  });

  return (
    <div className="space-y-3">
      {zones.map((zone) => (
        <div key={zone.key} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: zone.color }}
              />
              <span className="text-sm font-medium">{zone.label}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{zone.binCount} kutu</span>
              {zone.criticalCount > 0 && (
                <span className="text-red-500">
                  {zone.criticalCount} kritik
                </span>
              )}
            </div>
          </div>
          <FillLevelBar value={zone.avgFill} showLabel={false} />
        </div>
      ))}
    </div>
  );
}
