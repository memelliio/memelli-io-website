// @ts-nocheck
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  Users,
  Bot,
  BarChart3,
  Tv2,
  ShoppingBag,
  Zap,
  Contact,
  CheckSquare,
  Search,
  Workflow,
  Phone,
  FileText,
  CreditCard,
  BarChart2,
  Video,
  Activity,
  MessageSquare,
  CheckCircle,
  Handshake,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../../../contexts/auth';
import { useOnboarding } from '../../../../hooks/useOnboarding';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BusinessData {
  name: string;
  type: string;
  phone: string;
}

type SphereColorId = 'red' | 'blue' | 'gold' | 'purple' | 'green' | 'white';

interface SphereColor {
  id: SphereColorId;
  label: string;
  description: string;
  hex: string;
  glow: string;
}

interface ModuleCard {
  id: string;
  title: string;
  icon: LucideIcon;
  accent: string;
  bg: string;
}

interface OnboardingConfig {
  business: BusinessData;
  pinnedModuleIds: string[];
  sphereColorId: SphereColorId;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 5;

const BUSINESS_TYPES = [
  'Entrepreneur',
  'Agency',
  'Real Estate',
  'Finance',
  'E-commerce',
  'Coaching',
  'Other',
] as const;

const ALL_MODULES: ModuleCard[] = [
  { id: 'crm',            title: 'CRM',            icon: Users,         accent: '#3b82f6', bg: '#0d1f35' },
  { id: 'ai',             title: 'AI Agents',      icon: Bot,           accent: '#10b981', bg: '#0a2920' },
  { id: 'analytics',      title: 'Analytics',      icon: BarChart3,     accent: '#ec4899', bg: '#1e0f2d' },
  { id: 'iptv',           title: 'Live TV',         icon: Tv2,           accent: '#818cf8', bg: '#1a0a2e' },
  { id: 'commerce',       title: 'Commerce',       icon: ShoppingBag,   accent: '#f97316', bg: '#3b1f00' },
  { id: 'leads',          title: 'Leads',          icon: Zap,           accent: '#ef4444', bg: '#3b0f0f' },
  { id: 'contacts',       title: 'Contacts',       icon: Contact,       accent: '#818cf8', bg: '#1a1a2e' },
  { id: 'tasks',          title: 'Tasks',          icon: CheckSquare,   accent: '#fbbf24', bg: '#2d2200' },
  { id: 'seo',            title: 'SEO',            icon: Search,        accent: '#4ade80', bg: '#0f3320' },
  { id: 'workflows',      title: 'Workflows',      icon: Workflow,      accent: '#38bdf8', bg: '#0f1e3b' },
  { id: 'communications', title: 'Phone',          icon: Phone,         accent: '#4ade80', bg: '#0f3320' },
  { id: 'documents',      title: 'Documents',      icon: FileText,      accent: '#a1a1aa', bg: '#1a1a1a' },
  { id: 'credit',         title: 'Credit',         icon: CreditCard,    accent: '#4ade80', bg: '#0a2d1a' },
  { id: 'insights',       title: 'Insights',       icon: BarChart2,     accent: '#d8b4fe', bg: '#1e0f2d' },
  { id: 'content',        title: 'Content',        icon: Video,         accent: '#f87171', bg: '#2d1b4e' },
  { id: 'activities',     title: 'Activities',     icon: Activity,      accent: '#34d399', bg: '#0f2d1a' },
  { id: 'conversations',  title: 'Conversations',  icon: MessageSquare, accent: '#fbbf24', bg: '#1e1a0f' },
  { id: 'approval',       title: 'Approval',       icon: CheckCircle,   accent: '#60a5fa', bg: '#0f1e3b' },
  { id: 'partners',       title: 'Partners',       icon: Handshake,     accent: '#f59e0b', bg: '#2d1f00' },
];

const DEFAULT_PINNED_IDS = ['crm', 'ai', 'analytics', 'iptv', 'commerce', 'leads'];

const SPHERE_COLORS: SphereColor[] = [
  { id: 'red',    label: 'Signature Red', description: 'Bold, driven, and unstoppable.',      hex: '#ef4444', glow: 'rgba(239,68,68,0.45)' },
  { id: 'blue',   label: 'Deep Space',    description: 'Calm focus. Limitless reach.',         hex: '#3b82f6', glow: 'rgba(59,130,246,0.45)' },
  { id: 'gold',   label: 'Gold Rush',     description: 'Ambition, wealth, and legacy.',        hex: '#f59e0b', glow: 'rgba(245,158,11,0.45)' },
  { id: 'purple', label: 'Royal Pulse',   description: 'Creative power meets precision.',       hex: '#10b981', glow: 'rgba(239,68,68,0.45)' },
  { id: 'green',  label: 'Growth Mode',   description: 'Fresh momentum. Always expanding.',    hex: '#22c55e', glow: 'rgba(34,197,94,0.45)' },
  { id: 'white',  label: 'Clarity',       description: 'Clean, minimal, and crystal clear.',   hex: '#e4e4e7', glow: 'rgba(228,228,231,0.35)' },
];

const MIN_SELECTIONS = 3;
const MAX_SELECTIONS = 8;

const PINNED_MODULES_KEY = 'melli_pinned_modules';
const SPHERE_CONFIG_KEY = 'melli_sphere_config';
const SETUP_CONFIG_KEY = 'melli_setup_config';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function saveToLocalStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore QuotaExceededError or security errors
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Thin red progress bar at the very top of the page */
function TopProgressBar({ step }: { step: number }) {
  const pct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;
  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] bg-muted z-50">
      <div
        className="h-full bg-gradient-to-r from-red-700 to-red-400 transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Five-dot step indicator */
function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2.5 justify-center">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const idx = i + 1;
        const isActive    = idx === current;
        const isCompleted = idx < current;
        return (
          <div
            key={idx}
            className={[
              'rounded-full transition-all duration-300',
              isActive    ? 'w-6 h-3 bg-red-500'                                  : '',
              isCompleted ? 'w-3 h-3 bg-transparent border-2 border-red-500'       : '',
              !isActive && !isCompleted ? 'w-3 h-3 bg-muted'                    : '',
            ].join(' ')}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Welcome
// ---------------------------------------------------------------------------

function StepWelcome({ userName }: { userName: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-8">
      {/* Sparkles with animated red glow */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute w-32 h-32 rounded-full blur-2xl animate-pulse"
          style={{ backgroundColor: 'rgba(239,68,68,0.35)' }}
        />
        <div className="relative w-24 h-24 rounded-full bg-card border border-red-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.3)]">
          <Sparkles className="w-12 h-12 text-red-400" />
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-white tracking-tight">Welcome to Melli OS</h1>
        <p className="text-muted-foreground text-lg">Let&apos;s set up your OS in 2 minutes</p>
        {userName && (
          <p className="text-foreground text-base font-medium mt-1">
            Welcome,{' '}
            <span className="text-white font-semibold">{userName}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Your Business
// ---------------------------------------------------------------------------

function StepBusiness({
  data,
  onChange,
}: {
  data: BusinessData;
  onChange: (d: BusinessData) => void;
}) {
  return (
    <div className="space-y-7">
      <div className="text-center space-y-1.5">
        <h2 className="text-3xl font-bold text-white">Your Business</h2>
        <p className="text-muted-foreground text-sm">Tell us a little about your operation.</p>
      </div>

      <div className="space-y-5">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Business Name</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="Acme Corp"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition"
          />
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Business Type</label>
          <select
            value={data.type}
            onChange={(e) => onChange({ ...data, type: e.target.value })}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition"
          >
            <option value="" className="bg-card text-muted-foreground">Select type…</option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t} className="bg-card">{t}</option>
            ))}
          </select>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Phone Number</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Choose Your Apps
// ---------------------------------------------------------------------------

function StepApps({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      if (selected.length <= MIN_SELECTIONS) return; // enforce minimum
      onChange(selected.filter((s) => s !== id));
    } else {
      if (selected.length >= MAX_SELECTIONS) return; // enforce maximum
      onChange([...selected, id]);
    }
  };

  const atMin = selected.length <= MIN_SELECTIONS;
  const atMax = selected.length >= MAX_SELECTIONS;

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1.5">
        <h2 className="text-3xl font-bold text-white">Choose Your Apps</h2>
        <p className="text-muted-foreground text-sm">
          Pin your most-used modules to your home screen.
        </p>
        <p className="text-xs text-muted-foreground">
          {selected.length}/{MAX_SELECTIONS} selected
          {atMin && ' · minimum reached'}
          {atMax && ' · maximum reached'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {ALL_MODULES.map((mod) => {
          const Icon = mod.icon;
          const isSelected = selected.includes(mod.id);
          const isDisabled = !isSelected && atMax;

          return (
            <button
              key={mod.id}
              onClick={() => toggle(mod.id)}
              disabled={isDisabled}
              className={[
                'relative flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border transition-all duration-200 text-center',
                isSelected
                  ? 'border-red-500 bg-red-500/10 shadow-[0_0_16px_rgba(239,68,68,0.15)]'
                  : isDisabled
                  ? 'border-border bg-card opacity-40 cursor-not-allowed'
                  : 'border-border bg-card hover:border-border hover:bg-muted cursor-pointer',
              ].join(' ')}
            >
              {/* Selected checkmark badge */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </div>
              )}

              {/* Icon bubble */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: isSelected ? `${mod.accent}22` : mod.bg }}
              >
                <Icon
                  className="w-4.5 h-4.5"
                  style={{ color: isSelected ? mod.accent : '#71717a' }}
                  size={18}
                />
              </div>

              <span
                className={`text-[11px] font-medium leading-tight ${
                  isSelected ? 'text-white' : 'text-muted-foreground'
                }`}
              >
                {mod.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Your Sphere
// ---------------------------------------------------------------------------

function StepSphere({
  selectedId,
  onChange,
}: {
  selectedId: SphereColorId;
  onChange: (id: SphereColorId) => void;
}) {
  const selected = SPHERE_COLORS.find((c) => c.id === selectedId) ?? SPHERE_COLORS[0];

  return (
    <div className="space-y-7">
      <div className="text-center space-y-1.5">
        <h2 className="text-3xl font-bold text-white">Your Sphere</h2>
        <p className="text-muted-foreground text-sm">Customize your Melli AI sphere.</p>
      </div>

      {/* Live sphere preview */}
      <div className="flex justify-center">
        <div className="relative flex items-center justify-center">
          {/* Outer glow ring */}
          <div
            className="absolute w-36 h-36 rounded-full blur-3xl transition-all duration-500"
            style={{ backgroundColor: selected.glow }}
          />
          {/* Sphere body */}
          <div
            className="relative w-24 h-24 rounded-full transition-all duration-500 flex items-center justify-center shadow-2xl"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${selected.hex}cc, ${selected.hex}55 60%, #111 100%)`,
              boxShadow: `0 0 40px ${selected.glow}, inset 0 0 20px rgba(255,255,255,0.08)`,
            }}
          >
            <div
              className="w-6 h-6 rounded-full opacity-60"
              style={{ background: `radial-gradient(circle, #fff 0%, transparent 80%)` }}
            />
          </div>
        </div>
      </div>

      {/* Color name + description */}
      <div className="text-center space-y-1 min-h-[44px]">
        <p className="text-base font-semibold text-white transition-all duration-300">{selected.label}</p>
        <p className="text-sm text-muted-foreground transition-all duration-300">{selected.description}</p>
      </div>

      {/* Color picker buttons */}
      <div className="flex items-center justify-center gap-4">
        {SPHERE_COLORS.map((color) => {
          const isActive = color.id === selectedId;
          return (
            <button
              key={color.id}
              onClick={() => onChange(color.id)}
              className="group relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200"
              title={color.label}
            >
              {/* Active ring */}
              {isActive && (
                <div
                  className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-zinc-950 transition-all duration-200"
                  style={{ ringColor: color.hex, borderColor: color.hex, borderWidth: 2, boxShadow: `0 0 0 2px #09090b, 0 0 0 4px ${color.hex}` }}
                />
              )}
              <div
                className="w-8 h-8 rounded-full transition-transform duration-200 group-hover:scale-110"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${color.hex}ee, ${color.hex}88)`,
                  boxShadow: `0 2px 8px ${color.glow}`,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — You're Live
// ---------------------------------------------------------------------------

function StepLive({
  pinnedCount,
  sphereLabel,
}: {
  pinnedCount: number;
  sphereLabel: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-8">
      {/* Checkmark icon with red glow */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute w-40 h-40 rounded-full blur-3xl animate-pulse"
          style={{ backgroundColor: 'rgba(239,68,68,0.3)' }}
        />
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-[0_0_60px_rgba(239,68,68,0.5)]">
          <Check className="w-14 h-14 text-white" strokeWidth={2.5} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-4xl font-bold text-white">You&apos;re Live</h2>
        <p className="text-muted-foreground text-base max-w-sm mx-auto">
          Your OS is ready.
        </p>
        {/* Summary chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs text-foreground font-medium">
            <Check className="w-3 h-3 text-red-400" />
            {pinnedCount} app{pinnedCount !== 1 ? 's' : ''} pinned
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs text-foreground font-medium">
            <Check className="w-3 h-3 text-red-400" />
            {sphereLabel} sphere
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function SetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { completeOnboarding } = useOnboarding();

  const userName: string =
    (user as { firstName?: string; email?: string } | null)?.firstName ??
    user?.email?.split('@')[0] ??
    '';

  const [step, setStep] = useState<number>(1);
  const [transitioning, setTransitioning] = useState(false);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left');
  const contentRef = useRef<HTMLDivElement>(null);

  // Step 2 state
  const [business, setBusiness] = useState<BusinessData>({ name: '', type: '', phone: '' });

  // Step 3 state
  const [pinnedIds, setPinnedIds] = useState<string[]>(DEFAULT_PINNED_IDS);

  // Step 4 state
  const [sphereColorId, setSphereColorId] = useState<SphereColorId>('red');

  // Transition to next step with slide animation
  const goTo = useCallback((next: number, direction: 'left' | 'right') => {
    if (transitioning) return;
    setSlideDir(direction);
    setTransitioning(true);
    setTimeout(() => {
      setStep(next);
      setTransitioning(false);
    }, 220);
  }, [transitioning]);

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS) goTo(step + 1, 'left');
  }, [step, goTo]);

  const goBack = useCallback(() => {
    if (step > 1) goTo(step - 1, 'right');
  }, [step, goTo]);

  const handleLaunch = useCallback(() => {
    // Save all config to localStorage
    const config: OnboardingConfig = { business, pinnedModuleIds: pinnedIds, sphereColorId };
    saveToLocalStorage(SETUP_CONFIG_KEY, config);
    saveToLocalStorage(PINNED_MODULES_KEY, pinnedIds);
    saveToLocalStorage(SPHERE_CONFIG_KEY, { colorId: sphereColorId });

    // Mark onboarding complete
    completeOnboarding();

    router.push('/dashboard');
  }, [business, pinnedIds, sphereColorId, completeOnboarding, router]);

  const selectedSphere = SPHERE_COLORS.find((c) => c.id === sphereColorId) ?? SPHERE_COLORS[0];

  // Slide animation classes
  const slideClass = transitioning
    ? slideDir === 'left'
      ? 'opacity-0 translate-x-6'
      : 'opacity-0 -translate-x-6'
    : 'opacity-100 translate-x-0';

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      {/* Top progress bar */}
      <TopProgressBar step={step} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-10 pb-8">
        <div className="w-full max-w-lg flex flex-col gap-8">

          {/* Step dots */}
          <StepDots current={step} />

          {/* Step card */}
          <div className="bg-card border border-border rounded-2xl backdrop-blur-md overflow-hidden">
            {/* Animated content */}
            <div
              ref={contentRef}
              className={`p-8 transition-all duration-200 ease-out ${slideClass}`}
            >
              {step === 1 && <StepWelcome userName={userName} />}
              {step === 2 && <StepBusiness data={business} onChange={setBusiness} />}
              {step === 3 && <StepApps selected={pinnedIds} onChange={setPinnedIds} />}
              {step === 4 && <StepSphere selectedId={sphereColorId} onChange={setSphereColorId} />}
              {step === 5 && (
                <StepLive
                  pinnedCount={pinnedIds.length}
                  sphereLabel={selectedSphere.label}
                />
              )}
            </div>

            {/* Navigation bar */}
            <div className="px-8 pb-7 flex items-center justify-between">
              {/* Back */}
              <button
                onClick={goBack}
                disabled={step === 1}
                className={[
                  'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  step === 1
                    ? 'text-muted-foreground cursor-not-allowed'
                    : 'text-muted-foreground hover:text-white hover:bg-muted',
                ].join(' ')}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              {/* Right CTA */}
              {step < TOTAL_STEPS ? (
                <button
                  onClick={goNext}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 active:scale-[0.97]"
                >
                  {step === 1 ? 'Get Started' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleLaunch}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-bold rounded-xl transition-all duration-150 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.97]"
                >
                  Launch My OS
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Step counter */}
          <p className="text-center text-muted-foreground text-xs">
            Step {step} of {TOTAL_STEPS}
          </p>
        </div>
      </div>

      {/* Subtle background radial glow */}
      <div
        className="fixed inset-0 pointer-events-none z-[-1]"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(239,68,68,0.07) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
