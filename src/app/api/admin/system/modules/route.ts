// GET /api/admin/system/modules
// Returns distinct module values across all 14 module_* DB tables.
// Read-only. Used by the operator system-explorer's Modules tab.

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/groq-chat-db";
import { authedOrNull } from "@/lib/groq-chat-auth";

const MODULE_TABLES = [
  "module_identity",
  "module_design_laws",
  "module_dos",
  "module_donts",
  "module_roles",
  "module_dependencies",
  "module_health",
  "module_automations",
  "module_improvements",
  "module_maintenance",
  "module_patches",
  "module_schema_columns",
  "module_secrets_refs",
  "module_triggers",
];

export async function GET(req: NextRequest) {
  const user = await authedOrNull(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Union the distinct module values from each module_* table.
  // module_authority lives on a different column (module_key) — include it too.
  const unions = MODULE_TABLES.map(
    (t) => `SELECT DISTINCT module FROM "${t}" WHERE archived_at IS NULL AND module IS NOT NULL`
  );
  unions.push(`SELECT DISTINCT module_key AS module FROM module_authority WHERE module_key IS NOT NULL`);
  const sql = unions.join(" UNION ") + " ORDER BY 1";

  try {
    const rows = await q<{ module: string }>(sql);
    return NextResponse.json({ modules: rows.map((r) => r.module) });
  } catch (err) {
    return NextResponse.json(
      { error: "db_failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
