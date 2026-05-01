import { isDatabaseConnectionError, query } from "@/lib/db";
import {
  createMockAlert,
  getMockActiveAlerts,
  getMockAlertHistory,
  hasMockActiveAlertForBin,
  resolveMockAlert,
  resolveMockAlertsByBin,
} from "@/lib/mock-db";
import { Alert } from "@/types";

export async function createAlert(
  binId: number,
  alertType: string,
  message: string,
  severity: string = "warning"
): Promise<Alert> {
  try {
    const result = await query<Alert>(
      `INSERT INTO alerts (bin_id, alert_type, message, severity)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [binId, alertType, message, severity]
    );
    return result.rows[0];
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return createMockAlert(binId, alertType, message, severity);
    }
    throw error;
  }
}

export async function getActiveAlerts(): Promise<Alert[]> {
  try {
    const result = await query<Alert>(
      `SELECT a.*, wb.name as bin_name
       FROM alerts a
       JOIN waste_bins wb ON a.bin_id = wb.id
       WHERE a.is_resolved = FALSE
       ORDER BY
         CASE a.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
         a.created_at DESC`
    );
    return result.rows;
  } catch (error) {
    if (isDatabaseConnectionError(error)) return getMockActiveAlerts();
    throw error;
  }
}

export async function resolveAlert(id: number): Promise<void> {
  try {
    await query(
      "UPDATE alerts SET is_resolved = TRUE, resolved_at = NOW() WHERE id = $1",
      [id]
    );
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      resolveMockAlert(id);
      return;
    }
    throw error;
  }
}

export async function resolveAlertsByBin(binId: number): Promise<void> {
  try {
    await query(
      "UPDATE alerts SET is_resolved = TRUE, resolved_at = NOW() WHERE bin_id = $1 AND is_resolved = FALSE",
      [binId]
    );
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      resolveMockAlertsByBin(binId);
      return;
    }
    throw error;
  }
}

export async function getAlertHistory(limit: number = 50): Promise<Alert[]> {
  try {
    const result = await query<Alert>(
      `SELECT a.*, wb.name as bin_name
       FROM alerts a
       JOIN waste_bins wb ON a.bin_id = wb.id
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (error) {
    if (isDatabaseConnectionError(error)) return getMockAlertHistory(limit);
    throw error;
  }
}

export async function hasActiveAlertForBin(
  binId: number,
  alertType: string
): Promise<boolean> {
  try {
    const result = await query(
      "SELECT 1 FROM alerts WHERE bin_id = $1 AND alert_type = $2 AND is_resolved = FALSE LIMIT 1",
      [binId, alertType]
    );
    return result.rows.length > 0;
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return hasMockActiveAlertForBin(binId, alertType);
    }
    throw error;
  }
}
