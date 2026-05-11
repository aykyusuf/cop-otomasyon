import { Pool } from "pg";
import { MOCK_BINS } from "../src/lib/mock-data";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/cop_otomasyon"
});

async function seed() {
  try {
    await pool.query("TRUNCATE waste_bins RESTART IDENTITY CASCADE");
    for (const bin of MOCK_BINS) {
      await pool.query(
        "INSERT INTO waste_bins (name, latitude, longitude, waste_type, zone, capacity_liters, current_fill_percent, temperature, battery_level, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [bin.name, bin.latitude, bin.longitude, bin.waste_type, bin.zone, bin.capacity_liters, bin.current_fill_percent, bin.temperature, bin.battery_level, bin.status]
      );
    }
    console.log("Seeded successfully");
  } catch (e) {
    console.error("Seed failed:", e);
  } finally {
    await pool.end();
  }
}
seed();
