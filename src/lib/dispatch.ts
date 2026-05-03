// Shared dispatcher logic — used by /api/in AND every legacy /api/* shim.
// Looks up os-route-<task> in memelli_io_website.nodes, evals + runs.
// All actual route behavior lives in DB rows. Edit a row → live in 2s.
import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "./db";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const TASK_RE = /^[a-z0-9][a-z0-9._-]{0,80}$/;

async function loadRouteNode(task: string): Promise<string | null> {
  try {
    const r = await pool.query<{ code_text: string }>(
      "SELECT code_text FROM memelli_io_website.nodes WHERE active=true AND name = $1 ORDER BY version DESC LIMIT 1",
      [`os-route-${task}`],
    );
    return r.rows[0]?.code_text ?? null;
  } catch {
    return null;
  }
}

async function resolveUser(token: string | undefined) {
  if (!token) return { user: null, session: null };
  try {
    const r = await pool.query<{
      user_id: string;
      session_token: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
    }>(
      `SELECT s.user_id, s.token AS session_token, u.email, u.first_name, u.last_name
       FROM auth.sessions s JOIN auth.users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.revoked_at IS NULL AND s.expires_at > now()
       LIMIT 1`,
      [token],
    );
    if (!r.rows[0]) return { user: null, session: null };
    const row = r.rows[0];
    return {
      user: { id: row.user_id, email: row.email, firstName: row.first_name, lastName: row.last_name },
      session: { token: row.session_token },
    };
  } catch {
    return { user: null, session: null };
  }
}

export type DispatchOpts = {
  task: string;
  context?: Record<string, unknown>;
  request: Request;
};

/**
 * Run a DB-resident route handler. Used by /api/in and by legacy /api/* shims
 * that translate their body into a {task, context} envelope.
 */
export async function dispatch({ task, context, request }: DispatchOpts): Promise<Response> {
  if (!task || !TASK_RE.test(task)) {
    return NextResponse.json({ ok: false, error: "bad_task" }, { status: 400 });
  }

  const code = await loadRouteNode(task);
  if (!code) {
    return NextResponse.json({ ok: false, error: "route_not_found", task }, { status: 404 });
  }

  // Resolve token from EITHER cookie OR Authorization: Bearer header
  let token: string | undefined;
  const authHeader = request.headers.get("authorization") || "";
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (m) token = m[1].trim();
  if (!token) {
    const c = await cookies();
    token = c.get("memelli_session")?.value;
  }
  const { user, session } = await resolveUser(token);

  const headersObj: Record<string, string> = {};
  request.headers.forEach((v, k) => { headersObj[k] = v; });
  const url = new URL(request.url);
  const queryObj: Record<string, string> = {};
  url.searchParams.forEach((v, k) => { queryObj[k] = v; });

  const ctx = {
    task,
    context: context ?? {},
    request: { method: request.method, url: request.url },
    headers: headersObj,
    query: queryObj,
    user,
    session,
  };

  const helpers = {
    pool,
    bcrypt,
    crypto,
    setCookie: async (name: string, value: string, opts: Record<string, unknown> = {}) => {
      const store = await cookies();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      store.set(name, value, { httpOnly: true, secure: true, sameSite: "lax", path: "/", ...(opts as any) });
    },
    clearCookie: async (name: string) => {
      const store = await cookies();
      store.set(name, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
    },
    randomToken: (bytes = 32) => crypto.randomBytes(bytes).toString("hex"),
    hash: (plain: string, rounds = 10) => bcrypt.hash(plain, rounds),
    compare: (plain: string, hash: string) => bcrypt.compare(plain, hash),
  };

  let handler: (ctx: typeof ctx, h: typeof helpers) => Promise<unknown>;
  try {
    const m: { exports: unknown } = { exports: {} };
    new Function("module", "exports", "require", "Buffer", code)(m, m.exports, () => ({}), Buffer);
    handler = m.exports as typeof handler;
    if (typeof handler !== "function") throw new Error("handler_not_function");
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "route_compile_error", task, detail: (e as Error).message },
      { status: 500 },
    );
  }

  try {
    const result = await handler(ctx, helpers);
    if (result && typeof result === "object" && "__rawResponse" in (result as Record<string, unknown>)) {
      const raw = (result as { __rawResponse?: Response }).__rawResponse;
      if (raw instanceof Response) return raw;
    }
    if (result && typeof result === "object" && "__status" in (result as Record<string, unknown>)) {
      const r = result as { __status?: number; [k: string]: unknown };
      const { __status, ...rest } = r;
      return NextResponse.json(rest, { status: typeof __status === "number" ? __status : 200 });
    }
    return NextResponse.json(result ?? { ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "route_runtime_error", task, detail: (e as Error).message },
      { status: 500 },
    );
  }
}
