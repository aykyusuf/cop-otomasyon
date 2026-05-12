import { isDatabaseConnectionError, query } from "@/lib/db";
import {
  addMockRouteStops,
  createMockRoute,
  getMockActiveRoute,
  getMockRouteById,
  getMockRouteHistory,
  updateMockRouteStatus,
} from "@/lib/mock-db";
import { CollectionRoute, RouteStop } from "@/types";

export async function createRoute(data: {
  name: string;
  totalDistance: number;
  totalBins: number;
  estimatedDurationMin: number;
}): Promise<CollectionRoute> {
  try {
    const result = await query<CollectionRoute>(
      `INSERT INTO collection_routes (name, total_distance, total_bins, estimated_duration_min)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.name, data.totalDistance, data.totalBins, data.estimatedDurationMin]
    );
    return result.rows[0];
  } catch (error) {
    if (isDatabaseConnectionError(error)) return createMockRoute(data);
    throw error;
  }
}

export async function addRouteStops(
  routeId: number,
  stops: { binId: number; stopOrder: number }[]
): Promise<void> {
  if (stops.length === 0) return;

  const values = stops
    .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
    .join(", ");

  const params = stops.flatMap((s) => [routeId, s.binId, s.stopOrder]);

  try {
    await query(
      `INSERT INTO route_stops (route_id, bin_id, stop_order) VALUES ${values}`,
      params
    );
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      addMockRouteStops(routeId, stops);
      return;
    }
    throw error;
  }
}

export async function updateRouteStatus(
  routeId: number,
  status: string
): Promise<void> {
  const timeField =
    status === "in_progress"
      ? ", started_at = NOW()"
      : status === "completed"
        ? ", completed_at = NOW()"
        : "";

  try {
    await query(
      `UPDATE collection_routes SET status = $1${timeField} WHERE id = $2`,
      [status, routeId]
    );
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      updateMockRouteStatus(routeId, status);
      return;
    }
    throw error;
  }
}

export async function getActiveRoute(): Promise<
  (CollectionRoute & { stops: RouteStop[] }) | null
> {
  let routeResult;
  try {
    routeResult = await query<CollectionRoute>(
      "SELECT * FROM collection_routes WHERE status IN ('planned', 'in_progress') ORDER BY created_at DESC LIMIT 1"
    );
  } catch (error) {
    if (isDatabaseConnectionError(error)) return getMockActiveRoute();
    throw error;
  }

  if (routeResult.rows.length === 0) return null;

  const route = routeResult.rows[0];
  let stopsResult;
  try {
    stopsResult = await query<RouteStop>(
      "SELECT * FROM route_stops WHERE route_id = $1 ORDER BY stop_order",
      [route.id]
    );
  } catch (error) {
    if (isDatabaseConnectionError(error)) return getMockActiveRoute();
    throw error;
  }

  return { ...route, stops: stopsResult.rows };
}

export async function getRouteById(
  id: number
): Promise<(CollectionRoute & { stops: RouteStop[] }) | null> {
  let routeResult;
  try {
    routeResult = await query<CollectionRoute>(
      "SELECT * FROM collection_routes WHERE id = $1",
      [id]
    );
  } catch (error) {
    if (isDatabaseConnectionError(error)) return getMockRouteById(id);
    throw error;
  }

  if (routeResult.rows.length === 0) return null;

  const route = routeResult.rows[0];
  let stopsResult;
  try {
    stopsResult = await query<RouteStop>(
      "SELECT * FROM route_stops WHERE route_id = $1 ORDER BY stop_order",
      [route.id]
    );
  } catch (error) {
    if (isDatabaseConnectionError(error)) return getMockRouteById(id);
    throw error;
  }

  return { ...route, stops: stopsResult.rows };
}

export async function getRouteHistory(
  limit: number = 20
): Promise<CollectionRoute[]> {
  try {
    const result = await query<CollectionRoute>(
      "SELECT * FROM collection_routes ORDER BY created_at DESC LIMIT $1",
      [limit]
    );
    return result.rows;
  } catch (error) {
    if (isDatabaseConnectionError(error)) return getMockRouteHistory(limit);
    throw error;
  }
}
