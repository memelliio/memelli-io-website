// GET /api/admin/system/modules/:module/sections
// Returns the 14 sections of the canonical module-doctrine schema for a module.
// Each section is a list of rows from one of the module_* tables.
// Read-only. Empty sections render as "No data yet" gracefully on the client.

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/groq-chat-db";
import { authedOrNull } from "@/lib/groq-chat-auth";

interface SectionDef {
  key: string;
  label: string;
  table: string;
  columns: string[];
  filterByModule: boolean; // false for module_authority (uses module_key)
  moduleColumn?: string;
}

// Locked schema. New module_* tables get added here in one place.
const SECTIONS: SectionDef[] = [
  {
    key: "identity",
    label: "Identity",
    table: "module_identity",
    columns: ["entry_order", "purpose", "owner_team", "created_at"],
    filterByModule: true,
  },
  {
    key: "authority",
    label: "Authority",
    table: "module_authority",
    columns: [
      "purpose",
      "authority_scopes",
      "client_access_mode",
      "partner_whitelabel",
      "owner_lane",
      "required_role",
      "required_plans",
      "derived_from",
    ],
    filterByModule: false,
    moduleColumn: "module_key",
  },
  {
    key: "design_laws",
    label: "Design laws",
    table: "module_design_laws",
    columns: ["entry_order", "law", "applies_to"],
    filterByModule: true,
  },
  {
    key: "dos",
    label: "Dos",
    table: "module_dos",
    columns: ["entry_order", "rule", "rationale"],
    filterByModule: true,
  },
  {
    key: "donts",
    label: "Don'ts",
    table: "module_donts",
    columns: ["entry_order", "rule", "rationale"],
    filterByModule: true,
  },
  {
    key: "roles",
    label: "Roles",
    table: "module_roles",
    columns: ["role_name", "can_read", "can_write", "can_trigger", "dto_filter", "notes"],
    filterByModule: true,
  },
  {
    key: "dependencies",
    label: "Dependencies",
    table: "module_dependencies",
    columns: ["dep_kind", "dep_name", "purpose", "failure_mode_if_missing"],
    filterByModule: true,
  },
  {
    key: "health",
    label: "Health metrics",
    table: "module_health",
    columns: ["metric_name", "endpoint", "alert_threshold", "expected_shape"],
    filterByModule: true,
  },
  {
    key: "automations",
    label: "Automations",
    table: "module_automations",
    columns: ["supervisor_name", "claim_query", "description", "default_cadence_min"],
    filterByModule: true,
  },
  {
    key: "improvements",
    label: "Improvements",
    table: "module_improvements",
    columns: ["proposal", "priority", "default_review_days"],
    filterByModule: true,
  },
  {
    key: "maintenance",
    label: "Maintenance",
    table: "module_maintenance",
    columns: ["sweep_name", "description", "default_cadence_min"],
    filterByModule: true,
  },
  {
    key: "patches",
    label: "Patches",
    table: "module_patches",
    columns: ["taskkey", "summary", "fix", "confidence"],
    filterByModule: true,
  },
  {
    key: "schema_columns",
    label: "Schema columns",
    table: "module_schema_columns",
    columns: ["column_name", "data_type", "nullable", "default_value", "is_index", "notes"],
    filterByModule: true,
  },
  {
    key: "secrets_refs",
    label: "Secrets refs",
    table: "module_secrets_refs",
    columns: ["secret_name", "source_table", "purpose"],
    filterByModule: true,
  },
  {
    key: "triggers",
    label: "Triggers",
    table: "module_triggers",
    columns: ["trigger_kind", "description", "payload_shape"],
    filterByModule: true,
  },
];

function quoted(col: string): string {
  // entry_order is unquoted in DB; keep all other lowercase_snake unquoted too.
  return col.includes('"') ? col : `"${col}"`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ module: string }> }) {
  const user = await authedOrNull(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { module } = await params;
  if (!module) return NextResponse.json({ error: "module required" }, { status: 400 });

  const sections: { key: string; label: string; rows: unknown[] }[] = [];

  for (const def of SECTIONS) {
    const colSql = def.columns.map(quoted).join(", ");
    const moduleCol = def.filterByModule ? "module" : (def.moduleColumn ?? "module_key");
    const archivedFilter = def.filterByModule ? "AND archived_at IS NULL" : "";
    const orderBy = def.filterByModule ? "ORDER BY entry_order ASC" : "";
    const sql = `SELECT ${colSql} FROM "${def.table}" WHERE "${moduleCol}" = $1 ${archivedFilter} ${orderBy} LIMIT 200`;

    try {
      const rows = await q<Record<string, unknown>>(sql, [module]);
      sections.push({ key: def.key, label: def.label, rows });
    } catch (err) {
      sections.push({
        key: def.key,
        label: def.label,
        rows: [],
        // Bubble the error so the UI can show "section unavailable" instead of failing the whole tab.
        // @ts-expect-error optional augment
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ module, sections });
}
