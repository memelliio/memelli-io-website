// POST /api/melli/context — UPSERT session_context kernel_object for a user.
// Body: {
//   user_id: string,
//   active_module?: string,
//   focused_window_id?: string,
//   selected_item_id?: string,
//   view_state?: object,
// }
// Resp: { ok: true, id, action: 'inserted'|'updated' }
//
// Plus: GET /api/melli/context?user_id=... — returns latest session_context.
// Plus: NOTIFY trigger fires on UPDATE so M7 stream subscribers can push to the bar.

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/groq-chat-db";

const PLATFORM_TENANT = "98c1ecb7-6ad1-4349-96e3-5743198bee29";

interface SessCtxRow {
  id: string;
  metadata: Record<string, unknown>;
  updated_at: string;
}

export async function POST(req: NextRequest) {
  let body: {
    user_id?: string;
    active_module?: string;
    focused_window_id?: string;
    selected_item_id?: string;
    view_state?: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const userId = body.user_id;
  if (!userId) return NextResponse.json({ ok: false, error: "user_id_required" }, { status: 400 });

  // Find existing
  const existing = await q<{ id: string; metadata: Record<string, unknown> }>(
    `SELECT id, metadata FROM kernel_objects
     WHERE object_type='session_context' AND tenant_id=$1::uuid
       AND metadata->>'user_id'=$2 AND deleted_at IS NULL
     ORDER BY updated_at DESC LIMIT 1`,
    [PLATFORM_TENANT, userId],
  );

  const next = {
    user_id: userId,
    active_module: body.active_module ?? (existing[0]?.metadata?.active_module as string | undefined),
    focused_window_id: body.focused_window_id ?? (existing[0]?.metadata?.focused_window_id as string | undefined),
    selected_item_id: body.selected_item_id ?? (existing[0]?.metadata?.selected_item_id as string | undefined),
    view_state: body.view_state ?? (existing[0]?.metadata?.view_state as object | undefined) ?? {},
    recent_actions: (existing[0]?.metadata?.recent_actions as unknown[] | undefined) ?? [],
    last_activity_at: new Date().toISOString(),
  };

  let id: string;
  let action: "inserted" | "updated";

  if (existing[0]) {
    await q(
      `UPDATE kernel_objects
         SET metadata=$1::jsonb, updated_at=CURRENT_TIMESTAMP
       WHERE id=$2::uuid`,
      [JSON.stringify(next), existing[0].id],
    );
    id = existing[0].id;
    action = "updated";
  } else {
    const ins = await q<{ id: string }>(
      `INSERT INTO kernel_objects (id, object_type, status, owner_id, tenant_id, metadata, lifecycle_state, schema_version, updated_at)
       VALUES (gen_random_uuid(), 'session_context', 'active', $1::uuid, $2::uuid, $3::jsonb, 'active', 1, CURRENT_TIMESTAMP)
       RETURNING id`,
      [userId, PLATFORM_TENANT, JSON.stringify(next)],
    );
    id = ins[0].id;
    action = "inserted";
  }

  // Fire Postgres NOTIFY for M7 stream subscribers, channel-per-user.
  // Channel name: kernel_obj_session_context (filter by user_id in payload).
  try {
    await q(`SELECT pg_notify('kernel_obj_session_context', $1)`, [JSON.stringify({ user_id: userId, id, action })]);
  } catch (e) {
    void e;
  }

  return NextResponse.json({ ok: true, id, action });
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) return NextResponse.json({ ok: false, error: "user_id_required" }, { status: 400 });

  const rows = await q<SessCtxRow>(
    `SELECT id, metadata, updated_at FROM kernel_objects
     WHERE object_type='session_context' AND tenant_id=$1::uuid
       AND metadata->>'user_id'=$2 AND deleted_at IS NULL
     ORDER BY updated_at DESC LIMIT 1`,
    [PLATFORM_TENANT, userId],
  );
  return NextResponse.json({ ok: true, context: rows[0] ?? null });
}
