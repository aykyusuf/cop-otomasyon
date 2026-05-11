import { query } from "@/lib/db";
import { CollectionRoute, RouteStop } from "@/types";

export async function createRoute(data: {
  name: string;
  totalDistance: number;
  totalBins: number;
  estimatedDurationMin: number;
}): Promise<CollectionRoute> {
  const result = await query<CollectionRoute>(
    `INSERT INTO collection_routes (name, total_distance, total_bins, estimated_duration_min)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.name, data.totalDistance, data.totalBins, data.estimatedDurationMin]
  );
  return result.rows[0];
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

  await query(
    `INSERT INTO route_stops (route_id, bin_id, stop_order) VALUES ${values}`,
    params
  );
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

  await query(
    `UPDATE collection_routes SET status = $1${timeField} WHERE id = $2`,
    [status, routeId]
  );
}

export async function getActiveRoute(): Promise<
  (CollectionRoute & { stops: RouteStop[] }) | null
> {
  const routeResult = await query<CollectionRoute>(
    "SELECT * FROM collection_routes WHERE status IN ('planned', 'in_progress') ORDER BY created_at DESC LIMIT 1"
  );

  if (routeResult.rows.length === 0) return null;

  const route = routeResult.rows[0];
  const stopsResult = await query<RouteStop>(
    "SELECT * FROM route_stops WHERE route_id = $1 ORDER BY stop_order",
    [route.id]
  );

  return { ...route, stops: stopsResult.rows };
}

export async function getRouteHistory(
  limit: number = 20
): Promise<CollectionRoute[]> {
  const result = await query<CollectionRoute>(
    "SELECT * FROM collection_routes ORDER BY created_at DESC LIMIT $1",
    [limit]
  );
  return result.rows;
}
