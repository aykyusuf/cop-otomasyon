import type { Alert, LocationType, WasteBin, WasteType } from "@/types";
import { inferLocationType, ZONE_CONFIG } from "@/lib/simulation/site-config";

export interface PendingSimulationAlert {
  binId: number;
  type: Alert["alert_type"];
  message: string;
  severity: Alert["severity"];
}

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
  };
}

function getHourOfDay(tickCount: number) {
  return tickCount % 24;
}

function getActivityMultiplier(zone: string, tickCount: number) {
  const zoneConfig = ZONE_CONFIG[zone];
  if (!zoneConfig) return 1;

  const hour = getHourOfDay(tickCount);
  if (zoneConfig.peakHours.includes(hour)) return 1.45;
  if (hour >= 22 || hour <= 6) return 0.45;
  return 0.9;
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
  const zoneMultiplier = zoneConfig?.fillMultiplier || 1;
  const activityMultiplier = getActivityMultiplier(bin.zone, tickCount);

  return {
    fillIncrement:
      0.65 * speed * zoneMultiplier * wasteMultiplier * activityMultiplier,
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
  const zoneMultiplier = zoneConfig?.fillMultiplier || 1;
  const activityMultiplier = getActivityMultiplier(bin.zone, tickCount);

  const fillIncrement =
    randomBetween(0.25, 1.05) *
    speed *
    zoneMultiplier *
    wasteMultiplier *
    activityMultiplier;

  const fill = Math.min(100, Math.max(0, bin.current_fill_percent + fillIncrement));

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

    bin = {
      ...bin,
      current_fill_percent: fill,
      temperature,
      battery_level: battery,
      status: getStatus(fill),
    };
  }

  return bin;
}
