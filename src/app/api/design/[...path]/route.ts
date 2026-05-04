import { NextRequest, NextResponse } from "next/server";

const UPSTREAM =
  process.env.DESIGN_WAREHOUSE_URL ?? "https://design.memelli.io";

const ADMIN_EMAIL =
  process.env.MEMELLI_ADMIN_EMAIL ?? "admin@memelli.com";
const ADMIN_PASSWORD =
  process.env.MEMELLI_ADMIN_PASSWORD ?? "Admin1234";

let cachedToken: string | null = null;
let cachedAt = 0;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 6;

async function login(): Promise<string | null> {
  try {
    const r = await fetch(`${UPSTREAM}/admin/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { ok?: boolean; data?: { token?: string } };
    return j.data?.token ?? null;
  } catch {
    return null;
  }
}

async function getToken(force = false): Promise<string | null> {
  if (!force && cachedToken && Date.now() - cachedAt < TOKEN_TTL_MS) {
    return cachedToken;
  }
  const t = await login();
  if (t) {
    cachedToken = t;
    cachedAt = Date.now();
  }
  return t;
}

async function forwardOnce(
  target: string,
  init: RequestInit,
  token: string | null,
  body: string | null,
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (token) headers.set("authorization", `Bearer ${token}`);
  return fetch(target, {
    ...init,
    headers,
    body: body ?? undefined,
    cache: "no-store",
  });
}

async function forward(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const target = `${UPSTREAM}/api/${path.join("/")}${req.nextUrl.search}`;

  const reqContentType = req.headers.get("content-type") ?? "application/json";
  const baseHeaders = new Headers();
  baseHeaders.set("content-type", reqContentType);

  let body: string | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
  }

  const init: RequestInit = { method: req.method, headers: baseHeaders };

  // First try: cached token (or login if none)
  let token = await getToken(false);
  let upstream = await forwardOnce(target, init, token, body);

  // On 401, force-refresh token and retry once
  if (upstream.status === 401) {
    token = await getToken(true);
    upstream = await forwardOnce(target, init, token, body);
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return forward(req, ctx);
}
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return forward(req, ctx);
}
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return forward(req, ctx);
}
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return forward(req, ctx);
}
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return forward(req, ctx);
}
