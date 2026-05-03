import { NextResponse } from "next/server";
import { loadOsRegistry } from "@/lib/os-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const reg = await loadOsRegistry();
  return NextResponse.json(reg, {
    headers: { "Cache-Control": "no-store" },
  });
}
