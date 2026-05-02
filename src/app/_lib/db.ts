// Shared pg pool for MelliBar API routes.
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __memelli_mellibar_pool: Pool | undefined;
}

function databaseUrl(): string {
  const url = process.env.DATABASE_URL || process.env.MEMELLI_CORE_DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL / MEMELLI_CORE_DATABASE_URL not set");
  return url;
}

export function pool(): Pool {
  if (!globalThis.__memelli_mellibar_pool) {
    globalThis.__memelli_mellibar_pool = new Pool({ connectionString: databaseUrl(), max: 4 });
  }
  return globalThis.__memelli_mellibar_pool;
}

export async function q<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool().query(sql, params);
  return res.rows as T[];
}
