'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Globe, Users, Mail, MessageSquare, Phone, CalendarCheck,
  CreditCard, Search, Share2, BarChart3, UserCircle, Bot,
  Home, Dumbbell, UtensilsCrossed, Scissors, Camera, Briefcase,
  HardHat, Car, SprayCan, ChevronDown, ChevronRight, Sparkles,
  Zap, Check, ArrowRight, Play, Star, Quote, GraduationCap,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animated counter hook                                              */
/* ------------------------------------------------------------------ */

function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let frame: number;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [started, end, duration]);

  return { count, ref };
}

/* ------------------------------------------------------------------ */
/*  Fade-in on scroll                                                  */
/* ------------------------------------------------------------------ */

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, className: `transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}` };
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const included = [
  { icon: Globe, label: 'Custom Website', desc: 'Professional site built in minutes' },
  { icon: Users, label: 'CRM System', desc: 'Manage every lead and client' },
  { icon: Mail, label: 'Email Marketing', desc: 'Campaigns, sequences, automations' },
  { icon: MessageSquare, label: 'SMS System', desc: 'Two-way texting with clients' },
  { icon: Phone, label: 'Phone System', desc: 'Business line with call routing' },
  { icon: CalendarCheck, label: 'Appointment Booking', desc: 'Online scheduling & reminders' },
  { icon: CreditCard, label: 'Payment Processing', desc: 'Accept payments instantly' },
  { icon: Search, label: 'SEO Content Engine', desc: 'AI-written articles that rank' },
  { icon: Share2, label: 'Social Media Tools', desc: 'Post, schedule, engage' },
  { icon: BarChart3, label: 'Analytics Dashboard', desc: 'Real-time business metrics' },
  { icon: UserCircle, label: 'Client Portal', desc: 'Self-service for your customers' },
  { icon: Bot, label: 'AI Assistant (Melli)', desc: '24/7 intelligent business partner' },
];

const industries = [
  { icon: Home, label: 'Real Estate', color: 'from-blue-500/20 to-blue-600/5' },
  { icon: GraduationCap, label: 'Coaching', color: 'from-purple-500/20 to-purple-600/5' },
  { icon: Dumbbell, label: 'Fitness', color: 'from-green-500/20 to-green-600/5' },
  { icon: UtensilsCrossed, label: 'Restaurant', color: 'from-orange-500/20 to-orange-600/5' },
  { icon: Scissors, label: 'Salon', color: 'from-pink-500/20 to-pink-600/5' },
  { icon: Camera, label: 'Photography', color: 'from-cyan-500/20 to-cyan-600/5' },
  { icon: Briefcase, label: 'Consulting', color: 'from-amber-500/20 to-amber-600/5' },
  { icon: HardHat, label: 'Construction', color: 'from-yellow-500/20 to-yellow-600/5' },
  { icon: Car, label: 'Auto Detail', color: 'from-red-500/20 to-red-600/5' },
  { icon: SprayCan, label: 'Cleaning Service', color: 'from-teal-500/20 to-teal-600/5' },
];

const steps = [
  { num: '01', title: 'Choose Your Template', desc: 'Pick your industry. We have pre-built configurations tailored for your business type.' },
  { num: '02', title: 'Customize Your Brand', desc: 'Add your logo, colors, and business details. Make it yours in minutes.' },
  { num: '03', title: 'AI Builds Everything', desc: 'Melli configures your website, CRM, emails, phone, payments, and more automatically.' },
  { num: '04', title: 'Launch & Grow', desc: 'Go live with a complete business system. Start accepting clients on day one.' },
];

const plans = [
  {
    name: 'Starter',
    price: '$297',
    period: '/mo',
    desc: 'Everything you need to launch and run your business.',
    highlighted: false,
    features: [
      'Custom website (1 domain)',
      'CRM with 500 contacts',
      'Email marketing (5,000/mo)',
      'SMS system (500/mo)',
      'Appointment booking',
      'Payment processing',
      'Analytics dashboard',
      'Melli AI assistant',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    price: '$597',
    period: '/mo',
    badge: 'Most Popular',
    desc: 'Scale your business with advanced tools and unlimited reach.',
    highlighted: true,
    features: [
      'Everything in Starter',
      'Custom website (3 domains)',
      'CRM with 5,000 contacts',
      'Email marketing (25,000/mo)',
      'SMS system (2,500/mo)',
      'Phone system with routing',
      'SEO content engine',
      'Social media tools',
      'Client portal',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    price: '$997',
    period: '/mo',
    desc: 'Unlimited everything. White-glove setup. Dedicated support.',
    highlighted: false,
    features: [
      'Everything in Professional',
      'Unlimited domains',
      'Unlimited contacts',
      'Unlimited emails & SMS',
      'Advanced phone system',
      'Full SEO content engine',
      'White-label client portal',
      'Custom integrations',
      'Dedicated account manager',
      'Onboarding concierge',
    ],
  },
];

const faqs = [
  {
    q: 'How fast can I actually launch?',
    a: 'Most businesses are fully operational within 24 hours. Melli, our AI assistant, handles the heavy lifting — building your website, configuring your CRM, setting up email sequences, and connecting your payment processing. You just provide your brand details.',
  },
  {
    q: 'Do I need any technical skills?',
    a: 'Absolutely not. Everything is built through conversation with Melli. Tell her what you need, and she builds it. No coding, no design skills, no tech knowledge required.',
  },
  {
    q: 'Can I keep my existing domain name?',
    a: 'Yes. You can connect any domain you already own, or we can help you register a new one. DNS setup is handled automatically.',
  },
  {
    q: 'What happens if I want to switch templates later?',
    a: 'You can change your template or completely redesign your site at any time. Your data, contacts, and settings are preserved — only the visual layer changes.',
  },
  {
    q: 'Is there a contract or can I cancel anytime?',
    a: 'No long-term contracts. All plans are month-to-month. You can upgrade, downgrade, or cancel at any time from your dashboard.',
  },
  {
    q: 'What makes this different from Shopify or Squarespace?',
    a: 'Those platforms give you a website. We give you an entire business operating system — CRM, email, SMS, phone, payments, SEO, analytics, AI assistant, and client portal — all integrated and managed by AI. One platform, everything connected.',
  },
];

const testimonials = [
  { name: 'Sarah M.', role: 'Real Estate Agent', quote: 'I went from zero online presence to a fully operational business in one afternoon. Melli built everything while I was on a showing.' },
  { name: 'Marcus T.', role: 'Fitness Coach', quote: 'The all-in-one system replaced 6 different apps I was paying for. My clients love the portal and booking system.' },
  { name: 'Diana L.', role: 'Salon Owner', quote: 'I was skeptical about AI building my business, but the results speak for themselves. Bookings are up 340% since launch.' },
];

/* ------------------------------------------------------------------ */
/*  FAQ Accordion Item                                                 */
/* ------------------------------------------------------------------ */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="text-[15px] font-medium text-foreground pr-4">{q}</span>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-60 pb-5' : 'max-h-0'}`}
      >
        <p className="text-[14px] leading-relaxed text-muted-foreground">{a}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat Demo Panel                                                    */
/* ------------------------------------------------------------------ */

function ChatDemo() {
  const [messages, setMessages] = useState<{ from: 'jessica' | 'user'; text: string }[]>([]);
  const [step, setStep] = useState(0);

  const conversation = [
    { from: 'jessica' as const, text: "Hi! I'm Melli. Let's build your business. What industry are you in?" },
    { from: 'user' as const, text: "I'm a fitness coach." },
    { from: 'jessica' as const, text: "Great choice! I'm setting up your fitness coaching template with booking, payments, and client portal..." },
    { from: 'jessica' as const, text: "Done! Your website is live, CRM is configured, and booking calendar is ready. Want to customize your brand colors?" },
  ];

  const advanceChat = useCallback(() => {
    if (step < conversation.length) {
      setMessages((prev) => [...prev, conversation[step]]);
      setStep((s) => s + 1);
    }
  }, [step]);

  useEffect(() => {
    const timer = setTimeout(advanceChat, step === 0 ? 1000 : 2000);
    return () => clearTimeout(timer);
  }, [step, advanceChat]);

  return (
    <div className="rounded-2xl border border-border bg-card backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-foreground">Melli</p>
          <p className="text-[11px] text-green-400">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-3 p-5 min-h-[260px]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300 ${
              msg.from === 'jessica'
                ? 'self-start bg-muted text-foreground'
                : 'self-end bg-red-600/90 text-white'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {step < conversation.length && (
          <div className="flex items-center gap-1.5 self-start px-2">
            <span className="h-2 w-2 rounded-full bg-muted animate-pulse" />
            <span className="h-2 w-2 rounded-full bg-muted animate-pulse [animation-delay:150ms]" />
            <span className="h-2 w-2 rounded-full bg-muted animate-pulse [animation-delay:300ms]" />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-5 py-3">
        <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-2.5">
          <span className="flex-1 text-[13px] text-muted-foreground">Type a message...</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function BusinessInABoxPage() {
  const businessesCounter = useCountUp(2847, 2500);
  const hoursCounter = useCountUp(24, 1500);
  const toolsCounter = useCountUp(12, 2000);

  const s1 = useFadeIn();
  const s2 = useFadeIn();
  const s3 = useFadeIn();
  const s4 = useFadeIn();
  const s5 = useFadeIn();
  const s6 = useFadeIn();
  const s7 = useFadeIn();
  const s8 = useFadeIn();

  return (
    <div className="relative overflow-hidden">
      {/* ── Background glow ──────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[400px] left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-red-600/[0.07] blur-[120px]" />
        <div className="absolute top-[1200px] -right-[200px] h-[600px] w-[600px] rounded-full bg-red-500/[0.04] blur-[100px]" />
        <div className="absolute top-[3000px] -left-[200px] h-[500px] w-[500px] rounded-full bg-red-600/[0.05] blur-[100px]" />
      </div>

      {/* ================================================================
          SECTION 1 — Hero
          ================================================================ */}
      <section className="relative px-6 pt-20 pb-24 md:pt-32 md:pb-36">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.08] px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-red-400" />
            <span className="text-[12px] font-semibold tracking-wide text-red-400 uppercase">Business-in-a-Box</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Launch Your Business
            <br />
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              in 24 Hours
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Everything you need. Built by AI. One platform replaces your website builder,
            CRM, email tool, phone system, payment processor, and a dozen other apps.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/start"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-red-600/25 transition-all duration-200 hover:bg-red-500 hover:shadow-red-500/30 hover:scale-[1.02]"
            >
              Start Building
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3.5 text-[15px] font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:border-border"
            >
              <Play className="h-4 w-4" />
              Watch Demo
            </a>
          </div>

          {/* Animated counters */}
          <div
            ref={businessesCounter.ref}
            className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-8 border-t border-border pt-10"
          >
            <div>
              <p className="text-3xl font-bold text-white md:text-4xl">{businessesCounter.count.toLocaleString()}+</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Businesses Launched</p>
            </div>
            <div ref={hoursCounter.ref}>
              <p className="text-3xl font-bold text-white md:text-4xl">{hoursCounter.count}h</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Average Setup Time</p>
            </div>
            <div ref={toolsCounter.ref}>
              <p className="text-3xl font-bold text-white md:text-4xl">{toolsCounter.count}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Tools Included</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 2 — What's Included
          ================================================================ */}
      <section ref={s1.ref} className={s1.className}>
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Everything Included</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] text-muted-foreground">
              12 integrated tools that work together as one system. No plugins, no add-ons, no surprises.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {included.map((item) => (
              <div
                key={item.label}
                className="group rounded-2xl border border-border bg-card p-5 backdrop-blur-sm transition-all duration-200 hover:border-red-500/20 hover:bg-card"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400 transition-colors duration-200 group-hover:bg-red-500/20">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-[14px] font-semibold text-foreground">{item.label}</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 3 — Industry Templates
          ================================================================ */}
      <section ref={s2.ref} className={s2.className}>
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Built for Your Industry</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] text-muted-foreground">
              Pre-configured templates designed by experts. Choose yours and Melli handles the rest.
            </p>
          </div>

          <div className="mt-14 grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            {industries.map((ind) => (
              <div
                key={ind.label}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-center backdrop-blur-sm transition-all duration-200 hover:border-border hover:scale-[1.03]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${ind.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className="relative">
                  <ind.icon className="mx-auto h-8 w-8 text-muted-foreground transition-colors duration-200 group-hover:text-white" />
                  <p className="mt-3 text-[13px] font-medium text-muted-foreground group-hover:text-white">{ind.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 4 — How It Works
          ================================================================ */}
      <section ref={s3.ref} className={s3.className}>
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">How It Works</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] text-muted-foreground">
              Four simple steps. From zero to a fully operational business.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {steps.map((step) => (
              <div
                key={step.num}
                className="relative rounded-2xl border border-border bg-card p-6 backdrop-blur-sm"
              >
                <span className="text-[40px] font-black leading-none text-red-500/20">{step.num}</span>
                <h3 className="mt-2 text-[16px] font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 5 — Pricing
          ================================================================ */}
      <section ref={s4.ref} className={s4.className}>
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] text-muted-foreground">
              No hidden fees. No setup costs. Cancel anytime.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-7 backdrop-blur-sm transition-all duration-200 ${
                  plan.highlighted
                    ? 'border-red-500/40 bg-card shadow-lg shadow-red-500/[0.08] scale-[1.02]'
                    : 'border-border bg-card hover:border-border'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-[18px] font-bold text-foreground">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-[14px] text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-3 text-[13px] text-muted-foreground">{plan.desc}</p>

                <Link
                  href="/start"
                  className={`mt-6 block w-full rounded-xl py-3 text-center text-[14px] font-semibold transition-all duration-200 ${
                    plan.highlighted
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20 hover:bg-red-500'
                      : 'border border-border text-muted-foreground hover:bg-muted hover:border-border'
                  }`}
                >
                  Get Started
                </Link>

                <ul className="mt-6 flex flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                      <span className="text-[13px] text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 6 — Live Demo
          ================================================================ */}
      <section id="demo" ref={s5.ref} className={s5.className}>
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.08] px-3 py-1">
                <Zap className="h-3.5 w-3.5 text-red-400" />
                <span className="text-[11px] font-semibold tracking-wide text-red-400 uppercase">Live Preview</span>
              </div>
              <h2 className="text-3xl font-bold text-white md:text-4xl">
                See Melli Build
                <br />a Business Live
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                Watch our AI assistant configure a complete business system in real time.
                Website, CRM, email, payments — everything assembled through a simple conversation.
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {['No coding required', 'Ready in minutes, not weeks', 'Fully customizable after setup'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <ChevronRight className="h-4 w-4 text-red-400" />
                    <span className="text-[14px] text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <ChatDemo />
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 7 — Testimonials
          ================================================================ */}
      <section ref={s6.ref} className={s6.className}>
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">What Our Clients Say</h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-border bg-card p-6 backdrop-blur-sm"
              >
                <Quote className="h-8 w-8 text-red-500/30" />
                <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/20 text-[14px] font-bold text-red-400">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{t.name}</p>
                    <p className="text-[12px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-red-400 text-red-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 8 — FAQ
          ================================================================ */}
      <section ref={s7.ref} className={s7.className}>
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Frequently Asked Questions</h2>
          </div>

          <div className="mt-12">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 9 — Final CTA
          ================================================================ */}
      <section ref={s8.ref} className={s8.className}>
        <div className="mx-auto max-w-4xl px-6 py-20 md:py-28">
          <div className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-600/[0.12] to-zinc-900/80 p-10 text-center backdrop-blur-xl md:p-16">
            {/* Glow */}
            <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full bg-red-600/20 blur-[80px]" />

            <div className="relative">
              <h2 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                Ready to Launch?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[16px] text-muted-foreground">
                Stop stitching together a dozen apps. Get everything in one box,
                built by AI, live in 24 hours.
              </p>
              <Link
                href="/start"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-red-600 px-10 py-4 text-[16px] font-bold text-white shadow-xl shadow-red-600/25 transition-all duration-200 hover:bg-red-500 hover:shadow-red-500/30 hover:scale-[1.03]"
              >
                Start Building
                <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="mt-4 text-[13px] text-muted-foreground">No credit card required. Setup takes 5 minutes.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
