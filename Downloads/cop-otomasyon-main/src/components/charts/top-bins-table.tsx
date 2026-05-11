"use client";

import { useSimulationStore } from "@/lib/stores/simulation-store";
import { FillLevelBar } from "@/components/dashboard/fill-level-bar";

export function TopBinsTable() {
  const bins = useSimulationStore((s) => s.bins);

  const sorted = bins
    .slice()
    .sort((a, b) => b.current_fill_percent - a.current_fill_percent)
    .slice(0, 10);

  return (
    <div className="space-y-3">
      {sorted.map((bin, i) => (
        <div key={bin.id} className="flex items-center gap-3">
          <span className="w-5 text-xs text-muted-foreground font-mono">
            {i + 1}.
          </span>
          <span className="w-16 text-sm font-medium">{bin.name}</span>
          <div className="flex-1">
            <FillLevelBar value={bin.current_fill_percent} showLabel={false} />
          </div>
          <span className="w-12 text-right text-sm font-mono">
            {bin.current_fill_percent.toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}
