import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Accept token from Authorization: Bearer OR memelli_session cookie
    let token: string | undefined;
    const authHeader = req.headers.get("authorization") || "";
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    if (m) token = m[1].trim();
    const c = await cookies();
    if (!token) token = c.get("memelli_session")?.value;

    if (token) {
      await pool.query(
        "UPDATE auth.sessions SET revoked_at = now() WHERE token = $1",
        [token],
      );
    }

    c.set("memelli_session", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return NextResponse.json({ ok: true, success: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}