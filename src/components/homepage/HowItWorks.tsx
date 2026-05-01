'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Brain, Compass, Rocket } from 'lucide-react';
import { useSiteConfig } from '../../hooks/useSiteConfig';

const steps = [
  {
    num: 1,
    icon: MessageCircle,
    title: 'Talk to the AI',
    desc: 'Ask what you want help with \u2014 funding, credit, business setup, automation, or next steps.',
  },
  {
    num: 2,
    icon: Brain,
    title: 'The AI understands',
    desc: 'Memelli OS reads your context, goals, and available options.',
  },
  {
    num: 3,
    icon: Compass,
    title: 'The AI guides you',
    desc: 'The system explains, qualifies, recommends, and launches the right next action.',
  },
  {
    num: 4,
    icon: Rocket,
    title: 'Memelli moves it forward',
    desc: 'Applications, communications, follow-ups, and workflows continue automatically.',
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const siteConfig = useSiteConfig();
  // how_it_works_heading — config key: how_it_works_heading
  const heading: string = siteConfig.how_it_works_heading || 'How Memelli OS works';

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
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-[hsl(var(--background))] px-4 py-28 sm:px-6 sm:py-36"
    >
      <div className="mx-auto max-w-5xl">
        {/* Headline */}
        <div
          className="mb-16 text-center"
          style={{
            opacity: reducedMotion || visible ? 1 : 0,
            transform:
              reducedMotion || visible ? 'translateY(0)' : 'translateY(20px)',
            transition: reducedMotion
              ? 'none'
              : 'opacity 0.6s ease-out, transform 0.6s ease-out',
          }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {heading}
          </h2>
        </div>

        <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connecting line (desktop only) — animated draw */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-[52px] hidden h-px lg:block"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(147,51,234,0.35), transparent)',
              transform: reducedMotion || visible ? 'scaleX(1)' : 'scaleX(0)',
              transformOrigin: 'left',
              transition: reducedMotion
                ? 'none'
                : 'transform 1s ease-out 0.4s',
            }}
          />

          {steps.map((step, i) => {
            const Icon = step.icon;
            const delay = i * 200;
            return (
              <div
                key={step.num}
                className="relative flex flex-col items-center rounded-2xl border border-white/[0.04] bg-[hsl(var(--muted))] p-7 text-center backdrop-blur-xl"
                style={{
                  opacity: reducedMotion || visible ? 1 : 0,
                  transform:
                    reducedMotion || visible
                      ? 'translateY(0)'
                      : 'translateY(15px)',
                  transition: reducedMotion
                    ? 'none'
                    : `opacity 0.5s ease-out ${delay}ms, transform 0.5s ease-out ${delay}ms`,
                }}
              >
                {/* Number badge with glow flash */}
                <div
                  className={`relative z-10 mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-violet-600 text-lg font-bold text-white shadow-lg shadow-red-500/20 ${
                    !reducedMotion && visible ? 'hiw-badge-glow' : ''
                  }`}
                  style={
                    !reducedMotion
                      ? { animationDelay: `${delay + 300}ms` }
                      : undefined
                  }
                >
                  {step.num}
                </div>

                {/* Icon with pulse on reveal */}
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] ${
                    !reducedMotion && visible ? 'hiw-icon-pulse' : ''
                  }`}
                  style={
                    !reducedMotion
                      ? { animationDelay: `${delay + 400}ms` }
                      : undefined
                  }
                >
                  <Icon className="h-5 w-5 text-red-400" />
                </div>

                <h3 className="text-base font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @media (prefers-reduced-motion: no-preference) {
          .hiw-badge-glow {
            animation: hiw-badge-glow-kf 0.6s ease-out forwards;
          }
          @keyframes hiw-badge-glow-kf {
            0% {
              box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.6);
            }
            50% {
              box-shadow: 0 0 20px 4px rgba(147, 51, 234, 0.4);
            }
            100% {
              box-shadow: 0 10px 15px -3px rgba(147, 51, 234, 0.2);
            }
          }

          .hiw-icon-pulse {
            animation: hiw-icon-pulse-kf 0.5s ease-out forwards;
          }
          @keyframes hiw-icon-pulse-kf {
            0% {
              transform: scale(0.8);
              opacity: 0.5;
            }
            60% {
              transform: scale(1.1);
              opacity: 1;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        }
      `}</style>
    </section>
  );
}
