// /api/os-icon-svg/[name]/route.ts — serves DB-stored SVG icons inline.
import "server-only";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const p = await params;
  const cleanName = (p.name || "").replace(/\.svg$/, "").replace(/[^a-z0-9-]/gi, "");
  if (!cleanName) return new NextResponse("bad name", { status: 400 });
  try {
    const r = await pool.query<{ code_text: string }>(
      "SELECT code_text FROM memelli_io_website.nodes WHERE active=true AND name=$1 ORDER BY version DESC LIMIT 1",
      ["os-icon-svg-" + cleanName]
    );
    if (!r.rows[0]) return new NextResponse("not found", { status: 404 });
    const m: { exports: { svg?: string } } = { exports: {} };
    new Function("module", "exports", r.rows[0].code_text)(m, m.exports);
    const svg = m.exports.svg || "";
    if (!svg) return new NextResponse("empty", { status: 404 });
    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=60, must-revalidate",
      },
    });
  } catch (e) {
    return new NextResponse("error", { status: 500 });
  }
}
