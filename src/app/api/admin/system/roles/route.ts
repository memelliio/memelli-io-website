// GET /api/admin/system/roles
// Returns role_identity rows ordered by layer_num.
// Read-only.

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/groq-chat-db";
import { authedOrNull } from "@/lib/groq-chat-auth";

interface RoleRow {
  id: string;
  role_name: string;
  layer_num: number;
  identity: string;
  full_message: string | null;
  authority: string | null;
  locked_at: string | null;
}

export async function GET(req: NextRequest) {
  const user = await authedOrNull(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await q<RoleRow>(
    `SELECT id, role_name, layer_num, identity, full_message, authority, locked_at
     FROM role_identity
     WHERE archived_at IS NULL
     ORDER BY layer_num ASC, role_name ASC`
  );
  return NextResponse.json({ roles: rows });
}
