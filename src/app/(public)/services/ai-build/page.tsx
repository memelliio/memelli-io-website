'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const RED = '#E11D2E';

/* ------------------------------------------------------------------ */
/*  Data — What We Build                                               */
/* ------------------------------------------------------------------ */

const deliverables = [
  { icon: '🌐', title: 'Full Websites', desc: 'Landing pages, multi-page sites, e-commerce storefronts', price: '$199', example: 'Company landing page with animations' },
  { icon: '📊', title: 'Web Applications', desc: 'Dashboards, portals, CRMs, admin panels', price: '$499', example: 'Client management dashboard' },
  { icon: '📕', title: 'Marketing Materials', desc: 'Ebooks, slide decks, brochures, one-pagers', price: '$79', example: '40-page branded ebook' },
  { icon: '🛒', title: 'E-Commerce Stores', desc: 'Products, cart, checkout, inventory management', price: '$499', example: 'Full Shopify-style storefront' },
  { icon: '🎓', title: 'Course Platforms', desc: 'Lessons, quizzes, certificates, progress tracking', price: '$499', example: 'Online academy with 20 modules' },
  { icon: '🔐', title: 'Client Portals', desc: 'Login, documents, status tracking, messaging', price: '$399', example: 'Secure document sharing portal' },
  { icon: '📅', title: 'Booking Systems', desc: 'Scheduling, availability, payments, reminders', price: '$299', example: 'Appointment booking with Stripe' },
  { icon: '📈', title: 'Analytics Dashboards', desc: 'Charts, reports, exports, real-time data', price: '$399', example: 'KPI dashboard with live charts' },
  { icon: '✉️', title: 'Email Template Systems', desc: 'Responsive templates, sequences, A/B testing', price: '$89', example: 'Welcome sequence with 10 emails' },
  { icon: '🤝', title: 'Affiliate Platforms', desc: 'Referral tracking, commissions, partner portals', price: '$499', example: 'Two-tier affiliate network' },
  { icon: '📱', title: 'Mobile-Responsive Everything', desc: 'Every build works perfectly on all devices', price: 'Included', example: 'Pixel-perfect on phone, tablet, desktop' },
];

/* ------------------------------------------------------------------ */
/*  Data — Service Packages                                            */
/* ------------------------------------------------------------------ */

const packages = [
  {
    name: 'Starter',
    price: '$199',
    period: '',
    popular: false,
    accent: 'border-zinc-700',
    features: [
      '1 custom page or product',
      'Responsive design',
      'Basic animations',
      '48-hour delivery',
      '1 revision round',
      'Hosted preview link',
    ],
  },
  {
    name: 'Professional',
    price: '$499',
    period: '',
    popular: true,
    accent: 'border-red-500/60',
    features: [
      'Up to 5 pages or products',
      'Advanced animations & interactions',
      'API integration',
      '24-hour delivery',
      '3 revision rounds',
      'Source code included',
      'SEO meta tags',
      'Analytics integration',
    ],
  },
  {
    name: 'Enterprise',
    price: '$1,499',
    period: '',
    popular: false,
    accent: 'border-amber-500/60',
    features: [
      'Up to 20 pages or products',
      'Full application build',
      'Database + backend',
      'Authentication system',
      '1-week delivery',
      'Unlimited revisions',
      'Dedicated agent team',
      'Ongoing support (30 days)',
      'Deployment included',
      'Custom domain setup',
    ],
  },
  {
    name: 'Custom',
    price: 'Contact Us',
    period: '',
    popular: false,
    accent: 'border-violet-500/60',
    features: [
      'Unlimited scope',
      'Full platform builds',
      'White-label ready',
      'Custom integrations',
      'Dedicated project manager',
      'SLA & priority queue',
      'Custom quote within 24 hours',
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Data — Add-Ons                                                     */
/* ------------------------------------------------------------------ */

const addOns = [
  { title: 'Web Banner Set', desc: '5 sizes for ads & social', price: '$49' },
  { title: 'Animated Presentation', desc: '10+ slides with motion', price: '$99' },
  { title: 'Marketing Ebook', desc: 'Branded, designed, ready to publish', price: '$79' },
  { title: 'Social Media Kit', desc: 'Templates for all platforms', price: '$59' },
  { title: 'SEO Optimization', desc: 'Meta, schema, speed, keywords', price: '$149' },
  { title: 'Email Template Pack', desc: '10 responsive email templates', price: '$89' },
  { title: 'Logo Animation', desc: 'Animated logo reveal', price: '$69' },
  { title: 'Custom Domain Setup', desc: 'DNS, SSL, deployment', price: '$29' },
  { title: 'Monthly Maintenance', desc: 'Updates, fixes, monitoring', price: '$99/mo' },
  { title: 'Priority Delivery', desc: 'Same-day turnaround', price: '+50%' },
];

/* ------------------------------------------------------------------ */
/*  Data — Portfolio                                                   */
/* ------------------------------------------------------------------ */

const portfolio = [
  { title: 'Marketing Ebook', time: '9 minutes', pages: '40 pages', color: 'from-red-500/20 to-red-900/10' },
  { title: '17-Slide Power Deck', time: '3.7 minutes', pages: '17 slides', color: 'from-violet-500/20 to-violet-900/10' },
  { title: 'Factory Dashboard', time: '6.3 minutes', pages: 'Full app', color: 'from-amber-500/20 to-amber-900/10' },
  { title: 'Window Manager', time: '1.6 minutes', pages: 'Component', color: 'from-emerald-500/20 to-emerald-900/10' },
];

/* ------------------------------------------------------------------ */
/*  Data — Stats                                                       */
/* ------------------------------------------------------------------ */

const stats = [
  { label: 'Pages Built', value: 270, suffix: '+' },
  { label: 'Lines Per Session', value: 10000, suffix: '+' },
  { label: 'Type Errors', value: 0, suffix: '' },
  { label: 'Cost Savings', value: 99.7, suffix: '%' },
  { label: 'Faster Than Humans', value: 14, suffix: 'x' },
  { label: 'Satisfaction', value: 100, suffix: '%' },
];

/* ------------------------------------------------------------------ */
/*  Data — FAQ                                                         */
/* ------------------------------------------------------------------ */

const faqs = [
  { q: 'How fast is delivery?', a: 'Most projects are completed in under 1 hour. Complex applications with backends and databases are delivered within 24 hours. Enterprise builds take up to 1 week depending on scope.' },
  { q: 'Do I get the source code?', a: 'Yes, source code is included with Professional and above packages. Starter includes a hosted preview and deployment, but source code can be added for an additional fee.' },
  { q: 'Can you build anything?', a: 'If it is digital, we can build it. Websites, applications, dashboards, portals, course platforms, e-commerce stores, marketing materials, and more. If you can describe it, our agents can build it.' },
  { q: 'What technology do you use?', a: 'We build with Next.js, TypeScript, Tailwind CSS, and production-grade infrastructure. Every build is modern, performant, accessible, and production-ready out of the box.' },
  { q: 'Who are the agents?', a: 'Our agents are AI workers powered by Claude, supervised by Melli — our AI operations manager. They work in parallel teams, each specializing in different aspects of your build.' },
  { q: 'What if I am not happy?', a: 'Enterprise plans include unlimited revisions. Professional includes 3 rounds. We also offer a full money-back guarantee if the deliverable does not meet the agreed specifications.' },
];

/* ------------------------------------------------------------------ */
/*  Data — How It Works                                                */
/* ------------------------------------------------------------------ */

const steps = [
  { step: '01', title: 'Describe Your Vision', desc: 'Send text, voice notes, or screenshots. Describe what you need in plain language.', icon: '💬' },
  { step: '02', title: 'Melli Dispatches Agents', desc: 'Your project is decomposed into tasks. A parallel AI team is assigned instantly.', icon: '🚀' },
  { step: '03', title: 'Watch It Being Built', desc: 'Get live factory view access. See your project assembled in real time by AI agents.', icon: '👁️' },
  { step: '04', title: 'Review & Launch', desc: 'Your build is delivered, deployed, and live. Review it, request changes, go live.', icon: '✅' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.3 4.3a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4L6.6 9.6l5.3-5.3a1 1 0 0 1 1.4 0Z" fill="currentColor" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Counter                                                   */
/* ------------------------------------------------------------------ */

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * value * 10) / 10);
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  const formatted = value >= 1000 ? display.toLocaleString('en-US', { maximumFractionDigits: 0 }) : Number.isInteger(value) ? display.toFixed(0) : display.toFixed(1);

  return (
    <div ref={ref} className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
      {formatted}
      {suffix}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Agent Dots (Hero background)                              */
/* ------------------------------------------------------------------ */

function AgentDots() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 24 }).map((_, i) => {
        const size = 4 + Math.random() * 4;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = 3 + Math.random() * 4;
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: `${top}%`,
              background: i % 3 === 0 ? RED : i % 3 === 1 ? '#3b82f6' : '#f59e0b',
              opacity: 0.4,
              animation: `agentFloat ${duration}s ease-in-out ${delay}s infinite alternate`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes agentFloat {
          0% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { opacity: 0.7; }
          100% { transform: translateY(-30px) scale(1.3); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AIBuildServicePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', description: '', package: 'professional' });

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden px-6 pb-24 pt-28 text-center">
        <AgentDots />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-red-600/10 blur-[200px]" />
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/40 px-5 py-2 text-sm font-semibold text-red-300 backdrop-blur-sm">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
            Starting at $199
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-white">AI Build</span>{' '}
            <span className="bg-gradient-to-r from-red-400 via-rose-400 to-violet-400 bg-clip-text text-transparent">
              Service
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Custom digital products built by AI agents in under an hour.
            Websites, applications, dashboards, ebooks — production-ready and deployed.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#order"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(225,29,46,0.25)] transition-all duration-200 hover:shadow-[0_0_50px_rgba(225,29,46,0.35)] hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${RED}, #b91c1c)` }}
            >
              Order Now
            </a>
            <a
              href="#portfolio"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-card px-8 py-3.5 text-sm font-semibold text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:bg-muted hover:border-white/20"
            >
              See Examples
            </a>
          </div>
        </div>
      </section>

      {/* ===== WHAT WE BUILD ===== */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              What We{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">Build</span>
            </h2>
            <p className="mt-4 text-muted-foreground">Every deliverable is production-grade, responsive, and deployed.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {deliverables.map((d) => (
              <div
                key={d.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 backdrop-blur-2xl transition-all duration-200 hover:border-red-500/20 hover:bg-card hover:shadow-[0_0_40px_rgba(225,29,46,0.06)]"
              >
                <div className="text-3xl">{d.icon}</div>
                <h3 className="mt-3 text-sm font-bold text-white">{d.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{d.desc}</p>
                <p className="mt-2 text-xs text-muted-foreground italic">{d.example}</p>
                <div className="mt-3 inline-flex rounded-full bg-red-950/40 px-3 py-1 text-xs font-semibold text-red-300">
                  from {d.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SERVICE PACKAGES ===== */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Service{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Packages
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">Choose your scope. Every package includes production-ready delivery.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`relative flex flex-col rounded-2xl border backdrop-blur-2xl transition-all duration-200 ${
                  pkg.popular
                    ? 'border-red-500/30 bg-red-950/20 shadow-[0_0_60px_rgba(225,29,46,0.08)] scale-[1.03]'
                    : 'border-border bg-card hover:border-border'
                }`}
              >
                {/* Top border glow */}
                <div
                  className={`h-px rounded-t-2xl ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent'
                      : 'bg-gradient-to-r from-transparent via-zinc-700 to-transparent'
                  }`}
                />

                {pkg.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className="rounded-full px-4 py-1 text-xs font-bold text-white shadow-[0_0_20px_rgba(225,29,46,0.3)]"
                      style={{ backgroundColor: RED }}
                    >
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-7 pb-0">
                  <h3 className="text-lg font-semibold text-foreground">{pkg.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-white">{pkg.price}</span>
                  </div>
                </div>

                <ul className="mx-7 mb-6 mt-6 flex-1 space-y-3">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckIcon className="mt-0.5 shrink-0 text-red-400" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="p-7 pt-0">
                  <a
                    href={pkg.name === 'Custom' ? 'mailto:build@memelli.com' : '#order'}
                    className={`block w-full rounded-xl py-3 text-center text-sm font-bold transition-all duration-200 ${
                      pkg.popular
                        ? 'text-white shadow-[0_0_20px_rgba(225,29,46,0.15)] hover:shadow-[0_0_30px_rgba(225,29,46,0.25)]'
                        : 'border border-border bg-muted text-foreground hover:bg-muted'
                    }`}
                    style={pkg.popular ? { background: `linear-gradient(135deg, ${RED}, #b91c1c)` } : undefined}
                  >
                    {pkg.name === 'Custom' ? 'Contact Us' : 'Order Now'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="mt-4 text-muted-foreground">From description to deployment in 4 steps.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute right-0 top-12 hidden h-px w-6 translate-x-full bg-gradient-to-r from-zinc-700 to-transparent lg:block" />
                )}
                <div className="group rounded-2xl border border-border bg-card p-6 backdrop-blur-2xl transition-all duration-200 hover:border-red-500/20 hover:bg-card">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{s.icon}</span>
                    <span className="text-xs font-bold text-red-500">{s.step}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ADD-ONS ===== */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Add-Ons
              </span>{' '}
              & Upgrades
            </h2>
            <p className="mt-4 text-muted-foreground">Enhance any package with these extras.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {addOns.map((a) => (
              <div
                key={a.title}
                className="group rounded-2xl border border-border bg-card p-5 backdrop-blur-2xl transition-all duration-200 hover:border-violet-500/20 hover:bg-card"
              >
                <h4 className="text-sm font-bold text-white">{a.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground">{a.desc}</p>
                <div className="mt-3 inline-flex rounded-full bg-violet-950/40 px-3 py-1 text-xs font-semibold text-violet-300">
                  {a.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PORTFOLIO ===== */}
      <section id="portfolio" className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                This Session
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Real builds. Real times. All built simultaneously by AI agents.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {portfolio.map((p) => (
              <div
                key={p.title}
                className={`overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${p.color} p-8 backdrop-blur-2xl transition-all duration-200 hover:border-border hover:scale-[1.01]`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{p.title}</h3>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                    {p.pages}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-semibold text-emerald-300">Built in {p.time}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground italic">
              All projects built simultaneously by parallel AI agent teams, supervised by Melli.
            </p>
          </div>
        </div>
      </section>

      {/* ===== PROOF & STATS ===== */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              By The{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Numbers
              </span>
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 backdrop-blur-2xl text-center"
              >
                <AnimatedCounter value={s.value} suffix={s.suffix} />
                <p className="mt-2 text-sm font-medium text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently Asked{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-2xl"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted"
                >
                  {faq.q}
                  <span
                    className={`ml-4 shrink-0 text-lg text-muted-foreground transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  >
                    {'\u25BE'}
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    openFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-border px-6 py-4">
                      <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ORDER FORM / CTA ===== */}
      <section id="order" className="relative px-6 pb-28">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
          <div className="h-[500px] w-[500px] rounded-full bg-red-600/8 blur-[180px]" />
        </div>

        <div className="relative mx-auto max-w-2xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Build?
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Describe your project and our AI team will start immediately.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 backdrop-blur-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = `mailto:build@memelli.com?subject=AI Build Order — ${encodeURIComponent(formData.package)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\nPackage: ${formData.package}\n\nProject Description:\n${formData.description}`)}`;
              }}
              className="space-y-5"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors duration-200 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors duration-200 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20"
                    placeholder="jane@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Package</label>
                <select
                  value={formData.package}
                  onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-white outline-none transition-colors duration-200 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20"
                >
                  <option value="starter">Starter — $199</option>
                  <option value="professional">Professional — $499</option>
                  <option value="enterprise">Enterprise — $1,499</option>
                  <option value="custom">Custom — Contact Us</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Project Description</label>
                <textarea
                  required
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full resize-none rounded-xl border border-border bg-muted px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors duration-200 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20"
                  placeholder="Describe what you want built. Include details about pages, features, design preferences, and any examples or references..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(225,29,46,0.2)] transition-all duration-200 hover:shadow-[0_0_50px_rgba(225,29,46,0.3)] hover:scale-[1.01]"
                style={{ background: `linear-gradient(135deg, ${RED}, #b91c1c)` }}
              >
                Submit Build Order
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="h-px flex-1 bg-muted" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-muted" />
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/start"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-6 py-3 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:bg-muted hover:border-border"
              >
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Talk to Melli
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
