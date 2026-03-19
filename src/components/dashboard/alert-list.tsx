"use client";

import { AlertTriangle, Flame, BatteryLow, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSimulationStore } from "@/lib/stores/simulation-store";
import type { Alert } from "@/types";

const alertIcons: Record<string, React.ElementType> = {
  high_fill: AlertTriangle,
  overflow: AlertTriangle,
  high_temp: Flame,
  low_battery: BatteryLow,
  offline: Wifi,
};

const severityColors: Record<string, string> = {
  critical: "text-red-500 bg-red-500/10",
  warning: "text-yellow-500 bg-yellow-500/10",
  info: "text-blue-500 bg-blue-500/10",
};

export function AlertList() {
  const alerts = useSimulationStore((s) => s.alerts);

  if (alerts.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-6">
        Aktif alarm yok
      </div>
    );
  }

  const handleResolve = async (id: number) => {
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  return (
    <div className="space-y-2">
      {alerts.slice(0, 8).map((alert: Alert) => {
        const Icon = alertIcons[alert.alert_type] || AlertTriangle;
        const colorClass = severityColors[alert.severity] || severityColors.info;

        return (
          <div
            key={alert.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-card border"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {alert.bin_name || `Kutu #${alert.bin_id}`}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {alert.message}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 shrink-0"
              onClick={() => handleResolve(alert.id)}
            >
              Coz
            </Button>
          </div>
        );
      })}
    </div>
  );
}
