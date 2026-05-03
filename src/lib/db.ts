import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __memelliPgPool: Pool | undefined;
}

const conn =
  process.env.DATABASE_URL ||
  process.env.PGBOUNCER_INTERNAL ||
  process.env.PGBOUNCER_EXTERNAL ||
  "";

export const pool: Pool =
  globalThis.__memelliPgPool ??
  new Pool({
    connectionString: conn,
    max: 4,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
  });

if (!globalThis.__memelliPgPool) globalThis.__memelliPgPool = pool;
