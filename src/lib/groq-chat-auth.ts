// Auth helper for the operator chat surface.
// Production: standard SUPER_ADMIN JWT Bearer check.
// Dev: localhost auto-grants SUPER_ADMIN as the seeded admin user — no
// browser-side token theatre when the operator is on their own machine.

import type { NextRequest } from "next/server";
import { verifyToken, extractBearerToken } from "@memelli/auth";
import type { AuthUser } from "@memelli/types";
import { q } from "./groq-chat-db";

const DEV_ADMIN_EMAIL = "admin@memelli.com";
let cachedDevAdmin: AuthUser | null = null;

async function devAdmin(): Promise<AuthUser | null> {
  if (cachedDevAdmin) return cachedDevAdmin;
  const rows = await q<{ id: string; email: string; role: string }>(
    `SELECT id, email, role FROM users WHERE email = $1 AND role = 'SUPER_ADMIN' LIMIT 1`,
    [DEV_ADMIN_EMAIL]
  );
  if (rows.length === 0) return null;
  cachedDevAdmin = {
    id: rows[0].id,
    email: rows[0].email,
    role: rows[0].role as AuthUser["role"],
  };
  return cachedDevAdmin;
}

export async function authedOrNull(req: NextRequest): Promise<AuthUser | null> {
  // ── Dev bypass: only when NODE_ENV !== 'production' AND from localhost ──
  if (process.env.NODE_ENV !== "production") {
    const host = req.headers.get("host") ?? "";
    const isLocal =
      host.startsWith("localhost") ||
      host.startsWith("127.0.0.1") ||
      host.startsWith("0.0.0.0") ||
      host.startsWith("[::1]");
    if (isLocal) {
      const admin = await devAdmin();
      if (admin) return admin;
    }
  }

  // ── Production: real JWT Bearer check, must be SUPER_ADMIN ──
  const token = extractBearerToken(req.headers.get("authorization") ?? undefined);
  if (!token) return null;
  try {
    const user = verifyToken(token);
    if (user.role !== "SUPER_ADMIN") return null;
    return user;
  } catch {
    return null;
  }
}
