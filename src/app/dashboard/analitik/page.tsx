"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { FillLevelTrend } from "@/components/charts/fill-level-trend";
import { WasteTypeDistribution } from "@/components/charts/waste-type-distribution";
import { ZoneEfficiencyChart } from "@/components/charts/zone-efficiency";
import { TopBinsTable } from "@/components/charts/top-bins-table";
import { ZoneWasteComposition } from "@/components/charts/zone-waste-composition";
import { OverallWasteComposition } from "@/components/charts/overall-waste-composition";
import { useSimulationStore } from "@/lib/stores/simulation-store";

export default function AnalitikPage() {
  const bins = useSimulationStore((s) => s.bins);
  const avgFill =
    bins.length > 0
      ? bins.reduce((s, b) => s + b.current_fill_percent, 0) / bins.length
      : 0;
  const critical = bins.filter((b) => b.status === "critical").length;
  const avgBattery =
    bins.length > 0
      ? bins.reduce((s, b) => s + b.battery_level, 0) / bins.length
      : 0;

  return (
    <>
      <DashboardHeader title="Analitik" />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{bins.length}</p>
            <p className="text-xs text-muted-foreground">Toplam Kutu</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{avgFill.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Ort. Doluluk</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{critical}</p>
            <p className="text-xs text-muted-foreground">Kritik Kutu</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{avgBattery.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Ort. Batarya</p>
          </div>
        </div>

        {/* Charts grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-4">
              Bölgeye Göre Doluluk
            </h3>
            <FillLevelTrend />
          </div>

          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-4">Atık Tipi Dağılımı</h3>
            <WasteTypeDistribution />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-4">
              Bölge Verimliliği
            </h3>
            <ZoneEfficiencyChart />
          </div>

          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-4">
              En Dolu 10 Kutu
            </h3>
            <TopBinsTable />
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-4">
            Toplam Atik Orani
          </h3>
          <OverallWasteComposition />
        </div>

        <div className="glass rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-4">
            Bolgesel Atik Kompozisyonu
          </h3>
          <ZoneWasteComposition />
        </div>
      </div>
    </>
  );
}
