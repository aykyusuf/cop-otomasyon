import { NextRequest, NextResponse } from "next/server";
import { bulkUpdateBins } from "@/lib/queries/bins";
import { bulkInsertReadings } from "@/lib/queries/readings";
import {
  createAlert,
  hasActiveAlertForBin,
} from "@/lib/queries/alerts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bins, newAlerts } = body;

    if (bins && bins.length > 0) {
      await bulkUpdateBins(bins);

      const readings = bins.map(
        (b: { id: number; fill: number; temperature: number; battery: number }) => ({
          binId: b.id,
          fill: b.fill,
          temperature: b.temperature,
          battery: b.battery,
        })
      );
      await bulkInsertReadings(readings);
    }

    if (newAlerts && newAlerts.length > 0) {
      for (const alert of newAlerts) {
        const exists = await hasActiveAlertForBin(alert.binId, alert.type);
        if (!exists) {
          await createAlert(
            alert.binId,
            alert.type,
            alert.message,
            alert.severity
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Simulation persist error:", error);
    return NextResponse.json(
      { error: "Simulasyon verisi kaydedilemedi" },
      { status: 500 }
    );
  }
}
