import { NextRequest, NextResponse } from "next/server";
import { getAllBins, createBin } from "@/lib/queries/bins";
import { MOCK_BINS } from "@/lib/mock-data";

const USE_MOCK = !process.env.DATABASE_URL;

export async function GET() {
  if (USE_MOCK) return NextResponse.json(MOCK_BINS);
  try {
    const bins = await getAllBins();
    return NextResponse.json(bins);
  } catch (error) {
    console.error("Error fetching bins:", error);
    return NextResponse.json(MOCK_BINS);
  }
}

export async function POST(request: NextRequest) {
  if (USE_MOCK) return NextResponse.json({ ok: true });
  try {
    const body = await request.json();
    const { name, latitude, longitude, waste_type, zone, capacity_liters } = body;

    if (!name || latitude == null || longitude == null || !waste_type || !zone) {
      return NextResponse.json({ error: "Eksik alanlar" }, { status: 400 });
    }

    const bin = await createBin({ name, latitude, longitude, waste_type, zone, capacity_liters });
    return NextResponse.json(bin, { status: 201 });
  } catch (error) {
    console.error("Error creating bin:", error);
    return NextResponse.json({ error: "Kutu olusturulamadi" }, { status: 500 });
  }
}
