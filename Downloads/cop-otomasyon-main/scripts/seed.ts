import fs from "fs";
import path from "path";
import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://yusufayik@localhost:5432/cop_otomasyon",
});

async function seed() {
  try {
    const seedPath = path.join(__dirname, "../db/seed.sql");
    const sql = fs.readFileSync(seedPath, "utf-8");

    await pool.query(sql);
    console.log("Seed verisi basariyla yuklendi!");

    const bins = await pool.query("SELECT count(*) FROM waste_bins");
    const users = await pool.query("SELECT count(*) FROM users");
    console.log(`  ${bins.rows[0].count} atik kutusu`);
    console.log(`  ${users.rows[0].count} kullanici`);
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed basarisiz:", err);
  process.exit(1);
});
