import { isDatabaseConnectionError, query } from "@/lib/db";
import {
  bulkCreateMockCollections,
  createMockCollection,
  getMockCollectionHistory,
} from "@/lib/mock-db";
import { Collection } from "@/types";

export async function createCollection(data: {
  binId: number;
  routeId: number | null;
  fillAtCollection: number;
}): Promise<Collection> {
  try {
    const result = await query<Collection>(
      `INSERT INTO collections (bin_id, route_id, fill_at_collection)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.binId, data.routeId, data.fillAtCollection]
    );
    return result.rows[0];
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return createMockCollection(data.binId, data.routeId, data.fillAtCollection);
    }
    throw error;
  }
}

export async function bulkCreateCollections(
  items: { binId: number; routeId: number | null; fillAtCollection: number }[]
): Promise<void> {
  if (items.length === 0) return;

  const values = items
    .map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`)
    .join(", ");

  const params = items.flatMap((item) => [
    item.binId,
    item.routeId,
    item.fillAtCollection,
  ]);

  try {
    await query(
      `INSERT INTO collections (bin_id, route_id, fill_at_collection) VALUES ${values}`,
      params
    );
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      bulkCreateMockCollections(items);
      return;
    }
    throw error;
  }
}

export async function getCollectionHistory(limit: number = 50): Promise<Collection[]> {
  try {
    const result = await query<Collection>(
      "SELECT * FROM collections ORDER BY collected_at DESC LIMIT $1",
      [limit]
    );
    return result.rows;
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return getMockCollectionHistory(limit);
    }
    throw error;
  }
}
