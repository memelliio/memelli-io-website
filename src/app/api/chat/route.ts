import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatBody = {
  target?: "claude" | "groq" | "bar";
  text?: string;
  history?: { role: string; content: string }[];
};

export async function POST(req: Request) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  const target = body.target ?? "claude";
  if (!text) {
    return NextResponse.json({ ok: false, error: "empty_text" }, { status: 400 });
  }

  // Build the task prompt with light history context
  const recent = (body.history ?? []).slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");
  const task = recent
    ? `Conversation so far:\n${recent}\n\nuser: ${text}`
    : text;

  const upstream = await fetch("https://groq.memelli.io/api/groq/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task }),
    signal: AbortSignal.timeout(45_000),
  }).catch((e: unknown) => {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 502 },
    );
  });

  const data = await upstream.json().catch(() => ({}));
  const reply = (data && (data.result || data.text || "")) as string;

  return NextResponse.json({
    ok: !!reply,
    target,
    text: reply || "(empty reply)",
    model: data?.model ?? null,
    tokens: data?.tokens ?? null,
  });
}
