import { query } from "@/lib/db";
import { WasteBin } from "@/types";

export async function getAllBins(): Promise<WasteBin[]> {
  const result = await query<WasteBin>(
    "SELECT * FROM waste_bins ORDER BY zone, name"
  );
  return result.rows;
}

export async function getBinById(id: number): Promise<WasteBin | null> {
  const result = await query<WasteBin>(
    "SELECT * FROM waste_bins WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

export async function getBinsByZone(zone: string): Promise<WasteBin[]> {
  const result = await query<WasteBin>(
    "SELECT * FROM waste_bins WHERE zone = $1 ORDER BY name",
    [zone]
  );
  return result.rows;
}

export async function getBinsAboveThreshold(
  percent: number
): Promise<WasteBin[]> {
  const result = await query<WasteBin>(
    "SELECT * FROM waste_bins WHERE current_fill_percent >= $1 AND status != 'offline' ORDER BY current_fill_percent DESC",
    [percent]
  );
  return result.rows;
}

export async function updateBinFillLevel(
  id: number,
  fill: number,
  temperature: number,
  battery: number,
  status: string
): Promise<void> {
  await query(
    `UPDATE waste_bins
     SET current_fill_percent = $1, temperature = $2, battery_level = $3, status = $4, updated_at = NOW()
     WHERE id = $5`,
    [fill, temperature, battery, status, id]
  );
}

export async function resetBinAfterCollection(id: number): Promise<void> {
  await query(
    `UPDATE waste_bins
     SET current_fill_percent = 0, status = 'normal', updated_at = NOW()
     WHERE id = $1`,
    [id]
  );
}

export async function createBin(data: {
  name: string;
  latitude: number;
  longitude: number;
  waste_type: string;
  zone: string;
  capacity_liters?: number;
}): Promise<WasteBin> {
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
}

export async function deleteBin(id: number): Promise<void> {
  await query("DELETE FROM waste_bins WHERE id = $1", [id]);
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
  const conn = await client.connect();
  try {
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
    await conn.query("ROLLBACK");
    throw err;
  } finally {
    conn.release();
  }
}
