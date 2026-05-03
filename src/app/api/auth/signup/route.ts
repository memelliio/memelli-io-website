import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { firstName, lastName, email, phone, password } = body;

    // Basic validation
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { ok: false, error: "validation_error" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: "validation_error" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "validation_error" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertUserText = `
        INSERT INTO auth.users (email, password_hash, first_name, last_name, phone)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      const insertUserValues = [
        email,
        passwordHash,
        firstName,
        lastName,
        phone ?? null,
      ];
      const userResult = await client.query(insertUserText, insertUserValues);
      const userId = userResult.rows[0].id;

      // Create session token
      const token = crypto.randomBytes(32).toString("hex");
      const insertSessionText = `
        INSERT INTO auth.sessions (token, user_id, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '30 days')
      `;
      await client.query(insertSessionText, [token, userId]);

      // Insert default grant
      const insertGrantText = `
        INSERT INTO access.grants (user_id, app_id, plan_id, role, status)
        VALUES ($1, '*', 'free', 'member', 'active')
      `;
      await client.query(insertGrantText, [userId]);

      await client.query("COMMIT");

      // Set cookie
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
        userId,
        user: {
          id: userId,
          email,
          firstName,
          lastName,
        },
      });
    } catch (err: any) {
      await client.query("ROLLBACK");
      if (err.code === "23505") {
        // Unique violation
        return NextResponse.json(
          { ok: false, error: "email_taken" },
          { status: 409 }
        );
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}