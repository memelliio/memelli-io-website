// /api/admin/system-status — operator chat live system activity surface.
// Polled every ~5s by /admin/chat. Read-only — never mutates anything.
//
// Auth: SUPER_ADMIN JWT Bearer (localhost dev grants automatically — same
// rule as the chat surface itself).
//
// Returns four observation streams:
//   1. development_packets — recent rows (any status)
//   2. deployment_packets  — recent rows (any status)
//   3. chatActivity        — recent groq_chat_history rows where the
//                            direction is NOT operator->* and NOT
//                            *->operator coming from the operator's own CLI
//                            (i.e. team voice + supervisor outputs only)
//   4. supervisorHealth    — proxied from agent-runner /health (CORS-safe)
//
// Append-only DTO. No mutation paths from this route.

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/groq-chat-db";
import { authedOrNull } from "@/lib/groq-chat-auth";

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

export async function GET(req: NextRequest) {
  const user = await authedOrNull(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const errors: Record<string, string> = {};

  // 1. development_packets — newest 25
  let developmentPackets: DevPacketRow[] = [];
  try {
    developmentPackets = await q<DevPacketRow>(
      `SELECT id, target_repo, target_branch, subject, status, retries,
              error_text, enqueued_by, enqueued_at, claimed_at, completed_at,
              result_text
         FROM development_packets
        ORDER BY enqueued_at DESC
        LIMIT 25`
    );
  } catch (e) {
    errors.development_packets = e instanceof Error ? e.message : String(e);
  }

  // 2. deployment_packets — newest 25
  let deploymentPackets: DeployPacketRow[] = [];
  try {
    deploymentPackets = await q<DeployPacketRow>(
      `SELECT id, target_repo, target_env, dev_sha, main_sha, status, retries,
              error_text, enqueued_by, enqueued_at, claimed_at, completed_at,
              railway_deploy_id
         FROM deployment_packets
        ORDER BY enqueued_at DESC
        LIMIT 25`
    );
  } catch (e) {
    errors.deployment_packets = e instanceof Error ? e.message : String(e);
  }

  // 3. chatActivity — Groq team responses + chat-message-supervisor outputs.
  // Filter rule per spec: direction NOT LIKE 'operator->%'
  //                AND direction NOT LIKE '%cli-claude->operator'
  // i.e. anything that is NOT the operator typing AND NOT a Claude CLI
  // session reply (those are already in the operator's terminal session).
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
        LIMIT 25`
    );
  } catch (e) {
    errors.chat_activity = e instanceof Error ? e.message : String(e);
  }

  // 4. Supervisor health — proxy through agent-runner /health.
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

  return NextResponse.json(
    {
      ts: new Date().toISOString(),
      developmentPackets,
      deploymentPackets,
      chatActivity,
      supervisorHealth,
      errors: Object.keys(errors).length ? errors : undefined,
    },
    {
      // Never cache — this is a real-time activity stream.
      headers: { "Cache-Control": "no-store" },
    }
  );
}
