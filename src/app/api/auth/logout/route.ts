import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const c = await cookies();
    const token = c.get("memelli_session")?.value;

    if (token) {
      await pool.query(
        "UPDATE auth.sessions SET revoked_at = now() WHERE token = $1",
        [token]
      );
    }

    c.set("memelli_session", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}