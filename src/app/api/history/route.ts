import { NextResponse } from "next/server";
import { getCollectionHistory } from "@/lib/queries/collections";
import { getRouteHistory } from "@/lib/queries/routes";
import { getAlertHistory } from "@/lib/queries/alerts";
import { getLatestReadings } from "@/lib/queries/readings";
import { getAllBins } from "@/lib/queries/bins";

export async function GET() {
  try {
    const [collections, routes, alerts, readings, bins] = await Promise.all([
      getCollectionHistory(50),
      getRouteHistory(20),
      getAlertHistory(30),
      getLatestReadings(),
      getAllBins(),
    ]);

    const binMap = new Map(bins.map((bin) => [bin.id, bin]));

    const collectionItems = collections.map((collection) => ({
      ...collection,
      bin_name: binMap.get(collection.bin_id)?.name || `Kutu #${collection.bin_id}`,
      zone: binMap.get(collection.bin_id)?.zone || null,
    }));

    const readingItems = readings.map((reading) => ({
      ...reading,
      bin_name: binMap.get(reading.bin_id)?.name || `Kutu #${reading.bin_id}`,
      zone: binMap.get(reading.bin_id)?.zone || null,
    }));

    const alertItems = alerts.map((alert) => ({
      ...alert,
      zone: binMap.get(alert.bin_id)?.zone || null,
    }));

    return NextResponse.json({
      collections: collectionItems,
      routes,
      alerts: alertItems,
      readings: readingItems,
      summary: {
        collectionsToday: collections.filter(
          (collection) =>
            new Date(collection.collected_at).getTime() >
            Date.now() - 24 * 60 * 60 * 1000
        ).length,
        completedRoutes: routes.filter((route) => route.status === "completed").length,
        totalAlerts: alerts.length,
        latestReadings: readings.length,
      },
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "Gecmis verileri getirilemedi" },
      { status: 500 }
    );
  }
}
