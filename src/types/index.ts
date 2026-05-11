export interface WasteBin {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  waste_type: "general" | "recyclable" | "organic" | "hazardous";
  capacity_liters: number;
  current_fill_percent: number;
  temperature: number;
  battery_level: number;
  status: "normal" | "warning" | "critical" | "collecting" | "offline";
  zone: string;
  created_at: Date;
  updated_at: Date;
}

export interface SensorReading {
  id: number;
  bin_id: number;
  fill_percent: number;
  temperature: number;
  battery_level: number;
  recorded_at: Date;
}

export interface CollectionRoute {
  id: number;
  name: string;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  total_distance: number;
  total_bins: number;
  estimated_duration_min: number;
  algorithm: string;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
}

export interface RouteStop {
  id: number;
  route_id: number;
  bin_id: number;
  stop_order: number;
  fill_at_arrival: number | null;
  arrived_at: Date | null;
  collected_at: Date | null;
}

export interface Collection {
  id: number;
  bin_id: number;
  route_id: number | null;
  fill_at_collection: number;
  collected_at: Date;
}

export interface Alert {
  id: number;
  bin_id: number;
  alert_type:
    | "high_fill"
    | "overflow"
    | "high_temp"
    | "low_battery"
    | "offline";
  message: string;
  severity: "info" | "warning" | "critical";
  is_resolved: boolean;
  created_at: Date;
  resolved_at: Date | null;
  bin_name?: string;
}

export interface User {
  id: number;
  name: string;
  role: "admin" | "collector" | "viewer";
  total_collections: number;
  total_points: number;
  streak_days: number;
  created_at: Date;
}

export type WasteType = "recyclable" | "organic" | "general" | "hazardous";

export type BadgeId =
  | "beginner"
  | "recycler"
  | "green_campus"
  | "eco_champion"
  | "streak_master"
  | "first_throw";

export interface Badge {
  id: BadgeId;
  name: string;
  icon: string;
  description: string;
  requiredCredits: number;
}

export interface CreditTransaction {
  id: string;
  studentId: string;
  amount: number;
  reason: string;
  wasteType: WasteType;
  binName?: string;
  createdAt: Date;
}

export interface Student {
  id: string;
  name: string;
  studentNo: string;
  department: string;
  credits: number;
  streakDays: number;
  lastActivity: Date | null;
  badges: BadgeId[];
  totalThrows: number;
  recyclingRate: number; // 0-100
  createdAt: Date;
}

export interface DashboardStats {
  totalBins: number;
  avgFillPercent: number;
  collectionsToday: number;
  activeAlerts: number;
  binsByStatus: Record<string, number>;
  binsByZone: Record<string, number>;
}
