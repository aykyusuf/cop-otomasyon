import { NextRequest, NextResponse } from "next/server";
import { createRoute, addRouteStops, getRouteHistory } from "@/lib/queries/routes";

const USE_MOCK = !process.env.DATABASE_URL;

export async function GET() {
  if (USE_MOCK) return NextResponse.json([]);
  try {
    const routes = await getRouteHistory();
    return NextResponse.json(routes);
  } catch (error) {
    console.error("Error fetching routes:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  if (USE_MOCK) return NextResponse.json({ id: Date.now(), ok: true }, { status: 201 });
  try {
    const body = await request.json();
    const { name, totalDistance, totalBins, estimatedDurationMin, stops } = body;

    const route = await createRoute({ name, totalDistance, totalBins, estimatedDurationMin });

    if (stops && stops.length > 0) {
      await addRouteStops(route.id, stops);
    }

    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    console.error("Error creating route:", error);
    return NextResponse.json({ error: "Rota olusturulamadi" }, { status: 500 });
  }
}

