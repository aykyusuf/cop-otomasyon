"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useSimulationStore } from "@/lib/stores/simulation-store";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Trash2, RotateCcw, Database, Palette } from "lucide-react";

export default function AyarlarPage() {
  const { theme, setTheme } = useTheme();
  const reset = useSimulationStore((s) => s.reset);
  const bins = useSimulationStore((s) => s.bins);
  const init = useSimulationStore((s) => s.init);

  const [newBin, setNewBin] = useState({
    name: "",
    waste_type: "general",
    zone: "muhendislik",
    latitude: 350,
    longitude: 500,
  });

  const handleAddBin = async () => {
    if (!newBin.name.trim()) {
      toast.error("Kutu adi gerekli");
      return;
    }
    try {
      const res = await fetch("/api/bins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBin),
      });
      if (res.ok) {
        toast.success(`${newBin.name} eklendi`);
        setNewBin({ ...newBin, name: "" });
        // Refresh bins
        const data = await fetch("/api/bins").then((r) => r.json());
        if (Array.isArray(data)) init(data);
      }
    } catch {
      toast.error("Kutu eklenemedi");
    }
  };

  const handleResetDB = async () => {
    try {
      reset();
      // Re-fetch from DB
      const data = await fetch("/api/bins").then((r) => r.json());
      if (Array.isArray(data)) init(data);
      toast.success("Simulasyon sifirlandi");
    } catch {
      toast.error("Sifirlama basarisiz");
    }
  };

  return (
    <>
      <DashboardHeader title="Ayarlar" />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-3xl">
        {/* Theme */}
        <div className="glass rounded-xl p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4" /> Gorunum
          </h3>
          <div className="flex items-center justify-between">
            <Label>Tema</Label>
            <Select value={theme || "dark"} onValueChange={(v) => { if (v) setTheme(v); }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Koyu</SelectItem>
                <SelectItem value="light">Acik</SelectItem>
                <SelectItem value="system">Sistem</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Add Bin */}
        <div className="glass rounded-xl p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Kutu Ekle
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kutu Adi</Label>
              <Input
                value={newBin.name}
                onChange={(e) => setNewBin({ ...newBin, name: e.target.value })}
                placeholder="orn: YNI-01"
              />
            </div>
            <div className="space-y-2">
              <Label>Atik Tipi</Label>
              <Select
                value={newBin.waste_type}
                onValueChange={(v) => { if (v) setNewBin({ ...newBin, waste_type: v }); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Genel</SelectItem>
                  <SelectItem value="recyclable">Geri Donusum</SelectItem>
                  <SelectItem value="organic">Organik</SelectItem>
                  <SelectItem value="hazardous">Tehlikeli</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bolge</Label>
              <Select
                value={newBin.zone}
                onValueChange={(v) => { if (v) setNewBin({ ...newBin, zone: v }); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="muhendislik">Muhendislik</SelectItem>
                  <SelectItem value="fen">Fen</SelectItem>
                  <SelectItem value="edebiyat">Edebiyat</SelectItem>
                  <SelectItem value="yemekhane">Yemekhane</SelectItem>
                  <SelectItem value="kutuphane">Kutuphane</SelectItem>
                  <SelectItem value="spor">Spor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Konum (Y: {newBin.latitude}, X: {newBin.longitude})</Label>
              <Slider
                value={[newBin.latitude]}
                onValueChange={(val) => { const v = Array.isArray(val) ? val[0] : val; setNewBin({ ...newBin, latitude: v }); }}
                min={50}
                max={650}
              />
            </div>
          </div>
          <Button onClick={handleAddBin} size="sm">
            Kutu Ekle
          </Button>
        </div>

        {/* Database */}
        <div className="glass rounded-xl p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Database className="w-4 h-4" /> Veritabani
          </h3>
          <p className="text-sm text-muted-foreground">
            Sistemde {bins.length} atik kutusu bulunuyor.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleResetDB}>
              <RotateCcw className="w-4 h-4 mr-2" /> Simulasyonu Sifirla
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
