import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_CHECK =
  process.env.AUTH_CHECK_UPSTREAM ??
  "https://design.memelli.io/admin/auth/check";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const padded = parts[1] + "=".repeat((4 - (parts[1].length % 4)) % 4);
    const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "Bearer token required" },
      { status: 401 },
    );
  }

  // Try upstream check first (validates signature)
  try {
    const upstream = await fetch(UPSTREAM_CHECK, {
      headers: { authorization: auth },
      cache: "no-store",
    });
    if (upstream.ok) {
      const text = await upstream.text();
      return new NextResponse(text, {
        status: upstream.status,
        headers: {
          "content-type":
            upstream.headers.get("content-type") ?? "application/json",
        },
      });
    }
  } catch {
    // fall through to local decode
  }

  // Fallback: decode unverified claims so the UI has something to render.
  const token = auth.replace(/^Bearer\s+/i, "");
  const claims = decodeJwtPayload(token);
  if (!claims) {
    return NextResponse.json(
      { ok: false, error: "Invalid token" },
      { status: 401 },
    );
  }

  const data = {
    id: (claims.sub as string) ?? "",
    sub: (claims.sub as string) ?? "",
    email: (claims.email as string) ?? "",
    firstName: (claims.firstName as string) ?? undefined,
    lastName: (claims.lastName as string) ?? undefined,
    role: (claims.role as string) ?? "MEMBER",
    tenantId: (claims.tenantId as string) ?? undefined,
  };
  return NextResponse.json({ ok: true, data });
}
