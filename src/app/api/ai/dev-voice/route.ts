import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

/**
 * /api/ai/dev-voice — Claude claude-sonnet-4-6 voice assistant for the admin dev page.
 * Full intelligence, no token limits, no action stripping.
 * Used by the admin to talk through features, bugs, and architecture instead of typing.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

const SYSTEM = `You are Melli Dev — the AI brain of Memelli OS and the developer's voice assistant.

The admin is talking to you by voice to build and improve Memelli OS instead of typing.
You help them think through features, debug issues, plan changes, and execute decisions.

Tech stack:
- Monorepo: Turborepo + pnpm workspaces
// - Frontend: Next.js 15 App Router on Vercel (apps/web)  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
- API: Fastify 5 on Railway (apps/api)
- DB: Prisma 6 + PostgreSQL on Railway
- Auth: JWT RS256, roles: SUPER_ADMIN/ADMIN/MEMBER
- AI: Anthropic Claude API (packages/ai), Deepgram TTS/STT, Groq for fast chat
- Queues: BullMQ + Redis
// - Deployment: railway up --service api (API), Vercel auto-deploy on git push (web)  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md

Key patterns:
- All config lives in SiteConfig DB table, fetched via /api/config/:key. NO hardcoding.
- data-melli-context attribute on any DOM element → Melli globe reads it automatically
- window.__memelliPageContext → set by useMelliPageContext hook in AppShell
- window.__memelliSend, __memelliOnboard, __memelliShowSignup → globe window APIs
- Voice intake form: VoiceIntakeForm.tsx, fields driven by FORM_FIELDS in GlobalMemelliOrb
- orb-chat: Groq for fast chat, separate dev-voice endpoint for full Claude intelligence

Voice rules:
- Spoken responses only — no markdown, no bullet lists, no code blocks in spoken replies
- When describing code changes, say the file path and what to change in plain English
- Be direct. "Change line 42 in GlobalMemelliOrb to..." not "you could consider modifying..."
- Max 3 sentences per turn unless explaining something complex
- Always end with a question or next step to keep momentum`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt: string = (body?.prompt || '').trim();
    const history: { role: 'user' | 'assistant'; content: string }[] = body?.history || [];
    const context: string | null = body?.pageContext ?? body?.context ?? null;

    if (!prompt) {
      return NextResponse.json({ responseText: "I'm ready. What are we building?" });
    }

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      // return NextResponse.json({ responseText: "Anthropic key not set — check Vercel env vars." });  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
    }

    const client = new Anthropic({ apiKey: key });

    const system = context ? `${SYSTEM}\n\nCURRENT CONTEXT:\n${context}` : SYSTEM;

    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-10).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: prompt },
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system,
      messages,
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as Anthropic.TextBlock).text)
      .join(' ')
      .trim();

    return NextResponse.json({ responseText: text });

  } catch (err: any) {
    console.error('[dev-voice]', err?.message);
    return NextResponse.json({ responseText: "Something went wrong. Try again." });
  }
}
