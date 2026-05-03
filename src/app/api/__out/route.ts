// OUT LANE — single catch-all for outbound work.
// Body: { target: "credit-service", task: "credit.report.fetch", context: {...} }
//
// Default lane: ship to <target>.memelli.io/__in over the closed rail (auth via service token).
// Fallback lane: direct Railway production domain if custom domain unreachable.
// Hard fail: both fail → return error loud. NO silent fallback to local stub.
//
// Auth envelope is preserved end-to-end: the calling user's id+email travel as
// ctx.user inside the package so the receiving standalone can authorize.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OutBody = {
  target?: string;
  task?: string;
  context?: Record<string, unknown>;
  timeoutMs?: number;
};

const TARGET_RE = /^[a-z0-9][a-z0-9-]{1,40}$/;

async function resolveUser(token: string | undefined) {
  if (!token) return null;
  try {
    const r = await pool.query<{ id: string; email: string; first_name: string | null; last_name: string | null }>(
      `SELECT u.id, u.email, u.first_name, u.last_name
       FROM auth.sessions s JOIN auth.users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.revoked_at IS NULL AND s.expires_at > now()
       LIMIT 1`,
      [token],
    );
    if (!r.rows[0]) return null;
    return { id: r.rows[0].id, email: r.rows[0].email, firstName: r.rows[0].first_name, lastName: r.rows[0].last_name };
  } catch {
    return null;
  }
}

async function getServiceToken(): Promise<string> {
  // Token used to auth /__in calls between standalones. Stored in DB; UPDATE = rotate.
  try {
    const r = await pool.query<{ value: string }>(
      "SELECT code_text AS value FROM memelli_io_website.nodes WHERE active=true AND name = 'rail-service-token' ORDER BY version DESC LIMIT 1",
    );
    if (r.rows[0]?.value) return r.rows[0].value;
  } catch {
    /* fall through */
  }
  // Fallback to env if DB row not seeded
  return process.env.INTERNAL_SERVICE_TOKEN || "";
}

async function ship(url: string, payload: unknown, timeoutMs: number, serviceToken: string) {
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-memelli-service-token": serviceToken,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await r.text();
  let json: unknown;
  try { json = JSON.parse(text); } catch { json = { __raw: text }; }
  return { status: r.status, json };
}

export async function POST(req: Request) {
  let body: OutBody = {};
  try {
    body = (await req.json()) as OutBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const target = (body.target || "").trim();
  const task = (body.task || "").trim();
  if (!target || !TARGET_RE.test(target)) {
    return NextResponse.json({ ok: false, error: "bad_target" }, { status: 400 });
  }
  if (!task) {
    return NextResponse.json({ ok: false, error: "bad_task" }, { status: 400 });
  }

  const c = await cookies();
  const sessionToken = c.get("memelli_session")?.value;
  const user = await resolveUser(sessionToken);

  const envelope = {
    task,
    context: body.context ?? {},
    user, // stable user object travels with the request
    schema: target,
    ts: new Date().toISOString(),
  };

  const serviceToken = await getServiceToken();
  const timeoutMs = body.timeoutMs ?? 30_000;

  // ── DEFAULT LANE: <target>.memelli.io/__in (closed rail) ────
  const primary = `https://${target}.memelli.io/__in`;
  try {
    const out = await ship(primary, envelope, timeoutMs, serviceToken);
    if (out.status >= 200 && out.status < 500) {
      return NextResponse.json({ ok: true, lane: "default", ...(typeof out.json === "object" && out.json ? out.json : {}) }, { status: out.status });
    }
    // 5xx → try fallback
  } catch (_e) {
    // network/timeout → try fallback
  }

  // ── FALLBACK LANE: direct Railway production domain ─────────
  // Look up productionDomain from inventory or env. Standalone naming convention:
  // memelli-<target>-service-production-XXXX.up.railway.app — known per inventory.
  // Simplest fallback: try the obvious production domain pattern.
  const fallback = `https://memelli-${target}-production.up.railway.app/__in`;
  try {
    const out = await ship(fallback, envelope, timeoutMs, serviceToken);
    if (out.status >= 200 && out.status < 500) {
      return NextResponse.json({ ok: true, lane: "fallback", ...(typeof out.json === "object" && out.json ? out.json : {}) }, { status: out.status });
    }
  } catch (_e) {
    /* both lanes failed — hard fail */
  }

  // Hard fail. Both lanes down. No silent stub.
  return NextResponse.json(
    { ok: false, error: "rail_down", target, task, message: "both default + fallback lanes failed; check Groq Instant + Railway service health" },
    { status: 502 },
  );
}
