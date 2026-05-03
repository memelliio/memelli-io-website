// IN LANE — generic catch-all. Thin shim around the shared dispatcher.
// Body: { task, context }. Looks up os-route-<task> DB row, evals + runs.
import { dispatch } from "@/lib/dispatch";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { task?: string; context?: Record<string, unknown> } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  return dispatch({ task: body.task || "", context: body.context, request: req });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const task = url.searchParams.get("task") || "";
  const context: Record<string, unknown> = {};
  url.searchParams.forEach((v, k) => { if (k !== "task") context[k] = v; });
  return dispatch({ task, context, request: req });
}
