"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useSimulationStore } from "@/lib/stores/simulation-store";
import { useInterval } from "./use-interval";

export function useSimulation() {
  const {
    bins,
    isRunning,
    speed,
    tickCount,
    initialized,
    pendingAlerts,
    init,
    start,
    stop,
    reset,
    setSpeed,
    setTickCount,
    tick,
    clearPendingAlerts,
    setAlerts,
  } = useSimulationStore();

  const persistCounter = useRef(0);

  const refreshAlerts = useCallback(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAlerts(data);
      })
      .catch(console.error);
  }, [setAlerts]);

  // Fetch initial bins on mount
  useEffect(() => {
    if (!initialized) {
      fetch("/api/bins")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) init(data);
        })
        .catch(console.error);
    }
  }, [initialized, init]);

  // Run simulation tick
  useInterval(
    () => {
      tick();
      persistCounter.current++;
    },
    isRunning ? 2000 / speed : null
  );

  // Handle pending alerts (toast notifications)
  useEffect(() => {
    if (pendingAlerts.length === 0) return;

    for (const alert of pendingAlerts) {
      if (alert.severity === "critical") {
        toast.error(alert.message);
      } else {
        toast.warning(alert.message);
      }
    }

    fetch("/api/simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bins: [], newAlerts: pendingAlerts }),
    })
      .then(refreshAlerts)
      .catch(console.error);

    clearPendingAlerts();
  }, [pendingAlerts, clearPendingAlerts, refreshAlerts]);

  // Persist to DB every 5 ticks
  useEffect(() => {
    if (!isRunning || tickCount === 0 || tickCount % 5 !== 0) return;

    const binData = bins.map((b) => ({
      id: b.id,
      fill: b.current_fill_percent,
      temperature: b.temperature,
      battery: b.battery_level,
      status: b.status,
    }));

    fetch("/api/simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bins: binData, newAlerts: [] }),
    }).catch(console.error);
  }, [tickCount, isRunning, bins]);

  useEffect(() => {
    refreshAlerts();
    const id = setInterval(refreshAlerts, 10000);
    return () => clearInterval(id);
  }, [refreshAlerts]);

  return {
    bins,
    isRunning,
    speed,
    tickCount,
    initialized,
    start,
    stop,
    reset,
    setSpeed,
    setTickCount,
    refreshAlerts,
  };
}
