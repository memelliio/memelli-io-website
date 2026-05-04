// POST /api/melli/tts
// Body: { text: string, voice?: string }
// Returns: audio/mpeg stream from Alibaba DashScope CosyVoice (Sambert fallback).
//
// DASHSCOPE_API_KEY is loaded from service_keys.

import { NextRequest } from "next/server";
import { q } from "@/lib/groq-chat-db";

const DASHSCOPE_TTS_URL =
  "https://dashscope-intl.aliyuncs.com/api/v1/services/audio/tts/generate";

async function loadKey(): Promise<string | null> {
  try {
    const rows = await q<{ key_value: string }>(
      `SELECT key_value FROM service_keys WHERE key_name='DASHSCOPE_API_KEY' LIMIT 1`,
    );
    if (rows[0]?.key_value) return rows[0].key_value;
  } catch {
    /* */
  }
  return process.env.DASHSCOPE_API_KEY ?? null;
}

export async function POST(req: NextRequest) {
  let body: { text?: string; voice?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }
  const text = (body.text ?? "").trim();
  if (!text) return new Response("text required", { status: 400 });

  const key = await loadKey();
  if (!key) return new Response("dashscope key missing", { status: 503 });

  // Try CosyVoice first
  const voice = body.voice ?? "cosyvoice-v1";
  let r = await fetch(DASHSCOPE_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: voice,
      input: { text },
      parameters: { voice: "longxiaochun", format: "mp3", sample_rate: 22050 },
    }),
  });

  if (!r.ok) {
    // Sambert fallback
    r = await fetch(DASHSCOPE_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sambert-zhinan-v1",
        input: { text },
        parameters: { format: "mp3", sample_rate: 22050 },
      }),
    });
  }

  if (!r.ok) {
    return new Response(`tts failed ${r.status}`, { status: 502 });
  }

  // DashScope returns JSON with audio_url OR audio bytes depending on contentType
  const ct = r.headers.get("content-type") ?? "";
  if (ct.startsWith("audio/")) {
    return new Response(r.body, {
      status: 200,
      headers: { "Content-Type": ct, "Cache-Control": "no-store" },
    });
  }
  // JSON-shaped response (typical for sync TTS)
  const j = (await r.json()) as { output?: { audio?: { url?: string; data?: string } } };
  const audioUrl = j?.output?.audio?.url;
  if (audioUrl) {
    const a = await fetch(audioUrl);
    if (!a.ok) return new Response("audio fetch failed", { status: 502 });
    return new Response(a.body, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  }
  const audioData = j?.output?.audio?.data;
  if (audioData) {
    const buf = Buffer.from(audioData, "base64");
    return new Response(buf, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  }
  return new Response("no audio in tts response", { status: 502 });
}
