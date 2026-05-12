import type { RouteOptimizationResult } from "@/lib/algorithms/route-optimizer";

export type DecisionMode = "urgent" | "balanced" | "efficient";

export interface DecisionModeConfig {
  id: DecisionMode;
  label: string;
  description: string;
  thresholdOffset: number;
  weights: {
    coverage: number;
    distance: number;
    wait: number;
    overflow: number;
    critical: number;
    duration: number;
  };
}

export interface ScenarioDecisionMetrics {
  effectiveThreshold: number;
  coverageScore: number;
  distancePenalty: number;
  waitPenalty: number;
  overflowPenalty: number;
  criticalBonus: number;
  durationPenalty: number;
}

export const DECISION_MODE_CONFIG: Record<DecisionMode, DecisionModeConfig> = {
  urgent: {
    id: "urgent",
    label: "Acil",
    description: "Kritik doluluk ve tasma riskini oncele.",
    thresholdOffset: -10,
    weights: {
      coverage: 18,
      distance: 0.06,
      wait: 10,
      overflow: 180,
      critical: 36,
      duration: 0.8,
    },
  },
  balanced: {
    id: "balanced",
    label: "Dengeli",
    description: "Risk, sure ve mesafe dengesini koru.",
    thresholdOffset: 0,
    weights: {
      coverage: 18,
      distance: 0.08,
      wait: 14,
      overflow: 120,
      critical: 20,
      duration: 1.1,
    },
  },
  efficient: {
    id: "efficient",
    label: "Verimli",
    description: "Daha toplu ve daha dusuk maliyetli toplama ara.",
    thresholdOffset: 10,
    weights: {
      coverage: 16,
      distance: 0.11,
      wait: 8,
      overflow: 90,
      critical: 14,
      duration: 1.4,
    },
  },
};

export function getDecisionThreshold(
  threshold: number,
  mode: DecisionMode
) {
  const config = DECISION_MODE_CONFIG[mode];
  return Math.max(40, Math.min(95, threshold + config.thresholdOffset));
}

export function buildDecisionMetrics(
  route: RouteOptimizationResult,
  overflowRisk: number,
  projectedCriticalBins: number,
  waitTicks: number,
  effectiveThreshold: number,
  mode: DecisionMode
): ScenarioDecisionMetrics {
  const weights = DECISION_MODE_CONFIG[mode].weights;

  return {
    effectiveThreshold,
    coverageScore: route.orderedBins.length * weights.coverage,
    distancePenalty: route.totalDistance * weights.distance,
    waitPenalty: waitTicks * weights.wait,
    overflowPenalty: overflowRisk * weights.overflow,
    criticalBonus: projectedCriticalBins * weights.critical,
    durationPenalty: route.estimatedDurationMin * weights.duration,
  };
}

export function scoreDecisionMetrics(metrics: ScenarioDecisionMetrics) {
  return (
    metrics.coverageScore +
    metrics.criticalBonus -
    metrics.distancePenalty -
    metrics.waitPenalty -
    metrics.overflowPenalty -
    metrics.durationPenalty
  );
}

