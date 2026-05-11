import { NextResponse } from "next/server";
import { useIncentiveStore } from "@/lib/stores/incentive-store";
import type { WasteType } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, wasteType, binName } = body as {
      studentId: string;
      wasteType: WasteType;
      binName?: string;
    };

    if (!studentId || !wasteType) {
      return NextResponse.json({ error: "studentId ve wasteType zorunlu" }, { status: 400 });
    }

    const store = useIncentiveStore.getState();
    store.init();
    const result = store.awardCredits(studentId, wasteType, binName);

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
