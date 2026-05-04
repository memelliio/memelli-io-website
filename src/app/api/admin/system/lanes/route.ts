// GET /api/admin/system/lanes
// Per-lane summary: queue depth, in-flight, last-5 outcomes.
// Lanes are grouped by work_orders.taskType + the development_packets table.
// Read-only.

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/groq-chat-db";
import { authedOrNull } from "@/lib/groq-chat-auth";

interface LaneSummary {
  lane: string;
  source: "work_orders" | "development_packets";
  queued: number;
  inFlight: number;
  succeeded: number;
  failed: number;
  total: number;
  lastFiveOutcomes: { id: string; status: string; createdAt: string; summary: string | null }[];
}

export async function GET(req: NextRequest) {
  const user = await authedOrNull(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const lanes: LaneSummary[] = [];

  // ── work_orders lanes (grouped by taskType) ──────────────────────────────
  const taskTypeRows = await q<{ taskType: string }>(
    `SELECT DISTINCT "taskType" FROM work_orders WHERE "taskType" IS NOT NULL ORDER BY "taskType"`
  );

  for (const { taskType } of taskTypeRows) {
    const counts = await q<{ status: string; n: number }>(
      `SELECT status::text, COUNT(*)::int AS n FROM work_orders WHERE "taskType" = $1 GROUP BY status`,
      [taskType]
    );
    const byStatus: Record<string, number> = {};
    for (const c of counts) byStatus[c.status] = c.n;

    const last5 = await q<{ id: string; status: string; createdAt: Date; resultSummary: string | null }>(
      `SELECT id, status::text, "createdAt", "resultSummary"
       FROM work_orders WHERE "taskType" = $1
       ORDER BY "createdAt" DESC LIMIT 5`,
      [taskType]
    );

    lanes.push({
      lane: taskType,
      source: "work_orders",
      queued: (byStatus["QUEUED"] ?? 0) + (byStatus["PENDING"] ?? 0),
      inFlight: (byStatus["IN_PROGRESS"] ?? 0) + (byStatus["RUNNING"] ?? 0) + (byStatus["CLAIMED"] ?? 0),
      succeeded: (byStatus["COMPLETED"] ?? 0) + (byStatus["SUCCESS"] ?? 0),
      failed: (byStatus["FAILED"] ?? 0) + (byStatus["ERROR"] ?? 0),
      total: Object.values(byStatus).reduce((a, b) => a + b, 0),
      lastFiveOutcomes: last5.map((r) => ({
        id: r.id,
        status: r.status,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        summary: r.resultSummary,
      })),
    });
  }

  // ── development_packets lane ─────────────────────────────────────────────
  try {
    const dpCounts = await q<{ status: string; n: number }>(
      `SELECT status, COUNT(*)::int AS n FROM development_packets GROUP BY status`
    );
    const byStatus: Record<string, number> = {};
    for (const c of dpCounts) byStatus[c.status] = c.n;

    const last5 = await q<{ id: string; status: string; enqueued_at: Date | null; subject: string | null }>(
      `SELECT id, status, enqueued_at, subject
       FROM development_packets
       ORDER BY enqueued_at DESC NULLS LAST LIMIT 5`
    );

    lanes.push({
      lane: "development_packets",
      source: "development_packets",
      queued: (byStatus["QUEUED"] ?? 0) + (byStatus["PENDING"] ?? 0),
      inFlight: (byStatus["RUNNING"] ?? 0) + (byStatus["CLAIMED"] ?? 0),
      succeeded: (byStatus["COMPLETED"] ?? 0) + (byStatus["SUCCESS"] ?? 0),
      failed: (byStatus["FAILED"] ?? 0) + (byStatus["ERROR"] ?? 0),
      total: Object.values(byStatus).reduce((a, b) => a + b, 0),
      lastFiveOutcomes: last5.map((r) => ({
        id: r.id,
        status: r.status,
        createdAt:
          r.enqueued_at instanceof Date ? r.enqueued_at.toISOString() : String(r.enqueued_at ?? ""),
        summary: r.subject,
      })),
    });
  } catch {
    // table may not exist in some envs — soft-skip
  }

  return NextResponse.json({ lanes });
}
