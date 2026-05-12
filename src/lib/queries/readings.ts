import { isDatabaseConnectionError, query } from "@/lib/db";
import {
  bulkInsertMockReadings,
  getMockLatestReadings,
  getMockReadingsForBin,
  insertMockReading,
} from "@/lib/mock-db";
import { SensorReading } from "@/types";

export async function insertReading(
  binId: number,
  fillPercent: number,
  temperature: number,
  batteryLevel: number
): Promise<SensorReading> {
  try {
    const result = await query<SensorReading>(
      `INSERT INTO sensor_readings (bin_id, fill_percent, temperature, battery_level)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [binId, fillPercent, temperature, batteryLevel]
    );
    return result.rows[0];
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return insertMockReading(binId, fillPercent, temperature, batteryLevel);
    }
    throw error;
  }
}

export async function getReadingsForBin(
  binId: number,
  hours: number = 1
): Promise<SensorReading[]> {
  try {
    const result = await query<SensorReading>(
      `SELECT * FROM sensor_readings
       WHERE bin_id = $1 AND recorded_at > NOW() - INTERVAL '1 hour' * $2
       ORDER BY recorded_at ASC`,
      [binId, hours]
    );
    return result.rows;
  } catch (error) {
    if (isDatabaseConnectionError(error)) return getMockReadingsForBin(binId);
    throw error;
  }
}

export async function getLatestReadings(): Promise<SensorReading[]> {
  try {
    const result = await query<SensorReading>(
      `SELECT DISTINCT ON (bin_id) * FROM sensor_readings
       ORDER BY bin_id, recorded_at DESC`
    );
    return result.rows;
  } catch (error) {
    if (isDatabaseConnectionError(error)) return getMockLatestReadings();
    throw error;
  }
}

export async function bulkInsertReadings(
  readings: {
    binId: number;
    fill: number;
    temperature: number;
    battery: number;
  }[]
): Promise<void> {
  if (readings.length === 0) return;

  const values = readings
    .map(
      (_, i) =>
        `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`
    )
    .join(", ");

  const params = readings.flatMap((r) => [
    r.binId,
    r.fill,
    r.temperature,
    r.battery,
  ]);

  try {
    await query(
      `INSERT INTO sensor_readings (bin_id, fill_percent, temperature, battery_level) VALUES ${values}`,
      params
    );
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      bulkInsertMockReadings(readings);
      return;
    }
    throw error;
  }
}
