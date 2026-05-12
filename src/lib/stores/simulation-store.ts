import { create } from "zustand";
import type { WasteBin, Alert } from "@/types";
import {
  createEmptyWasteComposition,
  normalizeBin,
  simulateBinTick,
} from "@/lib/simulation/production-model";

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
  replaceBins: (bins: WasteBin[]) => void;
  advanceTicks: (steps: number) => void;
  setTickCount: (tickCount: number) => void;
  clearPendingAlerts: () => void;
  setAlerts: (alerts: Alert[]) => void;
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
      bins: bins.map(normalizeBin),
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
        ...normalizeBin(b),
        current_fill_percent: 0,
        temperature: 22,
        battery_level: 100,
        status: "normal" as const,
        waste_composition: createEmptyWasteComposition(),
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
      const result = simulateBinTick(bin, speed, tickCount);
      newPendingAlerts.push(...result.alerts);
      return result.bin;
    });

    set({
      bins: updatedBins,
      tickCount: tickCount + 1,
      pendingAlerts: newPendingAlerts,
    });
  },

  collectBin: (binId) => {
    set((state) => ({
      bins: state.bins.map((b) =>
        b.id === binId
          ? {
              ...b,
              current_fill_percent: 0,
              location_type: normalizeBin(b).location_type,
              status: "normal" as const,
              waste_composition: createEmptyWasteComposition(),
            }
          : b
      ),
      collectionsToday: state.collectionsToday + 1,
    }));
  },

  collectBins: (binIds) => {
    set((state) => ({
      bins: state.bins.map((b) =>
        binIds.includes(b.id)
          ? {
              ...b,
              current_fill_percent: 0,
              location_type: normalizeBin(b).location_type,
              status: "normal" as const,
              waste_composition: createEmptyWasteComposition(),
            }
          : b
      ),
      collectionsToday: state.collectionsToday + binIds.length,
    }));
  },

  replaceBins: (bins) =>
    set({
      bins: bins.map(normalizeBin),
    }),

  advanceTicks: (steps) =>
    set((state) => ({
      tickCount: state.tickCount + Math.max(0, steps),
    })),

  setTickCount: (tickCount) =>
    set({
      tickCount: Math.max(0, Math.floor(tickCount)),
    }),
}));
