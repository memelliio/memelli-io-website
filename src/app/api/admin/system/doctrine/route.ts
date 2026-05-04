// GET /api/admin/system/doctrine
// Returns:
//   1. system_operating_rules (locked operating rules)
//   2. Doctrine MD docs from groq_corpus tagged 'critical-law' OR matching the
//      6 named doctrine doc paths.
// Read-only.

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/groq-chat-db";
import { authedOrNull } from "@/lib/groq-chat-auth";

const DOCTRINE_DOC_PATTERNS = [
  "%PLATFORM_IDENTITY%",
  "%MODULE_TEMPLATE_DOCTRINE%",
  "%DEPLOYMENT_LANE%",
  "%CREDIT_MODULE%",
  "%PREQUAL_MODULE%",
  "%DB_RESIDENT%",
  "%DEV_LANE%",
  "%WORKFLOW_LANE%",
];

interface RuleRow {
  id: string;
  rule_key: string;
  category: string;
  rule: string;
  why: string | null;
  how_to_apply: string | null;
  authority: string | null;
  locked_at: string | null;
}

interface DocRow {
  path: string;
  contentKind: string;
  content: string;
  tags: string[] | null;
  updatedAt: string | null;
}

export async function GET(req: NextRequest) {
  const user = await authedOrNull(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rules = await q<RuleRow>(
    `SELECT id, rule_key, category, rule, why, how_to_apply, authority, locked_at
     FROM system_operating_rules
     WHERE archived_at IS NULL
     ORDER BY category ASC, rule_key ASC`
  );

  // Build LIKE clause for the named patterns
  const likeClauses = DOCTRINE_DOC_PATTERNS.map((_p, i) => `path ILIKE $${i + 1}`).join(" OR ");
  const docsByPath = await q<DocRow>(
    `SELECT path, "contentKind", content, tags, "updatedAt"
     FROM groq_corpus
     WHERE ${likeClauses}
     ORDER BY path ASC`,
    DOCTRINE_DOC_PATTERNS
  );

  // Also pick up anything tagged 'critical-law' that wasn't already matched
  const seen = new Set(docsByPath.map((d) => d.path));
  const taggedDocs = await q<DocRow>(
    `SELECT path, "contentKind", content, tags, "updatedAt"
     FROM groq_corpus
     WHERE 'critical-law' = ANY(tags)
     ORDER BY path ASC`
  );
  const extra = taggedDocs.filter((d) => !seen.has(d.path));

  return NextResponse.json({
    rules,
    docs: [...docsByPath, ...extra],
  });
}
