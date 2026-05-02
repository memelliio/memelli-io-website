// GET /api/melli/stream?user_id=...
//
// Server-Sent Events stream of session_context changes for the given user.
// Listens to Postgres NOTIFY on channel 'kernel_obj_session_context' and
// forwards events whose payload.user_id matches.
//
// SSE chosen over WebSocket because Next.js App Router supports SSE natively
// (Response streaming) but not raw WS upgrades — the bar reconnects on
// disconnect, so the loop is the same.

import { NextRequest } from "next/server";
import { Client } from "pg";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function databaseUrl(): string {
  const url = process.env.DATABASE_URL || process.env.MEMELLI_CORE_DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return url;
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return new Response("user_id required", { status: 400 });
  }

  const encoder = new TextEncoder();

  // We use a dedicated long-lived pg Client (NOT the pool) because LISTEN
  // requires a session-bound connection.
  const client = new Client({ connectionString: databaseUrl() });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        await client.connect();
        await client.query("LISTEN kernel_obj_session_context");

        client.on("notification", (msg) => {
          try {
            const parsed = JSON.parse(msg.payload ?? "{}");
            if (parsed?.user_id !== userId) return;
            send("session_context", parsed);
          } catch {
            // ignore malformed
          }
        });

        send("ready", { user_id: userId });

        // Heartbeat every 25s so proxies don't drop
        const hb = setInterval(() => send("ping", { t: Date.now() }), 25_000);

        const cleanup = async () => {
          if (closed) return;
          closed = true;
          clearInterval(hb);
          try {
            await client.query("UNLISTEN kernel_obj_session_context");
          } catch {
            /* */
          }
          try {
            await client.end();
          } catch {
            /* */
          }
          try {
            controller.close();
          } catch {
            /* */
          }
        };

        req.signal.addEventListener("abort", () => {
          void cleanup();
        });
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        send("error", { message: err });
        try {
          controller.close();
        } catch {
          /* */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
