import { NextRequest, NextResponse } from "next/server";
import {
  getFillTrends,
  getCollectionFrequency,
  getWasteTypeDistribution,
  getZoneEfficiency,
} from "@/lib/queries/analytics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "fill_trends";
    const hours = parseInt(searchParams.get("hours") || "24");
    const days = parseInt(searchParams.get("days") || "7");

    let data;
    switch (type) {
      case "fill_trends":
        data = await getFillTrends(hours);
        break;
      case "collection_frequency":
        data = await getCollectionFrequency(days);
        break;
      case "waste_type_distribution":
        data = await getWasteTypeDistribution();
        break;
      case "zone_efficiency":
        data = await getZoneEfficiency();
        break;
      default:
        return NextResponse.json({ error: "Gecersiz tip" }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching trends:", error);
    return NextResponse.json({ error: "Trend verisi getirilemedi" }, { status: 500 });
  }
}
