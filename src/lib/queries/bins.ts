import { isDatabaseConnectionError, query } from "@/lib/db";
import {
  bulkUpdateMockBins,
  createMockBin,
  deleteMockBin,
  getMockBinById,
  getMockBins,
  getMockBinsAboveThreshold,
  getMockBinsByZone,
  resetMockBinAfterCollection,
  updateMockBinFillLevel,
} from "@/lib/mock-db";
import { WasteBin } from "@/types";
import type { LocationType } from "@/types";

export async function getAllBins(): Promise<WasteBin[]> {
  try {
    const result = await query<WasteBin>(
      "SELECT * FROM waste_bins ORDER BY zone, name"
    );
    return result.rows;
  } catch (error) {
    if (isDatabaseConnectionError(error)) return getMockBins();
    throw error;
  }
}

export async function getBinById(id: number): Promise<WasteBin | null> {
  try {
    const result = await query<WasteBin>(
      "SELECT * FROM waste_bins WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    if (isDatabaseConnectionError(error)) return getMockBinById(id);
    throw error;
  }
}

export async function getBinsByZone(zone: string): Promise<WasteBin[]> {
  try {
    const result = await query<WasteBin>(
      "SELECT * FROM waste_bins WHERE zone = $1 ORDER BY name",
      [zone]
    );
    return result.rows;
  } catch (error) {
    if (isDatabaseConnectionError(error)) return getMockBinsByZone(zone);
    throw error;
  }
}

export async function getBinsAboveThreshold(
  percent: number
): Promise<WasteBin[]> {
  try {
    const result = await query<WasteBin>(
      "SELECT * FROM waste_bins WHERE current_fill_percent >= $1 AND status != 'offline' ORDER BY current_fill_percent DESC",
      [percent]
    );
    return result.rows;
  } catch (error) {
    if (isDatabaseConnectionError(error)) return getMockBinsAboveThreshold(percent);
    throw error;
  }
}

export async function updateBinFillLevel(
  id: number,
  fill: number,
  temperature: number,
  battery: number,
  status: string
): Promise<void> {
  try {
    await query(
      `UPDATE waste_bins
       SET current_fill_percent = $1, temperature = $2, battery_level = $3, status = $4, updated_at = NOW()
       WHERE id = $5`,
      [fill, temperature, battery, status, id]
    );
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      updateMockBinFillLevel(id, fill, temperature, battery, status);
      return;
    }
    throw error;
  }
}

export async function resetBinAfterCollection(id: number): Promise<void> {
  try {
    await query(
      `UPDATE waste_bins
       SET current_fill_percent = 0, status = 'normal', updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      resetMockBinAfterCollection(id);
      return;
    }
    throw error;
  }
}

export async function createBin(data: {
  name: string;
  latitude: number;
  longitude: number;
  waste_type: string;
  zone: string;
  location_type?: LocationType;
  capacity_liters?: number;
}): Promise<WasteBin> {
  try {
    const result = await query<WasteBin>(
      `INSERT INTO waste_bins (name, latitude, longitude, waste_type, zone, capacity_liters)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.name,
        data.latitude,
        data.longitude,
        data.waste_type,
        data.zone,
        data.capacity_liters || 120,
      ]
    );
    return result.rows[0];
  } catch (error) {
    if (isDatabaseConnectionError(error)) return createMockBin(data);
    throw error;
  }
}

export async function deleteBin(id: number): Promise<void> {
  try {
    await query("DELETE FROM waste_bins WHERE id = $1", [id]);
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      deleteMockBin(id);
      return;
    }
    throw error;
  }
}

export async function bulkUpdateBins(
  bins: {
    id: number;
    fill: number;
    temperature: number;
    battery: number;
    status: string;
  }[]
): Promise<void> {
  const client = (await import("@/lib/db")).default;
  let conn;
  try {
    conn = await client.connect();
    await conn.query("BEGIN");
    for (const bin of bins) {
      await conn.query(
        `UPDATE waste_bins
         SET current_fill_percent = $1, temperature = $2, battery_level = $3, status = $4, updated_at = NOW()
         WHERE id = $5`,
        [bin.fill, bin.temperature, bin.battery, bin.status, bin.id]
      );
    }
    await conn.query("COMMIT");
  } catch (err) {
    if (conn) await conn.query("ROLLBACK");
    if (isDatabaseConnectionError(err)) {
      bulkUpdateMockBins(bins);
      return;
    }
    throw err;
  } finally {
    conn?.release();
  }
}
