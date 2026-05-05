"use client";

import { Play, Pause, RotateCcw, Zap, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useSimulation } from "@/hooks/use-simulation";
import {
  formatSimulationClock,
  getActiveZoneEvents,
  SIMULATION_DAY_LABELS,
} from "@/lib/simulation/production-model";

const speedOptions = [1, 2, 4] as const;

export function SimulationControls() {
  const { isRunning, speed, tickCount, start, stop, reset, setSpeed, setTickCount } =
    useSimulation();
  const clock = formatSimulationClock(tickCount);
  const activeEvents = getActiveZoneEvents(tickCount);

  const handleHourChange = (value: number | readonly number[]) => {
    const nextHour = Array.isArray(value) ? value[0] ?? 0 : value;
    setTickCount(clock.day * 24 + nextHour);
  };

  const handleDayChange = (day: number) => {
    setTickCount(day * 24 + clock.hour);
  };

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

      <div className="rounded-lg border border-border/60 bg-background/40 p-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <Clock3 className="h-3 w-3" />
            Simulasyon Saati
          </span>
          <Badge variant="outline" className="text-[11px]">
            {clock.label}
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {SIMULATION_DAY_LABELS.map((dayLabel, index) => (
            <Button
              key={dayLabel}
              type="button"
              size="xs"
              variant={clock.day === index ? "default" : "outline"}
              className="h-6 px-1 text-[10px]"
              onClick={() => handleDayChange(index)}
            >
              {dayLabel}
            </Button>
          ))}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Saat</span>
            <span>{clock.hour.toString().padStart(2, "0")}:00</span>
          </div>
          <Slider
            value={[clock.hour]}
            onValueChange={handleHourChange}
            min={0}
            max={23}
            step={1}
          />
        </div>

        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">
            Aktif yogunluk pencereleri
          </p>
          {activeEvents.length > 0 ? (
            <div className="space-y-1">
              {activeEvents.slice(0, 3).map((event) => (
                <div
                  key={`${event.zone}-${event.eventId}`}
                  className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2 py-1"
                >
                  <p className="text-[10px] font-medium">{event.zoneLabel}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {event.eventLabel} x{event.multiplier.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              Bu saatte ozel yogunluk yok.
            </p>
          )}
        </div>
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
