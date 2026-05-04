import { NextRequest, NextResponse } from "next/server";

const UPSTREAM =
  process.env.AUTH_LOGIN_UPSTREAM ?? "https://design.memelli.io/admin/auth/login";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "upstream unreachable",
      },
      { status: 502 },
    );
  }
}
