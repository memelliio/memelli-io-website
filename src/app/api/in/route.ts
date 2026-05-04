// IN LANE — generic catch-all. Thin shim around the shared dispatcher.
// Body: { task, context }. Looks up os-route-<task> DB row, evals + runs.
//
// CORS: /api/in is the universal entry point — local dev, mobile, partner widgets,
// embedded shells, etc. all reach live nodes through here. So we allow any origin
// (credentials excluded — auth flows separately via the cookie or Bearer token
// already supported in dispatch.ts).
import { dispatch } from "@/lib/dispatch";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function withCors(res: Response): Response {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
  return res;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  let body: { task?: string; context?: Record<string, unknown> } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return withCors(NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 }));
  }
  const res = await dispatch({ task: body.task || "", context: body.context, request: req });
  return withCors(res);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const task = url.searchParams.get("task") || "";
  const context: Record<string, unknown> = {};
  url.searchParams.forEach((v, k) => { if (k !== "task") context[k] = v; });
  const res = await dispatch({ task, context, request: req });
  return withCors(res);
}
