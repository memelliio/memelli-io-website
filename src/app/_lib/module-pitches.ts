// Pitch cards shown to anonymous users when they click a module icon.
// Each module has its OWN layout variant — these are visually distinct.

export type PitchLayout =
  | "split-red" // left text / right red gradient panel + hero number
  | "money-tower" // black background, big $500K hero, vertical stack
  | "terminal-card" // mock terminal log on right, software-forward
  | "tri-stack"; // three offset bureau cards visualized

export type ModulePitch = {
  appId: string;
  layout: PitchLayout;
  eyebrow: string;
  headline: string;
  subhead: string;
  bullets: string[];
  primaryCta: { label: string; action: "sign-in" | "sign-up" | "open-app" };
  secondaryCta?: { label: string; action: "sign-in" | "sign-up" | "open-app" };
  // Visual content (used differently by each layout)
  heroValue: string;
  heroSupport: string;
  tags: string[];
};

export const MODULE_PITCHES: Record<string, ModulePitch> = {
  // ── Pre-Qualification — split-red layout ────────────────────────────
  "pre-qualification": {
    appId: "pre-qualification",
    layout: "split-red",
    eyebrow: "Pre-Qualify · Soft Pull · 60s",
    headline: "See what you qualify for in 60 seconds.",
    subhead:
      "A soft-pull eligibility check — no credit hit, no card required. Find out where you stand before you apply for anything real.",
    bullets: [
      "Soft pull only — your credit score is never touched",
      "Results in under 60 seconds",
      "Personal lines, cards, loans — and business funding eligibility",
      "Free to use — no card required, ever",
    ],
    primaryCta: { label: "Sign in to start", action: "sign-in" },
    secondaryCta: { label: "Create account", action: "sign-up" },
    heroValue: "60s",
    heroSupport:
      "Eligibility check, not an application. We tell you what you qualify for; you decide what to do next.",
    tags: ["Soft pull", "Personal", "Business", "No card"],
  },

  // ── Funding — money-tower layout (black + giant amount) ─────────────
  funding: {
    appId: "funding",
    layout: "money-tower",
    eyebrow: "Personal + Business Funding · Back-End Fees Only",
    headline: "Qualify for personal and business funding.",
    subhead:
      "Real capital — personal cards, business lines, term loans, real funding amounts. Back-end fees only, capped on up to $500,000 qualified.",
    bullets: [
      "Personal funding paths — cards, lines, signature loans",
      "Business funding paths — LOCs, term loans, real working capital",
      "Back-end fees only — you pay nothing until you're funded",
      "Fee cap covers up to $500,000 qualified",
      "Direct lender relationships, not a referral mill",
    ],
    primaryCta: { label: "Sign in to start", action: "sign-in" },
    secondaryCta: { label: "Create account", action: "sign-up" },
    heroValue: "$500K",
    heroSupport: "Funding range our process is built for.",
    tags: ["Personal", "Business", "Back-end fees", "Up to $500K"],
  },

  // ── Credit Repair — terminal-card layout (software-forward) ─────────
  "credit-repair": {
    appId: "credit-repair",
    layout: "terminal-card",
    eyebrow: "State-of-the-Art Credit Repair Software",
    headline: "Credit repair, automated end-to-end.",
    subhead:
      "Our software runs the disputes for you — automatic tracking, automatic letter generation, fast turnarounds across all three bureaus.",
    bullets: [
      "Automatic dispute generation across Experian, TransUnion, Equifax",
      "Automatic tracking of every letter, every response, every round",
      "Fast turnarounds — letters out same-day, no waiting on a rep",
      "Live status board for every item under dispute",
      "No upfront fee — pay only when items come off",
    ],
    primaryCta: { label: "Sign in to start", action: "sign-in" },
    secondaryCta: { label: "Create account", action: "sign-up" },
    heroValue: "Auto",
    heroSupport: "Software does the heavy lifting.",
    tags: ["Auto-disputes", "Auto-tracking", "Three bureaus", "Same-day"],
  },

  // ── Credit Reports — tri-stack layout (three bureau cards visual) ───
  "credit-reports": {
    appId: "credit-reports",
    layout: "tri-stack",
    eyebrow: "Always-On Credit Reports",
    headline: "Your credit report, always one click away.",
    subhead:
      "We bring your SmartCredit report inside Memelli so it's always with you — pre-qualification, repair work, funding apps, or just to check.",
    bullets: [
      "Your SmartCredit report, accessible inside the platform",
      "Pre-qualify anytime against your live report",
      "Reference your report during disputes, funding apps, repair work",
      "All three bureaus, one place, always available",
      "No re-pulls needed — your report stays with you",
    ],
    primaryCta: { label: "Sign in to start", action: "sign-in" },
    secondaryCta: { label: "Create account", action: "sign-up" },
    heroValue: "Always",
    heroSupport: "Powered by SmartCredit, surfaced inside Memelli.",
    tags: ["SmartCredit", "Three bureaus", "Always available"],
  },
};

// Generic fallback for any app the operator hasn't authored a custom pitch
// for yet. Uses the app label as the headline; layout cycles based on slug
// hash so different icons feel distinct.
function fallbackPitch(appId: string, label: string): ModulePitch {
  const layouts: PitchLayout[] = [
    "split-red",
    "money-tower",
    "terminal-card",
    "tri-stack",
  ];
  let h = 0;
  for (let i = 0; i < appId.length; i++) h = (h * 31 + appId.charCodeAt(i)) | 0;
  const layout = layouts[Math.abs(h) % layouts.length];
  return {
    appId,
    layout,
    eyebrow: `${label} · Memelli OS`,
    headline: `${label} — built into your workspace.`,
    subhead:
      "One sign-in unlocks every Memelli surface. Sign in to open this module — your data, your tenant, all linked together.",
    bullets: [
      "Single Memelli identity across every module",
      "Live state — your data updates everywhere",
      "Free to start, no card required",
      "Connected to your CRM, funding, and credit pipeline",
    ],
    primaryCta: { label: "Sign in to start", action: "sign-in" },
    secondaryCta: { label: "Create account", action: "sign-up" },
    heroValue: "01",
    heroSupport: `${label} is one of dozens of modules — sign in once, unlock the whole platform.`,
    tags: ["One identity", "Connected", "Free", "All modules"],
  };
}

export function getPitch(
  appId: string,
  label?: string,
): ModulePitch | null {
  return MODULE_PITCHES[appId] ?? (label ? fallbackPitch(appId, label) : null);
}
