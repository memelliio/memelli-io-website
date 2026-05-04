// Admin chat thread list + create.
// Auth: SUPER_ADMIN JWT Bearer token.
// Storage: groq_chat_threads via raw SQL (Prisma client model cache lags
// behind schema.prisma until @memelli/db is rebuilt — raw SQL is robust).
//
// GET  /api/admin/chat/threads          → operator's threads, newest first
// POST /api/admin/chat/threads          → { title?: string, target?: string } → new thread row

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/groq-chat-db";
import { authedOrNull } from "@/lib/groq-chat-auth";

interface ThreadRow {
  id: string;
  ownerId: string;
  title: string;
  target: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(req: NextRequest) {
  const user = await authedOrNull(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ownerId = user.id ?? user.sub;
  if (!ownerId) return NextResponse.json({ error: "no user id in token" }, { status: 401 });

  const threads = await q<ThreadRow>(
    `SELECT id, "ownerId", title, target, "createdAt", "updatedAt"
     FROM groq_chat_threads
     WHERE "ownerId" = $1::uuid
     ORDER BY "updatedAt" DESC
     LIMIT 100`,
    [ownerId]
  );
  return NextResponse.json({ threads });
}

export async function POST(req: NextRequest) {
  const user = await authedOrNull(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ownerId = user.id ?? user.sub;
  if (!ownerId) return NextResponse.json({ error: "no user id in token" }, { status: 401 });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "New conversation";
  const target = typeof body.target === "string" && body.target ? body.target : "claude";

  const rows = await q<ThreadRow>(
    `INSERT INTO groq_chat_threads ("ownerId", title, target)
     VALUES ($1::uuid, $2, $3)
     RETURNING id, "ownerId", title, target, "createdAt", "updatedAt"`,
    [ownerId, title, target]
  );
  return NextResponse.json({ thread: rows[0] });
}
