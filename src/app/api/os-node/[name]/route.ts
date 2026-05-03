import { NextResponse } from "next/server";
import { loadAppNodeCode } from "@/lib/os-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  if (!name || !/^[a-z0-9-]+$/i.test(name)) {
    return NextResponse.json({ ok: false, error: "bad_name" }, { status: 400 });
  }
  const code = await loadAppNodeCode(name);
  if (!code) {
    return NextResponse.json({ ok: false, error: "not_found", name }, { status: 404 });
  }
  return NextResponse.json(
    { ok: true, name, code },
    { headers: { "Cache-Control": "no-store" } },
  );
}
