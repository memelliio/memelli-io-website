// POST /api/melli/fallback
//
// MelliBar M8 — when intent matcher returns needs_llm. Dispatches to
// /api/groq/dispatch via api.memelli.io with: transcript + last 5 messages +
// session_context + relevant kernel_objects (e.g. focused contact).
//
// Groq's response shape:
//   { ok, agentId, source, result } where result is free text.
// Convention: if the result is JSON parseable as { command: { ... } } the
// orchestrator routes it back to /api/melli/dispatch; otherwise the bar
// speaks the text.

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/app/_lib/db";

const PLATFORM_TENANT = "98c1ecb7-6ad1-4349-96e3-5743198bee29";
const GATEWAY_URL =
  process.env.MEMELLI_CORE_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api-production-057c.up.railway.app";

interface PersonaRow {
  metadata: {
    name?: string;
    greeting?: string;
    tone?: string;
    brand_color?: string;
    partner_id?: string;
  };
}

async function loadInternalServiceToken(): Promise<string | null> {
  // service_keys is canonical; fall back to env in dev
  try {
    const rows = await q<{ key_value: string }>(
      `SELECT key_value FROM service_keys WHERE key_name='INTERNAL_SERVICE_TOKEN' LIMIT 1`,
    );
    if (rows[0]?.key_value) return rows[0].key_value;
  } catch {
    /* */
  }
  return process.env.INTERNAL_SERVICE_TOKEN ?? null;
}

export async function POST(req: NextRequest) {
  let body: {
    user_id?: string;
    transcript?: string;
    reason?: string;
    partial_match?: { name?: string; params?: Record<string, string>; missing?: string[] };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const userId = body.user_id;
  const transcript = body.transcript ?? "";
  if (!userId || !transcript) {
    return NextResponse.json({ ok: false, error: "user_id_and_transcript_required" }, { status: 400 });
  }

  // 1. Load session_context
  const ctxRows = await q<{ metadata: Record<string, unknown> }>(
    `SELECT metadata FROM kernel_objects
     WHERE object_type='session_context' AND tenant_id=$1::uuid
       AND metadata->>'user_id'=$2 AND deleted_at IS NULL
     ORDER BY updated_at DESC LIMIT 1`,
    [PLATFORM_TENANT, userId],
  );
  const ctx = ctxRows[0]?.metadata ?? {};

  // 2. Last 5 messages
  const msgRows = await q<{ metadata: Record<string, unknown>; created_at: string }>(
    `SELECT metadata, created_at FROM kernel_objects
     WHERE object_type='message' AND tenant_id=$1::uuid
       AND metadata->>'user_id'=$2 AND deleted_at IS NULL
     ORDER BY created_at DESC LIMIT 5`,
    [PLATFORM_TENANT, userId],
  );
  const recentMessages = msgRows.reverse().map((m) => ({
    role: (m.metadata.role as string) ?? "user",
    content: (m.metadata.content as string) ?? "",
    at: m.created_at,
  }));

  // 3. Focused entity (contact) if selected_item_id is a contact UUID
  let focused: Record<string, unknown> | null = null;
  const selId = ctx.selected_item_id as string | undefined;
  if (selId && /^[0-9a-f-]{36}$/.test(selId)) {
    try {
      const c = await q<Record<string, unknown>>(
        `SELECT id, "firstName", "lastName", email, phone FROM contacts WHERE id=$1::uuid LIMIT 1`,
        [selId],
      );
      focused = c[0] ?? null;
    } catch {
      /* */
    }
  }

  // 4. Persona
  const personaRows = await q<PersonaRow>(
    `SELECT metadata FROM kernel_objects
     WHERE object_type='persona' AND tenant_id=$1::uuid AND deleted_at IS NULL
     ORDER BY metadata->>'partner_id' NULLS LAST, created_at DESC LIMIT 1`,
    [PLATFORM_TENANT],
  );
  const persona = personaRows[0]?.metadata ?? {
    name: "Memelli",
    tone: "calm, helpful, concise",
    greeting: "Hey, what would you like me to do?",
  };

  // 5. Build dispatch task
  const taskPayload = {
    role: "MelliBar conversational fallback",
    persona,
    transcript,
    session_context: ctx,
    recent_messages: recentMessages,
    focused_entity: focused,
    fallback_reason: body.reason ?? "no_pattern_matched",
    partial_match: body.partial_match ?? null,
    instructions: [
      "Respond as Memelli per the persona's tone.",
      "If the user's intent maps to a known action (open contact, dial, schedule), reply ONLY with JSON: {\"command\":{\"name\":\"<name>\",\"params\":{...}}}.",
      "Otherwise reply with a short spoken answer (1-2 sentences) — plain text, no JSON.",
      "Available command names: contacts.open, contacts.search, contacts.add_note, phone.dial, prequal.next_step, credit.show_report, deals.create.",
    ],
  };

  const token = await loadInternalServiceToken();
  if (!token) {
    return NextResponse.json({
      ok: false,
      error: "INTERNAL_SERVICE_TOKEN missing — cannot reach /api/groq/dispatch",
      speak: "I can't reach my reasoning engine right now.",
    });
  }

  let groqResult: { ok?: boolean; result?: string; agentId?: string; source?: string } | null = null;
  try {
    const resp = await fetch(`${GATEWAY_URL}/api/groq/dispatch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ task: JSON.stringify(taskPayload) }),
    });
    if (resp.ok) {
      groqResult = await resp.json();
    } else {
      groqResult = { ok: false, result: `Groq HTTP ${resp.status}` };
    }
  } catch (e) {
    groqResult = { ok: false, result: e instanceof Error ? e.message : String(e) };
  }

  const text = groqResult?.result?.trim() ?? "";

  // Detect JSON-shaped command response
  let parsedCommand: { name?: string; params?: Record<string, string> } | null = null;
  if (text.startsWith("{")) {
    try {
      const j = JSON.parse(text);
      if (j?.command?.name) parsedCommand = j.command;
    } catch {
      /* */
    }
  }

  // Persist user utterance + memelli response into messages (M9 helper)
  try {
    await q(
      `INSERT INTO kernel_objects (id, object_type, status, owner_id, tenant_id, metadata, lifecycle_state, schema_version, updated_at)
       VALUES (gen_random_uuid(), 'message', 'active', $1::uuid, $2::uuid, $3::jsonb, 'active', 1, CURRENT_TIMESTAMP),
              (gen_random_uuid(), 'message', 'active', $1::uuid, $2::uuid, $4::jsonb, 'active', 1, CURRENT_TIMESTAMP)`,
      [
        userId,
        PLATFORM_TENANT,
        JSON.stringify({ user_id: userId, role: "user", content: transcript }),
        JSON.stringify({
          user_id: userId,
          role: "assistant",
          content: text,
          source: "groq",
          agentId: groqResult?.agentId,
        }),
      ],
    );
  } catch (e) {
    void e;
  }

  if (parsedCommand) {
    return NextResponse.json({
      ok: true,
      via: "groq",
      command: parsedCommand,
      raw: text,
    });
  }

  return NextResponse.json({
    ok: true,
    via: "groq",
    speak: text || "I'm not sure how to help with that yet.",
    raw: text,
  });
}
