"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { AlertList } from "@/components/dashboard/alert-list";
import { BinStatusOverview } from "@/components/dashboard/bin-status-overview";
import { ZoneSummary } from "@/components/dashboard/zone-summary";
import { CampusMap } from "@/components/map/campus-map";
import { useSimulationStore } from "@/lib/stores/simulation-store";
import { useSimulation } from "@/hooks/use-simulation";
import { Trash2, Percent, Truck, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  useSimulation();

  const bins = useSimulationStore((s) => s.bins);
  const alerts = useSimulationStore((s) => s.alerts);
  const collectionsToday = useSimulationStore((s) => s.collectionsToday);

  const totalBins = bins.length;
  const avgFill =
    bins.length > 0
      ? bins.reduce((s, b) => s + b.current_fill_percent, 0) / bins.length
      : 0;

  return (
    <>
      <DashboardHeader title="Ana Sayfa" />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Toplam Kutular"
            value={totalBins}
            icon={Trash2}
            color="#22c55e"
            delay={0}
          />
          <StatsCard
            title="Ort. Doluluk"
            value={avgFill}
            suffix="%"
            icon={Percent}
            color="#3b82f6"
            delay={1}
          />
          <StatsCard
            title="Toplama Bugün"
            value={collectionsToday}
            icon={Truck}
            trend="Simülasyonu başlatarak veri oluşturun"
            color="#8b5cf6"
            delay={2}
          />
          <StatsCard
            title="Aktif Alarmlar"
            value={alerts.length}
            icon={AlertTriangle}
            color="#ef4444"
            delay={3}
          />
        </div>

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Mini Map */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">Kampüs Haritası</h3>
            <CampusMap className="w-full h-[300px] rounded-lg" />
          </div>

          {/* Alerts */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">Aktif Alarmlar</h3>
            <AlertList />
          </div>
        </div>

        {/* Bottom grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Bin Status Pie */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">Kutu Durumu</h3>
            <BinStatusOverview />
          </div>

          {/* Zone Summary */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">Bölge Özeti</h3>
            <ZoneSummary />
          </div>
        </div>
      </div>
    </>
  );
}
