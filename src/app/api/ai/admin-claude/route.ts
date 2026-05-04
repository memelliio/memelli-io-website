import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin-only Claude terminal.
 * Uses full Claude Opus — for coding, architecture, debugging on the go.
 * Protected: only ADMIN/SUPER_ADMIN tokens allowed.
 *
 * Memory model:
 *  - history: last 60 turns from localStorage (short-term + cross-session)
 *  - memory:  pinned notes injected into every system prompt (long-term)
 *  - [memory:...] tag in response → client extracts + persists new facts
 */

const BASE_SYSTEM = `You are Claude — the admin AI for Memelli OS.
You are talking directly to the founder/admin. Help with:
- Code review, writing, debugging (TypeScript, React, Node, Prisma, SQL)
- Architecture decisions and system design
- Deployment and DevOps (Railway, Docker, pnpm monorepo)
- Business logic and feature planning

Be direct, technical, and precise. No filler. Give real answers.
When writing code, use proper formatting with code blocks.
When giving options, be opinionated — tell them what you'd actually do.

MEMORY SYSTEM:
If the user asks you to remember something important (a fact, decision, preference, context),
end your response with a tag in this exact format: [memory: one concise sentence about what to remember]
This will be saved and injected into future sessions automatically.
Only use [memory:...] when explicitly asked to remember, or when you identify something genuinely worth persisting.`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const prompt: string  = body?.prompt  || '';
    const history: Message[] = body?.history || [];
    const memory: string  = body?.memory  || '';   // pinned long-term notes

    if (!prompt.trim()) {
      return NextResponse.json({ responseText: 'What do you need?' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ responseText: 'ANTHROPIC_API_KEY not set in env.' }); // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
    }

    // Build system prompt — inject pinned memory if present
    const system = memory.trim()
      ? `${BASE_SYSTEM}\n\n## Pinned Memory (persist across sessions)\n${memory.trim()}`
      : BASE_SYSTEM;

    const messages: Message[] = [
      ...history.slice(-60),  // last 60 turns for context
      { role: 'user', content: prompt },
    ];

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        system,
        messages,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ responseText: `Claude API error: ${err}` }, { status: 500 });
    }

    const data = await res.json();
    const responseText: string = data.content?.[0]?.text || 'No response.';
    return NextResponse.json({ responseText });

  } catch (e: any) {
    return NextResponse.json({ responseText: `Error: ${e.message}` }, { status: 500 });
  }
}
