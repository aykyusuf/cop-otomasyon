"use client";

import { useMemo } from "react";
import { useSimulationStore } from "@/lib/stores/simulation-store";
import {
  WASTE_COMPOSITION_COLORS,
  WASTE_COMPOSITION_KEYS,
  WASTE_COMPOSITION_LABELS,
  ZONE_OPTIONS,
} from "@/lib/simulation/site-config";
import { normalizeWasteComposition } from "@/lib/simulation/production-model";

export function ZoneWasteComposition() {
  const bins = useSimulationStore((s) => s.bins);

  const data = useMemo(
    () =>
      ZONE_OPTIONS.map((zone) => {
        const zoneBins = bins.filter((bin) => bin.zone === zone.key);
        const totals = WASTE_COMPOSITION_KEYS.reduce(
          (acc, key) => {
            acc[key] = 0;
            return acc;
          },
          {} as Record<(typeof WASTE_COMPOSITION_KEYS)[number], number>
        );

        zoneBins.forEach((bin) => {
          const composition = normalizeWasteComposition(bin.waste_composition);
          WASTE_COMPOSITION_KEYS.forEach((key) => {
            totals[key] += composition[key];
          });
        });

        const totalAmount = WASTE_COMPOSITION_KEYS.reduce(
          (sum, key) => sum + totals[key],
          0
        );

        const percentages = WASTE_COMPOSITION_KEYS.reduce(
          (acc, key) => {
            acc[key] =
              totalAmount > 0 ? (totals[key] / totalAmount) * 100 : 0;
            return acc;
          },
          {} as Record<(typeof WASTE_COMPOSITION_KEYS)[number], number>
        );

        return {
          key: zone.key,
          label: zone.label,
          color: zone.color,
          hasData: totalAmount > 0,
          percentages,
        };
      }),
    [bins]
  );

  return (
    <div className="space-y-3">
      {data.map((zone) => (
        <div
          key={zone.key}
          className="rounded-lg border border-border/60 p-3 space-y-2"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: zone.color }}
              />
              <span className="text-sm font-medium">{zone.label}</span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {zone.hasData ? "Canli bolge dagilimi" : "Henuz veri yok"}
            </span>
          </div>

          <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
            {Object.entries(zone.percentages).map(([key, value]) => (
              <div
                key={key}
                className="h-full"
                style={{
                  width: `${value}%`,
                  backgroundColor:
                    WASTE_COMPOSITION_COLORS[
                      key as keyof typeof WASTE_COMPOSITION_COLORS
                    ],
                }}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            {Object.entries(zone.percentages).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        WASTE_COMPOSITION_COLORS[
                          key as keyof typeof WASTE_COMPOSITION_COLORS
                        ],
                    }}
                  />
                  <span>
                    {
                      WASTE_COMPOSITION_LABELS[
                        key as keyof typeof WASTE_COMPOSITION_LABELS
                      ]
                    }
                  </span>
                </div>
                <span className="font-medium text-foreground">
                  {value.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
