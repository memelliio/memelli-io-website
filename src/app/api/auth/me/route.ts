// Shim — delegates to /api/in dispatcher. All logic in os-route-auth.me DB row.
// Edit the row → live in 2s. No deploy.
import { dispatch } from "@/lib/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const context: Record<string, unknown> = {};
  u.searchParams.forEach((v, k) => { context[k] = v; });
  return dispatch({ task: "auth.me", context, request: req });
}
