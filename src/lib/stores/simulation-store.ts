import { create } from "zustand";
import type { WasteBin, Alert } from "@/types";
import { useIncentiveStore } from "./incentive-store";


interface PendingAlert {
  binId: number;
  type: string;
  message: string;
  severity: string;
}

interface SimulationStore {
  bins: WasteBin[];
  alerts: Alert[];
  pendingAlerts: PendingAlert[];
  isRunning: boolean;
  speed: 1 | 2 | 4;
  tickCount: number;
  initialized: boolean;
  collectionsToday: number;

  init: (bins: WasteBin[]) => void;
  start: () => void;
  stop: () => void;
  reset: () => void;
  setSpeed: (speed: 1 | 2 | 4) => void;
  tick: () => void;
  collectBin: (binId: number) => void;
  collectBins: (binIds: number[]) => void;
  clearPendingAlerts: () => void;
  setAlerts: (alerts: Alert[]) => void;
}

// Zone-based fill rate multipliers (yemekhane fills faster)
const zoneMultiplier: Record<string, number> = {
  yemekhane: 2.0,
  spor: 1.3,
  muhendislik: 1.0,
  fen: 1.0,
  edebiyat: 0.8,
  kutuphane: 0.6,
};

function getStatus(fill: number): WasteBin["status"] {
  if (fill >= 80) return "critical";
  if (fill >= 50) return "warning";
  return "normal";
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  bins: [],
  alerts: [],
  pendingAlerts: [],
  isRunning: false,
  speed: 1,
  tickCount: 0,
  initialized: false,
  collectionsToday: 0,

  init: (bins) =>
    set({
      bins,
      initialized: true,
      tickCount: 0,
      pendingAlerts: [],
    }),

  start: () => set({ isRunning: true }),
  stop: () => set({ isRunning: false }),

  reset: () => {
    const { bins } = get();
    set({
      bins: bins.map((b) => ({
        ...b,
        current_fill_percent: 0,
        temperature: 22,
        battery_level: 100,
        status: "normal" as const,
      })),
      isRunning: false,
      tickCount: 0,
      pendingAlerts: [],
      alerts: [],
    });
  },

  setSpeed: (speed) => set({ speed }),
  clearPendingAlerts: () => set({ pendingAlerts: [] }),
  setAlerts: (alerts) => set({ alerts }),

  tick: () => {
    const { bins, speed, tickCount } = get();
    const newPendingAlerts: PendingAlert[] = [];

    const updatedBins = bins.map((bin) => {
      if (bin.status === "offline" || bin.status === "collecting") return bin;

      const mult = zoneMultiplier[bin.zone] || 1.0;
      let fill = bin.current_fill_percent + randomBetween(0.3, 1.5) * speed * mult;
      fill = Math.min(100, Math.max(0, fill));

      let temp = bin.temperature + randomBetween(-0.5, 0.5);
      temp = Math.min(55, Math.max(-5, temp));

      let battery = bin.battery_level - randomBetween(0.01, 0.05) * speed;
      battery = Math.max(0, battery);

      const status = getStatus(fill);

      // Generate alerts
      if (fill > 95 && bin.current_fill_percent <= 95) {
        newPendingAlerts.push({
          binId: bin.id,
          type: "overflow",
          message: `${bin.name} taşıyor! Doluluk: ${fill.toFixed(0)}%`,
          severity: "critical",
        });
      } else if (fill > 80 && bin.current_fill_percent <= 80) {
        newPendingAlerts.push({
          binId: bin.id,
          type: "high_fill",
          message: `${bin.name} doluluğu yüksek: ${fill.toFixed(0)}%`,
          severity: "warning",
        });
      }

      if (temp > 45 && bin.temperature <= 45) {
        newPendingAlerts.push({
          binId: bin.id,
          type: "high_temp",
          message: `${bin.name} sıcaklık yüksek: ${temp.toFixed(1)}°C`,
          severity: "warning",
        });
      }

      if (battery < 15 && bin.battery_level >= 15) {
        newPendingAlerts.push({
          binId: bin.id,
          type: "low_battery",
          message: `${bin.name} batarya düşük: ${battery.toFixed(0)}%`,
          severity: "warning",
        });
      }

      return {
        ...bin,
        current_fill_percent: fill,
        temperature: temp,
        battery_level: battery,
        status,
      };
    });

    set({
      bins: updatedBins,
      tickCount: tickCount + 1,
      pendingAlerts: newPendingAlerts,
    });
  },

  collectBin: (binId) => {
    const bin = get().bins.find((b) => b.id === binId);
    const incentive = useIncentiveStore.getState();
    if (incentive.initialized && bin) {
      const wasteTypeMap: Record<string, "recyclable" | "organic" | "general" | "hazardous"> = {
        recyclable: "recyclable",
        organic: "organic",
        general: "general",
        hazardous: "hazardous",
      };
      const wt = wasteTypeMap[bin.waste_type] ?? "general";
      incentive.awardCreditsToRandom(wt, bin.name);
    }
    set((state) => ({
      bins: state.bins.map((b) =>
        b.id === binId
          ? {
              ...b,
              current_fill_percent: 0,
              status: "normal" as const,
            }
          : b
      ),
      collectionsToday: state.collectionsToday + 1,
    }));
  },


  collectBins: (binIds) => {
    const bins = get().bins;
    const incentive = useIncentiveStore.getState();
    if (incentive.initialized) {
      for (const id of binIds) {
        const bin = bins.find((b) => b.id === id);
        if (!bin) continue;
        const wasteTypeMap: Record<string, "recyclable" | "organic" | "general" | "hazardous"> = {
          recyclable: "recyclable",
          organic: "organic",
          general: "general",
          hazardous: "hazardous",
        };
        const wt = wasteTypeMap[bin.waste_type] ?? "general";
        incentive.awardCreditsToRandom(wt, bin.name);
      }
    }
    set((state) => ({
      bins: state.bins.map((b) =>
        binIds.includes(b.id)
          ? {
              ...b,
              current_fill_percent: 0,
              status: "normal" as const,
            }
          : b
      ),
      collectionsToday: state.collectionsToday + binIds.length,
    }));
  },
}));
