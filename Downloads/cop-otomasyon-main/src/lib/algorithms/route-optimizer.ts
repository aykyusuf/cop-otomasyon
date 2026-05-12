import type { WasteBin } from "@/types";
import type { Point } from "./distance";
import { buildDistanceMatrix, euclideanDistance, totalRouteDistance } from "./distance";
import { nearestNeighborTSP } from "./nearest-neighbor";
import { twoOpt } from "./two-opt";

/**
 * Mevcut rotaya yeni bir kutuyu en az ek mesafeyle ekler (cheapest insertion).
 * `fromIndex`: aracın şu an kaçıncı routePoint'te olduğu (bu index dahil edilmez,
 * sadece fromIndex..son arası değerlendirilir).
 *
 * Dönen değer: yeni orderedBins ve routePoints dizileri.
 */
export function insertBinCheapest(
  currentOrderedBins: WasteBin[],
  currentRoutePoints: Point[],
  newBin: WasteBin,
  fromIndex: number // araç kaçıncı routePoint indeksine ulaştı
): { orderedBins: WasteBin[]; routePoints: Point[] } {
  const newPoint: Point = { latitude: newBin.latitude, longitude: newBin.longitude };

  // routePoints: [DEPOT, bin1, bin2, ..., binN, DEPOT]
  // orderedBins: [bin1, bin2, ..., binN]  (routePoints[1..length-2])
  // fromIndex: araç bu noktayı tamamladı, sonraki duraklar fromIndex+1..son

  // Yalnızca kalan segment içinde (fromIndex → son) cheapest insertion yap
  const remainingStart = Math.max(fromIndex, 0);
  const points = currentRoutePoints;
  const n = points.length; // dahil: ilk DEPOT + kutular + son DEPOT

  let bestCost = Infinity;
  let bestInsertAfter = remainingStart; // routePoints array indexi

  // Aracın bulunduğu nokta (fromIndex) ile son DEPOT arasındaki kenarları dene
  for (let i = remainingStart; i < n - 1; i++) {
    const prev = points[i];
    const next = points[i + 1];
    const cost =
      euclideanDistance(prev, newPoint) +
      euclideanDistance(newPoint, next) -
      euclideanDistance(prev, next);
    if (cost < bestCost) {
      bestCost = cost;
      bestInsertAfter = i;
    }
  }

  // routePoints içine ekle (bestInsertAfter + 1 pozisyonuna)
  const newRoutePoints = [
    ...points.slice(0, bestInsertAfter + 1),
    newPoint,
    ...points.slice(bestInsertAfter + 1),
  ];

  // orderedBins: routePoints[1..length-2] ile senkronize
  // bestInsertAfter, routePoints indexi; orderedBins indexi = routePoints indexi - 1
  const binInsertIdx = bestInsertAfter; // orderedBins[binInsertIdx] sonrasına ekle
  const newOrderedBins = [
    ...currentOrderedBins.slice(0, binInsertIdx),
    newBin,
    ...currentOrderedBins.slice(binInsertIdx),
  ];

  return { orderedBins: newOrderedBins, routePoints: newRoutePoints };
}

export interface RouteOptimizationResult {
  bins: WasteBin[];
  orderedBins: WasteBin[];
  totalDistance: number;
  nnDistance: number;
  improvementPercent: number;
  estimatedDurationMin: number;
  routePoints: Point[];
}

// Depot location (bottom center of campus map)
const DEPOT: Point = { latitude: 645, longitude: 500 };

// Average speed: ~100 pixels per minute (walking/driving on campus)
const SPEED_PX_PER_MIN = 100;
// Time per collection stop (minutes)
const STOP_TIME_MIN = 2;

export function optimizeRoute(
  allBins: WasteBin[],
  threshold: number = 70
): RouteOptimizationResult {
  // Filter bins above threshold
  const bins = allBins.filter(
    (b) =>
      b.current_fill_percent >= threshold &&
      b.status !== "offline" &&
      b.status !== "collecting"
  );

  if (bins.length === 0) {
    return {
      bins: [],
      orderedBins: [],
      totalDistance: 0,
      nnDistance: 0,
      improvementPercent: 0,
      estimatedDurationMin: 0,
      routePoints: [],
    };
  }

  // Build points array: depot + bins
  const points: Point[] = [DEPOT, ...bins.map((b) => ({ latitude: b.latitude, longitude: b.longitude }))];
  const distMatrix = buildDistanceMatrix(points);

  // Nearest Neighbor from depot (index 0)
  const nn = nearestNeighborTSP(distMatrix, 0);

  // 2-opt improvement
  const optimized = twoOpt(nn.path, distMatrix);

  // Map back to bins (skip depot at start and end)
  const orderedBins = optimized.path
    .slice(1, -1)
    .map((idx) => bins[idx - 1])
    .filter(Boolean);

  // Build route points (depot -> bins -> depot)
  const routePoints: Point[] = [
    DEPOT,
    ...orderedBins.map((b) => ({ latitude: b.latitude, longitude: b.longitude })),
    DEPOT,
  ];

  const distance = totalRouteDistance(routePoints);
  const travelTime = distance / SPEED_PX_PER_MIN;
  const totalTime = travelTime + orderedBins.length * STOP_TIME_MIN;

  const improvement =
    nn.distance > 0
      ? ((nn.distance - optimized.distance) / nn.distance) * 100
      : 0;

  return {
    bins,
    orderedBins,
    totalDistance: distance,
    nnDistance: nn.distance,
    improvementPercent: Math.max(0, improvement),
    estimatedDurationMin: Math.ceil(totalTime),
    routePoints,
  };
}
