import { NextRequest, NextResponse } from "next/server";
import { getAllBins, createBin } from "@/lib/queries/bins";

export async function GET() {
  try {
    const bins = await getAllBins();
    return NextResponse.json(bins);
  } catch (error) {
    console.error("Error fetching bins:", error);
    return NextResponse.json(
      { error: "Kutular getirilemedi" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, latitude, longitude, waste_type, zone, capacity_liters } =
      body;

    if (!name || latitude == null || longitude == null || !waste_type || !zone) {
      return NextResponse.json(
        { error: "Eksik alanlar" },
        { status: 400 }
      );
    }

    const bin = await createBin({
      name,
      latitude,
      longitude,
      waste_type,
      zone,
      capacity_liters,
    });
    return NextResponse.json(bin, { status: 201 });
  } catch (error) {
    console.error("Error creating bin:", error);
    return NextResponse.json(
      { error: "Kutu olusturulamadi" },
      { status: 500 }
    );
  }
}
