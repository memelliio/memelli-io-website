'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Rocket,
  DollarSign,
  Megaphone,
  Wrench,
  Check,
  Clock,
  FileText,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Zap,
} from 'lucide-react';

/* ── Service Data ─────────────────────────────────────────────────── */

interface Service {
  id: string;
  name: string;
  tagline: string;
  price: string;
  priceNote?: string;
  recurring?: boolean;
  icon: React.ReactNode;
  accent: string;
  accentBorder: string;
  accentBg: string;
  accentText: string;
  timeline: string;
  scope: string;
  deliverables: string[];
  includes: string[];
}

const SERVICES: Service[] = [
  {
    id: 'credit-repair-setup',
    name: 'Credit Repair Setup',
    tagline: 'Full onboarding, dispute letters, and monitoring — we handle everything.',
    price: '$497',
    icon: <Shield className="h-7 w-7" />,
    accent: 'from-emerald-500/15 to-emerald-600/5',
    accentBorder: 'border-emerald-500/15',
    accentBg: 'bg-emerald-500/10',
    accentText: 'text-emerald-400',
    timeline: '5-7 business days',
    scope: 'Complete credit repair onboarding from intake to first dispute round.',
    deliverables: [
      'Full client intake and credit report pull',
      'Bureau-specific dispute letters (all 3 bureaus)',
      'Creditor direct dispute letters',
      'Credit monitoring setup and walkthrough',
      'Dispute tracking dashboard access',
      'First 30-day follow-up review',
    ],
    includes: [
      'Personal credit analyst review',
      'Custom dispute strategy',
      'Monitoring portal access',
      'Progress tracking',
    ],
  },
  {
    id: 'business-launch',
    name: 'Business Launch',
    tagline: 'Website, brand identity, marketing, and CRM — launch-ready in days.',
    price: '$997',
    icon: <Rocket className="h-7 w-7" />,
    accent: 'from-blue-500/15 to-blue-600/5',
    accentBorder: 'border-blue-500/15',
    accentBg: 'bg-blue-500/10',
    accentText: 'text-blue-400',
    timeline: '7-10 business days',
    scope: 'Everything you need to launch a professional online business from scratch.',
    deliverables: [
      'Custom website (5+ pages, mobile responsive)',
      'Brand identity (logo, colors, typography)',
      'Marketing copy and content strategy',
      'CRM setup with pipeline and automations',
      'Social media profile configuration',
      'Email template pack (welcome, onboarding, promo)',
      'Domain connection and SSL setup',
      'Launch checklist and go-live support',
    ],
    includes: [
      'Professional design',
      'SEO-optimized pages',
      'CRM pipeline',
      'Marketing assets',
    ],
  },
  {
    id: 'funding-package',
    name: 'Funding Package',
    tagline: 'Application prep, document assembly, and lender matching — ready to fund.',
    price: '$697',
    icon: <DollarSign className="h-7 w-7" />,
    accent: 'from-amber-500/15 to-amber-600/5',
    accentBorder: 'border-amber-500/15',
    accentBg: 'bg-amber-500/10',
    accentText: 'text-amber-400',
    timeline: '5-7 business days',
    scope: 'Complete funding preparation package from document assembly to lender submission.',
    deliverables: [
      'Business funding readiness assessment',
      'Document assembly (financials, bank statements, tax returns)',
      'Application preparation for top lenders',
      'Lender matching based on profile and needs',
      'Pre-qualification submissions',
      'Funding strategy roadmap',
      'Follow-up and status tracking',
    ],
    includes: [
      'Funding analyst review',
      'Multi-lender matching',
      'Application prep',
      'Status tracking',
    ],
  },
  {
    id: 'marketing-autopilot',
    name: 'Marketing Autopilot',
    tagline: 'Ongoing content, social, email, and SEO — your marketing runs itself.',
    price: '$397',
    priceNote: '/mo',
    recurring: true,
    icon: <Megaphone className="h-7 w-7" />,
    accent: 'from-purple-500/15 to-purple-600/5',
    accentBorder: 'border-primary/15',
    accentBg: 'bg-primary/10',
    accentText: 'text-primary',
    timeline: 'Ongoing monthly',
    scope: 'Hands-off marketing execution delivered every month on autopilot.',
    deliverables: [
      '8 social media posts per month (designed + scheduled)',
      '2 blog articles per month (SEO-optimized)',
      '4 email campaigns per month',
      'Monthly SEO audit and optimization',
      'Content calendar planning',
      'Performance reporting dashboard',
      'Hashtag and keyword research',
      'Engagement monitoring and response',
    ],
    includes: [
      'Content creation',
      'Social scheduling',
      'Email campaigns',
      'SEO optimization',
    ],
  },
  {
    id: 'custom-build',
    name: 'Custom Build',
    tagline: 'Anything you need, built to spec — tell us what you want.',
    price: 'Quote',
    icon: <Wrench className="h-7 w-7" />,
    accent: 'from-red-500/15 to-red-600/5',
    accentBorder: 'border-red-500/15',
    accentBg: 'bg-red-500/10',
    accentText: 'text-red-400',
    timeline: 'Varies by scope',
    scope: 'Custom-scoped project tailored to your exact requirements.',
    deliverables: [
      'Discovery call and requirements gathering',
      'Custom project scope and timeline',
      'Dedicated build team assignment',
      'Progress updates and milestone reviews',
      'Quality assurance and testing',
      'Deployment and go-live support',
      'Post-launch support period',
    ],
    includes: [
      'Custom scoping',
      'Dedicated team',
      'QA testing',
      'Go-live support',
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

export default function DoneForYouPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-red-900/10 via-zinc-950 to-zinc-950 px-6 pt-24 pb-16 text-center">
        <Link
          href="/store"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-muted-foreground transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Store
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-4 py-1.5 text-xs font-medium text-red-400 mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          Done-For-You Services
        </div>
        <h1 className="text-5xl font-semibold tracking-tight text-white/90 mb-4">
          We Build It. You Launch It.
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light">
          Skip the learning curve. Our team handles everything from setup to delivery so you can focus on running your business.
        </p>
      </div>

      {/* ── Services Grid ──────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {SERVICES.map((service) => {
            const isExpanded = expandedId === service.id;
            const isCustom = service.id === 'custom-build';

            return (
              <div
                key={service.id}
                className={`group relative rounded-2xl border border-border bg-card backdrop-blur-xl overflow-hidden hover:border-border transition-all duration-300 ${
                  isCustom ? 'lg:col-span-2' : ''
                }`}
              >
                <div className="p-7">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${service.accent} border ${service.accentBorder} ${service.accentText} group-hover:scale-105 transition-transform duration-300`}
                      >
                        {service.icon}
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground group-hover:text-white transition-colors duration-200">
                          {service.name}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-md">
                          {service.tagline}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className={`inline-flex items-baseline gap-0.5 rounded-xl ${service.accentBg} border ${service.accentBorder} px-4 py-2`}
                      >
                        <span className="text-2xl font-bold text-white">{service.price}</span>
                        {service.priceNote && (
                          <span className="text-sm font-medium text-muted-foreground">{service.priceNote}</span>
                        )}
                      </div>
                      {service.recurring && (
                        <p className="text-[10px] text-muted-foreground mt-1.5">Cancel anytime</p>
                      )}
                    </div>
                  </div>

                  {/* Quick includes */}
                  <div className="flex flex-wrap gap-2 mt-5">
                    {service.includes.map((item, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-[11px] font-medium text-muted-foreground"
                      >
                        <Check className="h-3 w-3 text-muted-foreground" />
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* Timeline */}
                  <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{service.timeline}</span>
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : service.id)}
                    className="inline-flex items-center gap-1 mt-4 text-xs font-medium text-muted-foreground hover:text-muted-foreground transition-colors duration-200"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {isExpanded ? 'Hide details' : 'View scope & deliverables'}
                    <ChevronRight
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {/* Expanded details */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-out ${
                      isExpanded ? 'max-h-[600px] opacity-100 mt-5' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="rounded-xl border border-border bg-[hsl(var(--background))] p-5">
                      {/* Scope */}
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Scope
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{service.scope}</p>
                      </div>

                      {/* Deliverables */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                          Deliverables
                        </h4>
                        <ul className="space-y-2">
                          {service.deliverables.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                              <Check className={`h-4 w-4 shrink-0 mt-0.5 ${service.accentText}`} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-6">
                    {isCustom ? (
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-500 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-red-600/20 hover:shadow-red-500/30"
                      >
                        <Zap className="h-4 w-4" />
                        Request a Quote
                      </Link>
                    ) : (
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-500 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-red-600/20 hover:shadow-red-500/30"
                      >
                        <Zap className="h-4 w-4" />
                        Order Now
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Bottom CTA ─────────────────────────────────────────────── */}
        <div className="mt-16 rounded-2xl border border-border bg-gradient-to-br from-zinc-900/60 to-zinc-900/30 backdrop-blur-xl p-10 text-center">
          <h3 className="text-2xl font-semibold text-foreground mb-3">
            Not sure which service you need?
          </h3>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-6 leading-relaxed">
            Tell us about your situation and we will recommend the right package. No commitment, no pressure.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-6 py-3 text-sm font-medium text-foreground hover:bg-muted hover:border-border transition-all duration-200"
          >
            Talk to Us
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
