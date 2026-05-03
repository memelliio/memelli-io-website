import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Accept token from EITHER Authorization: Bearer header OR memelli_session cookie.
    let token: string | undefined;
    const authHeader = request.headers.get("authorization") || "";
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    if (m) token = m[1].trim();
    if (!token) {
      const c = await cookies();
      token = c.get("memelli_session")?.value;
    }
    if (!token) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name
       FROM auth.sessions s
       JOIN auth.users u ON u.id = s.user_id
       WHERE s.token = $1
         AND s.revoked_at IS NULL
         AND s.expires_at > now()
       LIMIT 1`,
      [token],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const user = result.rows[0];
    const userObj = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    };
    return NextResponse.json({
      ok: true,
      success: true,
      user: userObj,
      data: userObj,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
