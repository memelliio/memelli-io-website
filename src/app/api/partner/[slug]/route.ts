// GET /api/partner/[slug] — returns partner_accounts row for white-label render
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global.__pgPool) {
    global.__pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
    });
  }
  return global.__pgPool;
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const lower = (slug || '').toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{1,39}$/.test(lower)) {
    return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
  }
  try {
    const pool = getPool();
    const r = await pool.query(
      'SELECT id, slug, "businessName", "logoUrl", "brandColor", "isActive" FROM partner_accounts WHERE slug = $1 AND "isActive" = true LIMIT 1',
      [lower]
    );
    const row = r.rows[0];
    if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json(row, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } });
  } catch (e) {
    return NextResponse.json({ error: 'lookup failed', detail: (e as Error).message }, { status: 500 });
  }
}
