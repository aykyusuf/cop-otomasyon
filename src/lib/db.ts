import { Pool, QueryResult, QueryResultRow } from "pg";

declare global {
  var dbPool: Pool | undefined;
}

function createPool(): Pool {
  return new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/cop_otomasyon",
    max: process.env.NODE_ENV === "production" ? 20 : 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

const pool = global.dbPool || createPool();

if (process.env.NODE_ENV !== "production") {
  global.dbPool = pool;
}

pool.on("error", (err) => {
  console.error("Unexpected error on idle client:", err);
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export function isDatabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const maybeError = error as {
    code?: string;
    errors?: { code?: string }[];
  };

  return (
    maybeError.code === "ECONNREFUSED" ||
    maybeError.errors?.some((item) => item.code === "ECONNREFUSED") === true
  );
}

export default pool;
