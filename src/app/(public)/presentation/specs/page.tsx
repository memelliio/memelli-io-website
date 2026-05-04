'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Zap, Server, Globe, Code2, Layout, ShieldCheck, Database,
  GitBranch, Cpu, Network, FileText, BarChart3, CreditCard, Users,
  Rocket, Lock, Layers, CheckCircle2, ChevronRight, ExternalLink,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════════ */

const BG = '#0F172A';
const BG_CARD = '#1E293B';
const ACCENT = '#F97316';
const ACCENT_GLOW = 'rgba(249, 115, 22, 0.15)';
const ACCENT_GLOW_STRONG = 'rgba(249, 115, 22, 0.35)';
const GREEN = '#22C55E';
const BLUE = '#3B82F6';
const PURPLE = '#A855F7';
const TEXT = '#F8FAFC';
const TEXT_DIM = '#94A3B8';

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

function Section({
  id,
  icon: Icon,
  title,
  children,
  accentColor = ACCENT,
}: {
  id: string;
  icon: React.ComponentType<any>;
  title: string;
  children: React.ReactNode;
  accentColor?: string;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      id={id}
      className="rounded-2xl p-8 border transition-all duration-700 mb-8"
      style={{
        background: BG_CARD,
        borderColor: visible ? `${accentColor}25` : 'rgba(255,255,255,0.03)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
      }}
    >
      <h2 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: TEXT }}>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TABLE OF CONTENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

const TOC = [
  { id: 'scope', label: 'System Scope' },
  { id: 'stack', label: 'Tech Stack' },
  { id: 'sitemap', label: 'Site Map' },
  { id: 'portal', label: 'Portal Map' },
  { id: 'checkout', label: 'Checkout Path' },
  { id: 'net-terms', label: 'Net Terms Path' },
  { id: 'investor', label: 'Investor Summary' },
  { id: 'deployment', label: 'Deployment Summary' },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   FLOW DIAGRAM COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

function FlowDiagram({ steps, color = ACCENT }: { steps: { label: string; detail?: string }[]; color?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {steps.map((step, i) => (
        <div key={i}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}
            >
              {i + 1}
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold" style={{ color: TEXT }}>{step.label}</span>
              {step.detail && (
                <span className="text-xs ml-2" style={{ color: TEXT_DIM }}>&mdash; {step.detail}</span>
              )}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="ml-[15px] h-4 border-l-2 border-dashed" style={{ borderColor: `${color}30` }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TECH STACK ITEM
   ═══════════════════════════════════════════════════════════════════════════════ */

function StackItem({ name, role, color }: { name: string; role: string; color: string }) {
  return (
    <div
      className="rounded-xl p-4 border"
      style={{ background: 'rgba(15, 23, 42, 0.5)', borderColor: `${color}20` }}
    >
      <div className="text-sm font-bold mb-1" style={{ color }}>{name}</div>
      <div className="text-xs" style={{ color: TEXT_DIM }}>{role}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function PresentationSpecsPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: `linear-gradient(135deg, ${BG} 0%, #1a1f3a 50%, ${BG} 100%)` }}
    >
      {/* Background glows */}
      <div
        className="fixed top-1/4 right-0 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none"
        style={{ background: ACCENT_GLOW, opacity: 0.2 }}
      />
      <div
        className="fixed bottom-0 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(59, 130, 246, 0.08)', opacity: 0.3 }}
      />

      {/* Header */}
      <header
        className="border-b sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'rgba(15, 23, 42, 0.85)', borderColor: 'rgba(249, 115, 22, 0.15)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/presentation/portal"
              className="flex items-center gap-2 text-sm transition-colors duration-200"
              style={{ color: TEXT_DIM }}
              onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_DIM)}
            >
              <ArrowLeft className="w-4 h-4" />
              Portal
            </Link>
            <div className="w-px h-6" style={{ background: 'rgba(249, 115, 22, 0.2)' }} />
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #EA580C)`, boxShadow: `0 0 20px ${ACCENT_GLOW_STRONG}` }}
              >
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: TEXT }}>ForgePress Industries</p>
                <p className="text-xs" style={{ color: TEXT_DIM }}>Technical Spec Sheet</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Cover */}
        <div
          className="rounded-2xl p-10 mb-10 border relative overflow-hidden text-center"
          style={{
            background: `linear-gradient(135deg, ${BG_CARD}, rgba(249, 115, 22, 0.05))`,
            borderColor: 'rgba(249, 115, 22, 0.2)',
            boxShadow: `0 0 60px ${ACCENT_GLOW}`,
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="w-5 h-5" style={{ color: ACCENT }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>
                Technical Documentation
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: TEXT }}>
              Platform Spec Sheet
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: TEXT_DIM }}>
              Complete technical specifications for the ForgePress Industries autonomous
              commerce platform &mdash; architecture, routes, deployment, and investor brief.
            </p>
          </div>
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
            style={{ background: `radial-gradient(circle, ${ACCENT_GLOW_STRONG}, transparent 70%)` }}
          />
        </div>

        {/* Table of Contents */}
        <div
          className="rounded-2xl p-6 border mb-10"
          style={{ background: BG_CARD, borderColor: 'rgba(249, 115, 22, 0.15)' }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: ACCENT }}>
            Contents
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors duration-200"
                style={{ color: TEXT_DIM }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${ACCENT}10`;
                  e.currentTarget.style.color = TEXT;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = TEXT_DIM;
                }}
              >
                <ChevronRight className="w-3 h-3" style={{ color: ACCENT }} />
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* ─── SYSTEM SCOPE ──────────────────────────────────────────────── */}
        <Section id="scope" icon={Globe} title="System Scope">
          <div className="space-y-4 text-sm" style={{ color: TEXT_DIM }}>
            <p>
              ForgePress Industries is a full-stack autonomous commerce platform built as a
              live demonstration of AI-driven enterprise software creation. The system encompasses:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {[
                { label: 'B2B Storefront', detail: 'Product catalog with industrial-grade product cards' },
                { label: 'Checkout System', detail: 'Multi-step checkout with payment processing' },
                { label: 'Net Terms Financing', detail: 'Business credit application and approval flow' },
                { label: 'Client Portal', detail: 'Authenticated access hub for all platform resources' },
                { label: 'Build Dashboard', detail: 'Real-time telemetry and performance metrics' },
                { label: 'Spec Sheet', detail: 'Complete technical documentation (this page)' },
                { label: 'Brand Brochure', detail: 'Marketing collateral with brand guidelines' },
                { label: 'Presentation Deck', detail: 'Executive overview and capability summary' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ background: 'rgba(15, 23, 42, 0.5)' }}
                >
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: GREEN }} />
                  <div>
                    <span className="text-sm font-semibold" style={{ color: TEXT }}>{item.label}</span>
                    <p className="text-xs" style={{ color: TEXT_DIM }}>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ─── TECH STACK ────────────────────────────────────────────────── */}
        <Section id="stack" icon={Code2} title="Tech Stack" accentColor={BLUE}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <StackItem name="Next.js 15" role="Frontend Framework (App Router)" color={BLUE} />
            <StackItem name="TypeScript" role="Type-Safe Language (Strict Mode)" color={BLUE} />
            <StackItem name="Tailwind CSS" role="Utility-First Styling" color="#06B6D4" />
            <StackItem name="React 19" role="UI Component Library" color="#61DAFB" />
            <StackItem name="Fastify 5" role="API Server Framework" color={ACCENT} />
            <StackItem name="Prisma 6" role="Database ORM / Schema" color={PURPLE} />
            <StackItem name="PostgreSQL" role="Primary Database (Railway)" color="#336791" />
            <StackItem name="Redis" role="Cache / Queue Backend" color="#DC382D" />
            <StackItem name="BullMQ" role="Job Queue Processing" color={ACCENT} />
            // <StackItem name="Vercel" role="Frontend Deployment" color={TEXT} />  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
            <StackItem name="Railway" role="API + DB + Redis Hosting" color={PURPLE} />
            <StackItem name="Lucide React" role="Icon System" color={GREEN} />
          </div>
        </Section>

        {/* ─── SITE MAP ──────────────────────────────────────────────────── */}
        <Section id="sitemap" icon={Layout} title="Site Map" accentColor={GREEN}>
          <div className="space-y-1">
            {[
              { route: '/presentation', label: 'Presentation Home', desc: 'Executive summary and capability overview' },
              { route: '/presentation/store', label: 'Storefront', desc: 'B2B product catalog and shopping experience' },
              { route: '/presentation/checkout', label: 'Checkout', desc: 'Multi-step order processing flow' },
              { route: '/presentation/net-terms', label: 'Net Terms', desc: 'Business credit application and financing' },
              { route: '/presentation/portal', label: 'Client Portal', desc: 'Authenticated resource hub (login gate)' },
              { route: '/presentation/dashboard', label: 'Build Dashboard', desc: 'Autonomous build telemetry and metrics' },
              { route: '/presentation/specs', label: 'Spec Sheet', desc: 'Technical documentation (this page)' },
            ].map((item, i) => (
              <div
                key={item.route}
                className="flex items-center gap-4 p-3 rounded-lg transition-colors duration-200"
                style={{ background: i % 2 === 0 ? 'rgba(15, 23, 42, 0.3)' : 'transparent' }}
              >
                <code
                  className="text-xs font-mono px-2 py-1 rounded flex-shrink-0 min-w-[220px]"
                  style={{ background: `${GREEN}10`, color: GREEN }}
                >
                  {item.route}
                </code>
                <span className="text-sm font-semibold" style={{ color: TEXT }}>{item.label}</span>
                <span className="text-xs hidden md:inline" style={{ color: TEXT_DIM }}>&mdash; {item.desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ─── PORTAL MAP ────────────────────────────────────────────────── */}
        <Section id="portal" icon={Lock} title="Portal Map" accentColor={PURPLE}>
          <p className="text-sm mb-6" style={{ color: TEXT_DIM }}>
            The client portal provides authenticated access to all platform resources.
            After login, users see a branded dashboard with navigation cards linking to
            each section of the platform.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl p-5 border" style={{ background: 'rgba(15, 23, 42, 0.5)', borderColor: `${PURPLE}20` }}>
              <h4 className="text-sm font-bold mb-3" style={{ color: PURPLE }}>Authentication</h4>
              <div className="space-y-2 text-xs" style={{ color: TEXT_DIM }}>
                <p>Email + Password login gate</p>
                <p>Pre-filled demo credentials for presentation</p>
                <p>Session-based (client-side state)</p>
                <p>Production-ready JWT pattern</p>
              </div>
            </div>
            <div className="rounded-xl p-5 border" style={{ background: 'rgba(15, 23, 42, 0.5)', borderColor: `${PURPLE}20` }}>
              <h4 className="text-sm font-bold mb-3" style={{ color: PURPLE }}>Portal Resources</h4>
              <div className="space-y-2 text-xs" style={{ color: TEXT_DIM }}>
                {['Presentation Summary', 'Spec Sheet', 'Brochure', 'Marketing Materials', 'Store Demo', 'Build Dashboard'].map((r) => (
                  <div key={r} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3" style={{ color: PURPLE }} />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ─── CHECKOUT PATH ─────────────────────────────────────────────── */}
        <Section id="checkout" icon={CreditCard} title="Checkout Path" accentColor={ACCENT}>
          <p className="text-sm mb-6" style={{ color: TEXT_DIM }}>
            Standard B2B checkout flow from cart to order confirmation.
          </p>
          <FlowDiagram
            color={ACCENT}
            steps={[
              { label: 'Browse Catalog', detail: 'Product selection with quantity controls' },
              { label: 'Add to Cart', detail: 'Cart state management with running totals' },
              { label: 'Shipping Information', detail: 'Business address and contact details' },
              { label: 'Payment Method', detail: 'Card, ACH, or purchase order selection' },
              { label: 'Order Review', detail: 'Final summary with line items and tax' },
              { label: 'Order Confirmation', detail: 'Confirmation number and receipt generation' },
            ]}
          />
        </Section>

        {/* ─── NET TERMS PATH ────────────────────────────────────────────── */}
        <Section id="net-terms" icon={ShieldCheck} title="Net Terms Path" accentColor={GREEN}>
          <p className="text-sm mb-6" style={{ color: TEXT_DIM }}>
            Business credit application flow for net-30/60/90 term financing.
          </p>
          <FlowDiagram
            color={GREEN}
            steps={[
              { label: 'Apply for Net Terms', detail: 'Entry from checkout or standalone application' },
              { label: 'Business Information', detail: 'Legal name, EIN, DUNS, industry, revenue' },
              { label: 'Trade References', detail: 'Minimum 3 business credit references' },
              { label: 'Bank Reference', detail: 'Primary business banking relationship' },
              { label: 'Credit Review', detail: 'Automated scoring + manual review queue' },
              { label: 'Approval & Terms', detail: 'Credit limit, payment terms, and conditions issued' },
              { label: 'Activate Terms', detail: 'Net terms available as checkout payment method' },
            ]}
          />
        </Section>

        {/* ─── INVESTOR SUMMARY ──────────────────────────────────────────── */}
        <Section id="investor" icon={BarChart3} title="Investor Summary" accentColor={ACCENT}>
          <div className="space-y-5 text-sm" style={{ color: TEXT_DIM }}>
            <p>
              This demonstration represents a proof of concept for <strong style={{ color: TEXT }}>autonomous
              enterprise platform generation</strong>. The key investment thesis:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  metric: '< 15 min',
                  label: 'Build Time',
                  detail: 'Full platform from natural language command to production deployment',
                },
                {
                  metric: '3,000+',
                  label: 'Lines of Code',
                  detail: 'Production-quality TypeScript across 15+ files and 7 modules',
                },
                {
                  metric: '7',
                  label: 'Complete Modules',
                  detail: 'Storefront, checkout, financing, portal, dashboard, specs, brochure',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl p-5 border text-center"
                  style={{ background: 'rgba(15, 23, 42, 0.5)', borderColor: `${ACCENT}20` }}
                >
                  <div className="text-3xl font-bold mb-1" style={{ color: ACCENT }}>{item.metric}</div>
                  <div className="text-sm font-semibold mb-2" style={{ color: TEXT }}>{item.label}</div>
                  <div className="text-xs" style={{ color: TEXT_DIM }}>{item.detail}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-5 border mt-4" style={{ background: 'rgba(15, 23, 42, 0.5)', borderColor: `${ACCENT}15` }}>
              <h4 className="text-sm font-bold mb-3" style={{ color: TEXT }}>Value Proposition</h4>
              <ul className="space-y-2">
                {[
                  'Reduce enterprise platform build time from months to minutes',
                  'Autonomous agent workforce eliminates manual development bottlenecks',
                  'Production-grade output with enterprise security and scalability patterns',
                  'White-label capable for multi-tenant SaaS deployment',
                  'Expandable to any industry vertical (commerce, CRM, coaching, SEO)',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <Rocket className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* ─── DEPLOYMENT SUMMARY ────────────────────────────────────────── */}
        <Section id="deployment" icon={Server} title="Deployment Summary" accentColor={GREEN}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl p-5 border" style={{ background: 'rgba(15, 23, 42, 0.5)', borderColor: `${GREEN}20` }}>
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: GREEN }}>
                  <Globe className="w-4 h-4" />
                  // Frontend (Vercel)  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
                </h4>
                <div className="space-y-2 text-xs" style={{ color: TEXT_DIM }}>
                  <p><strong style={{ color: TEXT }}>Framework:</strong> Next.js 15 (App Router)</p>
                  <p><strong style={{ color: TEXT }}>Build:</strong> Static + SSR hybrid</p>
                  // <p><strong style={{ color: TEXT }}>CDN:</strong> Vercel Edge Network (global)</p>  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
                  // <p><strong style={{ color: TEXT }}>SSL:</strong> Automatic via Vercel</p>  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
                  <p><strong style={{ color: TEXT }}>Status:</strong> <span style={{ color: GREEN }}>LIVE</span></p>
                </div>
              </div>

              <div className="rounded-xl p-5 border" style={{ background: 'rgba(15, 23, 42, 0.5)', borderColor: `${GREEN}20` }}>
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: GREEN }}>
                  <Server className="w-4 h-4" />
                  Backend (Railway)
                </h4>
                <div className="space-y-2 text-xs" style={{ color: TEXT_DIM }}>
                  <p><strong style={{ color: TEXT }}>API:</strong> Fastify 5 on Railway</p>
                  <p><strong style={{ color: TEXT }}>Database:</strong> PostgreSQL (Railway Postgres)</p>
                  <p><strong style={{ color: TEXT }}>Cache:</strong> Redis (Railway)</p>
                  <p><strong style={{ color: TEXT }}>Workers:</strong> BullMQ queue processors</p>
                  <p><strong style={{ color: TEXT }}>Status:</strong> <span style={{ color: GREEN }}>LIVE</span></p>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-5 border" style={{ background: 'rgba(15, 23, 42, 0.5)', borderColor: `${GREEN}15` }}>
              <h4 className="text-sm font-bold mb-3" style={{ color: TEXT }}>Infrastructure Topology</h4>
              <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: TEXT_DIM }}>
                {[
                  // { label: 'Vercel', sub: 'Frontend', color: TEXT },  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
                  { label: 'Railway API', sub: 'Backend', color: ACCENT },
                  { label: 'PostgreSQL', sub: 'Database', color: BLUE },
                  { label: 'Redis', sub: 'Cache/Queue', color: '#DC382D' },
                  { label: 'BullMQ', sub: 'Workers', color: PURPLE },
                ].map((node, i, arr) => (
                  <div key={node.label} className="flex items-center gap-3">
                    <div
                      className="px-4 py-2 rounded-lg border text-center"
                      style={{ borderColor: `${node.color}30`, background: `${node.color}08` }}
                    >
                      <div className="font-bold" style={{ color: node.color }}>{node.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: TEXT_DIM }}>{node.sub}</div>
                    </div>
                    {i < arr.length - 1 && (
                      <ChevronRight className="w-4 h-4" style={{ color: TEXT_DIM }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="h-px mb-8" style={{ background: `linear-gradient(to right, transparent, ${ACCENT}20, transparent)` }} />
          <p className="text-xs" style={{ color: TEXT_DIM }}>
            ForgePress Industries &mdash; Technical Spec Sheet &mdash; Powered by Memelli Universe
          </p>
        </div>
      </main>
    </div>
  );
}
