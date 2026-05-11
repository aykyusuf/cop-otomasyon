import { NextRequest, NextResponse } from "next/server";
import { getActiveRoute, updateRouteStatus } from "@/lib/queries/routes";

export async function GET() {
  try {
    const route = await getActiveRoute();
    if (!route) {
      return NextResponse.json({ error: "Aktif rota yok" }, { status: 404 });
    }
    return NextResponse.json(route);
  } catch (error) {
    console.error("Error fetching route:", error);
    return NextResponse.json({ error: "Rota getirilemedi" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    await updateRouteStatus(parseInt(id), status);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating route:", error);
    return NextResponse.json({ error: "Rota guncellenemedi" }, { status: 500 });
  }
}
