import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "bureaus",
      "goals",
    ];
    const missing = requiredFields.filter((field) => !(field in body));

    if (missing.length) {
      return NextResponse.json(
        { ok: false, error: "missing_fields", missing },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      bureaus,
      goals,
    } = body as {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      bureaus: unknown[];
      goals: unknown[];
    };

    // Retrieve user_id from session cookie if present
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("memelli_session")?.value;
    let userId: number | null = null;

    if (sessionToken) {
      const sessionResult = await pool.query<{ user_id: number }>(
        `SELECT user_id FROM sessions WHERE session_token = $1`,
        [sessionToken]
      );
      if (sessionResult.rowCount) {
        userId = sessionResult.rows[0].user_id;
      }
    }

    const insertResult = await pool.query<{ id: number }>(
      `INSERT INTO customer.credit_repair_cases
        (user_id, first_name, last_name, email, phone, bureaus, goals, payload, stage)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`,
      [
        userId,
        firstName,
        lastName,
        email,
        phone,
        JSON.stringify(bureaus),
        JSON.stringify(goals),
        JSON.stringify(body),
        "intake",
      ]
    );

    const caseId = insertResult.rows[0].id;

    return NextResponse.json({ ok: true, caseId });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}