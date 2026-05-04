// Per-thread message history + send.
// Auth: SUPER_ADMIN JWT Bearer.
// Storage: groq_chat_history (raw SQL — see threads/route.ts for rationale).
//
// GET  /api/admin/chat/threads/:id/messages
//      → messages for the thread, oldest first
//
// POST /api/admin/chat/threads/:id/messages
//      body: { content: string, target?: 'claude' | 'groq' | 'groq:<team>' }
//      target='groq:mellibar' routes to askMelliBar (Groq backend, MelliBar
//      system prompt — navigation-aware, action-oriented, terse).
//      flow: write operator row → call LLM → write response row → return both
//
// V1: synchronous LLM call inline (no chat-message-supervisor yet).
// Stage 2: a separate supervisor in agent-runner picks up status='PENDING'
// rows from groq_chat_history and writes responses, freeing the request thread.

import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { q, pool } from "@/lib/groq-chat-db";
import { authedOrNull } from "@/lib/groq-chat-auth";

const ORIGIN = "memelli.io-admin-chat";

interface MessageRow {
  id: string;
  threadId: string;
  direction: string;
  origin: string;
  content: string;
  contextRefs: string[];
  status: string;
  meta: Record<string, unknown>;
  createdAt: Date;
  processedAt: Date | null;
  errorMessage: string | null;
}

interface ThreadRow {
  id: string;
  ownerId: string;
  title: string;
  target: string;
  createdAt: Date;
  updatedAt: Date;
}

async function ownThreadOrNull(threadId: string, ownerId: string): Promise<ThreadRow | null> {
  const rows = await q<ThreadRow>(
    `SELECT id, "ownerId", title, target, "createdAt", "updatedAt"
     FROM groq_chat_threads WHERE id = $1::uuid AND "ownerId" = $2::uuid LIMIT 1`,
    [threadId, ownerId]
  );
  return rows[0] ?? null;
}

// ─── LLM clients ─────────────────────────────────────────────────────────────

interface LlmReply {
  content: string;
  meta: Record<string, unknown>;
}

const GROQ_DEFAULT_SYSTEM =
  "You are the Memelli.io master supervisor — the operator's primary AI agent inside the Memelli.io Terminal. " +
  "Your job: execute operator commands across the entire Memelli platform via tool calls. " +
  "You can read the DB, list modules + standalones, write files to memelliio standalone repos, and dispatch async work. " +
  "When the operator gives a goal: decide which tools to call, call them, return a tight summary of what you did and the result. " +
  "Stay terse. Action over prose. Skip preamble. The operator values progress.";

// MelliBar — Groq backend, distinct system prompt. Navigation-aware,
// action-oriented, terse. Per locked operator directive 2026-04-30:
// "MelliBar can read from the code everything … the Groq agent that's
// actually in the terminal." This is the conversational surface for the
// terminal-resident MelliBar agent.
const MELLIBAR_SYSTEM =
  "You are the MelliBar — the user's persistent navigation + updates surface. " +
  "You read the locked doctrine + role identity + role relationships + module structure on every dispatch. " +
  "When the user asks to open a module / go somewhere / take an action, you describe the next step + flag what the system can do. " +
  "Stay terse. Action-oriented. Skip prose.";

// Groq compound-mini tool definitions — what the master supervisor can do.
const GROQ_TOOLS = [
  {
    type: "function",
    function: {
      name: "query_db",
      description: "Read-only SQL query against the memelli database. Use for any SELECT — modules, standalones, work_orders, doctrine, patches, chat history. Wrapped in BEGIN READ ONLY so writes are rejected.",
      parameters: { type: "object", properties: { sql: { type: "string", description: "PostgreSQL SELECT statement" } }, required: ["sql"] },
    },
  },
  {
    type: "function",
    function: {
      name: "write_db",
      description: "Write SQL against the memelli database — INSERT / UPDATE / DELETE / DDL. Use to update operator-locked rules in system_operating_rules, edit module_* doctrine, INSERT work_orders, update module_persona, etc. NOT allowed on service_keys (encrypted secrets — separate workflow). Each call runs in its own transaction and is committed on success.",
      parameters: {
        type: "object",
        properties: {
          sql: { type: "string", description: "PostgreSQL DML/DDL statement (INSERT/UPDATE/DELETE/CREATE/ALTER). Multi-statement scripts allowed via semicolons." },
        },
        required: ["sql"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_modules",
      description: "List all 108 workspace modules with their key, name, route_path, and enabled state.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_standalones",
      description: "List all 55 Railway standalone projects with project name and id.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Write a file to a memelliio standalone repo via the live api.memelli.io/api/groq/write-file endpoint. Use repo='standalone:memelliio/<name>' for standalones, or 'monorepo' for the local apps.",
      parameters: {
        type: "object",
        properties: {
          repo: { type: "string", description: "Target repo, e.g. 'standalone:memelliio/memelli-crm-service'" },
          path: { type: "string", description: "File path within repo" },
          content: { type: "string", description: "Full file content" },
          message: { type: "string", description: "Commit message" },
        },
        required: ["repo", "path", "content", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "dispatch_subtask",
      description: "**You are the master in this chat — you execute, not delegate.** This tool inserts a generic taskType='task' row into work_orders. Real autonomous lanes use SPECIFIC taskTypes already in the table (`module_deploy_packet`, `repair_patch`, `service_route_repair`, `module_followup`, `fix_request_packet`) which their dedicated supervisors claim — those are NOT what dispatch_subtask creates. Use this ONLY for: (a) genuinely fire-and-forget background research/scan work that doesn't need a reply, OR (b) explicit operator handoffs to a named off-chat worker. For ANY multi-step build/edit/refactor: do it yourself across your tool calls — your iteration cap is high (1000) and you have search_files + write_file + write_db + commit + deploy_railway_service. Don't queue work hoping someone else picks it up. There usually isn't 'someone else'.",
      parameters: {
        type: "object",
        properties: {
          taskDescription: { type: "string", description: "What an off-chat worker should accomplish. Self-contained — the worker won't see this conversation." },
          priority: { type: "string", enum: ["LOW", "NORMAL", "HIGH", "CRITICAL"], description: "Default NORMAL" },
        },
        required: ["taskDescription"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_files",
      description: "Search code in a memelliio standalone repo for a regex pattern via GitHub code-search API. Returns file paths + line snippets that match. Use this BEFORE write_file when you need to find references.",
      parameters: {
        type: "object",
        properties: {
          repo: { type: "string", description: "Repo full name, e.g. 'memelliio/memelli-prozilla-os'" },
          pattern: { type: "string", description: "Search query (GitHub code-search syntax — e.g. 'memelli-prozilla-os', 'function.*foo')" },
        },
        required: ["repo", "pattern"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "rename_github_repo",
      description: "Rename a GitHub repo. Owner stays the same, only the repo name changes. Caller is responsible for confirming destructive intent (rename breaks all clone URLs + may invalidate webhooks until updated).",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub org/user (typically 'memelliio')" },
          oldName: { type: "string", description: "Current repo name (e.g. 'memelli-prozilla-os')" },
          newName: { type: "string", description: "Target repo name (e.g. 'memelli-os')" },
        },
        required: ["owner", "oldName", "newName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_supervisors",
      description: "Get current state of agent-runner supervisors — heartbeat freshness, cycle counts, last error per supervisor. Use to answer 'what's running' or before dispatching async work.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_work_orders",
      description: "List recent work_orders with their status. Use to answer 'what's queued', 'is the queue stuck', 'show me what's processing'.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status: QUEUED, IN_PROGRESS, COMPLETED, FAILED, CANCELLED. Optional." },
          limit: { type: "number", description: "Max rows (default 20)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recent_failures",
      description: "Show recent FAILED work_orders or chat turns. Use to answer 'what's broken', 'recent errors'.",
      parameters: {
        type: "object",
        properties: { limit: { type: "number", description: "Max rows (default 10)" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "deploy_railway_service",
      description: "Trigger a Railway deploy on a service's latest commit. Returns the deployment ID. Use when operator says 'deploy X' / 'redeploy X'.",
      parameters: {
        type: "object",
        properties: {
          serviceId: { type: "string", description: "Railway service UUID" },
          environmentId: { type: "string", description: "Railway environment UUID (production or dev)" },
          commitSha: { type: "string", description: "Optional specific commit SHA. If omitted, uses latest on tracked branch." },
        },
        required: ["serviceId", "environmentId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "rename_railway_project",
      description: "Rename a Railway project. Uses projectUpdate mutation. Won't change project ID or service domains, only the display name.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "Railway project UUID" },
          newName: { type: "string", description: "New display name" },
        },
        required: ["projectId", "newName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "http_fetch",
      description: "Fetch an arbitrary URL via HTTP(S). Use to probe service /health endpoints, hit Railway/GitHub APIs not already wrapped, verify deployments. Returns {status, headers, body (truncated to 100000 chars), bodyJson if parseable}. Method defaults to GET. Pass headers/body for POST/PUT/PATCH/DELETE.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "Full URL e.g. https://memelli-crm-service-dev.up.railway.app/health" },
          method: { type: "string", description: "GET / POST / PUT / PATCH / DELETE / HEAD. Default GET." },
          headers: { type: "object", description: "Optional header map, e.g. {\"Content-Type\":\"application/json\"}" },
          body: { type: "string", description: "Optional request body (string; JSON-stringify it yourself)" },
          timeout_ms: { type: "number", description: "Default 10000ms. Max 30000ms." },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_repo_file",
      description: "Read a single file from a memelliio GitHub repo. Decrypts GITHUB_TOKEN from service_keys internally. Returns {ok, path, content (full, no truncation), sha, size}. Use to pull the canonical hot-load bundle, server entry files, etc. before write_file'ing parity into another repo.",
      parameters: {
        type: "object",
        properties: {
          repo: { type: "string", description: "Repo full name e.g. 'memelliio/memelli-analytics-service'" },
          path: { type: "string", description: "File path within repo e.g. 'src/hot-load-connectors.bundle.ts'" },
          ref: { type: "string", description: "Branch/SHA to read from. Default 'main'." },
        },
        required: ["repo", "path"],
      },
    },
  },
];

// Helper: decrypt a service_keys value
async function decryptServiceKey(name: string): Promise<string | null> {
  try {
    const r = await q<{ value_encrypted: string; encryption_iv: string }>(
      `SELECT value_encrypted, encryption_iv FROM service_keys WHERE key_name = $1 AND archived_at IS NULL ORDER BY created_at DESC LIMIT 1`,
      [name]
    );
    if (!r[0]) return null;
    const { createDecipheriv, createHash } = await import("node:crypto");
    const masterKey = createHash("sha256").update("d7539691d39c270994d2480dbeafae5d0c59c830169210173d681404af6498fb", "utf8").digest();
    const blob = Buffer.from(r[0].value_encrypted, "base64");
    const decipher = createDecipheriv("aes-256-gcm", masterKey, Buffer.from(r[0].encryption_iv, "base64"));
    decipher.setAuthTag(blob.subarray(blob.length - 16));
    return Buffer.concat([decipher.update(blob.subarray(0, blob.length - 16)), decipher.final()]).toString("utf8");
  } catch { return null; }
}

async function execTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  if (name === "query_db") {
    const sql = String(args.sql ?? "");
    const client = await pool().connect();
    try {
      await client.query("BEGIN READ ONLY");
      const r = await client.query(sql);
      await client.query("ROLLBACK");
      return { rows: r.rows, rowCount: r.rowCount };
    } catch (e) {
      try { await client.query("ROLLBACK"); } catch {}
      return { error: e instanceof Error ? e.message : String(e) };
    } finally {
      client.release();
    }
  }
  if (name === "write_db") {
    const sql = String(args.sql ?? "");
    // Block service_keys writes — encrypted secrets have their own rotate flow.
    if (/\b(?:into|update|from|table)\s+(?:"?service_keys"?)\b/i.test(sql) || /\bservice_keys\b/.test(sql) && /(?:INSERT|UPDATE|DELETE|TRUNCATE|DROP|ALTER)/i.test(sql)) {
      return { error: "service_keys writes are blocked here — use the dedicated rotate flow." };
    }
    const client = await pool().connect();
    try {
      await client.query("BEGIN");
      const r = await client.query(sql);
      await client.query("COMMIT");
      const rows = Array.isArray(r) ? r.map(x => ({ command: x.command, rowCount: x.rowCount, rows: x.rows })) : { command: r.command, rowCount: r.rowCount, rows: r.rows };
      return { ok: true, result: rows };
    } catch (e) {
      try { await client.query("ROLLBACK"); } catch {}
      return { error: e instanceof Error ? e.message : String(e) };
    } finally {
      client.release();
    }
  }
  if (name === "list_modules") {
    const r = await q<{ module_key: string; module_name: string; route_path: string; is_enabled: boolean }>(
      `SELECT module_key, module_name, route_path, is_enabled FROM workspace_modules ORDER BY module_key`
    );
    return { count: r.length, modules: r };
  }
  if (name === "list_standalones") {
    const r = await q<{ name: string; railway_project_id: string | null }>(
      `SELECT module AS name, NULL AS railway_project_id FROM module_identity ORDER BY module`
    );
    return { count: r.length, standalones: r, note: "Source: module_identity. For full Railway project list query Railway GraphQL via the relay." };
  }
  if (name === "write_file") {
    const tok = process.env.INTERNAL_SERVICE_TOKEN;
    if (!tok) return { error: "INTERNAL_SERVICE_TOKEN not in env on local web server" };
    const res = await fetch("https://api.memelli.io/api/groq/write-file", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
      body: JSON.stringify(args),
    });
    return await res.json().catch(() => ({ status: res.status, error: "non-json response" }));
  }
  if (name === "dispatch_subtask") {
    const desc = String(args.taskDescription ?? "");
    const priority = (typeof args.priority === "string" ? args.priority : "NORMAL").toUpperCase();
    const r = await q<{ id: string }>(
      `INSERT INTO work_orders (id, "tenantId", "taskType", status, priority, "createdAt", "updatedAt", metadata, "goalSummary")
       VALUES (gen_random_uuid(), '6e92ec7d-845a-4687-b87b-266c99b0bbb6', 'task', 'QUEUED', $1::"WorkOrderPriority", NOW(), NOW(), $2::jsonb, $3)
       RETURNING id`,
      [priority, JSON.stringify({ payload: { task: desc } }), desc.slice(0, 200)]
    );
    return {
      dispatched: true,
      work_order_id: r[0].id,
      taskType: "task",
      note: "Row queued in work_orders. No claim ETA promised — generic taskType='task' is not on a dedicated supervisor lane. Operator may still need to surface this manually.",
    };
  }
  if (name === "search_files") {
    const repo = String(args.repo ?? "");
    const pattern = String(args.pattern ?? "");
    const tok = await decryptServiceKey("GITHUB_TOKEN");
    if (!tok) return { error: "GITHUB_TOKEN not in service_keys" };
    const url = `https://api.github.com/search/code?q=${encodeURIComponent(pattern + ' repo:' + repo)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${tok}`, Accept: "application/vnd.github+json" } });
    if (!res.ok) return { error: `GitHub search ${res.status}: ${(await res.text()).slice(0, 200)}` };
    const data = await res.json();
    const matches = (data.items || []).map((i: { path: string; url: string }) => ({ path: i.path, url: i.url }));
    return { total: data.total_count, matches };
  }
  if (name === "rename_github_repo") {
    const owner = String(args.owner ?? "");
    const oldName = String(args.oldName ?? "");
    const newName = String(args.newName ?? "");
    const tok = await decryptServiceKey("GITHUB_TOKEN");
    if (!tok) return { error: "GITHUB_TOKEN not in service_keys" };
    const res = await fetch(`https://api.github.com/repos/${owner}/${oldName}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tok}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const body = await res.text();
    if (!res.ok) return { error: `GitHub rename ${res.status}: ${body.slice(0, 300)}` };
    let parsed: unknown = body; try { parsed = JSON.parse(body); } catch {}
    const result = parsed as { full_name?: string; html_url?: string };
    return { ok: true, full_name: result?.full_name, html_url: result?.html_url };
  }
  if (name === "check_supervisors") {
    const r = await q<{ name: string; lastHeartbeat: Date; health: string }>(
      `SELECT name, "lastHeartbeat", health FROM agent_registrations
       WHERE name LIKE '%supervisor%' OR name LIKE '%-lane%' OR name LIKE '%-executor%' OR name LIKE '%route-scan%'
       ORDER BY "lastHeartbeat" DESC NULLS LAST`
    );
    const now = Date.now();
    const summary = r.map((row) => ({
      supervisor: row.name,
      last_heartbeat: row.lastHeartbeat,
      seconds_ago: row.lastHeartbeat ? Math.floor((now - new Date(row.lastHeartbeat).getTime()) / 1000) : null,
      health: row.health,
    }));
    return { count: r.length, supervisors: summary };
  }
  if (name === "list_work_orders") {
    const status = typeof args.status === "string" ? args.status : null;
    const limit = typeof args.limit === "number" ? Math.min(args.limit, 100) : 20;
    const params: unknown[] = [limit];
    let where = "";
    if (status) { params.push(status); where = `WHERE status = $2`; }
    const r = await q<{ id: string; status: string; taskType: string; goalSummary: string; createdAt: Date; updatedAt: Date }>(
      `SELECT id, status, "taskType", "goalSummary", "createdAt", "updatedAt" FROM work_orders ${where} ORDER BY "createdAt" DESC LIMIT $1::int`,
      params
    );
    return { count: r.length, work_orders: r };
  }
  if (name === "list_recent_failures") {
    const limit = typeof args.limit === "number" ? Math.min(args.limit, 50) : 10;
    const wo = await q<{ id: string; goalSummary: string; createdAt: Date }>(
      `SELECT id, "goalSummary", "createdAt" FROM work_orders WHERE status = 'FAILED' ORDER BY "createdAt" DESC LIMIT $1::int`,
      [limit]
    );
    const chats = await q<{ id: string; direction: string; content: string; errorMessage: string; createdAt: Date }>(
      `SELECT id, direction, content, "errorMessage", "createdAt" FROM groq_chat_history WHERE status = 'FAILED' ORDER BY "createdAt" DESC LIMIT $1::int`,
      [limit]
    );
    return { failed_work_orders: wo, failed_chat_turns: chats };
  }
  if (name === "deploy_railway_service") {
    const serviceId = String(args.serviceId ?? "");
    const environmentId = String(args.environmentId ?? "");
    const commitSha = typeof args.commitSha === "string" ? args.commitSha : null;
    const rwTok = await decryptServiceKey("RAILWAY_TOKEN");
    const relayTok = await decryptServiceKey("CLAUDE_RELAY_TOKEN");
    if (!rwTok) return { error: "RAILWAY_TOKEN not in service_keys" };
    const query = `mutation($s: String!, $e: String!, $c: String) { serviceInstanceDeployV2(serviceId: $s, environmentId: $e, commitSha: $c) }`;
    const variables = { s: serviceId, e: environmentId, c: commitSha };
    const url = relayTok ? "https://memelli-relay.osmemelli.workers.dev" : "https://backboard.railway.com/graphql/v2";
    const reqBody = relayTok
      ? { url: "https://backboard.railway.com/graphql/v2", method: "POST", headers: { Authorization: `Bearer ${rwTok}`, "Content-Type": "application/json" }, body: { query, variables } }
      : { query, variables };
    const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (relayTok) reqHeaders["X-Relay-Token"] = relayTok;
    else reqHeaders.Authorization = `Bearer ${rwTok}`;
    const res = await fetch(url, { method: "POST", headers: reqHeaders, body: JSON.stringify(reqBody) });
    const text = await res.text();
    return { status: res.status, body: text.slice(0, 500) };
  }
  if (name === "rename_railway_project") {
    const projectId = String(args.projectId ?? "");
    const newName = String(args.newName ?? "");
    const rwTok = await decryptServiceKey("RAILWAY_TOKEN");
    const relayTok = await decryptServiceKey("CLAUDE_RELAY_TOKEN");
    if (!rwTok) return { error: "RAILWAY_TOKEN not in service_keys" };
    const query = `mutation($id: String!, $input: ProjectUpdateInput!) { projectUpdate(id: $id, input: $input) { id name } }`;
    const variables = { id: projectId, input: { name: newName } };
    // Use CF Worker relay if available (US egress for Thailand IP), else direct
    const url = relayTok ? "https://memelli-relay.osmemelli.workers.dev" : "https://backboard.railway.com/graphql/v2";
    const reqBody = relayTok
      ? { url: "https://backboard.railway.com/graphql/v2", method: "POST", headers: { Authorization: `Bearer ${rwTok}`, "Content-Type": "application/json" }, body: { query, variables } }
      : { query, variables };
    const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (relayTok) reqHeaders["X-Relay-Token"] = relayTok;
    else reqHeaders.Authorization = `Bearer ${rwTok}`;
    const res = await fetch(url, { method: "POST", headers: reqHeaders, body: JSON.stringify(reqBody) });
    const text = await res.text();
    if (!res.ok) return { error: `Railway rename ${res.status}: ${text.slice(0, 300)}` };
    return { ok: true, response: text.slice(0, 500) };
  }
  if (name === "http_fetch") {
    const url = String(args.url ?? "");
    if (!url) return { error: "url required" };
    const method = String(args.method ?? "GET").toUpperCase();
    const headers = (typeof args.headers === "object" && args.headers !== null ? args.headers : {}) as Record<string, string>;
    const bodyArg = typeof args.body === "string" ? args.body : undefined;
    const timeoutMs = Math.min(typeof args.timeout_ms === "number" ? args.timeout_ms : 10000, 30000);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method, headers, body: bodyArg, signal: ctrl.signal });
      const respHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { respHeaders[k] = v; });
      const text = await res.text();
      const truncated = text.slice(0, 100000);
      let bodyJson: unknown = undefined;
      try { bodyJson = JSON.parse(truncated); } catch { /* not json */ }
      return { status: res.status, ok: res.ok, headers: respHeaders, body: truncated, bodyJson };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { error: `http_fetch failed: ${msg}` };
    } finally {
      clearTimeout(t);
    }
  }
  if (name === "read_repo_file") {
    const repo = String(args.repo ?? "");
    const path = String(args.path ?? "");
    const ref = typeof args.ref === "string" && args.ref ? `?ref=${encodeURIComponent(args.ref)}` : "";
    if (!repo || !path) return { error: "repo + path required" };
    const tok = await decryptServiceKey("GITHUB_TOKEN");
    if (!tok) return { error: "GITHUB_TOKEN not in service_keys" };
    const url = `https://api.github.com/repos/${repo}/contents/${path}${ref}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${tok}`, Accept: "application/vnd.github+json" } });
    if (!res.ok) {
      const body = await res.text();
      return { error: `GitHub Contents ${res.status}: ${body.slice(0, 300)}` };
    }
    const j = (await res.json()) as { content?: string; sha?: string; size?: number; encoding?: string };
    if (!j.content) return { error: "no content field in response" };
    const content = Buffer.from(j.content, "base64").toString("utf8");
    return { ok: true, path, sha: j.sha, size: j.size, content };
  }
  return { error: `unknown tool: ${name}` };
}

async function askGroqWith(
  systemPrompt: string,
  historyForLlm: { role: "user" | "assistant"; content: string }[],
  meta: Record<string, unknown> = {},
  modelOverride: string | null = null,
  settings?: ChatSettings
): Promise<LlmReply> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY missing in env");
  const t0 = Date.now();
  const cfg = settings || (await getChatSettings());

  // Tool-enabled dispatch loop. Groq compound-mini is the master supervisor;
  // it can call query_db / list_modules / list_standalones / write_file /
  // dispatch_subtask. Loop terminates when Groq returns a non-tool message.
  type GMsg = { role: string; content?: string | null; tool_calls?: { id: string; function: { name: string; arguments: string } }[]; tool_call_id?: string };
  const conv: GMsg[] = [
    { role: "system", content: systemPrompt },
    ...historyForLlm.map((m) => ({ role: m.role, content: m.content }) as GMsg),
  ];

  const toolTrace: { name: string; argsPreview: string; resultPreview: string }[] = [];
  let lastModel = "";
  let promptTokens = 0;
  let completionTokens = 0;
  let consecutiveEmptyResponses = 0;
  const MAX_EMPTY_RETRIES = 2;

  for (let iter = 0; iter < cfg.maxToolIterations; iter++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // Model + max_tokens come from system_operating_rules via getChatSettings().
        // Operator-locked rule_keys: chat_default_model, chat_max_completion_tokens.
        // Override via per-request `model` field (whitelisted against groq_model_tiers).
        model: modelOverride || cfg.defaultModel,
        max_tokens: cfg.maxCompletionTokens,
        messages: conv,
        tools: GROQ_TOOLS,
        tool_choice: "auto",
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      // Recover from common 400-class failures by nudging the model and
      // continuing, instead of 502'ing the operator's chat turn.
      //
      // (a) tool_use_failed — model hallucinates a wrapper tool name (e.g.
      //     'repo_browser.run', 'multi_tool_use.parallel') not in our tools array.
      // (b) output_parse_failed — model emits plain text that LOOKS like a tool
      //     name ("Now list_work_orders.") instead of a structured tool_call.
      if (res.status === 400) {
        const validToolNames = GROQ_TOOLS.map((t) => t.function.name).join(", ");
        if (/tool_use_failed|attempted to call tool '.*?' which was not in request\.tools/i.test(body)) {
          const failedMatch = /attempted to call tool '([^']+)'/.exec(body);
          const wrongName = failedMatch?.[1] || "(unknown)";
          conv.push({
            role: "user",
            content:
              `INVALID TOOL CALL — you tried to call '${wrongName}' but that tool is NOT in your registered list. ` +
              `Stop wrapping calls in fake supervisors like 'repo_browser.run' or 'multi_tool_use.parallel'. ` +
              `The ONLY tools you have access to (call them by these exact names): ${validToolNames}. ` +
              `Retry using ONLY these names. Each call must be a top-level tool_call, not nested.`,
          });
          continue;
        }
        if (/output_parse_failed|model generated output that could not be parsed/i.test(body)) {
          conv.push({
            role: "user",
            content:
              "Your last output couldn't be parsed. You probably emitted plain text that looked like a tool call (e.g. 'Now list_work_orders.'). " +
              "When you call a tool, use the structured tool_call format — pick a name from this list, pass JSON args: " +
              validToolNames + ". " +
              "When you reply to the operator, emit normal text — no fake tool-call syntax. Retry now.",
          });
          continue;
        }
      }
      throw new Error(`Groq API ${res.status}: ${body.slice(0, 400)}`);
    }
    const data = await res.json();
    lastModel = String(data?.model ?? "");
    promptTokens += Number(data?.usage?.prompt_tokens ?? 0);
    completionTokens += Number(data?.usage?.completion_tokens ?? 0);

    const choice = data?.choices?.[0];
    const msg = choice?.message as GMsg | undefined;
    if (!msg) {
      // Real API failure — let the route's error handler surface it honestly
      // instead of inserting a canned "(no response)" that pretends Groq spoke.
      throw new Error(`Groq returned no message in choice (model=${lastModel}, finish_reason=${choice?.finish_reason}, raw=${JSON.stringify(data).slice(0, 200)})`);
    }

    if (msg.tool_calls?.length) {
      consecutiveEmptyResponses = 0;
      conv.push(msg);
      for (const tc of msg.tool_calls) {
        let parsedArgs: Record<string, unknown> = {};
        try { parsedArgs = JSON.parse(tc.function.arguments || "{}"); } catch { parsedArgs = {}; }
        const result = await execTool(tc.function.name, parsedArgs);
        toolTrace.push({
          name: tc.function.name,
          argsPreview: JSON.stringify(parsedArgs).slice(0, 200),
          resultPreview: JSON.stringify(result).slice(0, 200),
        });
        conv.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      continue;
    }

    const finalText = String(msg.content ?? "").trim();
    if (!finalText) {
      // Empty completion with no tool calls — happens when the model "stops
      // thinking" mid-turn (adversarial prompt, oversized context, refusal).
      // Nudge with an explicit forcing message and retry up to MAX_EMPTY_RETRIES
      // times before surfacing the failure. Don't forge a canned reply.
      consecutiveEmptyResponses++;
      if (consecutiveEmptyResponses > MAX_EMPTY_RETRIES) {
        throw new Error(`Groq returned empty content with no tool calls ${consecutiveEmptyResponses}x in a row (model=${lastModel}, finish_reason=${choice?.finish_reason})`);
      }
      conv.push({ role: "assistant", content: "" });
      conv.push({
        role: "user",
        content:
          "You returned no content and no tool calls. That's not allowed. Either " +
          "(a) call the tools needed to answer the operator's last message, OR " +
          "(b) reply in plain text right now. Don't think silently — output something.",
      });
      continue;
    }
    consecutiveEmptyResponses = 0;
    return {
      content: finalText,
      meta: {
        ...meta,
        model: lastModel,
        iters: iter + 1,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        latency_ms: Date.now() - t0,
        tool_trace: toolTrace,
      },
    };
  }

  // Iteration cap hit — give Groq one final non-tool turn so it can actually
  // tell the operator in its own voice what it tried and what it found.
  // This avoids the dead "max iterations" canned reply that silences the model.
  conv.push({
    role: "user",
    content:
      "You've used your tool-call budget. No more tool calls allowed. " +
      "In ONE short paragraph, tell the operator what you were trying to find, what you actually got back from your tool calls, " +
      "and either give them the answer or tell them honestly what's blocking you. " +
      "Be conversational — talk to the operator, not at them.",
  });
  const finalRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      // Final summary call also DB-driven (chat_default_model + a tighter
      // cap on the wrap-up turn — quarter of the main max).
      model: modelOverride || cfg.defaultModel,
      max_tokens: Math.max(256, Math.floor(cfg.maxCompletionTokens / 5)),
      messages: conv,
    }),
  });
  if (!finalRes.ok) {
    const body = await finalRes.text();
    throw new Error(`Iteration cap summary call failed: Groq API ${finalRes.status}: ${body.slice(0, 300)}`);
  }
  const finalData = await finalRes.json();
  promptTokens += Number(finalData?.usage?.prompt_tokens ?? 0);
  completionTokens += Number(finalData?.usage?.completion_tokens ?? 0);
  const finalContent = String(finalData?.choices?.[0]?.message?.content ?? "").trim();
  if (!finalContent) {
    throw new Error(`Iteration cap summary returned empty content (model=${lastModel}, finish_reason=${finalData?.choices?.[0]?.finish_reason})`);
  }

  return {
    content: finalContent,
    meta: { ...meta, model: lastModel, iters: cfg.maxToolIterations, prompt_tokens: promptTokens, completion_tokens: completionTokens, latency_ms: Date.now() - t0, tool_trace: toolTrace, capped: true },
  };
}

// ─── DB-driven chat settings ─────────────────────────────────────────────────
//
// All chat-loop knobs (recent-message LIMIT, tool-iteration cap, completion
// max_tokens, default model, tools-capable model whitelist) live in the DB
// so the operator can tune them without a redeploy. Cached 60s in module
// scope — one UPDATE propagates to all chat turns within the cache window.
//
// Sources:
//   system_operating_rules.rule_key='chat_short_term_message_count'  → number
//   system_operating_rules.rule_key='chat_max_tool_iterations'       → number
//   system_operating_rules.rule_key='chat_max_completion_tokens'     → number
//   system_operating_rules.rule_key='chat_default_model'             → string
//   groq_model_tiers WHERE supports_tools=true AND active=true
//                      AND role='chat-face'                          → Set<modelName>

interface ChatSettings {
  shortTermMessageCount: number;          // legacy fallback if window-minutes missing
  shortTermWindowMinutes: number;          // 24-hour rolling = 1440
  shortTermMaxMessages: number;            // hard cap on time-window pull
  maxToolIterations: number;
  maxCompletionTokens: number;
  defaultModel: string;
  toolsCapableSet: Set<string>;
  crossThreadRecentCount: number;          // 0 disables cross-thread context entirely
  crossThreadSummaryMessages: number;       // messages per other thread
  injectStatusSnapshot: boolean;            // false disables live snapshot block
}

// Fallback values used when system_operating_rules is unreachable. Keep in
// sync with the DB-side defaults (operator-locked). These are NOT the source
// of truth — DB rows are. Update both together when the operator re-tunes.
const CHAT_SETTINGS_FALLBACK: ChatSettings = {
  shortTermMessageCount: 8,
  shortTermWindowMinutes: 1440,
  shortTermMaxMessages: 10000,
  maxToolIterations: 1000,
  maxCompletionTokens: 8192,
  defaultModel: "openai/gpt-oss-120b",
  toolsCapableSet: new Set([
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-safeguard-20b",
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct",
  ]),
  crossThreadRecentCount: 3,
  crossThreadSummaryMessages: 3,
  injectStatusSnapshot: true,
};

let cachedChatSettings: { value: ChatSettings; expires: number } | null = null;

async function getChatSettings(): Promise<ChatSettings> {
  if (cachedChatSettings && cachedChatSettings.expires > Date.now()) return cachedChatSettings.value;
  try {
    const ruleRows = await q<{ rule_key: string; rule: string }>(
      `SELECT rule_key, rule FROM system_operating_rules
       WHERE rule_key IN (
         'chat_short_term_message_count',
         'chat_short_term_window_minutes',
         'chat_short_term_max_messages',
         'chat_max_tool_iterations',
         'chat_max_completion_tokens',
         'chat_default_model',
         'chat_cross_thread_recent_count',
         'chat_cross_thread_summary_messages',
         'chat_inject_status_snapshot'
       ) AND archived_at IS NULL`
    );
    const ruleMap = new Map<string, string>(ruleRows.map((r) => [r.rule_key, r.rule] as [string, string]));

    const parseIntSafe = (v: string | undefined, fb: number): number => {
      if (!v) return fb;
      const n = parseInt(String(v).trim(), 10);
      return Number.isFinite(n) && n > 0 ? n : fb;
    };

    const tierRows = await q<{ model: string }>(
      `SELECT model FROM groq_model_tiers
       WHERE supports_tools = true AND active = true AND role = 'chat-face'`
    );
    const toolsCapableSet: Set<string> =
      tierRows.length > 0
        ? new Set<string>(tierRows.map((r) => r.model))
        : CHAT_SETTINGS_FALLBACK.toolsCapableSet;

    const parseBoolSafe = (v: string | undefined, fb: boolean): boolean => {
      if (v === undefined) return fb;
      const s = String(v).trim().toLowerCase();
      if (s === "1" || s === "true" || s === "yes" || s === "on") return true;
      if (s === "0" || s === "false" || s === "no" || s === "off") return false;
      return fb;
    };

    const value: ChatSettings = {
      shortTermMessageCount: parseIntSafe(ruleMap.get("chat_short_term_message_count"), CHAT_SETTINGS_FALLBACK.shortTermMessageCount),
      shortTermWindowMinutes: parseIntSafe(ruleMap.get("chat_short_term_window_minutes"), CHAT_SETTINGS_FALLBACK.shortTermWindowMinutes),
      shortTermMaxMessages: parseIntSafe(ruleMap.get("chat_short_term_max_messages"), CHAT_SETTINGS_FALLBACK.shortTermMaxMessages),
      maxToolIterations: parseIntSafe(ruleMap.get("chat_max_tool_iterations"), CHAT_SETTINGS_FALLBACK.maxToolIterations),
      maxCompletionTokens: parseIntSafe(ruleMap.get("chat_max_completion_tokens"), CHAT_SETTINGS_FALLBACK.maxCompletionTokens),
      defaultModel: (ruleMap.get("chat_default_model") || "").trim() || CHAT_SETTINGS_FALLBACK.defaultModel,
      toolsCapableSet,
      crossThreadRecentCount: parseIntSafe(ruleMap.get("chat_cross_thread_recent_count"), CHAT_SETTINGS_FALLBACK.crossThreadRecentCount),
      crossThreadSummaryMessages: parseIntSafe(ruleMap.get("chat_cross_thread_summary_messages"), CHAT_SETTINGS_FALLBACK.crossThreadSummaryMessages),
      injectStatusSnapshot: parseBoolSafe(ruleMap.get("chat_inject_status_snapshot"), CHAT_SETTINGS_FALLBACK.injectStatusSnapshot),
    };
    cachedChatSettings = { value, expires: Date.now() + 60000 };
    return value;
  } catch {
    return CHAT_SETTINGS_FALLBACK;
  }
}

// DB-resident system-prompt loader. Reads the operator-locked rules from
// `system_operating_rules` at request time and injects them into Groq's
// system prompt. Cached 60s in module scope so a single UPDATE in the table
// propagates to all chat turns without a redeploy.
//
// Combined prompt sections:
//   - groq_in_system_role  (the master-supervisor role definition)
//   - supervisor_parallel_formula  (actual batch/chunk/gap numbers Groq must use)
//   - claude_persona  (operator's 8 traits, so Groq replies in operator's voice)
// Cache keyed by model id so each model gets its own per-model card injected.
const cachedGroqPromptByModel = new Map<string, { value: string; expires: number }>();
async function getGroqSystemPrompt(activeModel?: string, opts?: { injectStatusSnapshot?: boolean }): Promise<string> {
  const injectSnapshot = opts?.injectStatusSnapshot !== false;
  const cacheKey = (activeModel || "__default__") + (injectSnapshot ? ":snap" : ":nosnap");
  const cached = cachedGroqPromptByModel.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.value;
  try {
    const rows = await q<{ rule_key: string; rule: string }>(
      `SELECT rule_key, rule FROM system_operating_rules
       WHERE rule_key IN ('chat_doctrine', 'operator_context', 'groq_in_system_role', 'supervisor_parallel_formula', 'claude_persona')
         AND archived_at IS NULL`
    );
    const doctrine = rows.find((r) => r.rule_key === "chat_doctrine")?.rule;
    const operatorContext = rows.find((r) => r.rule_key === "operator_context")?.rule;
    const role = rows.find((r) => r.rule_key === "groq_in_system_role")?.rule;
    const parallel = rows.find((r) => r.rule_key === "supervisor_parallel_formula")?.rule;
    const persona = rows.find((r) => r.rule_key === "claude_persona")?.rule;

    // Per-model identity card — tells the active model who it is, what it
    // specializes in, knowledge cutoff, reasoning level, etc. Pulled from
    // groq_model_tiers.model_card so a single UPDATE retunes the model.
    let modelCard: string | null = null;
    if (activeModel) {
      const cardRows = await q<{ model_card: string | null }>(
        `SELECT model_card FROM groq_model_tiers
         WHERE model = $1 AND role = 'chat-face' AND active = true
         LIMIT 1`,
        [activeModel]
      );
      modelCard = cardRows[0]?.model_card ?? null;
    }

    const sections: string[] = [];

    // ── 0. CHAT DOCTRINE ── loaded first so the model has the big picture
    // before any role/persona/formula details. Source: system_operating_rules
    // WHERE rule_key='chat_doctrine'. Operator updates this row to retune
    // the chat surface globally without redeploy.
    if (doctrine) {
      sections.push(
        "## CHAT DOCTRINE — `system_operating_rules.rule_key='chat_doctrine'`\n" +
          "This is the top-level operating manual for the Memelli.io Terminal chat. Read it first.\n\n" +
          doctrine
      );
    }

    // Live operator context — what's in-flight RIGHT NOW + recent decisions.
    // Refreshable row, separate from doctrine so it can churn without
    // touching the stable doctrine.
    if (operatorContext) {
      sections.push(
        "## OPERATOR LIVE CONTEXT — `system_operating_rules.rule_key='operator_context'`\n" +
          "Current state of operator's work. Use this to ground your responses in what's actually happening.\n\n" +
          operatorContext
      );
    }

    // Live system snapshot — supervisor heartbeats + work_orders queue + recent failures.
    // Injected so models can proactively surface "what's running" without being asked.
    // Gated by `system_operating_rules.rule_key='chat_inject_status_snapshot'` (default on).
    // Set to '0' to skip the per-turn DB queries + prompt bloat.
    if (injectSnapshot) {
      try {
        const wo = await q<{ status: string; count: string }>(
          `SELECT status, COUNT(*)::text AS count FROM work_orders WHERE "createdAt" > NOW() - INTERVAL '1 hour' GROUP BY status ORDER BY status`
        );
        const stuck = await q<{ count: string }>(
          `SELECT COUNT(*)::text FROM work_orders WHERE status = 'IN_PROGRESS' AND "updatedAt" < NOW() - INTERVAL '15 minutes'`
        );
        const recentFails = await q<{ count: string }>(
          `SELECT COUNT(*)::text FROM groq_chat_history WHERE status = 'FAILED' AND "createdAt" > NOW() - INTERVAL '1 hour'`
        );
        const supers = await q<{ name: string; secs: number }>(
          `SELECT name, EXTRACT(EPOCH FROM (NOW() - "lastHeartbeat"))::int AS secs FROM agent_registrations WHERE name LIKE '%supervisor%' OR name LIKE '%-lane%' OR name LIKE '%-executor%' ORDER BY "lastHeartbeat" DESC LIMIT 8`
        );
        const queueLines = wo.length > 0 ? wo.map((r) => `  ${r.status}: ${r.count}`).join("\n") : "  (no work_orders in last hour)";
        const supLines = supers.length > 0
          ? supers.map((s) => `  ${s.name}: ${s.secs < 120 ? "alive" : s.secs < 3600 ? `quiet ${Math.floor(s.secs / 60)}m` : `stale ${Math.floor(s.secs / 3600)}h`}`).join("\n")
          : "  (no supervisor heartbeats found)";
        const stuckCount = parseInt(stuck[0]?.count || "0", 10);
        const failCount = parseInt(recentFails[0]?.count || "0", 10);
        sections.push(
          "## LIVE SYSTEM SNAPSHOT (refreshed each turn — operator should see what's running without asking)\n" +
            `**Work orders (last hour):**\n${queueLines}\n` +
            (stuckCount > 0 ? `**⚠ ${stuckCount} stuck IN_PROGRESS > 15 min**\n` : "") +
            (failCount > 0 ? `**⚠ ${failCount} chat turns FAILED in last hour**\n` : "") +
            `**Supervisor heartbeats:**\n${supLines}\n\n` +
            "If anything above looks broken, surface it in your reply when relevant."
        );
      } catch { /* non-fatal */ }
    }

    sections.push(role || GROQ_DEFAULT_SYSTEM);

    // Per-model identity — operator-locked card from groq_model_tiers.model_card.
    // This is what tells gpt-oss-120b it's gpt-oss-120b, etc. Includes
    // knowledge cutoff, specialty, reasoning level, steerability rules.
    if (modelCard) {
      sections.push(
        "## Your model identity — `groq_model_tiers.model_card` for `" + (activeModel || "?") + "`\n" +
          "This is who you are. Reference these specifics when asked about yourself. Don't fabricate.\n" +
          modelCard
      );
    }

    // Tell Groq where its own rules live so it can confirm + cite them.
    sections.push(
      "## Where your operating rules live in the DB\n" +
        "All operator-locked rules are in `system_operating_rules`. The rows you should know about:\n" +
        "  - `rule_key='groq_in_system_role'` — your role definition (already loaded above).\n" +
        "  - `rule_key='supervisor_parallel_formula'` — the parallel formula (loaded below).\n" +
        "  - `rule_key='claude_persona'` — operator's personality traits (loaded below).\n" +
        "  - `rule_key='claude_in_system_role'` — Claude tab's role.\n" +
        "Module doctrine lives in 13 tables prefixed `module_` (module_identity, module_dos, module_donts, module_design_laws, module_roles, module_dependencies, module_schema_columns, module_secrets_refs, module_triggers, module_automations, module_improvements, module_maintenance, module_health) plus `module_persona`.\n" +
        "Workspace is `workspace_modules`. Work pipeline is `work_orders`. Patch lane is `groq_patch_records`. Chat history is `groq_chat_history` + `groq_chat_threads`. Service secrets are `service_keys` (AES-encrypted, do NOT decrypt without good reason).\n" +
        "When the operator asks 'do you see this in the database', the answer is YES — quote the relevant section from the prompt below + cite the rule_key. You do NOT need to query_db just to confirm presence; the row content is already in your context."
    );

    if (parallel) {
      sections.push(
        "## Active parallel formula — `system_operating_rules.rule_key='supervisor_parallel_formula'`\n" +
          "Use these EXACT values for batched work AND quote them by name when the operator asks about parallelism.\n" +
          parallel
      );
    }
    if (persona) {
      sections.push(
        "## Operator personality — `system_operating_rules.rule_key='claude_persona'`\n" +
          "Mirror these traits when you respond and when you choose tool sequences.\n" +
          persona
      );
    }
    const value = sections.join("\n\n");
    cachedGroqPromptByModel.set(cacheKey, { value, expires: Date.now() + 60000 });
    return value;
  } catch {
    return GROQ_DEFAULT_SYSTEM;
  }
}

async function askGroq(
  historyForLlm: { role: "user" | "assistant"; content: string }[],
  modelOverride: string | null = null,
  settings?: ChatSettings
): Promise<LlmReply> {
  const cfg = settings || (await getChatSettings());
  const activeModel = modelOverride || cfg.defaultModel;
  const system = await getGroqSystemPrompt(activeModel, { injectStatusSnapshot: cfg.injectStatusSnapshot });
  return askGroqWith(system, historyForLlm, {}, modelOverride, settings);
}

// MelliBar dispatch — same Groq backend, MelliBar system prompt. Stamps
// `voice: 'mellibar'` in meta so downstream observers can distinguish
// MelliBar replies from generic Groq.
async function askMelliBar(
  historyForLlm: { role: "user" | "assistant"; content: string }[],
  modelOverride: string | null = null,
  settings?: ChatSettings
): Promise<LlmReply> {
  return askGroqWith(MELLIBAR_SYSTEM, historyForLlm, { voice: "mellibar" }, modelOverride, settings);
}

async function askClaude(
  prompt: string,
  systemPrompt?: string,
  historyForLlm?: { role: "user" | "assistant"; content: string }[]
): Promise<LlmReply> {
  // Spawns the official `claude` CLI as a subprocess. Model selection is
  // DB-driven via system_operating_rules.rule_key='chat_claude_cli_model'.
  // Default: claude-sonnet-4-6 (more focused than Opus for prompt-cleaning).
  //
  // Context wiring: claude CLI's `-p` accepts a single prompt string. We
  // inline the 24-hour history + current message into ONE structured block
  // so Claude has the same context Groq has. The system prompt (chat
  // doctrine + role + persona) goes via --system-prompt-file (temp file)
  // because Windows command-lines cap at ~32KB.
  let modelFlag = "claude-sonnet-4-6";
  try {
    const r = await q<{ rule: string }>(
      `SELECT rule FROM system_operating_rules WHERE rule_key = 'chat_claude_cli_model' AND archived_at IS NULL LIMIT 1`
    );
    if (r[0]?.rule) modelFlag = String(r[0].rule).trim();
  } catch { /* fall back to default */ }

  // The system prompt + history can total >32KB on Windows, blowing the
  // CreateProcess command-line limit (spawn ENAMETOOLONG). Fix: write the
  // system prompt to a temp file and reference it via --system-prompt-file.
  // The operator-message + history block stays in -p (much smaller).
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const os = await import("node:os");

  // Build the conversation block (history + current message) for -p.
  const conversationBlocks: string[] = [];
  if (historyForLlm && historyForLlm.length > 0) {
    const historyText = historyForLlm
      .map((m) => `[${m.role}] ${m.content}`)
      .join("\n\n");
    conversationBlocks.push(
      "<<<RECENT_CHAT_HISTORY>>>\n" + historyText + "\n<<<END_HISTORY>>>"
    );
  }
  conversationBlocks.push(
    "<<<CURRENT_OPERATOR_MESSAGE>>>\n" + prompt + "\n<<<END_MESSAGE>>>\n\n" +
      "Respond as Claude in the Memelli.io Terminal. Keep it terse — operator scans. No markdown tables in casual conversation. Speak human, not console."
  );
  const conversationPrompt = conversationBlocks.join("\n\n");

  // Write the long system prompt to a temp file so we can pass it as a path
  // (avoids the 32KB Windows command-line cap).
  let systemPromptPath: string | null = null;
  if (systemPrompt) {
    systemPromptPath = path.join(os.tmpdir(), `memelli-claude-sysprompt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.md`);
    await fs.writeFile(systemPromptPath, systemPrompt, "utf8");
  }

  // Build claude CLI args. --system-prompt-file REPLACES the default system
  // prompt (which is what auto-loads CLAUDE.md from the workspace). This
  // scopes chat-Claude strictly to the DB-driven doctrine we hand it.
  // Auth uses the operator's logged-in OAuth session via the host keychain.
  const args = ["-p", conversationPrompt, "--model", modelFlag];
  if (systemPromptPath) {
    args.push("--system-prompt-file", systemPromptPath);
  }
  const childEnv = process.env;

  const cleanupTemp = async () => {
    if (systemPromptPath) {
      try { await fs.unlink(systemPromptPath); } catch { /* ignore */ }
    }
  };

  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const child = spawn("claude", args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: childEnv,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (e) => { void cleanupTemp(); reject(e); });
    child.on("close", (code) => {
      void cleanupTemp();
      if (code !== 0) {
        reject(new Error(`claude exited ${code}: ${stderr.slice(0, 300)}`));
        return;
      }
      const text = stdout.trim();
      if (!text) {
        reject(new Error(`claude CLI exited 0 but returned empty stdout (stderr=${stderr.slice(0, 200)})`));
        return;
      }
      resolve({
        content: text,
        meta: { source: "claude-cli-subprocess", model: modelFlag, exit_code: code, latency_ms: Date.now() - t0 },
      });
    });
  });
}

// ─── GET history ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authedOrNull(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const ownerId = user.id ?? user.sub;
  if (!ownerId) return NextResponse.json({ error: "no user id in token" }, { status: 401 });

  const { id } = await params;
  const thread = await ownThreadOrNull(id, ownerId);
  if (!thread) return NextResponse.json({ error: "thread not found" }, { status: 404 });

  const messages = await q<MessageRow>(
    `SELECT id, "threadId", direction, origin, content, "contextRefs", status, meta,
            "createdAt", "processedAt", "errorMessage"
     FROM groq_chat_history
     WHERE "threadId" = $1::uuid
     ORDER BY "createdAt" ASC
     LIMIT 500`,
    [id]
  );
  return NextResponse.json({ thread, messages });
}

// ─── POST send ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authedOrNull(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const ownerId = user.id ?? user.sub;
  if (!ownerId) return NextResponse.json({ error: "no user id in token" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const target = typeof body.target === "string" && body.target ? body.target : "claude";

  // Load DB-driven chat settings once per request. Drives:
  //   - LIMIT for short-term message context window
  //   - tool-iteration cap inside askGroqWith
  //   - max_tokens for both main + final-summary completion calls
  //   - default model when frontend doesn't pass an override
  //   - tools-capable model whitelist for validating the override
  const settings = await getChatSettings();

  // Optional per-message model override. Frontend can pass the operator's
  // pick from the model dropdown so we don't burn 120b dollars on every turn.
  // Whitelist comes from groq_model_tiers (supports_tools=true, active=true,
  // role='chat-face') via getChatSettings().
  const requestedModel = typeof body.model === "string" ? body.model : "";
  const overrideModel = settings.toolsCapableSet.has(requestedModel) ? requestedModel : null;

  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });

  const thread = await ownThreadOrNull(id, ownerId);
  if (!thread) return NextResponse.json({ error: "thread not found" }, { status: 404 });

  // 1. Write operator message — status PENDING
  const direction = `operator->${target}`;
  const operatorRows = await q<MessageRow>(
    `INSERT INTO groq_chat_history ("threadId", direction, origin, content, status)
     VALUES ($1::uuid, $2, $3, $4, 'PENDING')
     RETURNING id, "threadId", direction, origin, content, "contextRefs", status, meta,
               "createdAt", "processedAt", "errorMessage"`,
    [id, direction, ORIGIN, content]
  );
  const operatorMsg = operatorRows[0];

  // 2. Build short context: last N messages excluding the just-written one.
  // N comes from system_operating_rules.chat_short_term_message_count.
  const recent = await q<MessageRow>(
    // Time-windowed history (24-hour rolling) UNION ALL with archive table.
    // Hard-cap at shortTermMaxMessages to prevent context blow-up. Falls back
    // to legacy message-count if the window query returns nothing.
    `WITH window_messages AS (
       SELECT direction, content, "createdAt" FROM groq_chat_history
       WHERE "threadId" = $1::uuid AND id <> $2::uuid
         AND "createdAt" > NOW() - ($3::int * INTERVAL '1 minute')
       UNION ALL
       SELECT direction, content, "createdAt" FROM groq_chat_archive
       WHERE "threadId" = $1::uuid
         AND "createdAt" > NOW() - ($3::int * INTERVAL '1 minute')
     )
     SELECT direction, content FROM window_messages
     ORDER BY "createdAt" DESC
     LIMIT $4::int`,
    [id, operatorMsg.id, settings.shortTermWindowMinutes, settings.shortTermMaxMessages]
  );
  const ordered = [...recent].reverse();
  const historyForLlm = ordered.map((m) => ({
    role: m.direction.startsWith("operator->") ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));

  // 2b. Cross-thread context: pull the most recent N other threads' last few
  // messages each, so the model has awareness of related conversations.
  // Configurable via chat_cross_thread_recent_count + chat_cross_thread_summary_messages.
  if (settings.crossThreadRecentCount > 0) {
    try {
      const otherThreads = await q<{ id: string; title: string; target: string; updatedAt: Date }>(
        `SELECT id, title, target, "updatedAt"
         FROM groq_chat_threads
         WHERE "ownerId" = $1::uuid AND id <> $2::uuid
         ORDER BY "updatedAt" DESC
         LIMIT $3::int`,
        [ownerId, id, settings.crossThreadRecentCount]
      );
      if (otherThreads.length > 0) {
        const otherIds = otherThreads.map((t) => t.id);
        const otherMsgs = await q<{ threadId: string; direction: string; content: string; createdAt: Date }>(
          `SELECT "threadId", direction, content, "createdAt"
           FROM (
             SELECT "threadId", direction, content, "createdAt",
                    ROW_NUMBER() OVER (PARTITION BY "threadId" ORDER BY "createdAt" DESC) AS rn
             FROM groq_chat_history
             WHERE "threadId" = ANY($1::uuid[])
           ) ranked
           WHERE rn <= $2::int
           ORDER BY "threadId", "createdAt" ASC`,
          [otherIds, settings.crossThreadSummaryMessages]
        );
        const byThread = new Map<string, typeof otherMsgs>();
        for (const m of otherMsgs) {
          if (!byThread.has(m.threadId)) byThread.set(m.threadId, []);
          byThread.get(m.threadId)!.push(m);
        }
        const blocks: string[] = [];
        for (const t of otherThreads) {
          const msgs = byThread.get(t.id) || [];
          if (msgs.length === 0) continue;
          const lines = msgs.map((m) => `  ${m.direction}: ${m.content.replace(/\s+/g, " ").slice(0, 180)}`).join("\n");
          blocks.push(`### Thread "${t.title}" (target=${t.target}, updated ${t.updatedAt.toISOString().slice(0, 19)})\n${lines}`);
        }
        if (blocks.length > 0) {
          // Inject as a single user-role context message at the start of history
          historyForLlm.unshift({
            role: "user",
            content:
              "## Recent OTHER threads (context only — do NOT reply about these unless operator asks)\n" +
              "These are summaries of your last few replies in adjacent threads. Use ONLY for cross-thread continuity awareness.\n\n" +
              blocks.join("\n\n"),
          });
        }
      }
    } catch {
      /* non-fatal — skip cross-thread context if query errors */
    }
  }

  historyForLlm.push({ role: "user", content });

  // 3. Dispatch
  let reply: LlmReply;
  try {
    if (target === "claude") {
      // Wire Claude with the same context Groq has — chat doctrine + operator
      // context + role + persona — so Sonnet doesn't answer about local
      // filesystem memory when asked about chat memory.
      const claudeSystem = await getGroqSystemPrompt(
        overrideModel || settings.defaultModel,
        { injectStatusSnapshot: settings.injectStatusSnapshot }
      );
      reply = await askClaude(content, claudeSystem, historyForLlm.slice(0, -1));
    } else if (target === "groq:mellibar") {
      // MelliBar voice — Groq backend with the MelliBar system prompt.
      reply = await askMelliBar(historyForLlm, overrideModel, settings);
    } else if (target === "groq" || target.startsWith("groq:")) {
      reply = await askGroq(historyForLlm, overrideModel, settings);
    } else {
      throw new Error(`unsupported target: ${target}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await pool().query(
      `UPDATE groq_chat_history SET status='FAILED', "errorMessage"=$1, "processedAt"=NOW() WHERE id=$2::uuid`,
      [msg, operatorMsg.id]
    );
    return NextResponse.json({ error: "llm_failed", detail: msg }, { status: 502 });
  }

  // 4. Write response row + mark operator row ANSWERED + bump thread
  const responseDirection = `${target}->operator`;
  const responseRows = await q<MessageRow>(
    `INSERT INTO groq_chat_history ("threadId", direction, origin, content, status, meta)
     VALUES ($1::uuid, $2, $3, $4, 'ANSWERED', $5::jsonb)
     RETURNING id, "threadId", direction, origin, content, "contextRefs", status, meta,
               "createdAt", "processedAt", "errorMessage"`,
    [id, responseDirection, ORIGIN, reply.content, JSON.stringify(reply.meta)]
  );
  await pool().query(
    `UPDATE groq_chat_history SET status='ANSWERED', "processedAt"=NOW() WHERE id=$1::uuid`,
    [operatorMsg.id]
  );
  await pool().query(
    `UPDATE groq_chat_threads SET "updatedAt"=NOW() WHERE id=$1::uuid`,
    [id]
  );

  return NextResponse.json({ operatorMsg, responseMsg: responseRows[0] });
}
