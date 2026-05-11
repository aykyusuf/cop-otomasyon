import { NextResponse } from "next/server";
import { useIncentiveStore } from "@/lib/stores/incentive-store";

export async function GET() {
  try {
    const store = useIncentiveStore.getState();
    store.init();
    const leaderboard = store.getLeaderboard();
    return NextResponse.json(leaderboard);
  } catch {
    return NextResponse.json({ error: "Öğrenciler alınamadı" }, { status: 500 });
  }
}
