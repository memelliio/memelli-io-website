// POST /api/melli/intent
//
// MelliBar intent matcher (M3). Pure pattern-match router — no Groq cost.
// Loads:
//   - the user's session_context kernel_object (active_module + selected_item_id + recent_actions)
//   - all module_command kernel_objects for the tenant
// Walks intent_patterns regex array; first match wins.
//
// Body: { user_id: string, transcript: string, session_context_id?: string }
// Resp: { command: { name, handler_name, params, module_id }, source: 'pattern' }
//   OR  { needs_llm: true, reason: string }
//
// Frontline of MelliBar's "deterministic-first, Groq-fallback" loop.

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/app/_lib/db";

interface ModuleCommandRow {
  id: string;
  metadata: {
    name: string;
    intent_patterns: string[];
    handler_name: string;
    required_params: Record<string, string>;
    module_id: string;
  };
}

interface SessionContextRow {
  id: string;
  metadata: {
    user_id?: string;
    active_module?: string;
    focused_window_id?: string;
    selected_item_id?: string;
    view_state?: Record<string, unknown>;
    recent_actions?: Array<{ at: string; command: string }>;
    last_activity_at?: string;
  };
  tenant_id: string;
}

interface MatchedCommand {
  name: string;
  handler_name: string;
  module_id: string;
  params: Record<string, string>;
}

const PLATFORM_TENANT = "98c1ecb7-6ad1-4349-96e3-5743198bee29"; // memelli-universe

// Pronoun resolution: when transcript references "her/him/them/this contact"
// and the session_context has a selected_item_id, fold it into params.contact_id.
const PRONOUN_RX = /\b(her|him|them|this contact)\b/i;

function tryMatch(
  transcript: string,
  cmd: ModuleCommandRow["metadata"],
  ctx: SessionContextRow["metadata"] | null,
): MatchedCommand | null {
  for (const pat of cmd.intent_patterns ?? []) {
    let rx: RegExp;
    try {
      rx = new RegExp(pat, "i");
    } catch {
      continue;
    }
    const m = transcript.match(rx);
    if (!m) continue;

    const params: Record<string, string> = {};

    // Named groups → params
    if (m.groups) {
      for (const [k, v] of Object.entries(m.groups)) {
        if (v != null) params[k] = String(v).trim();
      }
    }

    // Pronoun → contact_id from session selected_item_id
    if (
      cmd.required_params &&
      Object.prototype.hasOwnProperty.call(cmd.required_params, "contact_id") &&
      !params.contact_id &&
      PRONOUN_RX.test(transcript) &&
      ctx?.selected_item_id
    ) {
      params.contact_id = ctx.selected_item_id;
    }

    // 'who' alias from phone.dial pattern → contact_id resolution
    if (params.who && cmd.required_params?.contact_id && !params.contact_id) {
      if (PRONOUN_RX.test(params.who) && ctx?.selected_item_id) {
        params.contact_id = ctx.selected_item_id;
      } else {
        // free-text name; M5 handler will look up by query
        params.query = params.who;
      }
      delete params.who;
    }

    return {
      name: cmd.name,
      handler_name: cmd.handler_name,
      module_id: cmd.module_id,
      params,
    };
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: { user_id?: string; transcript?: string; session_context_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const transcript = (body.transcript ?? "").trim();
  const userId = body.user_id;
  if (!transcript) return NextResponse.json({ error: "transcript_required" }, { status: 400 });
  if (!userId) return NextResponse.json({ error: "user_id_required" }, { status: 400 });

  // 1. Load session_context (most recent for this user, tenant-scoped)
  let ctxRow: SessionContextRow | null = null;
  try {
    const ctxRes = await q<SessionContextRow>(
      `SELECT id, metadata, tenant_id
       FROM kernel_objects
       WHERE object_type='session_context'
         AND tenant_id=$1::uuid
         AND deleted_at IS NULL
         AND metadata->>'user_id'=$2
       ORDER BY updated_at DESC
       LIMIT 1`,
      [PLATFORM_TENANT, userId],
    );
    ctxRow = ctxRes[0] ?? null;
  } catch (e) {
    // proceed without context — pattern match still possible
    void e;
  }

  // 2. Load all active module_commands for tenant
  const cmdRows = await q<ModuleCommandRow>(
    `SELECT id, metadata
     FROM kernel_objects
     WHERE object_type='module_command'
       AND tenant_id=$1::uuid
       AND deleted_at IS NULL
       AND status='active'
     ORDER BY metadata->>'name'`,
    [PLATFORM_TENANT],
  );

  // 3. Try each command
  for (const row of cmdRows) {
    const matched = tryMatch(transcript, row.metadata, ctxRow?.metadata ?? null);
    if (matched) {
      // Validate required params present (allow `?` suffix to mark optional)
      const missing: string[] = [];
      for (const [k, v] of Object.entries(row.metadata.required_params ?? {})) {
        const optional = String(v).endsWith("?");
        if (!optional && !matched.params[k]) missing.push(k);
      }
      if (missing.length > 0) {
        // Treat as needs_llm — Groq can ask follow-up or extract slots
        return NextResponse.json({
          needs_llm: true,
          reason: "missing_required_params",
          partial_match: { name: matched.name, params: matched.params, missing },
          context: ctxRow?.metadata ?? null,
        });
      }
      return NextResponse.json({
        command: matched,
        source: "pattern",
        context: ctxRow?.metadata ?? null,
      });
    }
  }

  return NextResponse.json({
    needs_llm: true,
    reason: "no_pattern_matched",
    context: ctxRow?.metadata ?? null,
  });
}
