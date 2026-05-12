import { euclideanDistance, type Point } from "@/lib/algorithms/distance";
import {
  optimizeRoute,
  type RouteOptimizationResult,
} from "@/lib/algorithms/route-optimizer";
import {
  buildDecisionMetrics,
  getDecisionThreshold,
  scoreDecisionMetrics,
  type DecisionMode,
  type ScenarioDecisionMetrics,
} from "@/lib/simulation/decision-engine";
import { projectBinForward } from "@/lib/simulation/production-model";
import { WAITING_NODES, type WaitingNode } from "@/lib/simulation/site-config";
import type { WasteBin } from "@/types";

export interface WaitingScenario {
  id: string;
  label: string;
  waitTicks: number;
  description: string;
}

export interface WaitingScenarioResult {
  scenario: WaitingScenario;
  route: RouteOptimizationResult;
  score: number;
  overflowRisk: number;
  projectedCriticalBins: number;
  waitingNode: WaitingNode | null;
  decisionMode: DecisionMode;
  metrics: ScenarioDecisionMetrics;
}

export const WAITING_SCENARIOS: WaitingScenario[] = [
  {
    id: "dispatch-now",
    label: "Hemen Cik",
    waitTicks: 0,
    description: "Esik ustundeki kutular icin araci aninda yonlendir.",
  },
  {
    id: "wait-short",
    label: "1 Cevrim Bekle",
    waitTicks: 1,
    description: "Yakin bolgelerde ek kutularin esige yaklasmasini bekle.",
  },
  {
    id: "wait-medium",
    label: "3 Cevrim Bekle",
    waitTicks: 3,
    description: "Toplu toplama verimi icin biraz daha birikim olustur.",
  },
];

function projectBins(
  bins: WasteBin[],
  speed: 1 | 2 | 4,
  startTick: number,
  waitTicks: number
) {
  return bins.map((bin) => projectBinForward(bin, speed, startTick, waitTicks));
}

function getOverflowRisk(bins: WasteBin[], threshold: number) {
  return bins.filter((bin) => bin.current_fill_percent >= Math.max(95, threshold + 15)).length;
}

function getProjectedCriticalBins(bins: WasteBin[]) {
  return bins.filter((bin) => bin.status === "critical").length;
}

function getRouteCentroid(points: Point[]) {
  if (points.length === 0) return null;
  const total = points.reduce(
    (acc, point) => ({
      latitude: acc.latitude + point.latitude,
      longitude: acc.longitude + point.longitude,
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: total.latitude / points.length,
    longitude: total.longitude / points.length,
  };
}

function pickWaitingNode(route: RouteOptimizationResult): WaitingNode | null {
  if (route.orderedBins.length === 0) return null;

  const routeZones = new Set(route.orderedBins.map((bin) => bin.zone));
  const centroid = getRouteCentroid(
    route.orderedBins.map((bin) => ({
      latitude: bin.latitude,
      longitude: bin.longitude,
    }))
  );

  if (!centroid) return null;

  return WAITING_NODES
    .filter((node) => node.zones.some((zone) => routeZones.has(zone)))
    .sort(
      (left, right) =>
        euclideanDistance(left, centroid) - euclideanDistance(right, centroid)
    )[0] || null;
}

function getRouteForScenario(
  projectedBins: WasteBin[],
  threshold: number,
  waitingNode: WaitingNode | null
) {
  const startPoint: Point | undefined = waitingNode
    ? {
        latitude: waitingNode.latitude,
        longitude: waitingNode.longitude,
      }
    : undefined;

  return optimizeRoute(projectedBins, threshold, { startPoint });
}

export function evaluateWaitingScenarios(
  bins: WasteBin[],
  threshold: number,
  speed: 1 | 2 | 4,
  tickCount: number,
  decisionMode: DecisionMode = "balanced"
): WaitingScenarioResult[] {
  const effectiveThreshold = getDecisionThreshold(threshold, decisionMode);

  return WAITING_SCENARIOS.map((scenario) => {
    const projectedBins = projectBins(bins, speed, tickCount, scenario.waitTicks);
    const previewRoute = optimizeRoute(projectedBins, effectiveThreshold);
    const waitingNode =
      scenario.waitTicks > 0 ? pickWaitingNode(previewRoute) : null;
    const route = getRouteForScenario(projectedBins, effectiveThreshold, waitingNode);
    const overflowRisk = getOverflowRisk(projectedBins, threshold);
    const projectedCriticalBins = getProjectedCriticalBins(projectedBins);
    const metrics = buildDecisionMetrics(
      route,
      overflowRisk,
      projectedCriticalBins,
      scenario.waitTicks,
      effectiveThreshold,
      decisionMode
    );

    return {
      scenario,
      route,
      overflowRisk,
      projectedCriticalBins,
      waitingNode,
      decisionMode,
      metrics,
      score: scoreDecisionMetrics(metrics),
    };
  }).sort((left, right) => right.score - left.score);
}
