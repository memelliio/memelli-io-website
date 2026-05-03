import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const c = await cookies();
    const token = c.get("memelli_session")?.value;
    if (!token) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT s.*, u.id, u.email, u.first_name, u.last_name
       FROM auth.sessions s
       JOIN auth.users u ON u.id = s.user_id
       WHERE s.token = $1
         AND s.revoked_at IS NULL
         AND s.expires_at > now()`,
      [token]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const user = result.rows[0];
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}