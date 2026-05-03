import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const appId = url.searchParams.get("app");
    if (!appId) {
      return NextResponse.json(
        { ok: false, allowed: false, reason: "missing_app" },
        { status: 400 }
      );
    }

    // Accept token from Authorization: Bearer OR memelli_session cookie
    let token: string | undefined;
    const authHeader = request.headers.get("authorization") || "";
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    if (m) token = m[1].trim();
    if (!token) {
      const c = await cookies();
      token = c.get("memelli_session")?.value;
    }
    if (!token) {
      return NextResponse.json(
        { ok: false, allowed: false, reason: "unauthenticated" },
        { status: 401 }
      );
    }

    const client = await pool.connect();
    try {
      // Lookup user by session token
      const sessionRes = await client.query(
        `SELECT user_id FROM auth.sessions WHERE token = $1 AND revoked_at IS NULL AND expires_at > now()`,
        [token]
      );

      if (sessionRes.rowCount === 0) {
        return NextResponse.json(
          { ok: false, allowed: false, reason: "unauthenticated" },
          { status: 401 }
        );
      }

      const userId = sessionRes.rows[0].user_id;

      // Fetch the most recent active grant for the user and app
      const grantRes = await client.query(
        `SELECT g.*, p.includes_apps
         FROM access.grants g
         LEFT JOIN access.plans p ON g.plan_id = p.id
         WHERE g.user_id = $1
           AND g.status = 'active'
           AND (g.app_id = $2 OR g.app_id = '*')
         ORDER BY g.created_at DESC
         LIMIT 1`,
        [userId, appId]
      );

      if (grantRes.rowCount === 0) {
        return NextResponse.json(
          {
            ok: false,
            allowed: false,
            reason: "plan_required",
            requiredPlan: "pro",
          },
          { status: 402 }
        );
      }

      const grant = grantRes.rows[0];
      const role: string = grant.role;
      const grantAppId: string = grant.app_id;
      const includesApps: any = grant.includes_apps; // could be array or null

      const includesArray = Array.isArray(includesApps)
        ? includesApps
        : typeof includesApps === "string"
        ? includesApps.split(",").map((s: string) => s.trim())
        : [];

      const allowed =
        role === "admin" ||
        grantAppId === appId ||
        includesArray.includes(appId) ||
        includesArray.includes("*");

      if (allowed) {
        return NextResponse.json({
          ok: true,
          allowed: true,
          plan: grant.plan_id,
        });
      } else {
        return NextResponse.json(
          {
            ok: false,
            allowed: false,
            reason: "plan_required",
            requiredPlan: "pro",
          },
          { status: 402 }
        );
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Access route error:", error);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}