import type {
  Alert,
  CollectionRoute,
  DashboardStats,
  LocationType,
  RouteStop,
  SensorReading,
  WasteBin,
} from "@/types";
import { inferLocationType } from "@/lib/simulation/site-config";

const now = () => new Date();

let nextBinId = 1;
let nextAlertId = 1;
let nextReadingId = 1;
let nextRouteId = 1;
let nextRouteStopId = 1;

const bins: WasteBin[] = [];

const alerts: Alert[] = [];

const readings: SensorReading[] = [];
const routes: CollectionRoute[] = [];
const routeStops: RouteStop[] = [];

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function getMockBins() {
  return clone([...bins].sort((a, b) => a.zone.localeCompare(b.zone) || a.name.localeCompare(b.name)));
}

export function getMockBinById(id: number) {
  return clone(bins.find((bin) => bin.id === id) ?? null);
}

export function getMockBinsByZone(zone: string) {
  return clone(bins.filter((bin) => bin.zone === zone).sort((a, b) => a.name.localeCompare(b.name)));
}

export function getMockBinsAboveThreshold(percent: number) {
  return clone(
    bins
      .filter((bin) => bin.current_fill_percent >= percent && bin.status !== "offline")
      .sort((a, b) => b.current_fill_percent - a.current_fill_percent)
  );
}

export function createMockBin(data: {
  name: string;
  latitude: number;
  longitude: number;
  waste_type: string;
  zone: string;
  location_type?: LocationType;
  capacity_liters?: number;
}) {
  const bin: WasteBin = {
    id: nextBinId++,
    name: data.name,
    latitude: data.latitude,
    longitude: data.longitude,
    waste_type: data.waste_type as WasteBin["waste_type"],
    zone: data.zone,
    location_type: data.location_type || inferLocationType(data.zone),
    capacity_liters: data.capacity_liters || 120,
    current_fill_percent: 0,
    temperature: 22,
    battery_level: 100,
    status: "normal",
    created_at: now(),
    updated_at: now(),
  };
  bins.push(bin);
  return clone(bin);
}

export function updateMockBinFillLevel(
  id: number,
  fill: number,
  temperature: number,
  battery: number,
  status: string
) {
  const bin = bins.find((item) => item.id === id);
  if (!bin) return;
  bin.current_fill_percent = fill;
  bin.temperature = temperature;
  bin.battery_level = battery;
  bin.status = status as WasteBin["status"];
  bin.updated_at = now();
}

export function resetMockBinAfterCollection(id: number) {
  updateMockBinFillLevel(id, 0, 22, 100, "normal");
}

export function deleteMockBin(id: number) {
  const index = bins.findIndex((bin) => bin.id === id);
  if (index >= 0) bins.splice(index, 1);
}

export function bulkUpdateMockBins(
  updates: { id: number; fill: number; temperature: number; battery: number; status: string }[]
) {
  for (const update of updates) {
    updateMockBinFillLevel(update.id, update.fill, update.temperature, update.battery, update.status);
  }
}

export function getMockActiveAlerts() {
  return clone(
    alerts
      .filter((alert) => !alert.is_resolved)
      .map((alert) => ({ ...alert, bin_name: bins.find((bin) => bin.id === alert.bin_id)?.name }))
      .sort((a, b) => {
        const rank = { critical: 0, warning: 1, info: 2 };
        return rank[a.severity] - rank[b.severity] || b.created_at.getTime() - a.created_at.getTime();
      })
  );
}

export function createMockAlert(
  binId: number,
  alertType: string,
  message: string,
  severity: string = "warning"
) {
  const alert: Alert = {
    id: nextAlertId++,
    bin_id: binId,
    alert_type: alertType as Alert["alert_type"],
    message,
    severity: severity as Alert["severity"],
    is_resolved: false,
    created_at: now(),
    resolved_at: null,
    bin_name: bins.find((bin) => bin.id === binId)?.name,
  };
  alerts.push(alert);
  return clone(alert);
}

export function resolveMockAlert(id: number) {
  const alert = alerts.find((item) => item.id === id);
  if (alert) {
    alert.is_resolved = true;
    alert.resolved_at = now();
  }
}

export function resolveMockAlertsByBin(binId: number) {
  for (const alert of alerts) {
    if (alert.bin_id === binId && !alert.is_resolved) {
      alert.is_resolved = true;
      alert.resolved_at = now();
    }
  }
}

export function getMockAlertHistory(limit = 50) {
  return clone(
    [...alerts]
      .map((alert) => ({ ...alert, bin_name: bins.find((bin) => bin.id === alert.bin_id)?.name }))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit)
  );
}

export function hasMockActiveAlertForBin(binId: number, alertType: string) {
  return alerts.some(
    (alert) => alert.bin_id === binId && alert.alert_type === alertType && !alert.is_resolved
  );
}

export function getMockDashboardStats(): DashboardStats {
  const binsByZone: Record<string, number> = {};
  const binsByStatus: Record<string, number> = {
    normal: 0,
    warning: 0,
    critical: 0,
    offline: 0,
  };

  for (const bin of bins) {
    binsByZone[bin.zone] = (binsByZone[bin.zone] || 0) + 1;
    binsByStatus[bin.status] = (binsByStatus[bin.status] || 0) + 1;
  }

  return {
    totalBins: bins.length,
    avgFillPercent:
      bins.reduce((total, bin) => total + bin.current_fill_percent, 0) / Math.max(bins.length, 1),
    collectionsToday: 0,
    activeAlerts: alerts.filter((alert) => !alert.is_resolved).length,
    binsByStatus,
    binsByZone,
  };
}

export function getMockWasteTypeDistribution() {
  const groups = new Map<string, { waste_type: string; count: number; totalFill: number }>();
  for (const bin of bins) {
    const group = groups.get(bin.waste_type) || {
      waste_type: bin.waste_type,
      count: 0,
      totalFill: 0,
    };
    group.count += 1;
    group.totalFill += bin.current_fill_percent;
    groups.set(bin.waste_type, group);
  }

  return [...groups.values()].map((group) => ({
    waste_type: group.waste_type,
    count: group.count,
    avg_fill: group.totalFill / group.count,
  }));
}

export function getMockZoneEfficiency() {
  const zones = new Map<string, WasteBin[]>();
  for (const bin of bins) {
    zones.set(bin.zone, [...(zones.get(bin.zone) || []), bin]);
  }

  return [...zones.entries()].map(([zone, zoneBins]) => ({
    zone,
    bin_count: zoneBins.length,
    avg_fill:
      zoneBins.reduce((total, bin) => total + bin.current_fill_percent, 0) / Math.max(zoneBins.length, 1),
    total_collections: 0,
    active_alerts: alerts.filter((alert) => !alert.is_resolved && zoneBins.some((bin) => bin.id === alert.bin_id)).length,
  }));
}

export function getMockFillTrends(hours = 24) {
  const avg = getMockDashboardStats().avgFillPercent;
  return Array.from({ length: Math.min(hours, 24) }, (_, index) => ({
    hour: new Date(Date.now() - (hours - index - 1) * 60 * 60 * 1000),
    avg_fill: Math.max(0, avg - 8 + index * 0.6),
    max_fill: Math.min(100, avg + 25),
    min_fill: Math.max(0, avg - 25),
  }));
}

export function getMockCollectionFrequency(days = 7) {
  return Array.from({ length: days }, (_, index) => ({
    day: new Date(Date.now() - (days - index - 1) * 24 * 60 * 60 * 1000),
    collection_count: 0,
    avg_fill_at_collection: 0,
  }));
}

export function insertMockReading(
  binId: number,
  fillPercent: number,
  temperature: number,
  batteryLevel: number
) {
  const reading: SensorReading = {
    id: nextReadingId++,
    bin_id: binId,
    fill_percent: fillPercent,
    temperature,
    battery_level: batteryLevel,
    recorded_at: now(),
  };
  readings.push(reading);
  return clone(reading);
}

export function getMockReadingsForBin(binId: number) {
  return clone(readings.filter((reading) => reading.bin_id === binId));
}

export function getMockLatestReadings() {
  return clone(
    bins
      .map((bin) => readings.filter((reading) => reading.bin_id === bin.id).at(-1))
      .filter(Boolean) as SensorReading[]
  );
}

export function bulkInsertMockReadings(
  items: { binId: number; fill: number; temperature: number; battery: number }[]
) {
  for (const item of items) {
    insertMockReading(item.binId, item.fill, item.temperature, item.battery);
  }
}

export function createMockRoute(data: {
  name: string;
  totalDistance: number;
  totalBins: number;
  estimatedDurationMin: number;
}) {
  const route: CollectionRoute = {
    id: nextRouteId++,
    name: data.name,
    status: "planned",
    total_distance: data.totalDistance,
    total_bins: data.totalBins,
    estimated_duration_min: data.estimatedDurationMin,
    algorithm: "nearest_neighbor",
    created_at: now(),
    started_at: null,
    completed_at: null,
  };
  routes.push(route);
  return clone(route);
}

export function addMockRouteStops(routeId: number, stops: { binId: number; stopOrder: number }[]) {
  for (const stop of stops) {
    routeStops.push({
      id: nextRouteStopId++,
      route_id: routeId,
      bin_id: stop.binId,
      stop_order: stop.stopOrder,
      fill_at_arrival: null,
      arrived_at: null,
      collected_at: null,
    });
  }
}

export function updateMockRouteStatus(routeId: number, status: string) {
  const route = routes.find((item) => item.id === routeId);
  if (!route) return;
  route.status = status as CollectionRoute["status"];
  if (status === "in_progress") route.started_at = now();
  if (status === "completed") route.completed_at = now();
}

export function getMockActiveRoute() {
  const route = [...routes]
    .filter((item) => item.status === "planned" || item.status === "in_progress")
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0];
  if (!route) return null;

  return clone({
    ...route,
    stops: routeStops.filter((stop) => stop.route_id === route.id).sort((a, b) => a.stop_order - b.stop_order),
  });
}

export function getMockRouteById(id: number) {
  const route = routes.find((item) => item.id === id);
  if (!route) return null;

  return clone({
    ...route,
    stops: routeStops.filter((stop) => stop.route_id === route.id).sort((a, b) => a.stop_order - b.stop_order),
  });
}

export function getMockRouteHistory(limit = 20) {
  return clone([...routes].sort((a, b) => b.created_at.getTime() - a.created_at.getTime()).slice(0, limit));
}
