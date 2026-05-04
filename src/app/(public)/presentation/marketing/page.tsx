'use client';

import { useState } from 'react';
import {
  Copy, Check, Megaphone, Mail, Hash, Type, MousePointerClick,
  FileText, ChevronRight
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════
   FORGEPRESS INDUSTRIES — MARKETING ASSET PACK
   ══════════════════════════════════════════════════════════════════════ */

const BRAND = {
  dark: '#0F172A',
  orange: '#F97316',
  orangeLight: '#FB923C',
  slate: '#334155',
  slateLight: '#64748B',
  surface: '#1E293B',
  surfaceLight: '#273548',
  white: '#F8FAFC',
  border: '#334155',
};

/* ── Tab Config ────────────────────────────────────────────────────── */

type TabKey = 'ads' | 'emails' | 'social' | 'headlines' | 'ctas' | 'promos';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'ads', label: 'Ad Copy', icon: Megaphone },
  { key: 'emails', label: 'Email Copy', icon: Mail },
  { key: 'social', label: 'Social Captions', icon: Hash },
  { key: 'headlines', label: 'Headlines', icon: Type },
  { key: 'ctas', label: 'CTAs', icon: MousePointerClick },
  { key: 'promos', label: 'Promo Blurbs', icon: FileText },
];

/* ── Content Data ─────────────────────────────────────────────────── */

const adCopy: { title: string; body: string }[] = [
  {
    title: 'Ad 1 — Production Power',
    body: `Stop outsourcing your transfers. The ForgePress FP-3600 Pro prints 28 sqft/hr of vibrant, full-color DTF transfers — on ANY fabric. No screens. No minimums. No weeding.\n\nFrom $9,750 with financing available.\n\n→ See the full lineup at forgepress.com`,
  },
  {
    title: 'Ad 2 — Startup Bundle',
    body: `Launch your DTF printing business for under $6K.\n\nThe ForgePress Startup Bundle includes everything: printer, heat press, inks, transfer sheets, powder, training, and a 1-year warranty. Print on day one.\n\nStartup Bundle — $5,795 (Save $495)\n\n→ Order now at forgepress.com`,
  },
  {
    title: 'Ad 3 — Net Terms',
    body: `Qualified businesses: get the equipment now, pay later.\n\nForgePress offers Net 30, Net 60, and Net 90 payment terms for established businesses. No interest. No hidden fees. Just flexible purchasing built for B2B.\n\n→ Apply at forgepress.com/net-terms`,
  },
  {
    title: 'Ad 4 — Industrial Scale',
    body: `Printing 500+ transfers a day? The ForgePress FP-6000 Industrial was built for you.\n\n60" print width. 65 sqft/hr. 8-color ink system. Inline powder & cure. This is production-grade DTF at its finest.\n\nStarting at $24,500.\n\n→ Request a quote at forgepress.com`,
  },
  {
    title: 'Ad 5 — Why DTF',
    body: `Screen printing is expensive. Sublimation only works on polyester. DTF works on EVERYTHING.\n\nCotton. Polyester. Blends. Nylon. Denim. Dark garments. Light garments. Full color. No weeding. No minimums.\n\nForgePress DTF printers start at $4,995.\n\n→ See why shops are switching at forgepress.com`,
  },
];

const emailCopy: { title: string; subject: string; body: string }[] = [
  {
    title: 'Email 1 — Introduction',
    subject: 'Your DTF equipment upgrade is waiting',
    body: `Hi [First Name],\n\nI wanted to introduce you to ForgePress Industries — we manufacture premium DTF printers and heat press equipment for businesses like yours.\n\nWhether you're launching a new print shop or scaling an existing operation, our equipment is designed for reliability, speed, and profit.\n\nHere's what sets us apart:\n• Print on ANY fabric — cotton, polyester, blends, and more\n• Production speeds up to 65 sqft/hr\n• Complete bundles starting at $5,795\n• Net 30/60/90 terms for qualified businesses\n\nI'd love to learn about your operation and recommend the right setup.\n\nWould you have 15 minutes this week for a quick call?\n\nBest,\n[Your Name]\nForgePress Industries\nsales@forgepress.com | (888) 555-0199`,
  },
  {
    title: 'Email 2 — Follow-Up',
    subject: 'Quick follow-up — DTF equipment for [Company]',
    body: `Hi [First Name],\n\nJust following up on my previous note about ForgePress DTF equipment.\n\nI know you're busy, so I'll keep this short: we're currently offering $495 off our Startup Bundle and $995 off our Pro Production Bundle for new accounts.\n\nThese bundles include everything you need — printer, heat press, inks, supplies, training, and warranty.\n\nIf you're evaluating DTF equipment, I'd be happy to send over detailed specs or set up a 10-minute demo call.\n\nNo pressure — just here to help when you're ready.\n\nBest,\n[Your Name]\nForgePress Industries`,
  },
  {
    title: 'Email 3 — Closing',
    subject: 'Last chance: bundle savings end Friday',
    body: `Hi [First Name],\n\nWanted to give you a heads up — our current bundle pricing ends this Friday.\n\nStartup Bundle: $5,795 (regularly $6,290)\nPro Production Bundle: $11,250 (regularly $12,245)\n\nBoth include full equipment, supplies, training, and extended warranty.\n\nIf you've been considering adding DTF capability to your shop, this is the best time to move. We also offer Net 30/60/90 for qualified businesses — so you can start printing now and pay later.\n\nReady to go? Reply to this email or call us at (888) 555-0199.\n\nLooking forward to getting you set up.\n\nBest,\n[Your Name]\nForgePress Industries`,
  },
];

const socialCaptions: string[] = [
  'DTF printing on ANY fabric. No screens. No minimums. No weeding. Just press and profit. 🔥 #ForgePress #DTFPrinting',
  'The ForgePress FP-3600 Pro just printed 200 transfers before lunch. What did your printer do today? #ProductionMode',
  'New to DTF? Our Startup Bundle has everything you need for under $6K. Printer. Press. Inks. Training. Done. #StartPrinting',
  'Net 30. Net 60. Net 90. Because real B2B equipment companies offer real B2B payment terms. #ForgePress #NetTerms',
  'Cotton? ✓ Polyester? ✓ Blends? ✓ Nylon? ✓ Denim? ✓ Dark garments? ✓ DTF prints on everything. #WhyDTF',
  'Our FP-6000 Industrial prints 65 sqft/hr with 8-color ink. That\'s enterprise DTF. #ForgePress #IndustrialPrinting',
  'Stop outsourcing your transfers. Start making them in-house. ForgePress DTF printers from $4,995. #OwnYourProduction',
  'The heat press that never quits. ForgePress HP-4800 Pneumatic — dual station, 99 presets, pneumatic auto-press. Built different. 💪',
  'Your customers don\'t care how you make the transfer. They care that it looks incredible and lasts forever. That\'s DTF. #QualityFirst',
  'From one-off customs to 10,000-piece runs. Same equipment. Same quality. That\'s the ForgePress difference. #ScaleReady',
];

const headlines: string[] = [
  'Premium DTF Equipment for Serious Print Shops',
  'Print on Any Fabric. No Screens Required.',
  'DTF Printers Starting at $4,995',
  'The Equipment Your Production Line Deserves',
  'Net 30/60/90 Terms for Qualified Businesses',
  'Launch Your DTF Business for Under $6K',
  'Industrial-Grade DTF Printing, Delivered',
  'Stop Outsourcing. Start Pressing.',
  'Full-Color Transfers on Dark & Light Garments',
  'Built for Production. Priced for Profit.',
  'From Startup to Scale — One Equipment Partner',
  '65 sqft/hr. 8-Color Ink. Zero Compromises.',
  'The Fastest-Growing Print Method in the Industry',
  'Professional DTF Equipment with Real B2B Support',
  'Your Next Press Should Be a ForgePress',
];

const ctas: string[] = [
  'Shop DTF Printers →',
  'Get Your Free Quote',
  'Request a Demo',
  'Apply for Net Terms',
  'See the Full Lineup',
  'Order Your Bundle Today',
  'Talk to Our Equipment Specialists',
  'Start Printing This Week',
  'Download the Equipment Guide',
  'Claim Your Bundle Savings',
];

const promoBlurbs: { title: string; body: string }[] = [
  {
    title: 'Blurb 1 — Company Intro',
    body: 'ForgePress Industries manufactures premium Direct-to-Film (DTF) printing equipment and heat press systems for businesses of every size. From entry-level printers to industrial production lines, every machine is engineered for reliability, precision, and profit. Backed by lifetime technical support and flexible Net 30/60/90 terms for qualified businesses.',
  },
  {
    title: 'Blurb 2 — Product Focus',
    body: 'The ForgePress FP-3600 Pro is the mid-range DTF workhorse trusted by production shops nationwide. With a 36" print width, 2880 x 1440 dpi resolution, and 28 sqft/hr speed, it delivers vibrant full-color transfers on any fabric — cotton, polyester, blends, and more. Dual print heads and auto powder & cure make it a true set-and-forget production machine.',
  },
  {
    title: 'Blurb 3 — Bundle Value',
    body: 'The ForgePress Startup Bundle gives you everything you need to launch a DTF printing business for $5,795 — saving you $495 over buying components separately. Includes the FP-2400 printer, HP-1600 heat press, starter ink kit, 500 transfer sheets, DTF powder, online training, and a 1-year extended warranty. Unbox, set up, and start printing the same day.',
  },
  {
    title: 'Blurb 4 — Net Terms',
    body: 'ForgePress offers Net 30, Net 60, and Net 90 payment terms for qualified businesses — because serious equipment purchases deserve serious payment flexibility. No interest, no hidden fees. Apply during checkout or contact our sales team to get approved. Requirements: active business entity, 2+ years in operation, and completed credit application.',
  },
  {
    title: 'Blurb 5 — Why DTF',
    body: 'DTF (Direct-to-Film) printing is the fastest-growing garment decoration method in the industry — and for good reason. It works on any fabric, requires no weeding, produces photographic-quality full-color prints, and handles both dark and light garments with ease. Startup costs are a fraction of screen printing, and on-demand production means zero minimums and zero waste.',
  },
];

/* ── Copy Button Component ────────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0"
      style={{
        background: copied ? '#16a34a' : `${BRAND.orange}22`,
        color: copied ? '#fff' : BRAND.orange,
        border: `1px solid ${copied ? '#16a34a' : BRAND.orange}44`,
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

/* ── Card Wrapper ─────────────────────────────────────────────────── */

function AssetCard({ title, children, copyText }: { title?: string; children: React.ReactNode; copyText: string }) {
  return (
    <div className="rounded-xl border p-5" style={{ background: BRAND.surface, borderColor: BRAND.border }}>
      <div className="flex items-start justify-between gap-4 mb-3">
        {title && <h3 className="font-bold text-sm" style={{ color: BRAND.white }}>{title}</h3>}
        <CopyButton text={copyText} />
      </div>
      {children}
    </div>
  );
}

/* ── Tab Content Renderers ────────────────────────────────────────── */

function AdsTab() {
  return (
    <div className="space-y-5">
      {adCopy.map((ad, i) => (
        <AssetCard key={i} title={ad.title} copyText={ad.body}>
          <p className="text-sm whitespace-pre-line" style={{ color: BRAND.slateLight }}>{ad.body}</p>
        </AssetCard>
      ))}
    </div>
  );
}

function EmailsTab() {
  return (
    <div className="space-y-5">
      {emailCopy.map((email, i) => (
        <AssetCard key={i} title={email.title} copyText={`Subject: ${email.subject}\n\n${email.body}`}>
          <div className="mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: BRAND.surfaceLight }}>
            <span className="font-semibold" style={{ color: BRAND.orange }}>Subject:</span>{' '}
            <span style={{ color: BRAND.white }}>{email.subject}</span>
          </div>
          <p className="text-sm whitespace-pre-line" style={{ color: BRAND.slateLight }}>{email.body}</p>
        </AssetCard>
      ))}
    </div>
  );
}

function SocialTab() {
  return (
    <div className="space-y-4">
      {socialCaptions.map((caption, i) => (
        <AssetCard key={i} title={`Caption ${i + 1}`} copyText={caption}>
          <p className="text-sm" style={{ color: BRAND.slateLight }}>{caption}</p>
        </AssetCard>
      ))}
    </div>
  );
}

function HeadlinesTab() {
  return (
    <div className="space-y-3">
      {headlines.map((h, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 rounded-xl border px-5 py-4"
          style={{ background: BRAND.surface, borderColor: BRAND.border }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `${BRAND.orange}22`, color: BRAND.orange }}>
              {i + 1}
            </span>
            <p className="font-semibold text-sm" style={{ color: BRAND.white }}>{h}</p>
          </div>
          <CopyButton text={h} />
        </div>
      ))}
    </div>
  );
}

function CTAsTab() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {ctas.map((cta, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-xl border px-5 py-4"
          style={{ background: BRAND.surface, borderColor: BRAND.border }}
        >
          <div className="flex items-center gap-2">
            <ChevronRight size={16} style={{ color: BRAND.orange }} />
            <p className="font-semibold text-sm" style={{ color: BRAND.white }}>{cta}</p>
          </div>
          <CopyButton text={cta} />
        </div>
      ))}
    </div>
  );
}

function PromosTab() {
  return (
    <div className="space-y-5">
      {promoBlurbs.map((promo, i) => (
        <AssetCard key={i} title={promo.title} copyText={promo.body}>
          <p className="text-sm leading-relaxed" style={{ color: BRAND.slateLight }}>{promo.body}</p>
        </AssetCard>
      ))}
    </div>
  );
}

const TAB_CONTENT: Record<TabKey, () => React.ReactElement> = {
  ads: AdsTab,
  emails: EmailsTab,
  social: SocialTab,
  headlines: HeadlinesTab,
  ctas: CTAsTab,
  promos: PromosTab,
};

/* ══════════════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════════════ */

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('ads');
  const ActiveContent = TAB_CONTENT[activeTab];

  return (
    <div className="min-h-screen" style={{ background: BRAND.dark, color: BRAND.white }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, ${BRAND.orange}44 0%, transparent 50%), radial-gradient(circle at 85% 30%, ${BRAND.orange}22 0%, transparent 40%)`,
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 md:px-12 lg:px-20 py-16 md:py-24">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 tracking-wider uppercase"
            style={{ background: `${BRAND.orange}18`, color: BRAND.orange, border: `1px solid ${BRAND.orange}33` }}>
            <Megaphone size={14} /> Marketing Assets
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
            <span style={{ color: BRAND.orange }}>Forge</span>Press Marketing Pack
          </h1>
          <p className="text-base max-w-xl" style={{ color: BRAND.slateLight }}>
            Ready-to-use ad copy, email templates, social captions, headlines, CTAs, and promotional blurbs for ForgePress DTF equipment campaigns.
          </p>
        </div>
      </header>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b" style={{ background: BRAND.dark, borderColor: BRAND.border }}>
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-20">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all cursor-pointer"
                  style={{
                    background: isActive ? BRAND.orange : 'transparent',
                    color: isActive ? '#fff' : BRAND.slateLight,
                  }}
                >
                  <tab.icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 md:px-12 lg:px-20 py-10">
        <ActiveContent />
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t py-8 px-6 text-center" style={{ borderColor: BRAND.border }}>
        <p className="text-xs" style={{ color: BRAND.slateLight }}>
          &copy; {new Date().getFullYear()} ForgePress Industries. Marketing assets for authorized use only.
        </p>
      </footer>
    </div>
  );
}
