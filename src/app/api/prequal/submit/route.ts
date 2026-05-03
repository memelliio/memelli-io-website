import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const json = await req.json();

    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "employmentStatus",
      "monthlyIncome",
      "homeStatus",
      "estCreditBand",
      "desiredAmount",
      "purpose",
    ];

    const missing = requiredFields.filter(
      (field) => json[field] === undefined || json[field] === null
    );

    if (missing.length > 0) {
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
      employmentStatus,
      monthlyIncome,
      homeStatus,
      estCreditBand,
      desiredAmount,
      purpose,
    } = json as {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      employmentStatus: string;
      monthlyIncome: number;
      homeStatus: string;
      estCreditBand: string;
      desiredAmount: number;
      purpose: string;
    };

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("memelli_session")?.value;

    let userId: string | null = null;

    if (sessionToken) {
      const sessionResult = await pool.query(
        `SELECT user_id FROM auth.sessions WHERE token = $1 AND revoked_at IS NULL AND expires_at > now()`,
        [sessionToken]
      );

      if ((sessionResult.rowCount ?? 0) > 0) {
        userId = sessionResult.rows[0].user_id;
      }
    }

    const desiredAmountCents = Math.round(Number(desiredAmount) * 100);

    const insertResult = await pool.query(
      `INSERT INTO customer.prequal_applications
        (user_id, first_name, last_name, email, phone, employment_status, monthly_income, home_status, est_credit_band, desired_amount_cents, purpose, payload, stage)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        userId,
        firstName,
        lastName,
        email,
        phone,
        employmentStatus,
        monthlyIncome,
        homeStatus,
        estCreditBand,
        desiredAmountCents,
        purpose,
        JSON.stringify(json),
        "submitted",
      ]
    );

    const applicationId = insertResult.rows[0].id;

    return NextResponse.json({ ok: true, applicationId });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}