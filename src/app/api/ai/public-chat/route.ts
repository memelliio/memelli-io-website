import { NextRequest, NextResponse } from 'next/server';

/**
 * Public (no-auth) chat endpoint for the homepage sphere.
 * Proxies to the Railway core API, falls back to canned responses.
 *
 * Canned responses may include a [nav:/path] tag — the frontend strips
 * this tag from the spoken text and uses it for navigation when the user
 * responds affirmatively ("yes", "sure", "show me", etc.)
 */

const CORE_API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

// Affirmative words that indicate the user is saying "yes" to a prior suggestion
const AFFIRMATIVE = /^(yes|yeah|yep|sure|ok|okay|alright|absolutely|definitely|let'?s go|show me|take me there|bring me there|do it|sounds good|let me see|i'?m ready|ready)\b/i;

// Nav tag format embedded in canned responses: [nav:/path]
// These are stripped before speaking but used for client navigation.
const CANNED: [RegExp, string][] = [
  [/crm|contact|deal|pipeline|lead/i,            "Melli's CRM connects your contacts, deals, and pipelines — all powered by AI agents that update records automatically. Ready to see it? [nav:/dashboard/crm]"],
  [/commerce|store|product|payment|shop|checkout/i, "Your commerce engine is built in — create stores, products, checkouts, and subscriptions without any plugins. Want to open it? [nav:/dashboard/commerce]"],
  [/coaching|program|course|lesson|certification/i, "Melli includes a full coaching platform — create programs, modules, and certifications. Your clients access everything from one branded portal. Ready to explore it? [nav:/dashboard/coaching]"],
  [/analytics|report|stats|revenue|metric|data/i, "Real-time revenue dashboards, cohort analysis, and LTV tracking — all live across every module. Want to see your numbers? [nav:/dashboard/analytics]"],
  [/agent|automat|workflow|ai workforce/i,        "Melli runs 40+ AI agents 24/7 in parallel — lead follow-up, content, tasks, and more. You stay focused while Melli works. Want to see the AI workforce? [nav:/dashboard/ai]"],
  [/phone|call|sms|voice|communication|ivr/i,     "Melli includes a full phone system — IVR routing, AI call handling, SMS, and transcripts. Want to see the phone system? [nav:/dashboard/workflows]"],
  [/seo|content|article|blog|rank|publish/i,      "Melli's AI writes, publishes, and optimizes content for SEO at scale — articles, product descriptions, and landing pages tuned to rank. Ready to see it? [nav:/dashboard/seo]"],
  [/tv|iptv|channel|stream|live tv/i,             "Melli includes Live TV with 500+ channels — sports, news, entertainment, and more, right inside your dashboard. Want to watch? [nav:/dashboard/iptv]"],
  [/vpn|private|browser|infinity|secure/i,        "The Infinity VPN routes all your agent tasks through your own IP — no data center flags, full privacy. Want to set it up? [nav:/dashboard/vpn]"],
  [/revenue|builder|digital product|site|brand/i, "The Revenue Builder generates full digital product sites in seconds — branding, Stripe checkout, SEO, phone scripts, all at once. Want to try it? [nav:/dashboard/revenue-builder]"],
  [/credit|score|dispute|repair|funding/i,        "No worries — I'll get you started with credit repair right now! I'm opening Smart Credit through your private VPN browser. It only takes a minute. [nav:/dashboard/vpn-browser?url=https%3A%2F%2Fwww.smartcredit.com]"],
  [/price|cost|plan|trial|free|start|sign up/i,   "Start free and scale as you grow — no per-seat pricing, no surprises. Ready to create your account? [nav:/start]"],
  [/what.*do|help|feature|tell me|show me everything/i, "I'm Melli — your entire business OS. CRM, AI agents, commerce, coaching, phone, Live TV, analytics, and automation — all connected, all live, all yours. Where do you want to start? [nav:/dashboard]"],
  [/dashboard|home|workspace|my account/i,        "Your Melli OS dashboard has everything — CRM, AI, commerce, coaching, and more. Ready to open it? [nav:/dashboard]"],
];

function getCannedResponse(prompt: string): { text: string; navHref: string | null } | null {
  for (const [pattern, response] of CANNED) {
    if (pattern.test(prompt)) {
      const navMatch = response.match(/\[nav:([^\]]+)\]/);
      const navHref = navMatch ? navMatch[1] : null;
      const text = response.replace(/\s*\[nav:[^\]]+\]/, '');
      return { text, navHref };
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt: string = body?.prompt || body?.message || '';
    const lastNavHref: string | null = body?.lastNavHref ?? null;   // client sends last nav hint

    if (!prompt.trim()) {
      return NextResponse.json({ success: true, data: { responseText: "Hi! I'm Melli — ask me anything about the platform." } });
    }

    // ── Affirmative response with existing nav context ────────────────────────
    if (AFFIRMATIVE.test(prompt.trim()) && lastNavHref) {
      const navLabel = lastNavHref.split('/').pop()?.replace('-', ' ') ?? 'your dashboard';
      return NextResponse.json({
        success: true,
        data: {
          responseText: `Let's go — opening ${navLabel} for you now!`,
          navHref: lastNavHref,
        },
      });
    }

    // ── Canned response (instant, no API needed) ──────────────────────────────
    const canned = getCannedResponse(prompt);
    if (canned) {
      return NextResponse.json({
        success: true,
        data: { responseText: canned.text, navHref: canned.navHref },
      });
    }

    // ── Proxy to Railway core API ─────────────────────────────────────────────
    const res = await fetch(`${CORE_API}/api/ai/public-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const data = await res.json();
      // Parse nav tags from proxied response too
      const raw: string = data?.data?.responseText || data?.responseText || '';
      const navMatch = raw.match(/\[nav:([^\]]+)\]/);
      const navHref = navMatch ? navMatch[1] : null;
      const responseText = raw.replace(/\s*\[nav:[^\]]+\]/g, '');
      return NextResponse.json({ success: true, data: { responseText, navHref } });
    }

    throw new Error(`Core API error: ${res.status}`);
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        responseText: "I'm Melli — your AI business partner. I help you run CRM, commerce, coaching, AI agents, and automation all in one place. Start free to see everything.",
        navHref: null,
      },
    });
  }
}
