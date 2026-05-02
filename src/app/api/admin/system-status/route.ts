// /api/admin/system-status — operator chat live system activity surface (memelli-io-website).
// Polled every 5s by the Memelli terminal panel. Read-only — never mutates anything.
//
// Returns observation streams from the kernel DB:
//   1. development_packets    — recent dev work
//   2. deployment_packets     — recent deploy work
//   3. chatActivity           — groq_chat_history (team voices, not operator)
//   4. supervisorHealth       — proxied agent-runner /health
//   5. claudeSessions         — active Claude orchestration sessions
//   6. kernelEvents           — append-only timeline for active sessions
//   7. operatingRules         — locked architectural decisions (system_operating_rules)
//
// Auth: Bearer INTERNAL_SERVICE_TOKEN (matches the rest of the standalone's protected routes).

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/app/_lib/db";

const AGENT_RUNNER_HEALTH =
  process.env.AGENT_RUNNER_HEALTH_URL || "https://agent-runner.memelli.io/health";

interface DevPacketRow {
  id: string;
  target_repo: string;
  target_branch: string | null;
  subject: string | null;
  status: string;
  retries: number;
  error_text: string | null;
  enqueued_by: string;
  enqueued_at: Date;
  claimed_at: Date | null;
  completed_at: Date | null;
  result_text: string | null;
}

interface DeployPacketRow {
  id: string;
  target_repo: string;
  target_env: string;
  dev_sha: string | null;
  main_sha: string | null;
  status: string;
  retries: number;
  error_text: string | null;
  enqueued_by: string;
  enqueued_at: Date;
  claimed_at: Date | null;
  completed_at: Date | null;
  railway_deploy_id: string | null;
}

interface ChatActivityRow {
  id: string;
  threadId: string;
  threadTitle: string | null;
  direction: string;
  origin: string;
  content: string;
  status: string;
  createdAt: Date;
}

interface KernelSessionRow {
  id: string;
  title: string;
  status: string;
  lifecycle_state: string;
  started_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: any;
}

interface KernelEventRow {
  id: string;
  object_id: string;
  event_type: string;
  payload: any;
  metadata: any;
  created_at: string;
}

interface OperatingRuleRow {
  id: string;
  rule_key: string;
  category: string;
  rule: string;
  why: string;
  how_to_apply: string;
  authority: string;
  locked_at: string | null;
  updated_at: string;
}

function authed(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  return !!token && token === process.env.INTERNAL_SERVICE_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const errors: Record<string, string> = {};

  let developmentPackets: DevPacketRow[] = [];
  try {
    developmentPackets = await q<DevPacketRow>(
      `SELECT id, target_repo, target_branch, subject, status, retries,
              error_text, enqueued_by, enqueued_at, claimed_at, completed_at,
              result_text
         FROM development_packets
        ORDER BY enqueued_at DESC
        LIMIT 25`,
    );
  } catch (e) {
    errors.development_packets = e instanceof Error ? e.message : String(e);
  }

  let deploymentPackets: DeployPacketRow[] = [];
  try {
    deploymentPackets = await q<DeployPacketRow>(
      `SELECT id, target_repo, target_env, dev_sha, main_sha, status, retries,
              error_text, enqueued_by, enqueued_at, claimed_at, completed_at,
              railway_deploy_id
         FROM deployment_packets
        ORDER BY enqueued_at DESC
        LIMIT 25`,
    );
  } catch (e) {
    errors.deployment_packets = e instanceof Error ? e.message : String(e);
  }

  let chatActivity: ChatActivityRow[] = [];
  try {
    chatActivity = await q<ChatActivityRow>(
      `SELECT h.id, h."threadId", t.title AS "threadTitle",
              h.direction, h.origin, h.content, h.status, h."createdAt"
         FROM groq_chat_history h
         LEFT JOIN groq_chat_threads t ON t.id = h."threadId"
        WHERE h.direction NOT LIKE 'operator->%'
          AND h.direction NOT LIKE '%cli-claude->operator'
        ORDER BY h."createdAt" DESC
        LIMIT 25`,
    );
  } catch (e) {
    errors.chat_activity = e instanceof Error ? e.message : String(e);
  }

  let supervisorHealth: Record<string, unknown> | null = null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(AGENT_RUNNER_HEALTH, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    if (res.ok) {
      supervisorHealth = (await res.json()) as Record<string, unknown>;
    } else {
      errors.supervisor_health = `agent-runner /health ${res.status}`;
    }
  } catch (e) {
    errors.supervisor_health = e instanceof Error ? e.message : String(e);
  }

  let claudeSessions: KernelSessionRow[] = [];
  try {
    claudeSessions = await q<KernelSessionRow>(
      `SELECT id, title, status, lifecycle_state, started_at, closed_at, created_at, updated_at, metadata
         FROM kernel_objects
        WHERE object_type = 'claude_session' AND lifecycle_state = 'active'
        ORDER BY created_at DESC
        LIMIT 10`,
    );
  } catch (e) {
    errors.claude_sessions = e instanceof Error ? e.message : String(e);
  }

  let kernelEvents: KernelEventRow[] = [];
  try {
    kernelEvents = await q<KernelEventRow>(
      `SELECT id, object_id, event_type, payload, metadata, created_at
         FROM kernel_events
        WHERE object_id IN (
              SELECT id FROM kernel_objects
               WHERE object_type = 'claude_session' AND lifecycle_state = 'active')
        ORDER BY created_at DESC
        LIMIT 50`,
    );
  } catch (e) {
    errors.kernel_events = e instanceof Error ? e.message : String(e);
  }

  let operatingRules: OperatingRuleRow[] = [];
  try {
    operatingRules = await q<OperatingRuleRow>(
      `SELECT id, rule_key, category, rule, why, how_to_apply, authority, locked_at, updated_at
         FROM system_operating_rules
        ORDER BY updated_at DESC NULLS LAST
        LIMIT 20`,
    );
  } catch (e) {
    errors.operating_rules = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(
    {
      ts: new Date().toISOString(),
      developmentPackets,
      deploymentPackets,
      chatActivity,
      supervisorHealth,
      claudeSessions,
      kernelEvents,
      operatingRules,
      errors: Object.keys(errors).length ? errors : undefined,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
