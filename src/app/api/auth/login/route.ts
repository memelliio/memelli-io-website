import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as {
      email: string;
      password: string;
    };

    const client = await pool.connect();
    try {
      const userResult = await client.query(
        `SELECT id, email, password_hash, first_name, last_name FROM auth.users WHERE email = $1`,
        [email]
      );

      if (userResult.rowCount === 0) {
        return NextResponse.json(
          { ok: false, error: "invalid_credentials" },
          { status: 401 }
        );
      }

      const user = userResult.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return NextResponse.json(
          { ok: false, error: "invalid_credentials" },
          { status: 401 }
        );
      }

      const token = crypto.randomBytes(32).toString("hex");

      await client.query(
        `INSERT INTO auth.sessions (user_id, token, created_at, expires_at) VALUES ($1, $2, now(), now() + interval '30 days')`,
        [user.id, token]
      );

      await client.query(
        `UPDATE auth.users SET last_login_at = now() WHERE id = $1`,
        [user.id]
      );

      const cookieStore = await cookies();
      cookieStore.set("memelli_session", token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return NextResponse.json({
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}