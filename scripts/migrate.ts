import fs from "fs";
import path from "path";
import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/cop_otomasyon",
});

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function getMigratedFiles(): Promise<Set<string>> {
  const result = await pool.query("SELECT name FROM migrations ORDER BY name");
  return new Set(result.rows.map((row) => row.name));
}

async function runMigrations() {
  try {
    await ensureMigrationsTable();

    const migrationsDir = path.join(__dirname, "../db/migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const migrated = await getMigratedFiles();

    for (const file of files) {
      if (migrated.has(file)) {
        console.log(`  ✓ ${file} (zaten calistirilmis)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

      try {
        await pool.query("BEGIN");
        await pool.query(sql);
        await pool.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
        await pool.query("COMMIT");
        console.log(`  ✓ ${file}`);
      } catch (err) {
        await pool.query("ROLLBACK");
        console.error(`  ✗ ${file} - Hata:`, err);
        throw err;
      }
    }

    console.log("\nTum migration'lar basariyla tamamlandi!");
  } finally {
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error("Migration basarisiz:", err);
  process.exit(1);
});
