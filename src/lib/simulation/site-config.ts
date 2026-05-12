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
  baseHourlyIntensity: number[];
  specialEvents: ZoneEventProfile[];
  wasteComposition: WasteCompositionProfile;
}

export interface WaitingNode extends Point {
  id: string;
  label: string;
  zones: string[];
}

export interface ZoneEventProfile {
  id: string;
  label: string;
  hours: number[];
  days?: number[];
  multiplier: number;
  wasteTypeBoosts?: Partial<Record<WasteType, number>>;
}

export interface WasteCompositionProfile {
  plastic: number;
  metal: number;
  organic: number;
  nonRecyclable: number;
  hazardous: number;
}

export const WASTE_COMPOSITION_KEYS = [
  "plastic",
  "metal",
  "organic",
  "nonRecyclable",
  "hazardous",
] as const;

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
    baseHourlyIntensity: [
      0.35, 0.3, 0.28, 0.28, 0.3, 0.35, 0.55, 0.8, 1.05, 1.15, 1.2, 1.0,
      1.1, 1.15, 1.0, 0.95, 1.05, 0.85, 0.65, 0.55, 0.45, 0.4, 0.35, 0.32,
    ],
    specialEvents: [
      {
        id: "engineering-club",
        label: "Muhendislik Kulup Etkinligi",
        hours: [17, 18, 19],
        days: [1, 3],
        multiplier: 1.28,
        wasteTypeBoosts: { recyclable: 1.15, general: 1.1 },
      },
    ],
    wasteComposition: {
      plastic: 26,
      metal: 14,
      organic: 12,
      nonRecyclable: 48,
      hazardous: 0,
    },
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
    baseHourlyIntensity: [
      0.3, 0.28, 0.26, 0.26, 0.28, 0.35, 0.5, 0.72, 0.92, 1.05, 1.08, 1.0,
      1.02, 1.08, 1.0, 1.02, 0.88, 0.74, 0.6, 0.5, 0.42, 0.36, 0.32, 0.3,
    ],
    specialEvents: [
      {
        id: "science-fair",
        label: "Fen Proje Sergisi",
        hours: [10, 11, 12, 13],
        days: [2],
        multiplier: 1.22,
        wasteTypeBoosts: { recyclable: 1.18, general: 1.08 },
      },
    ],
    wasteComposition: {
      plastic: 22,
      metal: 12,
      organic: 10,
      nonRecyclable: 54,
      hazardous: 2,
    },
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
    baseHourlyIntensity: [
      0.28, 0.25, 0.24, 0.24, 0.26, 0.32, 0.45, 0.62, 0.78, 0.9, 1.0, 1.02,
      1.05, 0.95, 1.0, 0.88, 0.82, 0.68, 0.58, 0.5, 0.42, 0.34, 0.3, 0.28,
    ],
    specialEvents: [
      {
        id: "seminar-evening",
        label: "Edebiyat Semineri",
        hours: [18, 19],
        days: [2, 4],
        multiplier: 1.18,
        wasteTypeBoosts: { general: 1.12 },
      },
    ],
    wasteComposition: {
      plastic: 24,
      metal: 8,
      organic: 6,
      nonRecyclable: 62,
      hazardous: 0,
    },
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
    baseHourlyIntensity: [
      0.22, 0.2, 0.18, 0.18, 0.2, 0.28, 0.48, 0.95, 1.3, 0.75, 0.7, 1.05,
      1.45, 1.38, 0.92, 0.76, 0.82, 1.02, 1.22, 0.74, 0.48, 0.34, 0.26, 0.24,
    ],
    specialEvents: [
      {
        id: "lunch-rush",
        label: "Oglen Yemek Yogunlugu",
        hours: [12, 13],
        multiplier: 1.35,
        wasteTypeBoosts: { organic: 1.25, general: 1.1 },
      },
      {
        id: "dinner-rush",
        label: "Aksam Yemek Yogunlugu",
        hours: [18, 19],
        multiplier: 1.2,
        wasteTypeBoosts: { organic: 1.18 },
      },
    ],
    wasteComposition: {
      plastic: 18,
      metal: 6,
      organic: 46,
      nonRecyclable: 28,
      hazardous: 2,
    },
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
    baseHourlyIntensity: [
      0.18, 0.16, 0.14, 0.14, 0.16, 0.2, 0.26, 0.34, 0.48, 0.6, 0.72, 0.8,
      0.86, 0.94, 1.0, 1.06, 1.08, 1.12, 1.18, 1.22, 1.16, 0.9, 0.55, 0.3,
    ],
    specialEvents: [
      {
        id: "exam-period",
        label: "Sinav Donemi Yogunlugu",
        hours: [17, 18, 19, 20, 21],
        days: [0, 1, 2, 3, 4],
        multiplier: 1.22,
        wasteTypeBoosts: { general: 1.08, recyclable: 1.1 },
      },
    ],
    wasteComposition: {
      plastic: 20,
      metal: 6,
      organic: 4,
      nonRecyclable: 70,
      hazardous: 0,
    },
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
    baseHourlyIntensity: [
      0.2, 0.18, 0.18, 0.18, 0.2, 0.28, 0.58, 0.92, 0.62, 0.42, 0.36, 0.34,
      0.38, 0.46, 0.52, 0.68, 0.92, 1.08, 1.14, 1.08, 0.74, 0.52, 0.32, 0.24,
    ],
    specialEvents: [
      {
        id: "match-night",
        label: "Mac / Etkinlik Yogunlugu",
        hours: [18, 19, 20],
        days: [1, 4, 6],
        multiplier: 1.34,
        wasteTypeBoosts: { general: 1.16, recyclable: 1.12 },
      },
    ],
    wasteComposition: {
      plastic: 28,
      metal: 12,
      organic: 10,
      nonRecyclable: 50,
      hazardous: 0,
    },
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
    baseHourlyIntensity: [
      0.16, 0.14, 0.14, 0.14, 0.16, 0.2, 0.28, 0.44, 0.66, 0.86, 1.0, 1.08,
      0.92, 0.84, 0.98, 1.08, 0.82, 0.58, 0.42, 0.3, 0.24, 0.2, 0.18, 0.16,
    ],
    specialEvents: [
      {
        id: "hazard-disposal-window",
        label: "Atik Bosaltim Penceresi",
        hours: [14, 15, 16],
        days: [1, 3, 5],
        multiplier: 1.28,
        wasteTypeBoosts: { hazardous: 1.35 },
      },
    ],
    wasteComposition: {
      plastic: 8,
      metal: 10,
      organic: 4,
      nonRecyclable: 38,
      hazardous: 40,
    },
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

export const WASTE_COMPOSITION_LABELS: Record<keyof WasteCompositionProfile, string> = {
  plastic: "Plastik",
  metal: "Metal",
  organic: "Organik",
  nonRecyclable: "Geri Donusemeyen",
  hazardous: "Tehlikeli",
};

export const WASTE_COMPOSITION_COLORS: Record<keyof WasteCompositionProfile, string> = {
  plastic: "#38bdf8",
  metal: "#a3a3a3",
  organic: "#22c55e",
  nonRecyclable: "#f97316",
  hazardous: "#ef4444",
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
