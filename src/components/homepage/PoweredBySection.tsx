'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  DollarSign,
  CreditCard,
  Workflow,
  Radio,
  Users,
  Phone,
  Briefcase,
} from 'lucide-react';

const bullets = [
  { icon: MessageSquare, label: 'AI Conversation Engine' },
  { icon: DollarSign, label: 'Funding Intelligence' },
  { icon: CreditCard, label: 'Credit Guidance' },
  { icon: Workflow, label: 'Workflow Automation' },
  { icon: Radio, label: 'Communication Systems' },
  { icon: Users, label: 'Lead & CRM Automation' },
  { icon: Phone, label: 'Voice/Text/Email Orchestration' },
  { icon: Briefcase, label: 'Business & Growth Tools' },
];

export default function PoweredBySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-950 px-4 py-28 sm:px-6 sm:py-36"
    >
      {/* Subtle glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-red-900/10 blur-[160px]" />

      <div className="relative mx-auto max-w-5xl">
        {/* Headline reveal */}
        <div
          className="text-center"
          style={{
            opacity: reducedMotion || visible ? 1 : 0,
            transform:
              reducedMotion || visible ? 'translateY(0)' : 'translateY(20px)',
            transition: reducedMotion
              ? 'none'
              : 'opacity 0.6s ease-out, transform 0.6s ease-out',
          }}
        >
          <h2 className="text-4xl font-bold tracking-tight text-white">
            Powered by Memelli OS
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
            Memelli OS connects funding, credit, automation, communication, AI
            agents, business tools, and opportunity systems into one intelligent
            platform.
          </p>
        </div>

        {/* Cards with individual stagger */}
        <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
          {bullets.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-white/[0.04] bg-[hsl(var(--muted))] p-6 text-center backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-red-500/25 hover:bg-[hsl(var(--card))] hover:shadow-[0_8px_32px_-8px_rgba(147,51,234,0.15)]"
                style={{
                  opacity: reducedMotion || visible ? 1 : 0,
                  transform:
                    reducedMotion || visible
                      ? 'translateY(0)'
                      : 'translateY(15px)',
                  transition: reducedMotion
                    ? 'none'
                    : `opacity 0.5s ease-out ${i * 100}ms, transform 0.5s ease-out ${i * 100}ms`,
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] transition-colors duration-200 group-hover:bg-red-500/15">
                  <Icon className="h-5 w-5 text-[hsl(var(--muted-foreground))] transition-colors duration-200 group-hover:text-red-400" />
                </div>
                <span className="text-sm font-medium text-[hsl(var(--foreground))] transition-colors duration-200 group-hover:text-white">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
