import { NextRequest, NextResponse } from "next/server";
import { bulkUpdateBins } from "@/lib/queries/bins";
import { bulkInsertReadings } from "@/lib/queries/readings";
import { createAlert, hasActiveAlertForBin } from "@/lib/queries/alerts";

const USE_MOCK = !process.env.DATABASE_URL;

export async function POST(request: NextRequest) {
  // DB yoksa simülasyon verisi kaydetmeye gerek yok, sadece 200 dön
  if (USE_MOCK) return NextResponse.json({ success: true });
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
          await createAlert(alert.binId, alert.type, alert.message, alert.severity);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Simulation persist error:", error);
    return NextResponse.json({ success: true }); // DB hatasında yine de devam et
  }
}
