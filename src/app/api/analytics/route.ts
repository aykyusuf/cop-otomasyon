import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/queries/analytics";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Analitik verisi getirilemedi" }, { status: 500 });
  }
}
