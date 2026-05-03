// Direct pg client for the operator chat tables. Bypasses @memelli/db's
// bundled Prisma client because (a) its dist is stale relative to schema.prisma
// and (b) Prisma's Windows engine .dll lookup fails in Next.js dev with Turbopack.
//
// Same Postgres URL the rest of the app talks to. Single shared pool.

import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __memelli_groq_chat_pool: Pool | undefined;
}

function databaseUrl(): string {
  const url = process.env.DATABASE_URL || process.env.MEMELLI_CORE_DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL / MEMELLI_CORE_DATABASE_URL not set");
  return url;
}

export function pool(): Pool {
  if (!globalThis.__memelli_groq_chat_pool) {
    globalThis.__memelli_groq_chat_pool = new Pool({
      connectionString: databaseUrl(),
      max: 4,
    });
  }
  return globalThis.__memelli_groq_chat_pool;
}

export async function q<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool().query(sql, params);
  return res.rows as T[];
}
