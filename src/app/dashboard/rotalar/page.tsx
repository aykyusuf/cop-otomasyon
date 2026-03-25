"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { CampusMap } from "@/components/map/campus-map";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useSimulationStore } from "@/lib/stores/simulation-store";
import {
  optimizeRoute,
  type RouteOptimizationResult,
} from "@/lib/algorithms/route-optimizer";
import { Route, Play, CheckCircle, MapPin, Clock, Ruler } from "lucide-react";
import { toast } from "sonner";
import { FillLevelBar } from "@/components/dashboard/fill-level-bar";

export default function RotalarPage() {
  const bins = useSimulationStore((s) => s.bins);
  const collectBin = useSimulationStore((s) => s.collectBin);
  const [threshold, setThreshold] = useState(70);
  const [result, setResult] = useState<RouteOptimizationResult | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [collectedCount, setCollectedCount] = useState(0);
  const [collectedBinIds, setCollectedBinIds] = useState<Set<number>>(new Set());
  const collectingRef = useRef(false);

  // Cancel collection on unmount
  useEffect(() => {
    return () => { collectingRef.current = false; };
  }, []);

  const handleGenerate = () => {
    collectingRef.current = false;
    setCollectedBinIds(new Set());
    setCollecting(false);

    const r = optimizeRoute(bins, threshold);
    setResult(r);
    setCollectedCount(0);
    if (r.orderedBins.length === 0) {
      toast.info("Esik ustunde kutu bulunamadi.");
    } else {
      toast.success(`${r.orderedBins.length} kutu icin rota olusturuldu.`);
    }
  };

  const handleCollect = async () => {
    if (!result || result.orderedBins.length === 0) return;
    setCollecting(true);
    collectingRef.current = true;
    setCollectedCount(0);
    setCollectedBinIds(new Set());

    for (let i = 0; i < result.orderedBins.length; i++) {
      if (!collectingRef.current) break;

      setCollectedCount(i + 1); // trigger vehicle animation FIRST
      await new Promise((r) => setTimeout(r, 800));

      if (!collectingRef.current) break;

      // Collect bin individually so it visually empties on map
      collectBin(result.orderedBins[i].id);
      setCollectedBinIds((prev) => new Set(prev).add(result.orderedBins[i].id));
    }

    if (collectingRef.current) {
      toast.success("Toplama tamamlandi!");

      // Save route to DB
      fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Rota-${new Date().toLocaleTimeString("tr-TR")}`,
          totalDistance: result.totalDistance,
          totalBins: result.orderedBins.length,
          estimatedDurationMin: result.estimatedDurationMin,
          stops: result.orderedBins.map((b, i) => ({
            binId: b.id,
            stopOrder: i + 1,
          })),
        }),
      }).catch(console.error);
    }

    setCollecting(false);
    collectingRef.current = false;
  };

  const routePoints = result?.routePoints;

  return (
    <>
      <DashboardHeader title="Rota Optimizasyonu" />
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 p-4">
          <CampusMap
            className="w-full h-full rounded-xl border border-border"
            routePoints={routePoints}
            collectingIndex={collecting ? collectedCount : undefined}
            collectedBinIds={collecting || collectedBinIds.size > 0 ? collectedBinIds : undefined}
          />
        </div>

        {/* Side panel */}
        <div className="w-80 border-l p-4 overflow-y-auto space-y-4">
          {/* Generator */}
          <div className="glass rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Route className="w-4 h-4" /> Rota Olustur
            </h3>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                Doluluk Esigi: {threshold}%
              </label>
              <Slider
                value={[threshold]}
                onValueChange={(val) => setThreshold(Array.isArray(val) ? val[0] : val)}
                min={30}
                max={100}
                step={5}
              />
            </div>
            <Button onClick={handleGenerate} className="w-full" size="sm">
              <Route className="w-4 h-4 mr-2" /> Rota Hesapla
            </Button>
          </div>

          {/* Route info */}
          {result && result.orderedBins.length > 0 && (
            <>
              <div className="glass rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-sm">Rota Bilgisi</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{result.orderedBins.length} durak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-muted-foreground" />
                    <span>{result.totalDistance.toFixed(0)} px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>~{result.estimatedDurationMin} dk</span>
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className="text-xs text-emerald-500"
                    >
                      %{result.improvementPercent.toFixed(1)} iyilestirme
                    </Badge>
                  </div>
                </div>

                {collecting ? (
                  <div className="space-y-2">
                    <FillLevelBar
                      value={
                        (collectedCount / result.orderedBins.length) * 100
                      }
                      label={`${collectedCount}/${result.orderedBins.length} toplandi`}
                    />
                  </div>
                ) : (
                  <Button
                    onClick={handleCollect}
                    className="w-full bg-emerald-600 hover:bg-emerald-500"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-2" /> Toplamaya Basla
                  </Button>
                )}
              </div>

              {/* Stop list */}
              <div className="glass rounded-xl p-4 space-y-2">
                <h3 className="font-semibold text-sm">Duraklar</h3>
                {result.orderedBins.map((bin, i) => (
                  <div
                    key={bin.id}
                    className="flex items-center gap-3 p-2 rounded-lg text-sm"
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        collecting && i < collectedCount
                          ? "bg-emerald-500/20 text-emerald-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {collecting && i < collectedCount ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span className="flex-1 font-medium">{bin.name}</span>
                    <span className="text-muted-foreground">
                      {bin.current_fill_percent.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
