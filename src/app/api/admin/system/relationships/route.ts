// GET /api/admin/system/relationships
// Returns the full role_relationships table.
// Read-only.

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/groq-chat-db";
import { authedOrNull } from "@/lib/groq-chat-auth";

export async function GET(req: NextRequest) {
  const user = await authedOrNull(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await q(
    `SELECT id, from_role, to_role, can_communicate, scope, notes, authority, locked_at
     FROM role_relationships
     WHERE archived_at IS NULL
     ORDER BY from_role ASC, can_communicate DESC, to_role ASC`
  );
  return NextResponse.json({ relationships: rows });
}
