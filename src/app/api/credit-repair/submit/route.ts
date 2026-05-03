// Shim — delegates to /api/in dispatcher. All logic in os-route-credit-repair.submit DB row.
// Edit the row → live in 2s. No deploy.
import { dispatch } from "@/lib/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let context: Record<string, unknown> = {};
  try { context = (await req.json()) as Record<string, unknown>; } catch { /* empty body */ }
  // Merge query string (if any)
  try { const u = new URL(req.url); u.searchParams.forEach((v, k) => { if (!(k in context)) context[k] = v; }); } catch {}
  return dispatch({ task: "credit-repair.submit", context, request: req });
}
