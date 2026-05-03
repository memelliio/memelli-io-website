import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const required = ["firstName", "lastName", "email", "phone", "bureaus", "goals"];
    const missing = required.filter((f) => !(f in body));
    if (missing.length) {
      return NextResponse.json({ ok: false, error: "missing_fields", missing }, { status: 400 });
    }

    const { firstName, lastName, email, phone, bureaus, goals } = body as {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      bureaus: string[];
      goals: string[];
    };

    const c = await cookies();
    const sessionToken = c.get("memelli_session")?.value;
    let userId: string | null = null;
    if (sessionToken) {
      const sr = await pool.query<{ user_id: string }>(
        `SELECT user_id FROM auth.sessions WHERE token = $1 AND revoked_at IS NULL AND expires_at > now()`,
        [sessionToken],
      );
      if (sr.rowCount) userId = sr.rows[0].user_id;
    }

    const ins = await pool.query<{ id: string }>(
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
        Array.isArray(bureaus) ? bureaus : [],
        Array.isArray(goals) ? goals : [],
        JSON.stringify(body),
        "intake",
      ],
    );

    return NextResponse.json({ ok: true, caseId: ins.rows[0].id });
  } catch (e) {
    console.error("[credit-repair/submit]", e);
    return NextResponse.json({ ok: false, error: "server_error", detail: (e as Error).message }, { status: 500 });
  }
}
