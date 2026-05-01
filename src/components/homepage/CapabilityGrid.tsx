'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DollarSign,
  CreditCard,
  Building2,
  TrendingUp,
  Bot,
  MessageCircle,
  Users,
  Phone,
  Mail,
  Share2,
  FileSearch,
  Target,
  Workflow,
  Magnet,
  BarChart3,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useSiteConfig } from '../../hooks/useSiteConfig';

interface CapabilityGridProps {
  onAskAI?: (topic: string) => void;
}

const tiles = [
  { icon: DollarSign, title: 'Funding Engine', desc: 'Smart matching to lenders and programs you qualify for.' },
  { icon: CreditCard, title: 'Credit Intelligence', desc: 'Monitor, analyze, and optimize your credit position.' },
  { icon: Building2, title: 'Business Credit Builder', desc: 'Structured path to Tier 1 business credit.' },
  { icon: TrendingUp, title: 'Tradelines', desc: 'Authorized-user tradeline marketplace and tracking.' },
  { icon: Bot, title: 'AI Sales Assistant', desc: 'Autonomous sales outreach and follow-up engine.' },
  { icon: MessageCircle, title: 'Omnichannel Chat', desc: 'Web, SMS, and social conversations in one thread.' },
  { icon: Users, title: 'CRM Automation', desc: 'Pipeline, deal, and contact management on autopilot.' },
  { icon: Phone, title: 'Voice + Call Flows', desc: 'IVR, call routing, voicemail drops, and live transfer.' },
  { icon: Mail, title: 'Text + Email Automation', desc: 'Scheduled drip campaigns and transactional messaging.' },
  { icon: Share2, title: 'Affiliate System', desc: 'Commission tracking, payouts, and partner portals.' },
  { icon: FileSearch, title: 'Document Intelligence', desc: 'AI-powered document parsing and verification.' },
  { icon: Target, title: 'Opportunity Tracking', desc: 'Track every lead, deal, and funding opportunity.' },
  { icon: Workflow, title: 'Workflow Automations', desc: 'Visual builder for multi-step business workflows.' },
  { icon: Magnet, title: 'Lead Generation Tools', desc: 'Capture, score, and route leads automatically.' },
  { icon: BarChart3, title: 'Analytics Engine', desc: 'Real-time dashboards across every system.' },
  { icon: FileText, title: 'Business Formation', desc: 'LLC, EIN, compliance, and corporate setup.' },
];

export default function CapabilityGrid({ onAskAI }: CapabilityGridProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const siteConfig = useSiteConfig();
  // capability_grid_heading — config key: capability_grid_heading
  const heading: string = siteConfig.capability_grid_heading || 'Everything the AI can connect you to';

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
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 4 columns on md+, so compute row/col stagger delay
  const getDelay = (i: number) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    return (row * 4 + col) * 50; // 50ms between each, top-left first
  };

  return (
    <section
      ref={sectionRef}
      className="relative bg-[hsl(var(--background))] px-4 py-28 sm:px-6 sm:py-36"
    >
      <div className="mx-auto max-w-6xl">
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

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {tiles.map((tile, i) => {
            const Icon = tile.icon;
            const delay = getDelay(i);
            return (
              <div
                key={tile.title}
                className="cap-tile group relative rounded-2xl border border-white/[0.04] bg-[hsl(var(--muted))] p-6 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-red-500/30 hover:bg-[hsl(var(--card))] hover:shadow-[0_8px_32px_-8px_rgba(147,51,234,0.15)]"
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
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] transition-colors duration-200 group-hover:bg-red-500/15">
                  <Icon className="h-5 w-5 text-[hsl(var(--muted-foreground))] transition-colors duration-200 group-hover:text-red-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">{tile.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {tile.desc}
                </p>

                {onAskAI && (
                  <button
                    type="button"
                    onClick={() => onAskAI(tile.title)}
                    className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-400 opacity-0 transition-all duration-200 hover:bg-red-500/20 group-hover:opacity-100"
                  >
                    <Sparkles className="h-3 w-3" />
                    Ask AI
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid line pulse decoration */}
      <style jsx>{`
        @media (prefers-reduced-motion: no-preference) {
          .cap-tile::after {
            content: '';
            position: absolute;
            inset: -1px;
            border-radius: 1rem;
            border: 1px solid transparent;
            pointer-events: none;
            transition: border-color 0.3s ease;
          }
          .cap-tile:hover::after {
            border-color: rgba(147, 51, 234, 0.15);
            animation: cap-border-pulse 2s ease-in-out infinite;
          }
          @keyframes cap-border-pulse {
            0%,
            100% {
              border-color: rgba(147, 51, 234, 0.1);
            }
            50% {
              border-color: rgba(147, 51, 234, 0.3);
            }
          }
        }
      `}</style>
    </section>
  );
}
