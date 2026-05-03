import type { LocationType, WasteType } from "@/types";
import type { Point } from "@/lib/algorithms/distance";

export interface ZoneConfig {
  key: string;
  label: string;
  color: string;
  defaultLocationType: LocationType;
  defaultPoint: Point;
  recommendedWasteTypes: WasteType[];
  fillMultiplier: number;
  temperatureBias: number;
  batteryDrainMultiplier: number;
  peakHours: number[];
}

export interface WaitingNode extends Point {
  id: string;
  label: string;
  zones: string[];
}

export const CAMPUS_MAP_ASSET = "/campus/campus-map.svg";

export const CAMPUS_MAP_BOUNDS: [[number, number], [number, number]] = [
  [0, 0],
  [700, 1000],
];

export const DEPOT_POINT: Point = {
  latitude: 645,
  longitude: 500,
};

export const DEPOT_LABEL = "Depo";

export const WAITING_NODES: WaitingNode[] = [
  {
    id: "north-west-hub",
    label: "Kuzey Bati Dugumu",
    latitude: 170,
    longitude: 150,
    zones: ["muhendislik", "edebiyat"],
  },
  {
    id: "north-east-hub",
    label: "Kuzey Dogu Dugumu",
    latitude: 160,
    longitude: 590,
    zones: ["fen", "laboratuvar"],
  },
  {
    id: "central-hub",
    label: "Merkez Dugum",
    latitude: 350,
    longitude: 455,
    zones: ["yemekhane", "edebiyat"],
  },
  {
    id: "south-west-hub",
    label: "Guney Bati Dugumu",
    latitude: 535,
    longitude: 210,
    zones: ["kutuphane"],
  },
  {
    id: "south-east-hub",
    label: "Guney Dogu Dugumu",
    latitude: 555,
    longitude: 610,
    zones: ["spor"],
  },
];

export const ZONE_CONFIG: Record<string, ZoneConfig> = {
  muhendislik: {
    key: "muhendislik",
    label: "Muhendislik",
    color: "#3b82f6",
    defaultLocationType: "faculty",
    defaultPoint: { latitude: 165, longitude: 135 },
    recommendedWasteTypes: ["general", "recyclable", "organic"],
    fillMultiplier: 1.0,
    temperatureBias: 0,
    batteryDrainMultiplier: 1,
    peakHours: [9, 10, 12, 13, 16],
  },
  fen: {
    key: "fen",
    label: "Fen",
    color: "#8b5cf6",
    defaultLocationType: "faculty",
    defaultPoint: { latitude: 155, longitude: 570 },
    recommendedWasteTypes: ["general", "recyclable", "organic"],
    fillMultiplier: 0.95,
    temperatureBias: 0,
    batteryDrainMultiplier: 1,
    peakHours: [9, 11, 13, 15],
  },
  edebiyat: {
    key: "edebiyat",
    label: "Edebiyat",
    color: "#f59e0b",
    defaultLocationType: "faculty",
    defaultPoint: { latitude: 355, longitude: 165 },
    recommendedWasteTypes: ["general", "recyclable"],
    fillMultiplier: 0.8,
    temperatureBias: 0,
    batteryDrainMultiplier: 0.95,
    peakHours: [10, 12, 14],
  },
  yemekhane: {
    key: "yemekhane",
    label: "Yemekhane",
    color: "#ef4444",
    defaultLocationType: "cafeteria",
    defaultPoint: { latitude: 350, longitude: 460 },
    recommendedWasteTypes: ["organic", "general", "recyclable"],
    fillMultiplier: 1.9,
    temperatureBias: 1.5,
    batteryDrainMultiplier: 1.1,
    peakHours: [8, 12, 13, 18],
  },
  kutuphane: {
    key: "kutuphane",
    label: "Kutuphane",
    color: "#10b981",
    defaultLocationType: "library",
    defaultPoint: { latitude: 535, longitude: 210 },
    recommendedWasteTypes: ["recyclable", "general"],
    fillMultiplier: 0.6,
    temperatureBias: -0.3,
    batteryDrainMultiplier: 0.85,
    peakHours: [11, 14, 19, 20],
  },
  spor: {
    key: "spor",
    label: "Spor",
    color: "#06b6d4",
    defaultLocationType: "sports",
    defaultPoint: { latitude: 555, longitude: 610 },
    recommendedWasteTypes: ["general", "recyclable", "organic"],
    fillMultiplier: 1.25,
    temperatureBias: 0.4,
    batteryDrainMultiplier: 1.05,
    peakHours: [7, 17, 18, 19],
  },
  laboratuvar: {
    key: "laboratuvar",
    label: "Laboratuvar",
    color: "#64748b",
    defaultLocationType: "laboratory",
    defaultPoint: { latitude: 210, longitude: 640 },
    recommendedWasteTypes: ["hazardous", "general"],
    fillMultiplier: 0.9,
    temperatureBias: 0.8,
    batteryDrainMultiplier: 1.15,
    peakHours: [10, 11, 14, 15],
  },
};

export const ZONE_OPTIONS = Object.values(ZONE_CONFIG);

export const WASTE_TYPE_LABELS: Record<WasteType, string> = {
  general: "Genel",
  recyclable: "Geri Donusum",
  organic: "Organik",
  hazardous: "Tehlikeli",
};

export const WASTE_TYPE_COLORS: Record<WasteType, string> = {
  general: "#6b7280",
  recyclable: "#3b82f6",
  organic: "#22c55e",
  hazardous: "#ef4444",
};

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  faculty: "Fakulte",
  cafeteria: "Yemekhane",
  library: "Kutuphane",
  sports: "Spor",
  laboratory: "Laboratuvar",
  outdoor: "Acik Alan",
};

export function inferLocationType(zone: string): LocationType {
  return ZONE_CONFIG[zone]?.defaultLocationType || "outdoor";
}

export function getZoneDefaultPoint(zone: string): Point {
  return ZONE_CONFIG[zone]?.defaultPoint || { latitude: 350, longitude: 500 };
}

export function getRecommendedWasteTypes(zone: string): WasteType[] {
  return ZONE_CONFIG[zone]?.recommendedWasteTypes || ["general"];
}
