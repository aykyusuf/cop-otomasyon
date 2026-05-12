import type { Alert, LocationType, WasteBin, WasteType } from "@/types";
import {
  inferLocationType,
  WASTE_COMPOSITION_KEYS,
  ZONE_CONFIG,
  type WasteCompositionProfile,
} from "@/lib/simulation/site-config";

export interface PendingSimulationAlert {
  binId: number;
  type: Alert["alert_type"];
  message: string;
  severity: Alert["severity"];
}

export interface ActiveZoneEventSummary {
  zone: string;
  zoneLabel: string;
  eventId: string;
  eventLabel: string;
  multiplier: number;
}

export const SIMULATION_DAY_LABELS = [
  "Pzt",
  "Sali",
  "Cars",
  "Pers",
  "Cum",
  "Cmt",
  "Paz",
] as const;

const WASTE_MULTIPLIERS: Record<LocationType, Partial<Record<WasteType, number>>> = {
  faculty: {
    general: 1.1,
    recyclable: 1.15,
    organic: 0.8,
  },
  cafeteria: {
    general: 1.2,
    recyclable: 1.0,
    organic: 1.75,
  },
  library: {
    general: 0.6,
    recyclable: 0.8,
    organic: 0.45,
  },
  sports: {
    general: 1.25,
    recyclable: 1.0,
    organic: 0.75,
  },
  laboratory: {
    general: 0.5,
    recyclable: 0.55,
    organic: 0.35,
    hazardous: 1.65,
  },
  outdoor: {
    general: 0.9,
    recyclable: 0.8,
    organic: 0.6,
    hazardous: 0.7,
  },
};

const WASTE_COMPOSITION_BIASES: Record<
  WasteType,
  Partial<Record<keyof WasteCompositionProfile, number>>
> = {
  general: {
    nonRecyclable: 1.35,
    plastic: 0.9,
    metal: 0.9,
    organic: 0.9,
  },
  recyclable: {
    plastic: 1.3,
    metal: 1.2,
    nonRecyclable: 0.7,
    organic: 0.7,
  },
  organic: {
    organic: 1.5,
    nonRecyclable: 0.7,
    plastic: 0.8,
    metal: 0.75,
  },
  hazardous: {
    hazardous: 1.7,
    nonRecyclable: 0.7,
    plastic: 0.6,
    metal: 0.6,
    organic: 0.5,
  },
};

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function getStatus(fill: number): WasteBin["status"] {
  if (fill >= 80) return "critical";
  if (fill >= 50) return "warning";
  return "normal";
}

export function normalizeBin(bin: WasteBin): WasteBin {
  return {
    ...bin,
    location_type: bin.location_type || inferLocationType(bin.zone),
    waste_composition: normalizeWasteComposition(bin.waste_composition),
  };
}

export function createEmptyWasteComposition(): WasteCompositionProfile {
  return {
    plastic: 0,
    metal: 0,
    organic: 0,
    nonRecyclable: 0,
    hazardous: 0,
  };
}

export function normalizeWasteComposition(
  composition?: WasteBin["waste_composition"]
): WasteCompositionProfile {
  const base = createEmptyWasteComposition();

  for (const key of WASTE_COMPOSITION_KEYS) {
    const value = composition?.[key];
    base[key] = typeof value === "number" ? Math.max(0, value) : 0;
  }

  return base;
}

function projectCompositionGrowth(
  bin: WasteBin,
  fillIncrement: number
): WasteCompositionProfile {
  const zoneConfig = ZONE_CONFIG[bin.zone];
  const currentComposition = normalizeWasteComposition(bin.waste_composition);
  const profile = zoneConfig?.wasteComposition || createEmptyWasteComposition();
  const bias = WASTE_COMPOSITION_BIASES[bin.waste_type] || {};

  const weightedProfile = {} as Record<keyof WasteCompositionProfile, number>;
  let totalWeight = 0;

  for (const key of WASTE_COMPOSITION_KEYS) {
    const weight = profile[key] * (bias[key] || 1);
    weightedProfile[key] = weight;
    totalWeight += weight;
  }

  const safeWeight = totalWeight || 1;
  const nextComposition = { ...currentComposition };
  let assigned = 0;

  WASTE_COMPOSITION_KEYS.forEach((key, index) => {
    const share =
      index === WASTE_COMPOSITION_KEYS.length - 1
        ? Math.max(0, fillIncrement - assigned)
        : fillIncrement * (weightedProfile[key] / safeWeight);

    nextComposition[key] += share;
    assigned += share;
  });

  return nextComposition;
}

export function getHourOfDay(tickCount: number) {
  return tickCount % 24;
}

export function getSimulationDay(tickCount: number) {
  return Math.floor(tickCount / 24) % 7;
}

export function formatSimulationClock(tickCount: number) {
  const hour = getHourOfDay(tickCount);
  const day = getSimulationDay(tickCount);

  return {
    hour,
    day,
    dayLabel: SIMULATION_DAY_LABELS[day],
    label: `${SIMULATION_DAY_LABELS[day]} ${hour.toString().padStart(2, "0")}:00`,
  };
}

function getActivityMultiplier(zone: string, tickCount: number) {
  const zoneConfig = ZONE_CONFIG[zone];
  if (!zoneConfig) return 1;

  const hour = getHourOfDay(tickCount);
  const day = getSimulationDay(tickCount);
  const hourlyBase = zoneConfig.baseHourlyIntensity[hour] || 0.9;
  const peakBoost = zoneConfig.peakHours.includes(hour) ? 1.12 : 1;
  const lateNightPenalty = hour >= 22 || hour <= 6 ? 0.82 : 1;

  const eventMultiplier = zoneConfig.specialEvents.reduce((maxMultiplier, event) => {
    const dayMatches = !event.days || event.days.includes(day);
    const hourMatches = event.hours.includes(hour);

    if (dayMatches && hourMatches) {
      return Math.max(maxMultiplier, event.multiplier);
    }

    return maxMultiplier;
  }, 1);

  return hourlyBase * peakBoost * lateNightPenalty * eventMultiplier;
}

function getSpecialWasteBoost(
  zone: string,
  wasteType: WasteType,
  tickCount: number
) {
  const zoneConfig = ZONE_CONFIG[zone];
  if (!zoneConfig) return 1;

  const hour = getHourOfDay(tickCount);
  const day = getSimulationDay(tickCount);

  return zoneConfig.specialEvents.reduce((boost, event) => {
    const dayMatches = !event.days || event.days.includes(day);
    const hourMatches = event.hours.includes(hour);
    const wasteBoost = event.wasteTypeBoosts?.[wasteType] || 1;

    if (dayMatches && hourMatches) {
      return Math.max(boost, wasteBoost);
    }

    return boost;
  }, 1);
}

export function getActiveZoneEvents(tickCount: number): ActiveZoneEventSummary[] {
  const hour = getHourOfDay(tickCount);
  const day = getSimulationDay(tickCount);

  return Object.values(ZONE_CONFIG).flatMap((zoneConfig) =>
    zoneConfig.specialEvents
      .filter((event) => {
        const dayMatches = !event.days || event.days.includes(day);
        return dayMatches && event.hours.includes(hour);
      })
      .map((event) => ({
        zone: zoneConfig.key,
        zoneLabel: zoneConfig.label,
        eventId: event.id,
        eventLabel: event.label,
        multiplier: event.multiplier,
      }))
  );
}

function getProjectedDelta(
  bin: WasteBin,
  speed: 1 | 2 | 4,
  tickCount: number
) {
  const zoneConfig = ZONE_CONFIG[bin.zone];
  const locationType = bin.location_type || inferLocationType(bin.zone);
  const wasteMultiplier =
    WASTE_MULTIPLIERS[locationType][bin.waste_type] || 1;
  const eventWasteBoost = getSpecialWasteBoost(
    bin.zone,
    bin.waste_type,
    tickCount
  );
  const zoneMultiplier = zoneConfig?.fillMultiplier || 1;
  const activityMultiplier = getActivityMultiplier(bin.zone, tickCount);

  return {
    fillIncrement:
      0.65 *
      speed *
      zoneMultiplier *
      wasteMultiplier *
      eventWasteBoost *
      activityMultiplier,
    temperatureDelta:
      0.05 + (zoneConfig?.temperatureBias || 0) * 0.08,
    batteryDrain:
      0.025 * (zoneConfig?.batteryDrainMultiplier || 1) * speed,
  };
}

export function simulateBinTick(
  rawBin: WasteBin,
  speed: 1 | 2 | 4,
  tickCount: number
): { bin: WasteBin; alerts: PendingSimulationAlert[] } {
  const bin = normalizeBin(rawBin);

  if (bin.status === "offline" || bin.status === "collecting") {
    return { bin, alerts: [] };
  }

  const zoneConfig = ZONE_CONFIG[bin.zone];
  const locationType = bin.location_type || inferLocationType(bin.zone);
  const wasteMultiplier =
    WASTE_MULTIPLIERS[locationType][bin.waste_type] || 1;
  const eventWasteBoost = getSpecialWasteBoost(
    bin.zone,
    bin.waste_type,
    tickCount
  );
  const zoneMultiplier = zoneConfig?.fillMultiplier || 1;
  const activityMultiplier = getActivityMultiplier(bin.zone, tickCount);

  const fillIncrement =
    randomBetween(0.25, 1.05) *
    speed *
    zoneMultiplier *
    wasteMultiplier *
    eventWasteBoost *
    activityMultiplier;

  const fill = Math.min(100, Math.max(0, bin.current_fill_percent + fillIncrement));
  const wasteComposition = projectCompositionGrowth(bin, fillIncrement);

  const tempBias = zoneConfig?.temperatureBias || 0;
  const temperature = Math.min(
    55,
    Math.max(-5, bin.temperature + randomBetween(-0.35, 0.45) + tempBias * 0.08)
  );

  const batteryDrain = (zoneConfig?.batteryDrainMultiplier || 1) * speed;
  const battery = Math.max(
    0,
    bin.battery_level - randomBetween(0.01, 0.04) * batteryDrain
  );

  const status = getStatus(fill);
  const alerts: PendingSimulationAlert[] = [];

  if (fill > 95 && bin.current_fill_percent <= 95) {
    alerts.push({
      binId: bin.id,
      type: "overflow",
      message: `${bin.name} tasiyor! Doluluk: ${fill.toFixed(0)}%`,
      severity: "critical",
    });
  } else if (fill > 80 && bin.current_fill_percent <= 80) {
    alerts.push({
      binId: bin.id,
      type: "high_fill",
      message: `${bin.name} dolulugu yuksek: ${fill.toFixed(0)}%`,
      severity: "warning",
    });
  }

  if (temperature > 45 && bin.temperature <= 45) {
    alerts.push({
      binId: bin.id,
      type: "high_temp",
      message: `${bin.name} sicaklik yuksek: ${temperature.toFixed(1)} C`,
      severity: "warning",
    });
  }

  if (battery < 15 && bin.battery_level >= 15) {
    alerts.push({
      binId: bin.id,
      type: "low_battery",
      message: `${bin.name} batarya dusuk: ${battery.toFixed(0)}%`,
      severity: "warning",
    });
  }

  return {
    bin: {
      ...bin,
      current_fill_percent: fill,
      temperature,
      battery_level: battery,
      status,
      waste_composition: wasteComposition,
    },
    alerts,
  };
}

export function projectBinForward(
  rawBin: WasteBin,
  speed: 1 | 2 | 4,
  startTick: number,
  steps: number
): WasteBin {
  let bin = normalizeBin(rawBin);

  for (let offset = 0; offset < steps; offset++) {
    if (bin.status === "offline" || bin.status === "collecting") break;

    const projection = getProjectedDelta(bin, speed, startTick + offset);
    const fill = Math.min(100, Math.max(0, bin.current_fill_percent + projection.fillIncrement));
    const temperature = Math.min(55, Math.max(-5, bin.temperature + projection.temperatureDelta));
    const battery = Math.max(0, bin.battery_level - projection.batteryDrain);
    const wasteComposition = projectCompositionGrowth(bin, projection.fillIncrement);

    bin = {
      ...bin,
      current_fill_percent: fill,
      temperature,
      battery_level: battery,
      status: getStatus(fill),
      waste_composition: wasteComposition,
    };
  }

  return bin;
}
