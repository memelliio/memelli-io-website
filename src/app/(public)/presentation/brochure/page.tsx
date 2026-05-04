'use client';

import { useState } from 'react';
import {
  Printer, Flame, Package, CheckCircle2, Clock, Shield, Star,
  Download, Phone, Mail, Globe, ArrowRight, Zap, Award,
  Building2, CreditCard, FileText, ChevronDown, ChevronUp,
  Layers, Target, TrendingUp, Users
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════
   FORGEPRESS INDUSTRIES — DIGITAL BROCHURE
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

/* ── Product Data ─────────────────────────────────────────────────── */

const dtfPrinters = [
  {
    name: 'ForgePress FP-2400',
    tagline: 'Entry-Level Production',
    image: null,
    specs: [
      'Print Width: 24"',
      'Resolution: 1440 x 720 dpi',
      'Speed: 12 sqft/hr',
      'Ink System: 4-Color CMYK + White',
      'RIP Software Included',
      'Auto Sheet Feeder',
    ],
    price: '$4,995',
    ideal: 'Startups & small shops entering DTF',
  },
  {
    name: 'ForgePress FP-3600 Pro',
    tagline: 'Mid-Range Workhorse',
    image: null,
    specs: [
      'Print Width: 36"',
      'Resolution: 2880 x 1440 dpi',
      'Speed: 28 sqft/hr',
      'Ink System: 6-Color CMYK + White + Neon',
      'Dual Print Heads',
      'Auto Powder & Cure System',
    ],
    price: '$9,750',
    ideal: 'Growing businesses with daily production',
  },
  {
    name: 'ForgePress FP-6000 Industrial',
    tagline: 'High-Volume Production',
    image: null,
    specs: [
      'Print Width: 60"',
      'Resolution: 2880 x 1440 dpi',
      'Speed: 65 sqft/hr',
      'Ink System: 8-Color CMYK + White + Neon + Spot',
      'Quad Staggered Print Heads',
      'Inline Powder, Cure & Roll System',
    ],
    price: '$24,500',
    ideal: 'High-volume fulfillment & wholesale operations',
  },
];

const heatPresses = [
  {
    name: 'ForgePress HP-1600 Clamshell',
    tagline: 'Compact & Reliable',
    specs: [
      'Platen: 16" x 20"',
      'Temp Range: 250°F – 450°F',
      'Digital Controller',
      'Auto-Open Timer',
      'Even Heat Distribution',
      'Teflon-Coated Platen',
    ],
    price: '$1,295',
    ideal: 'Single-operator shops & home businesses',
  },
  {
    name: 'ForgePress HP-2400 Swing-Away',
    tagline: 'Ergonomic Production',
    specs: [
      'Platen: 24" x 32"',
      'Temp Range: 200°F – 500°F',
      'Dual Digital Controllers',
      'Swing-Away Design',
      'Interchangeable Platens',
      'Pressure Gauge Display',
    ],
    price: '$2,495',
    ideal: 'Daily production environments',
  },
  {
    name: 'ForgePress HP-4800 Pneumatic',
    tagline: 'Industrial Grade',
    specs: [
      'Platen: 48" x 64"',
      'Temp Range: 200°F – 550°F',
      'Pneumatic Auto-Press',
      'Dual Station Shuttle',
      'Programmable Presets (99 slots)',
      'Air Compressor Included',
    ],
    price: '$6,950',
    ideal: 'High-volume production lines',
  },
];

const bundles = [
  {
    name: 'Startup Bundle',
    tagline: 'Everything to Launch',
    includes: [
      'FP-2400 DTF Printer',
      'HP-1600 Clamshell Heat Press',
      'Starter Ink Kit (CMYK + White)',
      '500 Transfer Sheets',
      'DTF Powder (2 kg)',
      'Online Training Course',
      '1-Year Extended Warranty',
    ],
    price: '$5,795',
    savings: 'Save $495',
  },
  {
    name: 'Pro Production Bundle',
    tagline: 'Scale Your Operation',
    includes: [
      'FP-3600 Pro DTF Printer',
      'HP-2400 Swing-Away Heat Press',
      'Full Ink Kit (6-Color + Neon)',
      '2,000 Transfer Sheets',
      'DTF Powder (10 kg)',
      'Advanced RIP License',
      'On-Site Installation & Training',
      '2-Year Extended Warranty',
    ],
    price: '$11,250',
    savings: 'Save $995',
  },
];

/* ── Components ───────────────────────────────────────────────────── */

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`py-16 px-6 md:px-12 lg:px-20 ${className}`}>
      <div className="max-w-5xl mx-auto">{children}</div>
    </section>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: BRAND.orange }}>
          <Icon size={20} color="#fff" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold" style={{ color: BRAND.white }}>{title}</h2>
      </div>
      {subtitle && <p className="text-base mt-2" style={{ color: BRAND.slateLight }}>{subtitle}</p>}
      <div className="mt-4 h-px w-full" style={{ background: `linear-gradient(90deg, ${BRAND.orange}, transparent)` }} />
    </div>
  );
}

function ProductCard({ product, type }: { product: any; type: 'printer' | 'press' | 'bundle' }) {
  const [open, setOpen] = useState(false);
  const items = type === 'bundle' ? product.includes : product.specs;

  return (
    <div
      className="rounded-xl border p-6 transition-all hover:border-orange-500/50"
      style={{ background: BRAND.surface, borderColor: BRAND.border }}
    >
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-lg font-bold" style={{ color: BRAND.white }}>{product.name}</h3>
          <p className="text-sm" style={{ color: BRAND.orange }}>{product.tagline}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold" style={{ color: BRAND.orange }}>{product.price}</p>
          {product.savings && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#16a34a22', color: '#4ade80' }}>
              {product.savings}
            </span>
          )}
        </div>
      </div>

      {product.ideal && (
        <p className="text-sm mt-2 mb-3" style={{ color: BRAND.slateLight }}>
          <Target size={13} className="inline mr-1 -mt-0.5" style={{ color: BRAND.orange }} />
          Ideal for: {product.ideal}
        </p>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm font-medium mt-2 mb-2 cursor-pointer"
        style={{ color: BRAND.orangeLight }}
      >
        {type === 'bundle' ? 'What\'s Included' : 'Full Specs'}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <ul className="space-y-1.5 mt-2">
          {items.map((item: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: BRAND.white }}>
              <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: BRAND.orange }} />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Brochure Text for PDF Download ───────────────────────────────── */

function buildBrochureText(): string {
  const lines: string[] = [];
  const hr = '═'.repeat(60);
  const sr = '─'.repeat(60);

  lines.push(hr);
  lines.push('  FORGEPRESS INDUSTRIES');
  lines.push('  Premium DTF & Heat Press Equipment');
  lines.push(hr);
  lines.push('');
  lines.push('BRAND OVERVIEW');
  lines.push(sr);
  lines.push('ForgePress Industries manufactures premium Direct-to-Film (DTF)');
  lines.push('printing equipment and heat press systems for businesses of every');
  lines.push('size. From startup shops to industrial fulfillment operations, our');
  lines.push('equipment is engineered for reliability, precision, and profit.');
  lines.push('');

  lines.push('DTF PRINTERS');
  lines.push(sr);
  dtfPrinters.forEach((p) => {
    lines.push(`  ${p.name} — ${p.tagline}`);
    lines.push(`  Price: ${p.price}`);
    lines.push(`  Ideal for: ${p.ideal}`);
    p.specs.forEach((s) => lines.push(`    • ${s}`));
    lines.push('');
  });

  lines.push('HEAT PRESSES');
  lines.push(sr);
  heatPresses.forEach((p) => {
    lines.push(`  ${p.name} — ${p.tagline}`);
    lines.push(`  Price: ${p.price}`);
    lines.push(`  Ideal for: ${p.ideal}`);
    p.specs.forEach((s) => lines.push(`    • ${s}`));
    lines.push('');
  });

  lines.push('BUNDLES');
  lines.push(sr);
  bundles.forEach((b) => {
    lines.push(`  ${b.name} — ${b.tagline}`);
    lines.push(`  Price: ${b.price} (${b.savings})`);
    lines.push('  Includes:');
    b.includes.forEach((i) => lines.push(`    • ${i}`));
    lines.push('');
  });

  lines.push('CHECKOUT OPTIONS');
  lines.push(sr);
  lines.push('Standard Checkout: Credit/debit card, PayPal, or wire transfer.');
  lines.push('All orders include free shipping on orders over $5,000.');
  lines.push('');
  lines.push('Net Terms (Qualified Businesses):');
  lines.push('  • Net 30 — Pay within 30 days of invoice');
  lines.push('  • Net 60 — Pay within 60 days of invoice');
  lines.push('  • Net 90 — Pay within 90 days of invoice');
  lines.push('  Requirements: Active business entity, 2+ years operation,');
  lines.push('  credit application approval. Apply during checkout or contact sales.');
  lines.push('');

  lines.push('WHY DTF PRINTING?');
  lines.push(sr);
  lines.push('  • Print on ANY fabric — cotton, polyester, blends, nylon');
  lines.push('  • No weeding — full-color, photographic prints with fine detail');
  lines.push('  • Low startup cost compared to screen printing');
  lines.push('  • On-demand production — no minimum orders');
  lines.push('  • Vibrant, wash-durable transfers');
  lines.push('  • Works with dark AND light garments');
  lines.push('');

  lines.push('CONTACT');
  lines.push(sr);
  lines.push('  Web: forgepress.com');
  lines.push('  Email: sales@forgepress.com');
  lines.push('  Phone: (888) 555-0199');
  lines.push('');
  lines.push(hr);
  lines.push('  © ForgePress Industries. All rights reserved.');
  lines.push(hr);

  return lines.join('\n');
}

/* ══════════════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════════════ */

export default function BrochurePage() {
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    const text = buildBrochureText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: BRAND.dark, color: BRAND.white }}>

      {/* ── Cover ───────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 40%, ${BRAND.orange}44 0%, transparent 60%), radial-gradient(circle at 80% 70%, ${BRAND.orange}22 0%, transparent 50%)`,
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 md:px-12 lg:px-20 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 tracking-wider uppercase"
            style={{ background: `${BRAND.orange}18`, color: BRAND.orange, border: `1px solid ${BRAND.orange}33` }}>
            <Flame size={14} /> Equipment Catalog 2026
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
            <span style={{ color: BRAND.orange }}>Forge</span>Press
          </h1>
          <p className="text-xl md:text-2xl font-medium tracking-wide" style={{ color: BRAND.slateLight }}>
            Premium DTF & Heat Press Equipment
          </p>
          <p className="text-base mt-4 max-w-xl mx-auto" style={{ color: BRAND.slateLight }}>
            Industrial-grade printing equipment engineered for startups, production shops, and enterprise fulfillment operations.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="#products" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:brightness-110"
              style={{ background: BRAND.orange, color: '#fff' }}>
              View Products <ArrowRight size={16} />
            </a>
            <a href="#contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border transition-all hover:bg-white/5"
              style={{ borderColor: BRAND.border, color: BRAND.white }}>
              Contact Sales <Phone size={16} />
            </a>
          </div>
        </div>
      </header>

      {/* ── Brand Overview ──────────────────────────────────────────── */}
      <Section>
        <SectionTitle icon={Building2} title="Brand Overview" subtitle="Built for businesses that demand performance." />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Award, label: 'Industry Leading', desc: 'Precision-engineered equipment with best-in-class print quality and production speed.' },
            { icon: Shield, label: 'Built to Last', desc: 'Heavy-duty construction with commercial-grade components and comprehensive warranties.' },
            { icon: Users, label: 'Full Support', desc: 'Dedicated account managers, on-site installation, training, and lifetime technical support.' },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border p-6" style={{ background: BRAND.surface, borderColor: BRAND.border }}>
              <item.icon size={28} style={{ color: BRAND.orange }} className="mb-3" />
              <h3 className="font-bold text-base mb-1" style={{ color: BRAND.white }}>{item.label}</h3>
              <p className="text-sm" style={{ color: BRAND.slateLight }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── DTF Printers ────────────────────────────────────────────── */}
      <div id="products">
        <Section className="pt-8">
          <SectionTitle icon={Printer} title="DTF Printers" subtitle="Direct-to-Film printers for every production level." />
          <div className="grid md:grid-cols-3 gap-6">
            {dtfPrinters.map((p, i) => <ProductCard key={i} product={p} type="printer" />)}
          </div>
        </Section>
      </div>

      {/* ── Heat Presses ────────────────────────────────────────────── */}
      <Section className="pt-4">
        <SectionTitle icon={Flame} title="Heat Presses" subtitle="Professional heat application systems for flawless transfers." />
        <div className="grid md:grid-cols-3 gap-6">
          {heatPresses.map((p, i) => <ProductCard key={i} product={p} type="press" />)}
        </div>
      </Section>

      {/* ── Bundles ─────────────────────────────────────────────────── */}
      <Section className="pt-4">
        <SectionTitle icon={Package} title="Equipment Bundles" subtitle="Complete packages to get you printing from day one." />
        <div className="grid md:grid-cols-2 gap-6">
          {bundles.map((b, i) => <ProductCard key={i} product={b} type="bundle" />)}
        </div>
      </Section>

      {/* ── Checkout ────────────────────────────────────────────────── */}
      <Section>
        <SectionTitle icon={CreditCard} title="Standard Checkout" subtitle="Simple, secure purchasing for every buyer." />
        <div className="rounded-xl border p-6" style={{ background: BRAND.surface, borderColor: BRAND.border }}>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold mb-3" style={{ color: BRAND.white }}>Payment Methods</h3>
              <ul className="space-y-2">
                {['Credit & Debit Cards (Visa, MC, Amex)', 'PayPal & PayPal Credit', 'Wire Transfer / ACH', 'Purchase Orders (approved accounts)'].map((m, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: BRAND.slateLight }}>
                    <CheckCircle2 size={14} style={{ color: BRAND.orange }} /> {m}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3" style={{ color: BRAND.white }}>Order Benefits</h3>
              <ul className="space-y-2">
                {['Free shipping on orders over $5,000', 'Secure SSL checkout', '30-day satisfaction guarantee', 'Tracking & delivery confirmation'].map((m, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: BRAND.slateLight }}>
                    <CheckCircle2 size={14} style={{ color: BRAND.orange }} /> {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Net Terms ───────────────────────────────────────────────── */}
      <Section className="pt-4">
        <SectionTitle icon={Clock} title="Net Terms for Qualified Businesses" subtitle="Flexible payment schedules for established businesses." />
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[
            { term: 'Net 30', desc: 'Pay within 30 days of invoice date. Best for businesses with steady cash flow.' },
            { term: 'Net 60', desc: 'Pay within 60 days of invoice date. Ideal for seasonal operations planning ahead.' },
            { term: 'Net 90', desc: 'Pay within 90 days of invoice date. For large orders and enterprise accounts.' },
          ].map((t, i) => (
            <div key={i} className="rounded-xl border p-6 text-center" style={{ background: BRAND.surface, borderColor: BRAND.border }}>
              <p className="text-3xl font-black mb-1" style={{ color: BRAND.orange }}>{t.term}</p>
              <p className="text-sm" style={{ color: BRAND.slateLight }}>{t.desc}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border p-6" style={{ background: BRAND.surfaceLight, borderColor: BRAND.border }}>
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.white }}>
            <FileText size={18} style={{ color: BRAND.orange }} /> Qualification Requirements
          </h3>
          <ul className="space-y-2">
            {[
              'Active business entity (LLC, Corp, Sole Proprietorship with EIN)',
              'Minimum 2 years in operation',
              'Completed credit application with trade references',
              'Satisfactory credit review',
              'Minimum order of $5,000 for first net-terms purchase',
            ].map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: BRAND.slateLight }}>
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: BRAND.orange }} /> {r}
              </li>
            ))}
          </ul>
          <p className="text-xs mt-4" style={{ color: BRAND.slateLight }}>
            Apply during checkout or contact our sales team to start the approval process.
          </p>
        </div>
      </Section>

      {/* ── Why DTF ─────────────────────────────────────────────────── */}
      <Section>
        <SectionTitle icon={Zap} title="Why DTF Printing?" subtitle="The fastest-growing decoration method in the industry." />
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {[
            { icon: Layers, title: 'Any Fabric', desc: 'Print on cotton, polyester, blends, nylon, denim, leather, and more.' },
            { icon: Star, title: 'No Weeding', desc: 'Full-color, photographic prints with fine detail — no cutting or weeding required.' },
            { icon: TrendingUp, title: 'Low Startup Cost', desc: 'Fraction of the cost of screen printing setup. Start producing same day.' },
            { icon: Target, title: 'On-Demand', desc: 'No minimum orders. Print one piece or ten thousand — same quality.' },
            { icon: Shield, title: 'Wash Durable', desc: 'Vibrant transfers that withstand 50+ wash cycles without fading or cracking.' },
            { icon: Zap, title: 'Dark & Light', desc: 'Works beautifully on both dark and light garments with white ink under-base.' },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border p-5" style={{ background: BRAND.surface, borderColor: BRAND.border }}>
              <item.icon size={22} className="mb-2" style={{ color: BRAND.orange }} />
              <h4 className="font-bold text-sm mb-1" style={{ color: BRAND.white }}>{item.title}</h4>
              <p className="text-xs" style={{ color: BRAND.slateLight }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Portal / Demo ───────────────────────────────────────────── */}
      <Section className="pt-4">
        <div className="rounded-xl border p-8 text-center" style={{ background: `linear-gradient(135deg, ${BRAND.surface}, ${BRAND.surfaceLight})`, borderColor: BRAND.border }}>
          <Globe size={36} className="mx-auto mb-4" style={{ color: BRAND.orange }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: BRAND.white }}>ForgePress Dealer Portal</h2>
          <p className="text-sm max-w-lg mx-auto mb-6" style={{ color: BRAND.slateLight }}>
            Access wholesale pricing, manage orders, track shipments, and submit net-terms applications — all from your personalized dealer dashboard. Request a demo to see the full platform in action.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#contact" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:brightness-110"
              style={{ background: BRAND.orange, color: '#fff' }}>
              Request Demo <ArrowRight size={15} />
            </a>
            <a href="#contact" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm border transition-all hover:bg-white/5"
              style={{ borderColor: BRAND.border, color: BRAND.white }}>
              Portal Access <Globe size={15} />
            </a>
          </div>
        </div>
      </Section>

      {/* ── Contact ─────────────────────────────────────────────────── */}
      <div id="contact">
        <Section>
          <SectionTitle icon={Phone} title="Contact Us" subtitle="Our sales team is ready to help you find the right equipment." />
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Phone, label: 'Call Us', value: '(888) 555-0199', sub: 'Mon–Fri, 8am–6pm EST' },
              { icon: Mail, label: 'Email', value: 'sales@forgepress.com', sub: 'Response within 2 hours' },
              { icon: Globe, label: 'Website', value: 'forgepress.com', sub: 'Live chat available' },
            ].map((c, i) => (
              <div key={i} className="rounded-xl border p-6 text-center" style={{ background: BRAND.surface, borderColor: BRAND.border }}>
                <c.icon size={28} className="mx-auto mb-3" style={{ color: BRAND.orange }} />
                <p className="font-bold text-sm mb-0.5" style={{ color: BRAND.white }}>{c.label}</p>
                <p className="font-semibold" style={{ color: BRAND.orange }}>{c.value}</p>
                <p className="text-xs mt-1" style={{ color: BRAND.slateLight }}>{c.sub}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── Download PDF Button ─────────────────────────────────────── */}
      <Section className="pt-0 pb-8">
        <div className="text-center">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:brightness-110 cursor-pointer"
            style={{ background: BRAND.orange, color: '#fff' }}
          >
            <Download size={20} />
            {copied ? 'Copied to Clipboard!' : 'Download PDF'}
          </button>
          <p className="text-xs mt-3" style={{ color: BRAND.slateLight }}>
            Copies formatted brochure text to your clipboard for pasting into any document.
          </p>
        </div>
      </Section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t py-8 px-6 text-center" style={{ borderColor: BRAND.border }}>
        <p className="text-xs" style={{ color: BRAND.slateLight }}>
          &copy; {new Date().getFullYear()} ForgePress Industries. All rights reserved. Equipment specifications subject to change.
        </p>
      </footer>
    </div>
  );
}
