import {
  DECISION_MODE_CONFIG,
  type DecisionMode,
} from "@/lib/simulation/decision-engine";
import {
  evaluateWaitingScenarios,
  type WaitingScenarioResult,
} from "@/lib/simulation/waiting-strategies";
import type { WasteBin } from "@/types";

export interface AlternativePlanResult {
  decisionMode: DecisionMode;
  scenarios: WaitingScenarioResult[];
  recommendedScenario: WaitingScenarioResult | null;
}

export function evaluateAlternativePlans(
  bins: WasteBin[],
  threshold: number,
  speed: 1 | 2 | 4,
  tickCount: number
): AlternativePlanResult[] {
  return Object.values(DECISION_MODE_CONFIG).map((config) => {
    const scenarios = evaluateWaitingScenarios(
      bins,
      threshold,
      speed,
      tickCount,
      config.id
    );

    return {
      decisionMode: config.id,
      scenarios,
      recommendedScenario: scenarios[0] || null,
    };
  });
}

