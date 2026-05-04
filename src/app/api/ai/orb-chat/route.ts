import { NextRequest, NextResponse } from 'next/server';

const API_BASE   = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/* ── DB config helper ──────────────────────────────────────────────── */
async function getConfig(key: string, fallback: string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/config/${key}`, { next: { revalidate: 60 } });
    if (!res.ok) return fallback;
    const data = await res.json();
    return data?.data?.value || fallback;
  } catch { return fallback; }
}

/* ── Fallback system prompts ───────────────────────────────────────── */
// Identity authority: .agent-sync/PLATFORM_IDENTITY.md — Memelli is a business IO.
const FALLBACK_PUBLIC = `You are Melli, the AI for Memelli — a business IO that runs the member's business: compliance, funding, and growth.
A member's business inputs go in (numbers, goals, blockers); outputs come out (funding, compliance, growth). Personal credit only matters when the business needs it to.
Be warm, direct, and helpful. Answer questions naturally and conversationally.
Only trigger onboarding when the user EXPLICITLY says they want to sign up, create an account, or start free — never assume.
Keep responses under 25 words unless explaining something complex.
Voice rules: no markdown, no bullet points, plain conversational sentences.
If the user wants to sign up, reply with exactly: [action:start_onboarding]`;

const FALLBACK_AUTHED = `You are Melli, the AI brain of Memelli — the business IO that runs the member's business (compliance, funding, growth).
You help users navigate, find data, and take action inside their business IO.
Personality: direct, confident, warm. Sound like a smart colleague.
Voice rules: short sentences, no bullet lists, no markdown. Under 30 words when no navigation needed.
To navigate, reply with: [action:navigate:/path]
To start onboarding, reply with: [action:start_onboarding]
Always be ready for the next instruction.`;

/* ── Route handler ────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt: string = (body?.prompt || '').trim();
    const history: { role: 'user' | 'assistant'; content: string }[] = body?.history || [];
    const isAuthed: boolean = body?.isAuthed ?? false;
    const pageContext: string | null = body?.pageContext ?? null;

    if (!prompt) {
      return NextResponse.json({ responseText: 'Hey, what do you need?', navHref: null });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ responseText: "I'm Melli — what can I help with?", navHref: null });
    }

    const baseSystem = isAuthed
      ? await getConfig('orb_system_prompt_authed', FALLBACK_AUTHED)
      : await getConfig('orb_system_prompt_public', FALLBACK_PUBLIC);

    const system = pageContext
      ? `${baseSystem}\n\nCURRENT PAGE CONTEXT:\n${pageContext}`
      : baseSystem;

    const messages = [
      ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt },
    ];

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: 200,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error('[orb-chat] Groq error', res.status);
      return NextResponse.json({ responseText: "I'm here. What do you need?", navHref: null });
    }

    const data = await res.json();
    const raw: string = data?.choices?.[0]?.message?.content?.trim() || '';

    // Parse action tags
    let navHref: string | null = null;
    let clientAction: string | null = null;
    let responseText = raw;

    const actionMatch = raw.match(/\[action:([^\]]+)\]/);
    if (actionMatch) {
      const actionVal = actionMatch[1].trim();
      responseText = raw.replace(/\[action:[^\]]+\]/, '').trim();

      if (actionVal === 'start_onboarding') {
        clientAction = 'start_onboarding';
        if (!responseText) responseText = "Let's get you set up.";
      } else if (actionVal.startsWith('/')) {
        navHref = actionVal;
        if (!responseText) responseText = 'Opening that now.';
      } else if (actionVal.startsWith('navigate:')) {
        navHref = actionVal.replace('navigate:', '');
        if (!responseText) responseText = 'Opening that now.';
      }
    }

    return NextResponse.json({ responseText, navHref, action: clientAction });

  } catch (err: any) {
    console.error('[orb-chat]', err?.message);
    return NextResponse.json({ responseText: "I'm here. What do you need?", navHref: null });
  }
}
