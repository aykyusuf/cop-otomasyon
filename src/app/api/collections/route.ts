import { NextRequest, NextResponse } from "next/server";
import {
  bulkCreateCollections,
  createCollection,
  getCollectionHistory,
} from "@/lib/queries/collections";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const collections = await getCollectionHistory(limit);
    return NextResponse.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Toplama gecmisi getirilemedi" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (Array.isArray(body?.items)) {
      await bulkCreateCollections(body.items);
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const { binId, routeId, fillAtCollection } = body;

    if (!binId || fillAtCollection == null) {
      return NextResponse.json(
        { error: "Eksik toplama verisi" },
        { status: 400 }
      );
    }

    const collection = await createCollection({
      binId,
      routeId: routeId ?? null,
      fillAtCollection,
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: "Toplama kaydi olusturulamadi" },
      { status: 500 }
    );
  }
}
