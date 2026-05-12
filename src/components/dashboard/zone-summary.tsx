"use client";

import { useSimulationStore } from "@/lib/stores/simulation-store";
import { FillLevelBar } from "./fill-level-bar";
import { ZONE_OPTIONS } from "@/lib/simulation/site-config";

export function ZoneSummary() {
  const bins = useSimulationStore((s) => s.bins);

  const zones = ZONE_OPTIONS.map((config) => {
    const key = config.key;
    const zoneBins = bins.filter((b) => b.zone === key);
    const avgFill =
      zoneBins.length > 0
        ? zoneBins.reduce((sum, b) => sum + b.current_fill_percent, 0) /
          zoneBins.length
        : 0;

    return {
      key,
      label: config.label,
      color: config.color,
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
