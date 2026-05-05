"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Route, ShieldAlert, Trash2, Waves } from "lucide-react";
import { ZONE_CONFIG } from "@/lib/simulation/site-config";

type HistoryView = "all" | "collections" | "routes" | "alerts" | "readings";
type DateRange = "today" | "7d" | "30d" | "all";

interface HistoryPayload {
  collections: Array<{
    id: number;
    bin_id: number;
    route_id: number | null;
    fill_at_collection: number;
    collected_at: string;
    bin_name: string;
    zone: string | null;
  }>;
  routes: Array<{
    id: number;
    name: string;
    status: string;
    total_distance: number;
    total_bins: number;
    estimated_duration_min: number;
    created_at: string;
    completed_at: string | null;
  }>;
  alerts: Array<{
    id: number;
    bin_id: number;
    bin_name?: string;
    message: string;
    severity: "info" | "warning" | "critical";
    is_resolved: boolean;
    created_at: string;
    zone?: string | null;
  }>;
  readings: Array<{
    id: number;
    bin_id: number;
    bin_name: string;
    zone: string | null;
    fill_percent: number;
    temperature: number;
    battery_level: number;
    recorded_at: string;
  }>;
  summary: {
    collectionsToday: number;
    completedRoutes: number;
    totalAlerts: number;
    latestReadings: number;
  };
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GecmisPage() {
  const [data, setData] = useState<HistoryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<HistoryView>("all");
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>("7d");

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/history");
      const payload = await response.json();
      if (response.ok) {
        setData(payload);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    const id = setInterval(loadHistory, 15000);
    return () => clearInterval(id);
  }, [loadHistory]);

  const zoneOptions = useMemo(() => {
    const zoneSet = new Set<string>();
    data?.collections.forEach((item) => item.zone && zoneSet.add(item.zone));
    data?.alerts.forEach((item) => item.zone && zoneSet.add(item.zone));
    data?.readings.forEach((item) => item.zone && zoneSet.add(item.zone));
    return Array.from(zoneSet);
  }, [data]);

  const isWithinRange = useCallback((value: string | null, range: DateRange) => {
    if (!value || range === "all") return true;
    const itemTime = new Date(value).getTime();
    const now = Date.now();

    if (range === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      return itemTime >= startOfDay.getTime();
    }

    const days = range === "7d" ? 7 : 30;
    return itemTime >= now - days * 24 * 60 * 60 * 1000;
  }, []);

  const filteredCollections = useMemo(
    () =>
      (data?.collections || []).filter(
        (item) =>
          (selectedZone === "all" || item.zone === selectedZone) &&
          isWithinRange(item.collected_at, dateRange)
      ),
    [data, selectedZone, dateRange, isWithinRange]
  );

  const filteredRoutes = useMemo(
    () =>
      (data?.routes || []).filter((item) =>
        isWithinRange(item.completed_at || item.created_at, dateRange)
      ),
    [data, dateRange, isWithinRange]
  );

  const filteredAlerts = useMemo(
    () =>
      (data?.alerts || []).filter(
        (item) =>
          (selectedZone === "all" || item.zone === selectedZone) &&
          isWithinRange(item.created_at, dateRange)
      ),
    [data, selectedZone, dateRange, isWithinRange]
  );

  const filteredReadings = useMemo(
    () =>
      (data?.readings || []).filter(
        (item) =>
          (selectedZone === "all" || item.zone === selectedZone) &&
          isWithinRange(item.recorded_at, dateRange)
      ),
    [data, selectedZone, dateRange, isWithinRange]
  );

  const renderCollections = () => (
    <div className="glass rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm">Son Toplamalar</h3>
      <div className="space-y-2">
        {filteredCollections.length ? (
          filteredCollections.map((collection) => (
            <div
              key={collection.id}
              className="rounded-lg border border-border/60 p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{collection.bin_name}</span>
                <Badge variant="outline">%{collection.fill_at_collection.toFixed(0)}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {collection.zone ? ZONE_CONFIG[collection.zone]?.label || collection.zone : "Bolge yok"}
                </span>
                <span>{formatDateTime(collection.collected_at)}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Filtreye uygun toplama kaydi yok.</p>
        )}
      </div>
    </div>
  );

  const renderRoutes = () => (
    <div className="glass rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm">Rota Gecmisi</h3>
      <div className="space-y-2">
        {filteredRoutes.length ? (
          filteredRoutes.map((route) => (
            <div
              key={route.id}
              className="rounded-lg border border-border/60 p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{route.name}</span>
                <Badge variant="outline">{route.status}</Badge>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>{route.total_bins} kutu</span>
                <span>{route.total_distance.toFixed(0)} px</span>
                <span>{route.estimated_duration_min} dk</span>
                <span>{formatDateTime(route.completed_at || route.created_at)}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Filtreye uygun rota gecmisi yok.</p>
        )}
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="glass rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm">Alarm Gecmisi</h3>
      <div className="space-y-2">
        {filteredAlerts.length ? (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-lg border border-border/60 p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{alert.bin_name || `Kutu #${alert.bin_id}`}</span>
                <Badge
                  variant="outline"
                  className={
                    alert.severity === "critical"
                      ? "text-red-500"
                      : alert.severity === "warning"
                        ? "text-amber-500"
                        : "text-sky-500"
                  }
                >
                  {alert.severity}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{alert.message}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {alert.zone ? ZONE_CONFIG[alert.zone]?.label || alert.zone : alert.is_resolved ? "Cozuldu" : "Aktifti"}
                </span>
                <span>{formatDateTime(alert.created_at)}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Filtreye uygun alarm gecmisi yok.</p>
        )}
      </div>
    </div>
  );

  const renderReadings = () => (
    <div className="glass rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm">Son Sensor Okumalari</h3>
      <div className="space-y-2">
        {filteredReadings.length ? (
          filteredReadings.map((reading) => (
            <div
              key={reading.id}
              className="rounded-lg border border-border/60 p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{reading.bin_name}</span>
                <Badge variant="outline">%{reading.fill_percent.toFixed(0)}</Badge>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>{reading.temperature.toFixed(1)} C</span>
                <span>Batarya %{reading.battery_level.toFixed(0)}</span>
                <span>{reading.zone ? ZONE_CONFIG[reading.zone]?.label || reading.zone : "Bolge yok"}</span>
                <span>{formatDateTime(reading.recorded_at)}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Filtreye uygun sensor okumasi yok.</p>
        )}
      </div>
    </div>
  );

  return (
    <>
      <DashboardHeader title="Gecmis" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Toplama, rota, alarm ve sensor kayitlarini tek yerde gor.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadHistory} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </Button>
        </div>

        <div className="glass rounded-xl p-4 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <Tabs
              value={activeView}
              onValueChange={(value) => setActiveView(value as HistoryView)}
              className="gap-3"
            >
              <TabsList variant="line">
                <TabsTrigger value="all">Tum Kayitlar</TabsTrigger>
                <TabsTrigger value="collections">Toplamalar</TabsTrigger>
                <TabsTrigger value="routes">Rotalar</TabsTrigger>
                <TabsTrigger value="alerts">Alarmlar</TabsTrigger>
                <TabsTrigger value="readings">Sensorler</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Bolge</p>
                <Select
                  value={selectedZone}
                  onValueChange={(value) => {
                    if (value) setSelectedZone(value);
                  }}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Tum bolgeler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tum bolgeler</SelectItem>
                    {zoneOptions.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {ZONE_CONFIG[zone]?.label || zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tarih Araligi</p>
                <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Bugun</SelectItem>
                    <SelectItem value="7d">Son 7 gun</SelectItem>
                    <SelectItem value="30d">Son 30 gun</SelectItem>
                    <SelectItem value="all">Tum zamanlar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Bugunku Toplama</span>
              <Trash2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {data?.summary.collectionsToday ?? 0}
            </p>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Tamamlanan Rota</span>
              <Route className="h-4 w-4 text-sky-500" />
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {data?.summary.completedRoutes ?? 0}
            </p>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Alarm Kaydi</span>
              <ShieldAlert className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {data?.summary.totalAlerts ?? 0}
            </p>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Son Sensor Anliklari</span>
              <Waves className="h-4 w-4 text-violet-500" />
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {data?.summary.latestReadings ?? 0}
            </p>
          </div>
        </div>

        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as HistoryView)}>
          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              {renderCollections()}
              {renderRoutes()}
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              {renderAlerts()}
              {renderReadings()}
            </div>
          </TabsContent>

          <TabsContent value="collections">{renderCollections()}</TabsContent>
          <TabsContent value="routes">{renderRoutes()}</TabsContent>
          <TabsContent value="alerts">{renderAlerts()}</TabsContent>
          <TabsContent value="readings">{renderReadings()}</TabsContent>
        </Tabs>
      </div>
    </>
  );
}
