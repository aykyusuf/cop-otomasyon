"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { CampusMap } from "@/components/map/campus-map";
import { useSimulationStore } from "@/lib/stores/simulation-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Thermometer, Battery, Trash2 } from "lucide-react";
import {
  WASTE_COMPOSITION_COLORS,
  WASTE_COMPOSITION_LABELS,
  WASTE_TYPE_LABELS,
  ZONE_CONFIG,
} from "@/lib/simulation/site-config";
import { normalizeWasteComposition } from "@/lib/simulation/production-model";

function getFillColorClass(fill: number): string {
  if (fill < 25) return "text-green-500";
  if (fill < 50) return "text-yellow-500";
  if (fill < 75) return "text-orange-500";
  return "text-red-500";
}

export default function HaritaPage() {
  const bins = useSimulationStore((s) => s.bins);
  const selectedBinId = useUIStore((s) => s.selectedBinId);
  const selectBin = useUIStore((s) => s.selectBin);
  const selectedBin = bins.find((b) => b.id === selectedBinId);
  const selectedZoneConfig = selectedBin ? ZONE_CONFIG[selectedBin.zone] : null;
  const selectedBinComposition = selectedBin
    ? normalizeWasteComposition(selectedBin.waste_composition)
    : null;
  const selectedBinCompositionTotal = selectedBinComposition
    ? Object.values(selectedBinComposition).reduce((sum, value) => sum + value, 0)
    : 0;

  const critical = bins.filter((b) => b.status === "critical").length;
  const warning = bins.filter((b) => b.status === "warning").length;

  return (
    <>
      <DashboardHeader title="Kampus Haritasi" />
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden lg:flex-row">
        <div className="min-h-[420px] flex-1 p-4">
          <CampusMap className="w-full h-full rounded-xl border border-border" />
        </div>

        <div className="max-h-[42vh] border-t p-4 overflow-y-auto space-y-4 lg:max-h-none lg:w-80 lg:border-l lg:border-t-0">
          <div className="glass rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-sm">Ozet</h3>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {bins.length} Kutu
              </Badge>
              {critical > 0 && (
                <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs">
                  {critical} Kritik
                </Badge>
              )}
              {warning > 0 && (
                <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">
                  {warning} Uyari
                </Badge>
              )}
            </div>
          </div>

          {selectedBin ? (
            <div className="glass rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{selectedBin.name}</h3>
                <button
                  onClick={() => selectBin(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Kapat
                </button>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Doluluk</span>
                  <span
                    className={getFillColorClass(
                      selectedBin.current_fill_percent
                    )}
                  >
                    {selectedBin.current_fill_percent.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={selectedBin.current_fill_percent}
                  className="h-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedBin.temperature.toFixed(1)} C</span>
                </div>
                <div className="flex items-center gap-2">
                  <Battery className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedBin.battery_level.toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                  <span>{WASTE_TYPE_LABELS[selectedBin.waste_type]}</span>
                </div>
                <div className="text-muted-foreground capitalize">
                  {ZONE_CONFIG[selectedBin.zone]?.label || selectedBin.zone}
                </div>
              </div>

              {selectedZoneConfig && selectedBinComposition && (
                <div className="space-y-2 rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">
                      {selectedZoneConfig.label} / {selectedBin.name} Kompozisyonu
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {selectedBinCompositionTotal > 0 ? "Canli dagilim" : "Henuz birikim yok"}
                    </span>
                  </div>

                  <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
                    {Object.entries(selectedBinComposition).map(([key, value]) => (
                      <div
                        key={key}
                        className="h-full"
                        style={{
                          width: `${
                            selectedBinCompositionTotal > 0
                              ? (value / selectedBinCompositionTotal) * 100
                              : 0
                          }%`,
                          backgroundColor:
                            WASTE_COMPOSITION_COLORS[
                              key as keyof typeof WASTE_COMPOSITION_COLORS
                            ],
                        }}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    {Object.entries(selectedBinComposition).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-2">
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
                          {selectedBinCompositionTotal > 0
                            ? ((value / selectedBinCompositionTotal) * 100).toFixed(1)
                            : "0.0"}
                          %
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">
              Detay icin haritadan bir kutu secin.
            </div>
          )}

          <div className="space-y-1">
            <h3 className="font-semibold text-sm mb-2">Kutular</h3>
            {bins
              .slice()
              .sort(
                (a, b) => b.current_fill_percent - a.current_fill_percent
              )
              .map((bin) => (
                <button
                  key={bin.id}
                  onClick={() => selectBin(bin.id)}
                  className={`w-full flex items-center justify-between gap-3 p-2 rounded-lg text-sm hover:bg-accent transition-colors ${
                    selectedBinId === bin.id ? "bg-accent" : ""
                  }`}
                >
                  <span className="truncate font-medium">{bin.name}</span>
                  <span
                    className={getFillColorClass(bin.current_fill_percent)}
                  >
                    {bin.current_fill_percent.toFixed(0)}%
                  </span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}
