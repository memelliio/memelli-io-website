// GET /api/admin/system/roles/:role/relationships
// Returns role_relationships rows where from_role = :role.
// Read-only.

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/groq-chat-db";
import { authedOrNull } from "@/lib/groq-chat-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ role: string }> }) {
  const user = await authedOrNull(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { role } = await params;
  if (!role) return NextResponse.json({ error: "role required" }, { status: 400 });

  const rows = await q(
    `SELECT id, from_role, to_role, can_communicate, scope, notes, authority, locked_at
     FROM role_relationships
     WHERE from_role = $1 AND archived_at IS NULL
     ORDER BY can_communicate DESC, to_role ASC`,
    [role]
  );
  return NextResponse.json({ from: role, relationships: rows });
}
