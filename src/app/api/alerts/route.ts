import { NextRequest, NextResponse } from "next/server";
import { getActiveAlerts, resolveAlert } from "@/lib/queries/alerts";

export async function GET() {
  try {
    const alerts = await getActiveAlerts();
    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Alarmlar getirilemedi" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Alarm ID gerekli" }, { status: 400 });
    }

    await resolveAlert(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resolving alert:", error);
    return NextResponse.json({ error: "Alarm cozulemedi" }, { status: 500 });
  }
}
