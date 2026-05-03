import { loadIcon } from "@/lib/os-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  if (!name) return new Response("bad name", { status: 400 });
  // Accept "billing.png" or "billing" — strip extension for DB lookup.
  const base = name.replace(/\.[a-z0-9]+$/i, "");
  if (!/^[a-z0-9-]+$/i.test(base)) {
    return new Response("bad name", { status: 400 });
  }
  const ic = await loadIcon("os-icon-" + base);
  if (!ic) return new Response("not found", { status: 404 });
  return new Response(new Uint8Array(ic.buf), {
    headers: {
      "Content-Type": ic.mime,
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
