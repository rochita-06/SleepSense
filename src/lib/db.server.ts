// Server-only Neon Postgres connection pool.
// Never import this from a route/component file directly — only from
// *.functions.ts server functions, which run exclusively on the server.
import { Pool } from "pg";

let _pool: Pool | undefined;

export function getPool(): Pool {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "Missing DATABASE_URL environment variable. Add your Neon connection string to .env (see README).",
      );
    }
    _pool = new Pool({
      connectionString,
      // Neon requires TLS; this accepts Neon's certificate chain without
      // needing the CA bundle configured locally.
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return _pool;
}
