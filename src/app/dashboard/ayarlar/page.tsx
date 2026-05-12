"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Database,
  LocateFixed,
  MapPin,
  Palette,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useSimulationStore } from "@/lib/stores/simulation-store";
import { useUIStore } from "@/lib/stores/ui-store";
import {
  getRecommendedWasteTypes,
  getZoneDefaultPoint,
  inferLocationType,
  LOCATION_TYPE_LABELS,
  WASTE_TYPE_LABELS,
  ZONE_CONFIG,
  ZONE_OPTIONS,
} from "@/lib/simulation/site-config";
import type { LocationType, WasteType } from "@/types";

const INITIAL_ZONE = "muhendislik";

function createInitialBinDraft() {
  return {
    name: "",
    zone: INITIAL_ZONE,
    location_type: inferLocationType(INITIAL_ZONE),
    waste_type: getRecommendedWasteTypes(INITIAL_ZONE)[0] || "general",
    ...getZoneDefaultPoint(INITIAL_ZONE),
  };
}

export default function AyarlarPage() {
  const { theme, setTheme } = useTheme();
  const reset = useSimulationStore((s) => s.reset);
  const bins = useSimulationStore((s) => s.bins);
  const init = useSimulationStore((s) => s.init);
  const selectedBinId = useUIStore((s) => s.selectedBinId);
  const selectBin = useUIStore((s) => s.selectBin);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newBin, setNewBin] = useState(createInitialBinDraft);

  const selectedZoneConfig = ZONE_CONFIG[newBin.zone];
  const recommendedWasteTypes = getRecommendedWasteTypes(newBin.zone);

  const refreshBins = async () => {
    const data = await fetch("/api/bins").then((r) => r.json());
    if (Array.isArray(data)) init(data);
  };

  const applyZoneDefaults = (zone: string) => {
    const defaultPoint = getZoneDefaultPoint(zone);
    const recommendedType = getRecommendedWasteTypes(zone)[0] || "general";

    setNewBin((current) => ({
      ...current,
      zone,
      location_type: inferLocationType(zone),
      waste_type: recommendedType,
      latitude: defaultPoint.latitude,
      longitude: defaultPoint.longitude,
    }));
  };

  const updateCoordinate = (axis: "latitude" | "longitude", rawValue: number) => {
    const max = axis === "latitude" ? 700 : 1000;
    const nextValue = Math.max(0, Math.min(max, Math.round(rawValue)));
    setNewBin((current) => ({ ...current, [axis]: nextValue }));
  };

  const resetDraftPosition = () => {
    const defaultPoint = getZoneDefaultPoint(newBin.zone);
    setNewBin((current) => ({
      ...current,
      latitude: defaultPoint.latitude,
      longitude: defaultPoint.longitude,
    }));
  };

  const resetDraftAfterCreate = () => {
    const defaultPoint = getZoneDefaultPoint(newBin.zone);
    setNewBin((current) => ({
      ...current,
      name: "",
      latitude: defaultPoint.latitude,
      longitude: defaultPoint.longitude,
    }));
  };

  const handleAddBin = async () => {
    if (!newBin.name.trim()) {
      toast.error("Kutu adı gerekli");
      return;
    }

    try {
      const res = await fetch("/api/bins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBin),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Kutu eklenemedi");
      }

      toast.success(`${newBin.name} eklendi`);
      resetDraftAfterCreate();
      await refreshBins();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kutu eklenemedi");
    }
  };

  const handleResetDB = async () => {
    try {
      reset();
      toast.success("Simulasyon sifirlandi");
    } catch {
      toast.error("Sıfırlama başarısız");
    }
  };

  const handleDeleteBin = async (id: number, name: string) => {
    const confirmed = window.confirm(`${name} silinsin mi?`);
    if (!confirmed) return;

    try {
      setDeletingId(id);
      const response = await fetch(`/api/bins/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Kutu silinemedi");
      }

      if (selectedBinId === id) selectBin(null);
      await refreshBins();
      toast.success(`${name} silindi`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kutu silinemedi");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <DashboardHeader title="Ayarlar" />
      <div className="flex-1 max-w-5xl space-y-6 overflow-y-auto p-6">
        <div className="glass space-y-4 rounded-xl p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <Palette className="h-4 w-4" /> Gorunum
          </h3>
          <div className="flex items-center justify-between">
            <Label>Tema</Label>
            <Select
              value={theme || "dark"}
              onValueChange={(value) => {
                if (value) setTheme(value);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Koyu</SelectItem>
                <SelectItem value="light">Açık</SelectItem>
                <SelectItem value="system">Sistem</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="glass space-y-5 rounded-xl p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <Plus className="h-4 w-4" /> Kutu Ekle
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Kutu Adı</Label>
              <Input
                value={newBin.name}
                onChange={(e) =>
                  setNewBin((current) => ({ ...current, name: e.target.value }))
                }
                placeholder="orn: LAB-01"
              />
            </div>

            <div className="space-y-2">
              <Label>Bölge</Label>
              <Select
                value={newBin.zone}
                onValueChange={(value) => {
                  if (value) applyZoneDefaults(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZONE_OPTIONS.map((zone) => (
                    <SelectItem key={zone.key} value={zone.key}>
                      {zone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Bolge secimi varsayilan konum tipi ve harita merkezini belirler.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Konum Tipi</Label>
              <Select
                value={newBin.location_type}
                onValueChange={(value) => {
                  if (value) {
                    setNewBin((current) => ({
                      ...current,
                      location_type: value as LocationType,
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LOCATION_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Varsayilan: {LOCATION_TYPE_LABELS[selectedZoneConfig.defaultLocationType]}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Atik Tipi</Label>
              <Select
                value={newBin.waste_type}
                onValueChange={(value) => {
                  if (value) {
                    setNewBin((current) => ({
                      ...current,
                      waste_type: value as WasteType,
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(WASTE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border bg-card/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Onerilen atik tipleri</span>
              {recommendedWasteTypes.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={newBin.waste_type === type ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setNewBin((current) => ({ ...current, waste_type: type }))
                  }
                >
                  {WASTE_TYPE_LABELS[type]}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-xl border bg-card/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-medium">Harita Konumu</h4>
                <p className="text-xs text-muted-foreground">
                  {selectedZoneConfig.label} icin baslangic noktasi: Y {selectedZoneConfig.defaultPoint.latitude}, X{" "}
                  {selectedZoneConfig.defaultPoint.longitude}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={resetDraftPosition}>
                <LocateFixed className="mr-2 h-4 w-4" />
                Bolge Merkezine Don
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coord-y">Y Koordinati</Label>
                <Input
                  id="coord-y"
                  type="number"
                  min={0}
                  max={700}
                  value={newBin.latitude}
                  onChange={(e) => updateCoordinate("latitude", Number(e.target.value))}
                />
                <Slider
                  value={[newBin.latitude]}
                  onValueChange={(value) =>
                    updateCoordinate("latitude", Array.isArray(value) ? value[0] : value)
                  }
                  min={0}
                  max={700}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coord-x">X Koordinati</Label>
                <Input
                  id="coord-x"
                  type="number"
                  min={0}
                  max={1000}
                  value={newBin.longitude}
                  onChange={(e) => updateCoordinate("longitude", Number(e.target.value))}
                />
                <Slider
                  value={[newBin.longitude]}
                  onValueChange={(value) =>
                    updateCoordinate("longitude", Array.isArray(value) ? value[0] : value)
                  }
                  min={0}
                  max={1000}
                  step={5}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleAddBin} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Kutu Ekle
          </Button>
        </div>

        <div className="glass space-y-4 rounded-xl p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <MapPin className="h-4 w-4" /> Kutulari Yonet
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {bins
              .slice()
              .sort((a, b) => a.zone.localeCompare(b.zone) || a.name.localeCompare(b.name))
              .map((bin) => (
                <div
                  key={bin.id}
                  className="flex items-center gap-3 rounded-lg border bg-card/60 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{bin.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ZONE_CONFIG[bin.zone]?.label || bin.zone} ·{" "}
                      {LOCATION_TYPE_LABELS[bin.location_type || inferLocationType(bin.zone)]} ·{" "}
                      {bin.current_fill_percent.toFixed(0)}%
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-400"
                    disabled={deletingId === bin.id}
                    onClick={() => handleDeleteBin(bin.id, bin.name)}
                    aria-label={`${bin.name} sil`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
          </div>
        </div>

        <div className="glass space-y-4 rounded-xl p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <Database className="h-4 w-4" /> Veritabani
          </h3>
          <p className="text-sm text-muted-foreground">
            Sistemde {bins.length} atik kutusu bulunuyor.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleResetDB}>
              <RotateCcw className="mr-2 h-4 w-4" /> Simulasyonu Sifirla
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
