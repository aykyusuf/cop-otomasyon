"use client";

import { Play, Pause, RotateCcw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSimulation } from "@/hooks/use-simulation";

const speedOptions = [1, 2, 4] as const;

export function SimulationControls() {
  const { isRunning, speed, tickCount, start, stop, reset, setSpeed } =
    useSimulation();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Simulasyon
        </span>
        <Badge
          variant={isRunning ? "default" : "outline"}
          className={
            isRunning
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs"
              : "text-xs"
          }
        >
          {isRunning ? `Calisiyor (${tickCount})` : "Durdu"}
        </Badge>
      </div>

      <div className="flex gap-2">
        {isRunning ? (
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={stop}
          >
            <Pause className="w-3.5 h-3.5 mr-1" />
            Durdur
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={start}
          >
            <Play className="w-3.5 h-3.5 mr-1" />
            Basla
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={reset}>
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex gap-1">
        {speedOptions.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={speed === s ? "default" : "outline"}
            className="flex-1 text-xs h-7"
            onClick={() => setSpeed(s)}
          >
            <Zap className="w-3 h-3 mr-0.5" />
            {s}x
          </Button>
        ))}
      </div>
    </div>
  );
}
