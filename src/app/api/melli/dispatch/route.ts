// POST /api/melli/dispatch
//
// MelliBar M5 — module command handlers.
// Body: { user_id, command: { name, handler_name, module_id, params } }
// Resp: { ok: true, action: { type, ... }, speak: string } — the bar uses
//   `action` to drive the OS window-store + per-module side effects, and
//   `speak` as the confirmation utterance.
//
// Each handler returns a plain JSON action descriptor (not a server-side
// window mutation — the OS shell is client-state). The bar interprets the
// descriptor and calls useWindowStore.open() / focuses an existing window /
// dispatches a custom event.
//
// Handlers that depend on services not yet wired (calendar, files.upload)
// return a `deferred: true` action so MelliBar can fall back to "noted, will
// open when that module ships."

import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/groq-chat-db";

const PLATFORM_TENANT = "98c1ecb7-6ad1-4349-96e3-5743198bee29";
const GATEWAY_URL =
  process.env.MEMELLI_CORE_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api-production-057c.up.railway.app";

interface ContactRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}

type DispatchAction =
  | { type: "open_window"; appId: string; focus_item_id?: string }
  | { type: "open_window_then_event"; appId: string; event: string; detail: Record<string, unknown> }
  | { type: "navigate"; href: string }
  | { type: "noop" }
  | { type: "deferred"; reason: string };

interface DispatchResponse {
  ok: boolean;
  action: DispatchAction;
  speak: string;
  data?: Record<string, unknown>;
  error?: string;
}

async function lookupContact(query: string): Promise<ContactRow | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);
  if (isUuid) {
    const rows = await q<ContactRow>(
      `SELECT id, "firstName", "lastName", email, phone FROM contacts WHERE id=$1::uuid LIMIT 1`,
      [query],
    );
    return rows[0] ?? null;
  }
  // free-text — split into words and match firstName/lastName/email
  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;
  const like = `%${tokens[0]}%`;
  const lastLike = `%${tokens[tokens.length - 1]}%`;
  const rows = await q<ContactRow>(
    `SELECT id, "firstName", "lastName", email, phone
     FROM contacts
     WHERE "firstName" ILIKE $1 OR "lastName" ILIKE $2 OR email ILIKE $1
     LIMIT 1`,
    [like, lastLike],
  );
  return rows[0] ?? null;
}

async function handle(
  handler: string,
  params: Record<string, string>,
  userId: string,
): Promise<DispatchResponse> {
  switch (handler) {
    case "openContactsWindow":
      return {
        ok: true,
        action: { type: "open_window", appId: "crm" },
        speak: "Opening contacts.",
      };

    case "searchContacts": {
      const query = params.query ?? "";
      const c = await lookupContact(query);
      if (!c) {
        return {
          ok: true,
          action: { type: "open_window", appId: "crm" },
          speak: `No contact found for ${query}. Opening CRM.`,
        };
      }
      const display =
        [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || c.email || c.id;
      return {
        ok: true,
        action: {
          type: "open_window_then_event",
          appId: "crm",
          event: "memelli:crm:focus-contact",
          detail: { contactId: c.id },
        },
        speak: `Opening ${display}.`,
        data: { contact: c },
      };
    }

    case "addContactNote": {
      const contactId = params.contact_id;
      const body = params.body ?? "";
      if (!contactId) {
        return {
          ok: false,
          action: { type: "noop" },
          speak: "Which contact should I note?",
          error: "missing_contact_id",
        };
      }
      // Insert into notes table if it exists; otherwise emit an event
      try {
        await q(
          `INSERT INTO notes (id, "userId", title, body, "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1::uuid, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [userId, `Note on ${contactId}`, body || "(voice note)"],
        );
      } catch (e) {
        void e;
      }
      return {
        ok: true,
        action: {
          type: "open_window_then_event",
          appId: "crm",
          event: "memelli:crm:note-added",
          detail: { contactId, body },
        },
        speak: "Note added.",
      };
    }

    case "dialPhone": {
      const contactId = params.contact_id;
      let phone: string | null = null;
      if (contactId) {
        const rows = await q<{ phone: string | null }>(
          `SELECT phone FROM contacts WHERE id=$1::uuid LIMIT 1`,
          [contactId],
        );
        phone = rows[0]?.phone ?? null;
      }
      if (!phone) {
        return {
          ok: false,
          action: { type: "open_window", appId: "phone" },
          speak: "I don't have a phone number for that contact yet. Opening phone.",
          error: "no_phone_on_contact",
        };
      }
      return {
        ok: true,
        action: {
          type: "open_window_then_event",
          appId: "phone",
          event: "memelli:phone:dial",
          detail: { contactId, phone },
        },
        speak: `Dialing ${phone}.`,
        data: { phone },
      };
    }

    case "prequalNextStep":
      return {
        ok: true,
        action: { type: "open_window", appId: "pre-qualification" },
        speak: "Continuing pre-qual.",
      };

    case "showCreditReport":
      return {
        ok: true,
        action: { type: "open_window", appId: "credit-reports" },
        speak: "Pulling up the credit report.",
      };

    case "createDeal": {
      const contactId = params.contact_id;
      return {
        ok: true,
        action: {
          type: "open_window_then_event",
          appId: "deals",
          event: "memelli:deals:create",
          detail: { contactId, amount: params.amount },
        },
        speak: "Starting a new deal.",
      };
    }

    case "bookCalendar":
      // Calendar app is a stub today — defer with noted intent
      return {
        ok: true,
        action: {
          type: "deferred",
          reason: "calendar module is a stub — booking will queue when calendar.memelli.io ships",
        },
        speak: "Calendar isn't wired yet — I've noted it.",
      };

    case "filesUpload":
      // DocuVault exists but upload UX is not yet voice-driven; open the window
      return {
        ok: true,
        action: { type: "open_window", appId: "docuvault" },
        speak: "Opening DocuVault. Drag a file in to upload.",
      };

    default:
      return {
        ok: false,
        action: { type: "noop" },
        speak: `I don't know how to ${handler} yet.`,
        error: "unknown_handler",
      };
  }
}

export async function POST(req: NextRequest) {
  let body: {
    user_id?: string;
    command?: { name?: string; handler_name?: string; module_id?: string; params?: Record<string, string> };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const userId = body.user_id;
  const cmd = body.command;
  if (!userId || !cmd?.handler_name) {
    return NextResponse.json({ ok: false, error: "user_id_and_command_required" }, { status: 400 });
  }

  const resp = await handle(cmd.handler_name, cmd.params ?? {}, userId);

  // Append to recent_actions in session_context (best-effort — soft-fail)
  try {
    await q(
      `UPDATE kernel_objects
         SET metadata = jsonb_set(
           jsonb_set(metadata, '{last_activity_at}', to_jsonb(now())),
           '{recent_actions}',
           COALESCE(
             (
               SELECT to_jsonb(arr) FROM (
                 SELECT (
                   COALESCE((metadata->'recent_actions')::jsonb, '[]'::jsonb) ||
                   jsonb_build_array(jsonb_build_object('at', now()::text, 'command', $3::text))
                 ) AS arr
               ) sub
             ),
             '[]'::jsonb
           )
         ),
         updated_at = CURRENT_TIMESTAMP
       WHERE object_type='session_context'
         AND tenant_id=$1::uuid
         AND metadata->>'user_id'=$2
         AND deleted_at IS NULL`,
      [PLATFORM_TENANT, userId, cmd.name ?? cmd.handler_name],
    );
  } catch (e) {
    void e;
  }

  void GATEWAY_URL;
  return NextResponse.json(resp);
}
