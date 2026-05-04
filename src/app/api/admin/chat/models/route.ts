// Admin chat models + settings — DB-driven catalog the operator chat surface
// (memelli-terminal page + /api/admin/chat/threads/[id]/messages route) reads
// instead of hardcoding model lists or magic numbers.
//
// Auth: SUPER_ADMIN JWT Bearer (or localhost dev bypass via authedOrNull).
//
// GET /api/admin/chat/models
//   → {
//       models: ChatModel[];     // sorted by sort_order ASC, only chat-face + active
//       settings: {              // pulled from system_operating_rules
//         default_model:               string;
//         short_term_message_count:    number;
//         max_tool_iterations:         number;
//         max_completion_tokens:       number;
//       }
//     }
//
// Source of truth:
//   • models   → groq_model_tiers WHERE role='chat-face' AND active=true
//   • settings → system_operating_rules WHERE rule_key IN
//                ('chat_default_model','chat_short_term_message_count',
//                 'chat_max_tool_iterations','chat_max_completion_tokens')
//
// Cache: Cache-Control: max-age=60 — operator can change DB rows without
// redeploying; browsers/clients pick up the change within a minute.

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/groq-chat-db";
import { authedOrNull } from "@/lib/groq-chat-auth";

interface ChatModelRow {
  model: string;
  label: string | null;
  archetype: string | null;
  smart_rank: number | null;
  speed: string | null;
  cost_in_per_m: string | null;
  cost_out_per_m: string | null;
  best_for: string | null;
  target_kind: string | null;
  supports_tools: boolean | null;
  sort_order: number | null;
}

interface ChatModel {
  id: string;
  label: string;
  archetype: string | null;
  smart_rank: number | null;
  speed: string | null;
  cost_in_per_m: string | null;
  cost_out_per_m: string | null;
  best_for: string | null;
  target_kind: string | null;
  supports_tools: boolean;
  sort_order: number;
}

interface SettingRow {
  rule_key: string;
  rule: string;
}

// Default fallbacks if a setting row is missing — keeps the route safe even
// if the seed has not run on a given environment.
const SETTING_FALLBACKS = {
  chat_default_model: "openai/gpt-oss-120b",
  chat_short_term_message_count: "8",
  chat_max_tool_iterations: "8",
  chat_max_completion_tokens: "4096",
} as const;

function toInt(v: string | undefined, fallback: number): number {
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: NextRequest) {
  const user = await authedOrNull(req);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [modelRows, settingRows] = await Promise.all([
    q<ChatModelRow>(
      `SELECT model, label, archetype, smart_rank, speed,
              cost_in_per_m, cost_out_per_m, best_for,
              target_kind, supports_tools, sort_order
       FROM groq_model_tiers
       WHERE role = 'chat-face' AND active = true
       ORDER BY sort_order ASC NULLS LAST, model ASC`,
      []
    ),
    q<SettingRow>(
      `SELECT rule_key, rule
       FROM system_operating_rules
       WHERE rule_key IN (
         'chat_default_model',
         'chat_short_term_message_count',
         'chat_max_tool_iterations',
         'chat_max_completion_tokens'
       )`,
      []
    ),
  ]);

  const models: ChatModel[] = modelRows.map((r) => ({
    id: r.model,
    label: r.label ?? r.model,
    archetype: r.archetype,
    smart_rank: r.smart_rank,
    speed: r.speed,
    cost_in_per_m: r.cost_in_per_m,
    cost_out_per_m: r.cost_out_per_m,
    best_for: r.best_for,
    target_kind: r.target_kind,
    supports_tools: r.supports_tools ?? false,
    sort_order: r.sort_order ?? 0,
  }));

  const byKey = new Map(settingRows.map((r) => [r.rule_key, r.rule]));
  const settings = {
    default_model:
      byKey.get("chat_default_model") ?? SETTING_FALLBACKS.chat_default_model,
    short_term_message_count: toInt(
      byKey.get("chat_short_term_message_count"),
      toInt(SETTING_FALLBACKS.chat_short_term_message_count, 8)
    ),
    max_tool_iterations: toInt(
      byKey.get("chat_max_tool_iterations"),
      toInt(SETTING_FALLBACKS.chat_max_tool_iterations, 8)
    ),
    max_completion_tokens: toInt(
      byKey.get("chat_max_completion_tokens"),
      toInt(SETTING_FALLBACKS.chat_max_completion_tokens, 4096)
    ),
  };

  return NextResponse.json(
    { models, settings },
    {
      headers: {
        "Cache-Control": "max-age=60",
      },
    }
  );
}
