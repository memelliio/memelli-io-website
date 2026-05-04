// GET /api/melli/persona?partner_id=...
// Returns the persona kernel_object for the partner, falling back to default Memelli persona.

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/groq-chat-db";

const PLATFORM_TENANT = "98c1ecb7-6ad1-4349-96e3-5743198bee29";

export async function GET(req: NextRequest) {
  const partnerId = req.nextUrl.searchParams.get("partner_id");

  if (partnerId) {
    const rows = await q<{ id: string; metadata: Record<string, unknown> }>(
      `SELECT id, metadata FROM kernel_objects
       WHERE object_type='persona' AND tenant_id=$1::uuid
         AND metadata->>'partner_id'=$2 AND deleted_at IS NULL
       ORDER BY updated_at DESC LIMIT 1`,
      [PLATFORM_TENANT, partnerId],
    );
    if (rows[0]) return NextResponse.json({ ok: true, persona: rows[0].metadata });
  }

  // Default Memelli
  const def = await q<{ id: string; metadata: Record<string, unknown> }>(
    `SELECT id, metadata FROM kernel_objects
     WHERE object_type='persona' AND tenant_id=$1::uuid
       AND (metadata->>'partner_id' IS NULL OR metadata->>'partner_id'='')
       AND deleted_at IS NULL
     ORDER BY updated_at DESC LIMIT 1`,
    [PLATFORM_TENANT],
  );
  return NextResponse.json({
    ok: true,
    persona:
      def[0]?.metadata ?? {
        name: "Memelli",
        greeting: "Hey, what would you like me to do?",
        tone: "calm, helpful, concise",
        brand_color: "#C41E3A",
        partner_id: null,
      },
  });
}
