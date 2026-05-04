// /api/melli/messages — MelliBar conversation memory.
//
// POST: append a single message kernel_object. Body: { user_id, role, content }.
// GET ?user_id=&limit=10: return last N messages (chronological).
//
// Summarization at >50 messages: collapse oldest 40 into a single
// kernel_objects row of object_type='message_summary' (keeps the message
// table light) and link via kernel_relationships(relationship_type=
// 'summarized_from').

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/groq-chat-db";

const PLATFORM_TENANT = "98c1ecb7-6ad1-4349-96e3-5743198bee29";

interface MsgRow {
  id: string;
  metadata: { role: string; content: string; user_id: string; source?: string };
  created_at: string;
}

export async function POST(req: NextRequest) {
  let body: { user_id?: string; role?: string; content?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const { user_id: userId, role, content, source } = body;
  if (!userId || !role || !content) {
    return NextResponse.json({ ok: false, error: "user_id_role_content_required" }, { status: 400 });
  }

  const ins = await q<{ id: string }>(
    `INSERT INTO kernel_objects (id, object_type, status, owner_id, tenant_id, metadata, lifecycle_state, schema_version, updated_at)
     VALUES (gen_random_uuid(), 'message', 'active', $1::uuid, $2::uuid, $3::jsonb, 'active', 1, CURRENT_TIMESTAMP)
     RETURNING id`,
    [
      userId,
      PLATFORM_TENANT,
      JSON.stringify({ user_id: userId, role, content, source: source ?? "user" }),
    ],
  );

  // Summarization gate: count active messages
  const cnt = await q<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM kernel_objects
     WHERE object_type='message' AND tenant_id=$1::uuid AND deleted_at IS NULL
       AND metadata->>'user_id'=$2`,
    [PLATFORM_TENANT, userId],
  );
  if ((cnt[0]?.c ?? 0) > 50) {
    try {
      // Pull oldest 40
      const old = await q<MsgRow>(
        `SELECT id, metadata, created_at FROM kernel_objects
         WHERE object_type='message' AND tenant_id=$1::uuid AND deleted_at IS NULL
           AND metadata->>'user_id'=$2
         ORDER BY created_at ASC LIMIT 40`,
        [PLATFORM_TENANT, userId],
      );
      const summaryText = old
        .map((m) => `${m.metadata.role}: ${m.metadata.content}`)
        .join("\n");
      const sumIns = await q<{ id: string }>(
        `INSERT INTO kernel_objects (id, object_type, status, owner_id, tenant_id, metadata, lifecycle_state, schema_version, updated_at)
         VALUES (gen_random_uuid(), 'message_summary', 'active', $1::uuid, $2::uuid, $3::jsonb, 'active', 1, CURRENT_TIMESTAMP)
         RETURNING id`,
        [
          userId,
          PLATFORM_TENANT,
          JSON.stringify({
            user_id: userId,
            content: summaryText,
            message_count: old.length,
            from: old[0]?.created_at,
            to: old[old.length - 1]?.created_at,
          }),
        ],
      );
      const sumId = sumIns[0]?.id;
      // Link summary → message ids
      for (const m of old) {
        try {
          await q(
            `INSERT INTO kernel_relationships (id, source_object_id, target_object_id, relationship_type, tenant_id, source_object_type, target_object_type, updated_at)
             VALUES (gen_random_uuid(), $1::uuid, $2::uuid, 'summarized_from', $3::uuid, 'message_summary', 'message', CURRENT_TIMESTAMP)`,
            [sumId, m.id, PLATFORM_TENANT],
          );
        } catch {
          /* */
        }
      }
      // Soft-delete the summarized originals
      const ids = old.map((m) => m.id);
      if (ids.length > 0) {
        await q(
          `UPDATE kernel_objects SET deleted_at=now(), deletion_reason='summarized'
           WHERE id = ANY($1::uuid[])`,
          [ids],
        );
      }
    } catch (e) {
      void e;
    }
  }

  return NextResponse.json({ ok: true, id: ins[0]?.id });
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  const limit = Math.max(
    1,
    Math.min(100, parseInt(req.nextUrl.searchParams.get("limit") ?? "10", 10) || 10),
  );
  if (!userId) return NextResponse.json({ ok: false, error: "user_id_required" }, { status: 400 });

  const rows = await q<MsgRow>(
    `SELECT id, metadata, created_at FROM kernel_objects
     WHERE object_type='message' AND tenant_id=$1::uuid AND deleted_at IS NULL
       AND metadata->>'user_id'=$2
     ORDER BY created_at DESC LIMIT $3`,
    [PLATFORM_TENANT, userId, limit],
  );
  // chronological for caller
  return NextResponse.json({ ok: true, messages: rows.reverse() });
}
