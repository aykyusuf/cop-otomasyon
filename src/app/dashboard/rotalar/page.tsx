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
  insertBinCheapest,
  type RouteOptimizationResult,
} from "@/lib/algorithms/route-optimizer";
import {
  evaluateWaitingScenarios,
  type WaitingScenarioResult,
} from "@/lib/simulation/waiting-strategies";
import {
  DECISION_MODE_CONFIG,
  type DecisionMode,
} from "@/lib/simulation/decision-engine";
import {
  evaluateAlternativePlans,
  type AlternativePlanResult,
} from "@/lib/simulation/route-variants";
import { projectBinForward } from "@/lib/simulation/production-model";
import { DEPOT_POINT } from "@/lib/simulation/site-config";
import { Route, Play, CheckCircle, MapPin, Clock, Ruler, PauseCircle, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { FillLevelBar } from "@/components/dashboard/fill-level-bar";

type RouteExecutionPhase = "idle" | "moving-to-node" | "waiting" | "collecting";
const MOVE_TO_NODE_MS = 1400;
const WAIT_TICK_MS = 1400;
const COLLECTION_STOP_MS = 1200;
const COLLECTION_PROGRESS_STEPS = 6;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resetRouteState(
  setResult: (value: RouteOptimizationResult | null) => void,
  setScenarioResults: (value: WaitingScenarioResult[]) => void,
  setSelectedScenarioId: (value: string | null) => void,
  setTravelIndex: (value: number) => void,
  setCollectedCount: (value: number) => void,
  setCollectedBinIds: (value: Set<number>) => void,
  setCollectingBinId: (value: number | null) => void,
  setCollectionProgress: (value: number) => void,
  setCollecting: (value: boolean) => void,
  setPhase: (value: RouteExecutionPhase) => void,
  setWaitProgress: (value: number) => void,
  setWaitStep: (value: number) => void,
  setMapRouteOverride: (value: { latitude: number; longitude: number }[] | null) => void,
  setVehicleStepIndex: (value: number | undefined) => void
) {
  setResult(null);
  setScenarioResults([]);
  setSelectedScenarioId(null);
  setTravelIndex(0);
  setCollectedCount(0);
  setCollectedBinIds(new Set());
  setCollectingBinId(null);
  setCollectionProgress(0);
  setCollecting(false);
  setPhase("idle");
  setWaitProgress(0);
  setWaitStep(0);
  setMapRouteOverride(null);
  setVehicleStepIndex(undefined);
}

export default function RotalarPage() {
  const bins = useSimulationStore((s) => s.bins);
  const collectBin = useSimulationStore((s) => s.collectBin);
  const replaceBins = useSimulationStore((s) => s.replaceBins);
  const advanceTicks = useSimulationStore((s) => s.advanceTicks);
  const speed = useSimulationStore((s) => s.speed);
  const tickCount = useSimulationStore((s) => s.tickCount);
  const [threshold, setThreshold] = useState(70);
  const [decisionMode, setDecisionMode] = useState<DecisionMode>("balanced");
  const [alternativePlans, setAlternativePlans] = useState<AlternativePlanResult[]>([]);
  const [result, setResult] = useState<RouteOptimizationResult | null>(null);
  const [scenarioResults, setScenarioResults] = useState<WaitingScenarioResult[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [, setCollecting] = useState(false);
  const [phase, setPhase] = useState<RouteExecutionPhase>("idle");
  const [travelIndex, setTravelIndex] = useState(0);
  const [collectedCount, setCollectedCount] = useState(0);
  const [collectedBinIds, setCollectedBinIds] = useState<Set<number>>(new Set());
  const [collectingBinId, setCollectingBinId] = useState<number | null>(null);
  const [collectionProgress, setCollectionProgress] = useState(0);
  const [waitProgress, setWaitProgress] = useState(0);
  const [waitStep, setWaitStep] = useState(0);
  const [mapRouteOverride, setMapRouteOverride] = useState<
    { latitude: number; longitude: number }[] | null
  >(null);
  const [vehicleStepIndex, setVehicleStepIndex] = useState<number | undefined>(undefined);
  const [dynamicAddedIds, setDynamicAddedIds] = useState<Set<number>>(new Set());
  const collectingRef = useRef(false);
  // Rota içindeki kutu ID'lerini takip eder (dinamik ekleme için)
  const routeBinIdsRef = useRef<Set<number>>(new Set());
  // Anlık result'u ref'te de tutuyoruz (closure sorununu çözmek için)
  const resultRef = useRef<RouteOptimizationResult | null>(null);
  const collectedCountRef = useRef(0);
  const isExecutingRoute = phase !== "idle";
  const isCollectingPhase = phase === "collecting";

  // Cancel collection on unmount
  useEffect(() => {
    return () => { collectingRef.current = false; };
  }, []);

  // result değiştikçe ref'i güncelle
  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  // collectedCount değiştikçe ref'i güncelle
  useEffect(() => {
    collectedCountRef.current = collectedCount;
  }, [collectedCount]);

  // ── Dinamik rota güncelleme ──────────────────────────────────────────────
  // Toplama sırasında eşiği aşan YENİ kutular cheapest-insertion ile eklenir
  useEffect(() => {
    if (phase !== "collecting") return;
    const current = resultRef.current;
    if (!current) return;

    const newBins = bins.filter(
      (b) =>
        b.current_fill_percent >= threshold &&
        b.status !== "offline" &&
        b.status !== "collecting" &&
        !routeBinIdsRef.current.has(b.id) &&
        !collectedBinIds.has(b.id)
    );

    if (newBins.length === 0) return;

    let updatedResult = { ...current };
    const addedNames: string[] = [];

    for (const newBin of newBins) {
      const vehicleRouteIdx = collectedCountRef.current;
      const { orderedBins, routePoints } = insertBinCheapest(
        updatedResult.orderedBins,
        updatedResult.routePoints,
        newBin,
        vehicleRouteIdx
      );
      updatedResult = { ...updatedResult, orderedBins, routePoints };
      routeBinIdsRef.current.add(newBin.id);
      addedNames.push(newBin.name);
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(updatedResult);
    setDynamicAddedIds((prev) => {
      const next = new Set(prev);
      newBins.forEach((b) => next.add(b.id));
      return next;
    });

    toast(`Rotaya eklendi: ${addedNames.join(", ")}`, {
      description: `Doluluk eşiğini (${threshold}%) aştı, en kısa yola eklendi.`,
      duration: 4000,
    });
  }, [bins, phase, threshold, collectedBinIds]);

  const handleGenerate = () => {
    collectingRef.current = false;
    setDynamicAddedIds(new Set());
    routeBinIdsRef.current = new Set();
    resetRouteState(
      setResult,
      setScenarioResults,
      setSelectedScenarioId,
      setTravelIndex,
      setCollectedCount,
      setCollectedBinIds,
      setCollectingBinId,
      setCollectionProgress,
      setCollecting,
      setPhase,
      setWaitProgress,
      setWaitStep,
      setMapRouteOverride,
      setVehicleStepIndex
    );
    setAlternativePlans([]);

    const plans = evaluateAlternativePlans(
      bins,
      threshold,
      speed,
      tickCount
    );
    const activePlan =
      plans.find((plan) => plan.decisionMode === decisionMode) || plans[0] || null;
    const scenarios = activePlan?.scenarios || [];
    const bestScenario = activePlan?.recommendedScenario || null;

    setAlternativePlans(plans);
    setScenarioResults(scenarios);
    setSelectedScenarioId(bestScenario?.scenario.id || null);
    setResult(bestScenario?.route || null);
    if (bestScenario?.route) {
      routeBinIdsRef.current = new Set(bestScenario.route.orderedBins.map((b) => b.id));
    }

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
    const baseScenario =
      scenarioResults.find((item) => item.scenario.id === selectedScenarioId) || null;

    if (!result || result.orderedBins.length === 0 || !baseScenario) return;
    collectingRef.current = true;
    setTravelIndex(0);
    setCollectedCount(0);
    setCollectedBinIds(new Set());
    setCollectingBinId(null);
    setCollectionProgress(0);
    setWaitProgress(0);
    setWaitStep(0);
    setVehicleStepIndex(undefined);

    let activeRoute = result;
    const collectionItems: {
      binId: number;
      fillAtCollection: number;
    }[] = [];
    if (baseScenario.scenario.waitTicks > 0 && baseScenario.waitingNode) {
      setPhase("moving-to-node");
      setMapRouteOverride([
        DEPOT_POINT,
        {
          latitude: baseScenario.waitingNode.latitude,
          longitude: baseScenario.waitingNode.longitude,
        },
      ]);
      setVehicleStepIndex(1);
      toast.info(`${baseScenario.waitingNode.label} noktasina geciliyor.`);
      await sleep(MOVE_TO_NODE_MS);

      if (!collectingRef.current) {
        setCollecting(false);
        setPhase("idle");
        setMapRouteOverride(null);
        setVehicleStepIndex(undefined);
        setCollectingBinId(null);
        setCollectionProgress(0);
        return;
      }

      setPhase("waiting");
      toast.info(
        `${baseScenario.scenario.label} uygulanıyor. Kutular ${baseScenario.scenario.waitTicks} cevrim ileri projekte edilecek.`
      );

      let projectedBins = bins;
      let projectedTickCount = tickCount;

      for (let step = 1; step <= baseScenario.scenario.waitTicks; step++) {
        setWaitStep(step);
        await sleep(WAIT_TICK_MS);
        if (!collectingRef.current) break;

        projectedBins = projectedBins.map((bin) =>
          projectBinForward(bin, speed, projectedTickCount, 1)
        );
        projectedTickCount += 1;
        replaceBins(projectedBins);
        advanceTicks(1);
        setWaitProgress((step / baseScenario.scenario.waitTicks) * 100);
      }

      if (!collectingRef.current) {
        setCollecting(false);
        setPhase("idle");
        setWaitStep(0);
        setMapRouteOverride(null);
        setVehicleStepIndex(undefined);
        setCollectingBinId(null);
        setCollectionProgress(0);
        return;
      }

      const refreshedScenarios = evaluateWaitingScenarios(
        projectedBins,
        threshold,
        speed,
        projectedTickCount,
        decisionMode
      );
      const dispatchScenario =
        refreshedScenarios.find((item) => item.scenario.id === "dispatch-now") ||
        refreshedScenarios[0] ||
        null;

      activeRoute = optimizeRoute(
        projectedBins,
        dispatchScenario?.metrics.effectiveThreshold || threshold,
        {
        startPoint: {
          latitude: baseScenario.waitingNode.latitude,
          longitude: baseScenario.waitingNode.longitude,
        },
      });

      setScenarioResults(refreshedScenarios);
      setSelectedScenarioId(dispatchScenario?.scenario.id || null);
      setResult(activeRoute);
      routeBinIdsRef.current = new Set(activeRoute.orderedBins.map((b) => b.id));
      setMapRouteOverride(null);
      setVehicleStepIndex(undefined);
      setWaitProgress(100);
      setWaitStep(0);
      toast.success("Bekleme tamamlandi. Rota guncellendi ve toplama basliyor.");
    }

    setPhase("collecting");
    setCollecting(true);
    setMapRouteOverride(null);
    setVehicleStepIndex(undefined);

    // Dinamik ekleme için rotadaki kutuların ID'lerini ve mevcut result'u ref'e yaz
    resultRef.current = activeRoute;
    routeBinIdsRef.current = new Set(activeRoute.orderedBins.map((b) => b.id));

    // ── ID bazlı toplama döngüsü ─────────────────────────────────────────────
    // index yerine ID takip ediyoruz → dinamik ekleme sırasında kayma olmaz
    const collectedIdsLocal = new Set<number>();
    while (collectingRef.current) {
      const currentResult = resultRef.current;
      if (!currentResult) break;

      // Henüz toplanmamış ilk kutuyu bul (sıra dinamik ekleme ile değişebilir)
      const nextBin = currentResult.orderedBins.find((b) => !collectedIdsLocal.has(b.id));
      if (!nextBin) break;

      const stopIndex = currentResult.orderedBins.indexOf(nextBin) + 1;
      setTravelIndex(stopIndex);
      setCollectedCount(stopIndex);
      await sleep(800);

      if (!collectingRef.current) break;

      setCollectingBinId(nextBin.id);
      for (let step = 1; step <= COLLECTION_PROGRESS_STEPS; step++) {
        setCollectionProgress((step / COLLECTION_PROGRESS_STEPS) * 100);
        await sleep(COLLECTION_STOP_MS / COLLECTION_PROGRESS_STEPS);
        if (!collectingRef.current) break;
      }

      if (!collectingRef.current) break;

      collectionItems.push({
        binId: nextBin.id,
        fillAtCollection: nextBin.current_fill_percent,
      });

      collectBin(nextBin.id);
      setCollectedBinIds((prev) => new Set(prev).add(nextBin.id));
      setCollectingBinId(null);
      setCollectionProgress(0);
      collectedIdsLocal.add(nextBin.id);
    }

    // Tamamlanmış rotaya göre depot'a dön
    const finalRoute = resultRef.current || activeRoute;
    if (collectingRef.current && finalRoute.routePoints.length > 1) {
      setTravelIndex(finalRoute.routePoints.length - 1);
      await sleep(900);
    }

    // Animate vehicle back to DEPOT (last element in routePoints)
    if (collectingRef.current && result.routePoints.length > 1) {
      setCollectedCount(result.routePoints.length - 1);
      await new Promise((r) => setTimeout(r, 800));
    }

    if (collectingRef.current) {
      toast.success("Toplama tamamlandı!");

      try {
        const routeResponse = await fetch("/api/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `Rota-${new Date().toLocaleTimeString("tr-TR")}`,
            totalDistance: finalRoute.totalDistance,
            totalBins: finalRoute.orderedBins.length,
            estimatedDurationMin: finalRoute.estimatedDurationMin,
            stops: finalRoute.orderedBins.map((b, i) => ({
              binId: b.id,
              stopOrder: i + 1,
            })),
          }),
        });

        const routeData = routeResponse.ok ? await routeResponse.json() : null;
        const routeId =
          routeData && typeof routeData.id === "number" ? routeData.id : null;

        await fetch("/api/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: collectionItems.map((item) => ({
              binId: item.binId,
              routeId,
              fillAtCollection: item.fillAtCollection,
            })),
          }),
        });

        if (routeId != null) {
          await fetch(`/api/routes/${routeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "completed" }),
          });
        }
      } catch (error) {
        console.error(error);
      }
    }

    collectingRef.current = false;
    resetRouteState(
      setResult,
      setScenarioResults,
      setSelectedScenarioId,
      setTravelIndex,
      setCollectedCount,
      setCollectedBinIds,
      setCollectingBinId,
      setCollectionProgress,
      setCollecting,
      setPhase,
      setWaitProgress,
      setWaitStep,
      setMapRouteOverride,
      setVehicleStepIndex
    );
  };

  const selectedScenario =
    scenarioResults.find((item) => item.scenario.id === selectedScenarioId) || null;
  const selectedPlan =
    alternativePlans.find((plan) => plan.decisionMode === decisionMode) || null;
  const routePoints = mapRouteOverride || result?.routePoints;
  const activeMapStep =
    phase === "moving-to-node" || phase === "waiting"
      ? vehicleStepIndex
      : isCollectingPhase
        ? travelIndex
        : undefined;

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
            waitingNodeHint={
              selectedScenario?.waitingNode
                ? "Arac dogrudan kutuda degil, bu bolgeyi tarayan node noktasinda bekler."
                : null
            }
            collectingIndex={activeMapStep}
            collectingBinId={collectingBinId}
            collectionProgress={collectionProgress}
            collectedBinIds={isExecutingRoute || collectedBinIds.size > 0 ? collectedBinIds : undefined}
          />
        </div>

        {/* Side panel */}
        <div className="h-[44vh] min-h-[260px] overflow-y-auto border-t p-4 space-y-4 lg:h-full lg:min-h-0 lg:max-h-full lg:w-80 lg:border-l lg:border-t-0 lg:overflow-y-auto">
          {/* Generator */}
          <div className="glass rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Route className="w-4 h-4" /> Rota Oluştur
            </h3>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                Karar Profili
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(DECISION_MODE_CONFIG).map((mode) => (
                  <Button
                    key={mode.id}
                    type="button"
                    size="sm"
                    variant={decisionMode === mode.id ? "default" : "outline"}
                    disabled={isExecutingRoute}
                    className="h-auto py-2 text-xs"
                    onClick={() => setDecisionMode(mode.id)}
                  >
                    {mode.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {DECISION_MODE_CONFIG[decisionMode].description}
              </p>
            </div>
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

          {alternativePlans.length > 0 && (
            <div className="glass rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-sm">Alternatif Planlar</h3>
              <div className="space-y-2">
                {alternativePlans.map((plan) => {
                  const recommended = plan.recommendedScenario;
                  const activePlanCard = plan.decisionMode === decisionMode;

                  return (
                    <button
                      key={plan.decisionMode}
                      disabled={isExecutingRoute || !recommended}
                      onClick={() => {
                        if (!recommended) return;
                        setDecisionMode(plan.decisionMode);
                        setScenarioResults(plan.scenarios);
                        setSelectedScenarioId(recommended.scenario.id);
                        setResult(recommended.route);
                        routeBinIdsRef.current = new Set(
                          recommended.route.orderedBins.map((b) => b.id)
                        );
                        setDynamicAddedIds(new Set());
                      }}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        activePlanCard ? "border-sky-500 bg-sky-500/8" : "hover:bg-accent"
                      } ${isExecutingRoute ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            {DECISION_MODE_CONFIG[plan.decisionMode].label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {DECISION_MODE_CONFIG[plan.decisionMode].description}
                          </p>
                        </div>
                        {recommended && (
                          <Badge variant="outline" className="text-sky-500">
                            {recommended.scenario.label}
                          </Badge>
                        )}
                      </div>
                      {recommended ? (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <span>{recommended.route.orderedBins.length} durak</span>
                          <span>{recommended.route.totalDistance.toFixed(0)} px</span>
                          <span>{recommended.projectedCriticalBins} kritik</span>
                          <span>Skor {recommended.score.toFixed(0)}</span>
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Uygun plan bulunamadi.
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                      disabled={isExecutingRoute}
                      onClick={() => {
                        setSelectedScenarioId(scenarioResult.scenario.id);
                        setResult(scenarioResult.route);
                        routeBinIdsRef.current = new Set(
                          scenarioResult.route.orderedBins.map((b) => b.id)
                        );
                        setDynamicAddedIds(new Set());
                        setCollectedCount(0);
                        setCollectedBinIds(new Set());
                        setCollecting(false);
                        collectingRef.current = false;
                      }}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        active ? "border-emerald-500 bg-emerald-500/8" : "hover:bg-accent"
                      } ${isExecutingRoute ? "cursor-not-allowed opacity-60" : ""}${
                        phase === "waiting" && active ? " ring-1 ring-amber-400/50" : ""
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
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                        <span>Esik %{scenarioResult.metrics.effectiveThreshold}</span>
                        <span>Sure ~{scenarioResult.route.estimatedDurationMin} dk</span>
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
                    <p className="mt-2">
                      Karar profili: {DECISION_MODE_CONFIG[selectedScenario.decisionMode].label}
                      , esik %{selectedScenario.metrics.effectiveThreshold}
                    </p>
                    {selectedPlan?.recommendedScenario && (
                      <p className="mt-2">
                        Bu profilin onerilen plani: {selectedPlan.recommendedScenario.scenario.label}
                      </p>
                    )}
                    {selectedScenario.waitingNode && (
                      <p className="mt-2">
                        Arac kutuda degil, once {selectedScenario.waitingNode.label} node noktasinda
                        bekleyip sonra cevredeki kutular icin rotaya cikabilir.
                      </p>
                    )}
                  </div>
                )}
                {phase === "moving-to-node" && selectedScenario?.waitingNode && (
                  <div className="rounded-lg border border-sky-500/25 bg-sky-500/5 p-3 text-xs text-muted-foreground">
                    Arac bekleme dugumune gidiyor: {selectedScenario.waitingNode.label}
                  </div>
                )}
                {phase === "waiting" && selectedScenario && (
                  <div className="space-y-2 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                    <p>
                      {selectedScenario.waitingNode?.label || "Secili dugum"} noktasinda bekleniyor.
                      Sistem doluluklari ileri projekte edip rotayi yeniden hesapliyor.
                    </p>
                    <p className="font-medium text-foreground">
                      Bekleme adimi: {waitStep}/{selectedScenario.scenario.waitTicks}
                    </p>
                    <FillLevelBar
                      value={waitProgress}
                      label={`${selectedScenario.scenario.waitTicks} cevrimlik bekleme uygulanıyor`}
                    />
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
                      %{result.improvementPercent.toFixed(1)} iyileştirme
                    </Badge>
                  </div>
                </div>

                {isCollectingPhase ? (
                  <div className="space-y-2">
                    <FillLevelBar
                      value={
                        (collectedCount / Math.max(1, result.orderedBins.length)) * 100
                      }
                      label={`${collectedCount}/${result.orderedBins.length} toplandı`}
                    />
                  </div>
                ) : isExecutingRoute ? (
                  <Button
                    disabled
                    className="w-full"
                    size="sm"
                    variant="secondary"
                  >
                    {phase === "moving-to-node" ? "Bekleme noktasina gidiliyor" : "Bekleme simulasyonu suruyor"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleCollect}
                    className="w-full bg-emerald-600 hover:bg-emerald-500"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-2" /> Toplamaya Başla
                  </Button>
                )}
              </div>

              {/* Stop list */}
              <div className="glass rounded-xl p-4 space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  Duraklar
                  {dynamicAddedIds.size > 0 && (
                    <Badge className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                      +{dynamicAddedIds.size} dinamik
                    </Badge>
                  )}
                </h3>
                <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
                  {result.orderedBins.map((bin, i) => {
                    const isDynamic = dynamicAddedIds.has(bin.id);
                    const isCollected = collectedBinIds.has(bin.id);
                    return (
                      <div
                        key={bin.id}
                        className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${
                          isDynamic ? "bg-blue-500/5 border border-blue-500/20" : ""
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCollected
                              ? "bg-emerald-500/20 text-emerald-500"
                              : isDynamic
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isCollected ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : isDynamic ? (
                            <PlusCircle className="w-4 h-4" />
                          ) : (
                            i + 1
                          )}
                        </span>
                        <span className="flex-1 font-medium">{bin.name}</span>
                        {isDynamic && (
                          <span className="text-xs text-blue-400 mr-1">yeni</span>
                        )}
                        <span className="text-muted-foreground">
                          {bin.current_fill_percent.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
