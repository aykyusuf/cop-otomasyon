"use client";

import { useMemo } from "react";
import { useSimulationStore } from "@/lib/stores/simulation-store";
import {
  WASTE_COMPOSITION_COLORS,
  WASTE_COMPOSITION_KEYS,
  WASTE_COMPOSITION_LABELS,
} from "@/lib/simulation/site-config";
import { normalizeWasteComposition } from "@/lib/simulation/production-model";

type CompositionKey = keyof typeof WASTE_COMPOSITION_LABELS;

export function OverallWasteComposition() {
  const bins = useSimulationStore((s) => s.bins);

  const totals = useMemo(() => {
    const aggregate = WASTE_COMPOSITION_KEYS.reduce(
      (acc, key) => {
        acc[key] = 0;
        return acc;
      },
      {} as Record<CompositionKey, number>
    );

    bins.forEach((bin) => {
      const composition = normalizeWasteComposition(bin.waste_composition);
      WASTE_COMPOSITION_KEYS.forEach((key) => {
        aggregate[key] += composition[key];
      });
    });

    const totalAmount = WASTE_COMPOSITION_KEYS.reduce(
      (sum, key) => sum + aggregate[key],
      0
    );

    const percentages = WASTE_COMPOSITION_KEYS.reduce(
      (acc, key) => {
        acc[key] = totalAmount > 0 ? (aggregate[key] / totalAmount) * 100 : 0;
        return acc;
      },
      {} as Record<CompositionKey, number>
    );

    return {
      hasData: totalAmount > 0,
      composition: percentages,
      recyclable: percentages.plastic + percentages.metal,
      nonRecyclable:
        percentages.organic +
        percentages.nonRecyclable +
        percentages.hazardous,
    };
  }, [bins]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <p className="text-[11px] uppercase tracking-wide text-emerald-300/90">
            Geri Donusturulebilir
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {totals.recyclable.toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground">
            Plastik + metal agirlikli toplam oran
          </p>
        </div>

        <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
          <p className="text-[11px] uppercase tracking-wide text-orange-300/90">
            Geri Donusmeyen / Ozel
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {totals.nonRecyclable.toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground">
            Organik, genel ve tehlikeli atiklar dahil
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Kampus Geneli Atik Kompozisyonu</p>
            <p className="text-xs text-muted-foreground">
              {totals.hasData
                ? "Kutularin anlik birikiminden hesaplanir"
                : "Henuz kutularda atik birikmedi"}
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Toplam oran
          </span>
        </div>

        <div className="flex h-3 overflow-hidden rounded-full bg-secondary">
          {WASTE_COMPOSITION_KEYS.map((key) => (
            <div
              key={key}
              className="h-full"
              style={{
                width: `${totals.composition[key]}%`,
                backgroundColor: WASTE_COMPOSITION_COLORS[key],
              }}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {WASTE_COMPOSITION_KEYS.map((key) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: WASTE_COMPOSITION_COLORS[key] }}
                />
                <span>{WASTE_COMPOSITION_LABELS[key]}</span>
              </div>
              <span className="font-medium">
                {totals.composition[key].toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
