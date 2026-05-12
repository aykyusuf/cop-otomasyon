import { query } from "@/lib/db";
import { DashboardStats } from "@/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const [binsResult, alertsResult, collectionsResult] = await Promise.all([
    query(`
      SELECT
        COUNT(*) as total,
        AVG(current_fill_percent) as avg_fill,
        COUNT(*) FILTER (WHERE status = 'normal') as normal_count,
        COUNT(*) FILTER (WHERE status = 'warning') as warning_count,
        COUNT(*) FILTER (WHERE status = 'critical') as critical_count,
        COUNT(*) FILTER (WHERE status = 'offline') as offline_count
      FROM waste_bins
    `),
    query(
      "SELECT COUNT(*) as count FROM alerts WHERE is_resolved = FALSE"
    ),
    query(
      "SELECT COUNT(*) as count FROM collections WHERE collected_at > NOW() - INTERVAL '24 hours'"
    ),
  ]);

  const bins = binsResult.rows[0];

  const zoneResult = await query(`
    SELECT zone, COUNT(*) as count
    FROM waste_bins
    GROUP BY zone
  `);

  const binsByZone: Record<string, number> = {};
  for (const row of zoneResult.rows) {
    binsByZone[row.zone] = parseInt(row.count);
  }

  return {
    totalBins: parseInt(bins.total),
    avgFillPercent: parseFloat(bins.avg_fill) || 0,
    collectionsToday: parseInt(collectionsResult.rows[0].count),
    activeAlerts: parseInt(alertsResult.rows[0].count),
    binsByStatus: {
      normal: parseInt(bins.normal_count),
      warning: parseInt(bins.warning_count),
      critical: parseInt(bins.critical_count),
      offline: parseInt(bins.offline_count),
    },
    binsByZone,
  };
}

export async function getFillTrends(hours: number = 24) {
  const result = await query(
    `SELECT
       date_trunc('hour', recorded_at) as hour,
       AVG(fill_percent) as avg_fill,
       MAX(fill_percent) as max_fill,
       MIN(fill_percent) as min_fill
     FROM sensor_readings
     WHERE recorded_at > NOW() - INTERVAL '1 hour' * $1
     GROUP BY date_trunc('hour', recorded_at)
     ORDER BY hour`,
    [hours]
  );
  return result.rows;
}

export async function getCollectionFrequency(days: number = 7) {
  const result = await query(
    `SELECT
       date_trunc('day', collected_at) as day,
       COUNT(*) as collection_count,
       AVG(fill_at_collection) as avg_fill_at_collection
     FROM collections
     WHERE collected_at > NOW() - INTERVAL '1 day' * $1
     GROUP BY date_trunc('day', collected_at)
     ORDER BY day`,
    [days]
  );
  return result.rows;
}

export async function getWasteTypeDistribution() {
  const result = await query(`
    SELECT waste_type, COUNT(*) as count, AVG(current_fill_percent) as avg_fill
    FROM waste_bins
    GROUP BY waste_type
    ORDER BY count DESC
  `);
  return result.rows;
}

export async function getZoneEfficiency() {
  const result = await query(`
    SELECT
      wb.zone,
      COUNT(DISTINCT wb.id) as bin_count,
      AVG(wb.current_fill_percent) as avg_fill,
      COUNT(c.id) as total_collections,
      COUNT(a.id) FILTER (WHERE a.is_resolved = FALSE) as active_alerts
    FROM waste_bins wb
    LEFT JOIN collections c ON c.bin_id = wb.id
    LEFT JOIN alerts a ON a.bin_id = wb.id
    GROUP BY wb.zone
    ORDER BY wb.zone
  `);
  return result.rows;
}
