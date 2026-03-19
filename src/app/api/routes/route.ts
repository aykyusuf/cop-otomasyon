import { NextRequest, NextResponse } from "next/server";
import { createRoute, addRouteStops, getRouteHistory } from "@/lib/queries/routes";

export async function GET() {
  try {
    const routes = await getRouteHistory();
    return NextResponse.json(routes);
  } catch (error) {
    console.error("Error fetching routes:", error);
    return NextResponse.json({ error: "Rotalar getirilemedi" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, totalDistance, totalBins, estimatedDurationMin, stops } = body;

    const route = await createRoute({
      name,
      totalDistance,
      totalBins,
      estimatedDurationMin,
    });

    if (stops && stops.length > 0) {
      await addRouteStops(route.id, stops);
    }

    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    console.error("Error creating route:", error);
    return NextResponse.json({ error: "Rota olusturulamadi" }, { status: 500 });
  }
}
