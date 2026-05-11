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
import { Route, Play, CheckCircle, MapPin, Clock, Ruler, PlusCircle } from "lucide-react";
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
  const [dynamicAddedIds, setDynamicAddedIds] = useState<Set<number>>(new Set());
  const collectingRef = useRef(false);
  // Rota içindeki kutu ID'lerini takip eder (dinamik ekleme için)
  const routeBinIdsRef = useRef<Set<number>>(new Set());
  // Anlık result'u ref'te de tutuyoruz (closure sorununu çözmek için)
  const resultRef = useRef<RouteOptimizationResult | null>(null);
  const collectedCountRef = useRef(0);

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
    if (!collecting) return;
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
      // Aracın şu an hangi routePoint segmentinde olduğunu belirle:
      // collectedCountRef.current = kaç durak tamamlandı
      // routePoints[0] = DEPOT, routePoints[1] = 1. kutu ...
      const vehicleRouteIdx = collectedCountRef.current; // araç bu indexi geçti

      const { orderedBins, routePoints } = insertBinCheapest(
        updatedResult.orderedBins,
        updatedResult.routePoints,
        newBin,
        vehicleRouteIdx
      );

      updatedResult = {
        ...updatedResult,
        orderedBins,
        routePoints,
        totalBins: orderedBins.length,
      };

      routeBinIdsRef.current.add(newBin.id);
      addedNames.push(newBin.name);
    }

    setResult(updatedResult);
    setDynamicAddedIds((prev) => {
      const next = new Set(prev);
      newBins.forEach((b) => next.add(b.id));
      return next;
    });

    toast(`🔄 Rotaya eklendi: ${addedNames.join(", ")}`, {
      description: `Doluluk eşiğini (${threshold}%) aştı, en kısa yola eklendi.`,
      duration: 4000,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bins, collecting]);

  const handleGenerate = () => {
    collectingRef.current = false;
    setCollectedBinIds(new Set());
    setDynamicAddedIds(new Set());
    setCollecting(false);

    const r = optimizeRoute(bins, threshold);
    setResult(r);
    setCollectedCount(0);
    // routeBinIdsRef'i ilk kutu ID listesiyle doldur
    routeBinIdsRef.current = new Set(r.orderedBins.map((b) => b.id));
    if (r.orderedBins.length === 0) {
      toast.info("Eşik üstünde kutu bulunamadı.");
    } else {
      toast.success(`${r.orderedBins.length} kutu için rota oluşturuldu.`);
    }
  };

  const handleCollect = async () => {
    if (!result || result.orderedBins.length === 0) return;

    // ── Başlamadan önce rotayı canlı bin durumuna göre yeniden hesapla ──────
    // Butona basma ile hesaplama arasında geçen sürede bazı kutular
    // dolmuş / boşalmış olabilir. Sadece gerçekten dolu olanları al.
    const freshResult = optimizeRoute(bins, threshold);
    if (freshResult.orderedBins.length === 0) {
      toast.info("Şu an eşik üstünde dolu kutu yok.");
      return;
    }
    setResult(freshResult);
    routeBinIdsRef.current = new Set(freshResult.orderedBins.map((b) => b.id));

    setCollecting(true);
    collectingRef.current = true;
    setCollectedCount(0);
    setCollectedBinIds(new Set());
    setDynamicAddedIds(new Set());

    // Araç DEPOT'ta görünsün diye kısa bekleme
    await new Promise((r) => setTimeout(r, 600));

    // ── ID bazlı toplama döngüsü ─────────────────────────────────────────────
    // index yerine ID takip ediyoruz → dinamik ekleme sırasında kayma olmaz
    const collectedIds = new Set<number>();

    let stopIndex = 0; // routePoints animasyon indeksi
    while (collectingRef.current) {
      const currentResult = resultRef.current;
      if (!currentResult) break;

      // Henüz toplanmamış ilk kutuyu bul
      const nextBin = currentResult.orderedBins.find((b) => !collectedIds.has(b.id));
      if (!nextBin) break; // hepsi toplandı

      stopIndex = currentResult.orderedBins.indexOf(nextBin) + 1;
      setCollectedCount(stopIndex); // araç bu noktaya hareket eder
      await new Promise((r) => setTimeout(r, 800));

      if (!collectingRef.current) break;

      // Canlı doluluk kontrolü: kutu hâlâ dolu mu?
      const liveBin = bins.find((b) => b.id === nextBin.id);
      if (liveBin && liveBin.current_fill_percent >= threshold) {
        collectBin(nextBin.id);
      }
      // Boşalmış olsa bile rotadan geçiyoruz (ama toplama yapmıyoruz)
      collectedIds.add(nextBin.id);
      setCollectedBinIds(new Set(collectedIds));
    }

    // Aracı DEPOT'a geri döndür
    if (collectingRef.current && resultRef.current && resultRef.current.routePoints.length > 1) {
      setCollectedCount(resultRef.current.routePoints.length - 1);
      await new Promise((r) => setTimeout(r, 800));
    }

    if (collectingRef.current) {
      toast.success(`Toplama tamamlandı! ${collectedIds.size} kutu toplandı.`);

      const finalResult = resultRef.current;
      if (finalResult) {
        fetch("/api/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `Rota-${new Date().toLocaleTimeString("tr-TR")}`,
            totalDistance: finalResult.totalDistance,
            totalBins: collectedIds.size,
            estimatedDurationMin: finalResult.estimatedDurationMin,
            stops: finalResult.orderedBins.map((b, idx) => ({
              binId: b.id,
              stopOrder: idx + 1,
            })),
          }),
        }).catch(console.error);
      }
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
              <Route className="w-4 h-4" /> Rota Oluştur
            </h3>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                Doluluk Eşiği: {threshold}%
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
                      %{result.improvementPercent.toFixed(1)} iyileştirme
                    </Badge>
                  </div>
                </div>

                {collecting ? (
                  <div className="space-y-2">
                    <FillLevelBar
                      value={
                        (collectedCount / result.orderedBins.length) * 100
                      }
                      label={`${collectedCount}/${result.orderedBins.length} toplandı`}
                    />
                  </div>
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
                {result.orderedBins.map((bin, i) => {
                  const isDynamic = dynamicAddedIds.has(bin.id);
                  const isCollected = collecting && i < collectedCount;
                  // Canlı doluluk: simülasyon store'undan al
                  const liveBin = bins.find((b) => b.id === bin.id);
                  const liveFill = liveBin?.current_fill_percent ?? bin.current_fill_percent;
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
                        {liveFill.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
