// Shim — delegates to /api/in dispatcher. All logic in os-route-os-icon DB row.
import { dispatch } from "@/lib/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const p = await params;
  const u = new URL(req.url);
  const context: Record<string, unknown> = { name: p.name };
  u.searchParams.forEach((v, k) => { if (!(k in context)) context[k] = v; });
  return dispatch({ task: "os-icon", context, request: req });
}
