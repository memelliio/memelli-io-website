'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Clock, Code2, FileCode2, Layout, Layers, Cpu, Rocket, CheckCircle2,
  ArrowLeft, Zap, Timer, Activity, Server, GitBranch, Terminal,
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
const GREEN_GLOW = 'rgba(34, 197, 94, 0.2)';
const TEXT = '#F8FAFC';
const TEXT_DIM = '#94A3B8';

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════════════════════════════════ */

function useAnimatedCounter(target: number, active: boolean, duration = 1200, prefix = '', suffix = '') {
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!active) { setDisplay(`${prefix}0${suffix}`); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      setDisplay(`${prefix}${current.toLocaleString()}${suffix}`);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [active, target, duration, prefix, suffix]);

  return display;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STAT CARDS DATA
   ═══════════════════════════════════════════════════════════════════════════════ */

const STAT_CARDS = [
  { label: 'Command Received', value: '15:04 UTC', icon: Terminal, type: 'text' as const },
  { label: 'Build Started', value: '15:05 UTC', icon: Timer, type: 'text' as const },
  { label: 'Lines of Code', value: 3000, suffix: '+', icon: Code2, type: 'number' as const },
  { label: 'Files Created', value: 15, suffix: '+', icon: FileCode2, type: 'number' as const },
  { label: 'Pages Generated', value: 7, icon: Layout, type: 'number' as const },
  { label: 'Modules Completed', value: 7, icon: Layers, type: 'number' as const },
];

const MODULES = [
  'Storefront',
  'Checkout',
  'Net Terms',
  'Portal',
  'Dashboard',
  'Specs',
  'Brochure',
];

const TIMELINE_PHASES = [
  { time: '15:04', label: 'Command Received', detail: 'Natural language instruction parsed by MUA', status: 'complete' },
  { time: '15:05', label: 'Build Plan Generated', detail: 'Task decomposition into parallel work orders', status: 'complete' },
  { time: '15:06', label: 'Agent Pool Dispatched', detail: '15+ autonomous agents deployed across modules', status: 'complete' },
  { time: '15:08', label: 'Storefront & Checkout Built', detail: 'Product catalog, cart, checkout flow, net terms', status: 'complete' },
  { time: '15:12', label: 'Portal & Dashboard Built', detail: 'Client portal, build dashboard, spec sheet', status: 'complete' },
  { time: '15:15', label: 'Brochure & Marketing Generated', detail: 'Brand-aligned collateral and presentation deck', status: 'complete' },
  { time: '15:17', label: 'Integration Testing', detail: 'Cross-module validation, link verification, responsive check', status: 'complete' },
  { time: '15:18', label: 'Deployment Complete', detail: 'All pages live on production environment', status: 'complete' },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   STAT CARD COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

function StatCard({ stat, index }: { stat: typeof STAT_CARDS[number]; index: number }) {
  const [visible, setVisible] = useState(false);
  const animatedValue = useAnimatedCounter(
    stat.type === 'number' ? (stat.value as number) : 0,
    visible,
    1200 + index * 200,
    '',
    stat.type === 'number' ? (stat.suffix || '') : ''
  );

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200 + index * 150);
    return () => clearTimeout(timer);
  }, [index]);

  const Icon = stat.icon;

  return (
    <div
      className="rounded-2xl p-6 border transition-all duration-700"
      style={{
        background: BG_CARD,
        borderColor: visible ? 'rgba(249, 115, 22, 0.25)' : 'rgba(249, 115, 22, 0.08)',
        boxShadow: visible ? `0 0 25px ${ACCENT_GLOW}` : 'none',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}
        >
          <Icon className="w-5 h-5" style={{ color: ACCENT }} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_DIM }}>
          {stat.label}
        </span>
      </div>
      <p className="text-3xl font-bold" style={{ color: TEXT }}>
        {stat.type === 'text' ? stat.value : animatedValue}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function PresentationDashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ background: `linear-gradient(135deg, ${BG} 0%, #1a1f3a 50%, ${BG} 100%)` }}
    >
      {/* Background glows */}
      <div
        className="fixed top-0 left-1/3 w-[700px] h-[700px] rounded-full blur-3xl pointer-events-none"
        style={{ background: ACCENT_GLOW, opacity: 0.25 }}
      />
      <div
        className="fixed bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{ background: GREEN_GLOW, opacity: 0.15 }}
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
                <p className="text-xs" style={{ color: TEXT_DIM }}>Build Dashboard</p>
              </div>
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
            style={{ background: `${GREEN}15`, color: GREEN, border: `1px solid ${GREEN}30` }}
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: GREEN }} />
            ALL SYSTEMS LIVE
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
              <Activity className="w-5 h-5" style={{ color: ACCENT }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>
                Executive Performance Report
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: TEXT }}>
              Autonomous Presentation<br />Build Summary
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: TEXT_DIM }}>
              Complete build telemetry for the ForgePress Industries autonomous platform
              generation, from command receipt through production deployment.
            </p>
          </div>
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
            style={{ background: `radial-gradient(circle, ${ACCENT_GLOW_STRONG}, transparent 70%)` }}
          />
          <div
            className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full"
            style={{ background: `radial-gradient(circle, ${GREEN_GLOW}, transparent 70%)` }}
          />
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {STAT_CARDS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} />
          ))}
        </div>

        {/* Modules Completed */}
        <div
          className="rounded-2xl p-8 border mb-12"
          style={{ background: BG_CARD, borderColor: 'rgba(249, 115, 22, 0.15)' }}
        >
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: TEXT }}>
            <Cpu className="w-5 h-5" style={{ color: ACCENT }} />
            Modules Completed
          </h2>
          <div className="flex flex-wrap gap-3">
            {MODULES.map((mod, i) => (
              <div
                key={mod}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-500"
                style={{
                  background: mounted ? `${GREEN}10` : 'transparent',
                  border: `1px solid ${mounted ? GREEN + '40' : 'rgba(255,255,255,0.05)'}`,
                  color: mounted ? GREEN : TEXT_DIM,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-10px)',
                  transitionDelay: `${i * 100}ms`,
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                {mod}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div
          className="rounded-2xl p-8 border mb-12"
          style={{ background: BG_CARD, borderColor: 'rgba(249, 115, 22, 0.15)' }}
        >
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3" style={{ color: TEXT }}>
            <GitBranch className="w-5 h-5" style={{ color: ACCENT }} />
            Build Timeline
          </h2>
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-[23px] top-2 bottom-2 w-px"
              style={{ background: `linear-gradient(to bottom, ${ACCENT}, ${GREEN})` }}
            />

            <div className="space-y-6">
              {TIMELINE_PHASES.map((phase, i) => (
                <div
                  key={i}
                  className="flex gap-5 transition-all duration-700"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
                    transitionDelay: `${300 + i * 120}ms`,
                  }}
                >
                  {/* Dot */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-[48px] h-[48px] rounded-full flex items-center justify-center"
                      style={{
                        background: i === TIMELINE_PHASES.length - 1
                          ? `linear-gradient(135deg, ${GREEN}, #16A34A)`
                          : `linear-gradient(135deg, ${ACCENT}, #EA580C)`,
                        boxShadow: `0 0 15px ${i === TIMELINE_PHASES.length - 1 ? GREEN_GLOW : ACCENT_GLOW}`,
                      }}
                    >
                      {i === TIMELINE_PHASES.length - 1 ? (
                        <Rocket className="w-5 h-5 text-white" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 rounded-xl p-5 border"
                    style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      borderColor: 'rgba(249, 115, 22, 0.1)',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: `${ACCENT}15`, color: ACCENT }}>
                        {phase.time}
                      </span>
                      <span className="text-sm font-bold" style={{ color: TEXT }}>{phase.label}</span>
                    </div>
                    <p className="text-sm" style={{ color: TEXT_DIM }}>{phase.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deployment Status */}
        <div
          className="rounded-2xl p-8 border mb-12"
          style={{
            background: `linear-gradient(135deg, ${BG_CARD}, rgba(34, 197, 94, 0.03))`,
            borderColor: `${GREEN}30`,
            boxShadow: `0 0 40px ${GREEN_GLOW}`,
          }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${GREEN}, #16A34A)`, boxShadow: `0 0 25px ${GREEN_GLOW}` }}
            >
              <Server className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: TEXT }}>Deployment Status</h2>
              <p className="text-sm" style={{ color: GREEN }}>All systems operational</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              // { label: 'Frontend', status: 'LIVE', platform: 'Vercel' },  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
              { label: 'API', status: 'LIVE', platform: 'Railway' },
              { label: 'Database', status: 'CONNECTED', platform: 'Railway Postgres' },
            ].map((svc) => (
              <div
                key={svc.label}
                className="rounded-xl p-4 border"
                style={{ background: 'rgba(15, 23, 42, 0.6)', borderColor: `${GREEN}20` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: TEXT }}>{svc.label}</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: `${GREEN}15`, color: GREEN }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: GREEN }} />
                    {svc.status}
                  </span>
                </div>
                <p className="text-xs" style={{ color: TEXT_DIM }}>{svc.platform}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Executive Summary */}
        <div
          className="rounded-2xl p-8 border"
          style={{ background: BG_CARD, borderColor: 'rgba(249, 115, 22, 0.15)' }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-3" style={{ color: TEXT }}>
            <Zap className="w-5 h-5" style={{ color: ACCENT }} />
            Executive Summary
          </h2>
          <div className="space-y-4 text-sm leading-relaxed" style={{ color: TEXT_DIM }}>
            <p>
              This dashboard documents the autonomous generation of a complete B2B commerce
              platform for <strong style={{ color: TEXT }}>ForgePress Industries</strong>.
              The entire build was initiated by a single natural-language command and executed
              by an autonomous agent workforce without manual intervention.
            </p>
            <p>
              The system produced a fully functional storefront with product catalog, checkout
              flow, net-terms financing, client portal, executive dashboard, technical spec sheet,
              and brand-aligned brochure &mdash; all in under 15 minutes from command receipt
              to production deployment.
            </p>
            <p>
              Every component follows enterprise-grade standards: responsive design, accessibility
              compliance, secure authentication patterns, and production-ready deployment on
              // modern cloud infrastructure (Vercel + Railway).  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="h-px mb-8" style={{ background: `linear-gradient(to right, transparent, ${ACCENT}20, transparent)` }} />
          <p className="text-xs" style={{ color: TEXT_DIM }}>
            ForgePress Industries &mdash; Autonomous Build Dashboard &mdash; Powered by Memelli Universe
          </p>
        </div>
      </main>
    </div>
  );
}
