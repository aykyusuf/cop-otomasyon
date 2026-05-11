import { NextRequest, NextResponse } from "next/server";
import {
  getBinById,
  updateBinFillLevel,
  deleteBin,
} from "@/lib/queries/bins";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bin = await getBinById(parseInt(id));
    if (!bin) {
      return NextResponse.json({ error: "Kutu bulunamadı" }, { status: 404 });
    }
    return NextResponse.json(bin);
  } catch (error) {
    console.error("Error fetching bin:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { current_fill_percent, temperature, battery_level, status } = body;

    await updateBinFillLevel(
      parseInt(id),
      current_fill_percent,
      temperature,
      battery_level,
      status
    );

    const updated = await getBinById(parseInt(id));
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating bin:", error);
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteBin(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bin:", error);
    return NextResponse.json({ error: "Silme başarısız" }, { status: 500 });
  }
}
