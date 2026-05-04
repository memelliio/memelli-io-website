// GET /api/admin/system/lanes/:lane/packets
// Recent packets for a single lane.
// Lane name is either a work_orders.taskType OR the literal "development_packets".
// Read-only.

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/groq-chat-db";
import { authedOrNull } from "@/lib/groq-chat-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ lane: string }> }) {
  const user = await authedOrNull(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { lane } = await params;
  if (!lane) return NextResponse.json({ error: "lane required" }, { status: 400 });

  if (lane === "development_packets") {
    const rows = await q(
      `SELECT id, target_repo, target_branch, subject, status, retries, claimed_by,
              enqueued_at, claimed_at, completed_at, error_text
       FROM development_packets
       ORDER BY enqueued_at DESC NULLS LAST
       LIMIT 50`
    );
    return NextResponse.json({ lane, source: "development_packets", packets: rows });
  }

  // Default: read from work_orders
  const rows = await q(
    `SELECT id, "taskType", status::text AS status, priority::text AS priority,
            "goalSummary", "resultSummary", "errorSummary",
            "startedAt", "completedAt", "createdAt"
     FROM work_orders
     WHERE "taskType" = $1
     ORDER BY "createdAt" DESC
     LIMIT 50`,
    [lane]
  );
  return NextResponse.json({ lane, source: "work_orders", packets: rows });
}
