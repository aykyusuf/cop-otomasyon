"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { CampusMap } from "@/components/map/campus-map";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useSimulationStore } from "@/lib/stores/simulation-store";
import type { RouteOptimizationResult } from "@/lib/algorithms/route-optimizer";
import {
  evaluateWaitingScenarios,
  type WaitingScenarioResult,
} from "@/lib/simulation/waiting-strategies";
import { Route, Play, CheckCircle, MapPin, Clock, Ruler, PauseCircle } from "lucide-react";
import { toast } from "sonner";
import { FillLevelBar } from "@/components/dashboard/fill-level-bar";

export default function RotalarPage() {
  const bins = useSimulationStore((s) => s.bins);
  const collectBin = useSimulationStore((s) => s.collectBin);
  const speed = useSimulationStore((s) => s.speed);
  const tickCount = useSimulationStore((s) => s.tickCount);
  const [threshold, setThreshold] = useState(70);
  const [result, setResult] = useState<RouteOptimizationResult | null>(null);
  const [scenarioResults, setScenarioResults] = useState<WaitingScenarioResult[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
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

    const scenarios = evaluateWaitingScenarios(bins, threshold, speed, tickCount);
    const bestScenario = scenarios[0] || null;

    setScenarioResults(scenarios);
    setSelectedScenarioId(bestScenario?.scenario.id || null);
    setResult(bestScenario?.route || null);
    setCollectedCount(0);

    if (!bestScenario || bestScenario.route.orderedBins.length === 0) {
      toast.info("Esik ustunde kutu bulunamadi.");
    } else {
      const waitText =
        bestScenario.scenario.waitTicks > 0
          ? `En iyi sonuc: ${bestScenario.scenario.label}`
          : "Anlik cikis oneriliyor";
      toast.success(`${bestScenario.route.orderedBins.length} kutu icin rota olusturuldu. ${waitText}.`);
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

  const selectedScenario =
    scenarioResults.find((item) => item.scenario.id === selectedScenarioId) || null;
  const routePoints = result?.routePoints;

  return (
    <>
      <DashboardHeader title="Rota Optimizasyonu" />
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden lg:flex-row">
        {/* Map */}
        <div className="min-h-[420px] flex-1 p-4">
          <CampusMap
            className="w-full h-full rounded-xl border border-border"
            routePoints={routePoints}
            waitingNode={selectedScenario?.waitingNode || null}
            collectingIndex={collecting ? collectedCount : undefined}
            collectedBinIds={collecting || collectedBinIds.size > 0 ? collectedBinIds : undefined}
          />
        </div>

        {/* Side panel */}
        <div className="max-h-[44vh] border-t p-4 overflow-y-auto space-y-4 lg:max-h-none lg:w-80 lg:border-l lg:border-t-0">
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

          {scenarioResults.length > 0 && (
            <div className="glass rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-sm">Bekleme Senaryolari</h3>
              <p className="text-xs leading-5 text-muted-foreground">
                Cevrim bekleme, rota cikarmadan once simülasyonun birkac tur daha
                ilerletilip kutularin ek dolum yapmasini ongormek demektir.
              </p>
              <div className="space-y-2">
                {scenarioResults.map((scenarioResult) => {
                  const active = selectedScenarioId === scenarioResult.scenario.id;

                  return (
                    <button
                      key={scenarioResult.scenario.id}
                      onClick={() => {
                        setSelectedScenarioId(scenarioResult.scenario.id);
                        setResult(scenarioResult.route);
                        setCollectedCount(0);
                        setCollectedBinIds(new Set());
                        setCollecting(false);
                        collectingRef.current = false;
                      }}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        active ? "border-emerald-500 bg-emerald-500/8" : "hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{scenarioResult.scenario.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {scenarioResult.scenario.description}
                          </p>
                        </div>
                        {scenarioResult.scenario.waitTicks > 0 ? (
                          <PauseCircle className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Route className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span>{scenarioResult.route.orderedBins.length} durak</span>
                        <span>{scenarioResult.route.totalDistance.toFixed(0)} px</span>
                        <span>{scenarioResult.projectedCriticalBins} kritik kutu</span>
                        <span>{scenarioResult.overflowRisk} tasma riski</span>
                      </div>
                      {scenarioResult.waitingNode && (
                        <p className="mt-2 text-xs text-emerald-600">
                          Bekleme dugumu: {scenarioResult.waitingNode.label}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Route info */}
          {result && result.orderedBins.length > 0 && (
            <>
              <div className="glass rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-sm">Rota Bilgisi</h3>
                {selectedScenario && (
                  <div className="rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-foreground">
                        Secili strateji: {selectedScenario.scenario.label}
                      </span>
                      <Badge variant="outline" className="text-emerald-600">
                        Skor {selectedScenario.score.toFixed(0)}
                      </Badge>
                    </div>
                    {selectedScenario.waitingNode && (
                      <p className="mt-2">
                        Arac once {selectedScenario.waitingNode.label} noktasinda bekleyip sonra rotaya cikabilir.
                      </p>
                    )}
                  </div>
                )}
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
