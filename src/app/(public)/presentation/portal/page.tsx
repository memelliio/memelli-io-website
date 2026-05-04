'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText, BarChart3, BookOpen, Megaphone, ShoppingCart, LayoutDashboard,
  Lock, LogIn, ArrowRight, Shield, Zap, ChevronRight,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════════ */

const BG = '#0F172A';
const BG_CARD = '#1E293B';
const BG_CARD_HOVER = '#334155';
const ACCENT = '#F97316';
const ACCENT_GLOW = 'rgba(249, 115, 22, 0.15)';
const ACCENT_GLOW_STRONG = 'rgba(249, 115, 22, 0.35)';
const TEXT = '#F8FAFC';
const TEXT_DIM = '#94A3B8';

const DEMO_EMAIL = 'jay-demo@forgepress.io';
const DEMO_PASSWORD = 'ForgeDemo2026!';

const PORTAL_LINKS = [
  {
    title: 'Presentation Summary',
    description: 'Full executive overview of the autonomous build demonstration and platform capabilities.',
    icon: FileText,
    href: '/presentation',
  },
  {
    title: 'Spec Sheet',
    description: 'Technical specifications, system architecture, deployment topology, and route mapping.',
    icon: Shield,
    href: '/presentation/specs',
  },
  {
    title: 'Brochure',
    description: 'Brand-ready digital brochure showcasing ForgePress Industries platform offering.',
    icon: BookOpen,
    href: '/brochure',
  },
  {
    title: 'Marketing Materials',
    description: 'Campaign assets, positioning decks, and go-to-market collateral.',
    icon: Megaphone,
    href: '/presentation',
  },
  {
    title: 'Store Demo',
    description: 'Live B2B storefront with product catalog, checkout flow, and net terms processing.',
    icon: ShoppingCart,
    href: '/presentation/store',
  },
  {
    title: 'Build Dashboard',
    description: 'Real-time build performance metrics, timeline, and deployment status.',
    icon: LayoutDashboard,
    href: '/presentation/dashboard',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   LOGIN GATE
   ═══════════════════════════════════════════════════════════════════════════════ */

function LoginGate({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        onLogin();
      } else {
        setError('Invalid credentials. Use the pre-filled demo login.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: `linear-gradient(135deg, ${BG} 0%, #1a1f3a 50%, ${BG} 100%)` }}
    >
      {/* Background glow effects */}
      <div
        className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: ACCENT_GLOW, opacity: 0.4 }}
      />
      <div
        className="fixed bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(249, 115, 22, 0.08)', opacity: 0.6 }}
      />

      <div
        className="relative w-full max-w-md rounded-2xl p-8 border"
        style={{
          background: `linear-gradient(145deg, ${BG_CARD}, ${BG})`,
          borderColor: 'rgba(249, 115, 22, 0.2)',
          boxShadow: `0 0 60px ${ACCENT_GLOW}, 0 25px 50px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, #EA580C)`,
              boxShadow: `0 0 30px ${ACCENT_GLOW_STRONG}`,
            }}
          >
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: TEXT }}>
            ForgePress Industries
          </h1>
          <p className="text-sm mt-1" style={{ color: TEXT_DIM }}>
            Secure Client Portal
          </p>
        </div>

        {/* Divider */}
        <div className="h-px mb-6" style={{ background: `linear-gradient(to right, transparent, ${ACCENT}40, transparent)` }} />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: TEXT_DIM }}>
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none transition-all duration-200"
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: TEXT,
                  border: `1px solid rgba(249, 115, 22, 0.2)`,
                }}
                onFocus={(e) => (e.target.style.borderColor = ACCENT)}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(249, 115, 22, 0.2)')}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: TEXT_DIM }}>
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none transition-all duration-200"
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: TEXT,
                  border: `1px solid rgba(249, 115, 22, 0.2)`,
                }}
                onFocus={(e) => (e.target.style.borderColor = ACCENT)}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(249, 115, 22, 0.2)')}
              />
              <Lock className="absolute right-3 top-3.5 w-4 h-4" style={{ color: TEXT_DIM }} />
            </div>
          </div>

          {error && (
            <div className="text-sm px-3 py-2 rounded-lg" style={{ color: '#F87171', background: 'rgba(248, 113, 113, 0.1)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
            style={{
              background: loading ? 'rgba(249, 115, 22, 0.5)' : `linear-gradient(135deg, ${ACCENT}, #EA580C)`,
              color: 'white',
              boxShadow: loading ? 'none' : `0 0 20px ${ACCENT_GLOW_STRONG}`,
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Access Portal
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: TEXT_DIM }}>
          Demo credentials are pre-filled for this presentation.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PORTAL DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════════ */

function PortalDashboard() {
  return (
    <div
      className="min-h-screen"
      style={{ background: `linear-gradient(135deg, ${BG} 0%, #1a1f3a 50%, ${BG} 100%)` }}
    >
      {/* Background glow */}
      <div
        className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none"
        style={{ background: ACCENT_GLOW, opacity: 0.3 }}
      />

      {/* Header */}
      <header
        className="border-b sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          borderColor: 'rgba(249, 115, 22, 0.15)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, #EA580C)`,
                boxShadow: `0 0 20px ${ACCENT_GLOW_STRONG}`,
              }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: TEXT }}>ForgePress Industries</p>
              <p className="text-xs" style={{ color: TEXT_DIM }}>Client Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold" style={{ color: TEXT }}>Jay</p>
              <p className="text-xs" style={{ color: TEXT_DIM }}>jay-demo@forgepress.io</p>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #EA580C)`, color: 'white' }}
            >
              J
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Panel */}
        <div
          className="rounded-2xl p-8 mb-10 border relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${BG_CARD}, rgba(249, 115, 22, 0.05))`,
            borderColor: 'rgba(249, 115, 22, 0.2)',
            boxShadow: `0 0 40px ${ACCENT_GLOW}`,
          }}
        >
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: ACCENT }}>
              Welcome Back
            </p>
            <h1 className="text-4xl font-bold mb-3" style={{ color: TEXT }}>
              Welcome, Jay
            </h1>
            <p className="text-lg max-w-2xl" style={{ color: TEXT_DIM }}>
              Your ForgePress Industries platform is live and operational. Access your presentation
              materials, review the build performance, and explore the live storefront below.
            </p>
          </div>
          {/* Decorative gradient arc */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full"
            style={{ background: `radial-gradient(circle, ${ACCENT_GLOW_STRONG}, transparent 70%)` }}
          />
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PORTAL_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.href}>
                <div
                  className="group rounded-2xl p-6 border transition-all duration-300 cursor-pointer h-full"
                  style={{
                    background: BG_CARD,
                    borderColor: 'rgba(249, 115, 22, 0.12)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.4)';
                    e.currentTarget.style.boxShadow = `0 0 30px ${ACCENT_GLOW}, 0 10px 40px rgba(0,0,0,0.3)`;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.background = BG_CARD_HOVER;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.12)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = BG_CARD;
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${ACCENT}20, ${ACCENT}05)`,
                        border: `1px solid ${ACCENT}30`,
                      }}
                    >
                      <Icon className="w-6 h-6" style={{ color: ACCENT }} />
                    </div>
                    <ArrowRight
                      className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                      style={{ color: TEXT_DIM }}
                    />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: TEXT }}>
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: TEXT_DIM }}>
                    {item.description}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold" style={{ color: ACCENT }}>
                    <span>Open</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="h-px mb-8" style={{ background: `linear-gradient(to right, transparent, ${ACCENT}20, transparent)` }} />
          <p className="text-xs" style={{ color: TEXT_DIM }}>
            ForgePress Industries &mdash; Autonomous Build Demonstration &mdash; Powered by Memelli Universe
          </p>
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function PresentationPortalPage() {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return <LoginGate onLogin={() => setAuthenticated(true)} />;
  }

  return <PortalDashboard />;
}
