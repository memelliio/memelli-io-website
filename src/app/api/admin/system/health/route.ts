// GET /api/admin/system/health
// Combined health snapshot proxying:
//   - https://agent-runner.memelli.io/health
//   - https://api.memelli.io/health
// Plus DB-side supervisor heartbeat freshness, if available.
// Read-only. Server-side fetch so the browser doesn't hit the upstreams directly.

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/groq-chat-db";
import { authedOrNull } from "@/lib/groq-chat-auth";

interface ServiceCheck {
  name: string;
  url: string;
  ok: boolean;
  status: number;
  latencyMs: number;
  body: unknown;
  error?: string;
}

const SERVICES: { name: string; url: string }[] = [
  { name: "agent-runner", url: "https://agent-runner.memelli.io/health" },
  { name: "api", url: "https://api.memelli.io/health" },
  { name: "groq-service", url: "https://api.memelli.io/api/groq/health" },
];

async function check(svc: { name: string; url: string }): Promise<ServiceCheck> {
  const t0 = Date.now();
  try {
    const res = await fetch(svc.url, {
      method: "GET",
      cache: "no-store",
      // Short timeout so a stuck service doesn't hold the whole snapshot.
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = text.slice(0, 1000);
    }
    return {
      name: svc.name,
      url: svc.url,
      ok: res.ok,
      status: res.status,
      latencyMs: Date.now() - t0,
      body,
    };
  } catch (err) {
    return {
      name: svc.name,
      url: svc.url,
      ok: false,
      status: 0,
      latencyMs: Date.now() - t0,
      body: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

interface HeartbeatRow {
  agent_id: string | null;
  name: string | null;
  health: string | null;
  last_heartbeat: Date | null;
  age_seconds: number | null;
}

export async function GET(req: NextRequest) {
  const user = await authedOrNull(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const services = await Promise.all(SERVICES.map(check));

  // Best-effort DB-side supervisor freshness: try common heartbeat tables.
  // If nothing found, leave the array empty — UI shows just the upstream cards.
  let heartbeats: HeartbeatRow[] = [];
  try {
    const exists = await q<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema='public' AND table_name='agent_registrations' LIMIT 1`
    );
    if (exists.length > 0) {
      heartbeats = await q<HeartbeatRow>(
        `SELECT
           "agentId" AS agent_id,
           name,
           health,
           "lastHeartbeat" AS last_heartbeat,
           EXTRACT(EPOCH FROM (NOW() - "lastHeartbeat"))::int AS age_seconds
         FROM agent_registrations
         WHERE "lastHeartbeat" IS NOT NULL
         ORDER BY "lastHeartbeat" DESC
         LIMIT 20`
      );
    }
  } catch {
    // soft-skip
  }

  return NextResponse.json({
    services,
    heartbeats,
    fetchedAt: new Date().toISOString(),
  });
}
