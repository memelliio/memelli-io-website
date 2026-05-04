'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ShoppingCart,
  Users,
  GraduationCap,
  Search,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Mic,
  CheckCircle,
  Globe,
  Zap,
  Send,
} from 'lucide-react';
import { useApi } from '../../../hooks/useApi';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface OnboardingData {
  businessName: string;
  industry: string;
  role: string;
  primaryEngine: string | null;
  firstTask: string;
}

const ENGINES = [
  {
    id: 'crm',
    label: 'CRM',
    description: 'Manage contacts, deals, and pipelines',
    icon: Users,
    color: 'from-red-600/20 to-red-400/20 border-red-500/30',
  },
  {
    id: 'commerce',
    label: 'Commerce',
    description: 'Stores, products, orders, and subscriptions',
    icon: ShoppingCart,
    color: 'from-red-600/20 to-red-400/20 border-red-500/30',
  },
  {
    id: 'coaching',
    label: 'Coaching',
    description: 'Programs, lessons, and student management',
    icon: GraduationCap,
    color: 'from-emerald-600/20 to-teal-600/20 border-emerald-500/30',
  },
  {
    id: 'seo',
    label: 'SEO & Traffic',
    description: 'Content generation, rankings, and keyword research',
    icon: Search,
    color: 'from-amber-600/20 to-orange-600/20 border-amber-500/30',
  },
];

const INDUSTRIES = [
  'Technology',
  'E-Commerce',
  'Real Estate',
  'Finance',
  'Healthcare',
  'Education',
  'Marketing',
  'Consulting',
  'SaaS',
  'Other',
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Steps                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current
              ? 'w-8 bg-gradient-to-r from-red-500 to-red-600'
              : i < current
                ? 'w-4 bg-red-500/60'
                : 'w-4 bg-muted'
          }`}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Page                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function OnboardingPage() {
  const router = useRouter();
  const api = useApi();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    businessName: '',
    industry: '',
    role: '',
    primaryEngine: null,
    firstTask: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskDispatched, setTaskDispatched] = useState(false);

  const totalSteps = 5;

  const updateData = useCallback((partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const canAdvance = (): boolean => {
    switch (step) {
      case 0: return data.businessName.trim().length > 0 && data.industry.length > 0;
      case 1: return data.primaryEngine !== null;
      case 2: return true; // overview step, always can advance
      case 3: return true; // tutorial step
      case 4: return data.firstTask.trim().length > 0 || taskDispatched;
      default: return true;
    }
  };

  const handleFinish = useCallback(async () => {
    // Mark onboarding as complete
    const { error } = await api.post<{ message: string }>('/api/onboarding/complete', {
      businessName: data.businessName,
      industry: data.industry,
      role: data.role,
      primaryEngine: data.primaryEngine,
    });

    if (error) {
      console.error('[Onboarding] Failed to save onboarding data:', error);
    }

    router.push('/dashboard');
  }, [api, data, router]);

  const dispatchFirstTask = useCallback(async () => {
    if (!data.firstTask.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await api.post('/api/ai/chat', {
        message: data.firstTask,
        context: { currentPage: '/onboarding', section: 'onboarding' },
      });
      setTaskDispatched(true);
    } catch {
      // Still allow proceeding
      setTaskDispatched(true);
    }

    setIsSubmitting(false);
  }, [api, data.firstTask, isSubmitting]);

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  Step Content                                                          */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const renderStep = () => {
    switch (step) {
      // ── Step 1: Profile ─────────────────────────────────────────────
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Welcome to your Universe</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">Let&apos;s set up your business profile</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={data.businessName}
                  onChange={(e) => updateData({ businessName: e.target.value })}
                  placeholder="Your company name"
                  className="w-full rounded-xl border border-white/[0.04] bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Industry
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => updateData({ industry: ind })}
                      className={`rounded-xl border px-3 py-2 text-sm transition-all duration-200 ${
                        data.industry === ind
                          ? 'border-red-500/50 bg-red-500/[0.08] text-red-300'
                          : 'border-white/[0.04] bg-muted text-muted-foreground hover:bg-white/[0.04] hover:border-white/[0.08] hover:text-foreground'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Your Role (optional)
                </label>
                <input
                  type="text"
                  value={data.role}
                  onChange={(e) => updateData({ role: e.target.value })}
                  placeholder="e.g., CEO, Marketing Director, Developer"
                  className="w-full rounded-xl border border-white/[0.04] bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                />
              </div>
            </div>
          </div>
        );

      // ── Step 2: Business Type ──────────────────────────────────────
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Choose Your Primary Engine</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">Select the main engine for your business. You can use all of them — this just sets your default.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ENGINES.map((engine) => {
                const Icon = engine.icon;
                const selected = data.primaryEngine === engine.id;
                return (
                  <button
                    key={engine.id}
                    onClick={() => updateData({ primaryEngine: engine.id })}
                    className={`flex flex-col items-center gap-3 rounded-2xl border p-6 transition-all duration-200 ${
                      selected
                        ? `bg-gradient-to-br ${engine.color} shadow-lg`
                        : 'border-white/[0.04] bg-card backdrop-blur-xl hover:border-white/[0.08] hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className={`h-8 w-8 ${selected ? 'text-foreground' : 'text-muted-foreground'}`} />
                    <div className="text-center">
                      <div className={`text-sm font-semibold ${selected ? 'text-foreground' : 'text-foreground'}`}>
                        {engine.label}
                      </div>
                      <div className={`text-xs mt-1 ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {engine.description}
                      </div>
                    </div>
                    {selected && <CheckCircle className="h-5 w-5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        );

      // ── Step 3: System Overview ────────────────────────────────────
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Your Universe at a Glance</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">Here&apos;s what&apos;s powering your business</p>
            </div>

            <div className="space-y-3">
              {[
                { icon: Globe, label: 'Universe Platform', desc: 'A complete business operating system with 4 engines', color: 'text-red-400' },
                { icon: Zap, label: '11,000+ AI Agents', desc: 'Autonomous workforce handling tasks across 39 pools', color: 'text-amber-400' },
                { icon: Sparkles, label: 'Melli AI', desc: 'Your personal assistant — voice and text, always ready', color: 'text-red-400' },
                { icon: Users, label: 'CRM + Commerce + Coaching + SEO', desc: 'Full stack business management in one platform', color: 'text-emerald-400' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      // ── Step 4: Sphere Tutorial ────────────────────────────────────
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Meet Melli</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">Your always-on AI assistant lives in the Sphere</p>
            </div>

            <div className="relative mx-auto w-48 h-48 rounded-full bg-gradient-to-br from-red-600/20 to-red-400/20 border border-red-500/20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full animate-ping bg-red-500/5" />
              <Sparkles className="h-16 w-16 text-red-400" />
            </div>

            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-3 rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
                <Mic className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-foreground">Say &quot;Hey Melli&quot;</span>
                  <br />
                  Melli is always listening. Just speak your command.
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
                <Sparkles className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-foreground">Click the Sphere</span>
                  <br />
                  The glowing orb in the bottom-right corner opens Melli&apos;s chat panel.
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
                <Zap className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-foreground">Natural Language</span>
                  <br />
                  Ask Melli anything: &quot;Create a contact&quot;, &quot;Show my deals&quot;, &quot;Write a blog post&quot;
                </div>
              </div>
            </div>
          </div>
        );

      // ── Step 5: First Task ─────────────────────────────────────────
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Your First Command</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">Tell Melli what to do — she&apos;ll dispatch it to the agent workforce</p>
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {[
                  'Create a welcome email sequence',
                  'Set up a sales pipeline',
                  'Write 3 blog posts about my industry',
                  'Add a sample product to my store',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => updateData({ firstTask: suggestion })}
                    className={`rounded-xl border px-3 py-1.5 text-xs transition-all duration-200 ${
                      data.firstTask === suggestion
                        ? 'border-red-500/50 bg-red-500/[0.08] text-red-300'
                        : 'border-white/[0.04] bg-muted text-muted-foreground hover:border-white/[0.08] hover:bg-white/[0.04]'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={data.firstTask}
                  onChange={(e) => updateData({ firstTask: e.target.value })}
                  placeholder="Or type your own command..."
                  disabled={taskDispatched}
                  className="flex-1 rounded-xl border border-white/[0.04] bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none disabled:opacity-50 transition-all duration-200"
                />
                <button
                  onClick={dispatchFirstTask}
                  disabled={!data.firstTask.trim() || isSubmitting || taskDispatched}
                  className="shrink-0 flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-3 text-sm font-medium text-white disabled:opacity-40 transition-all duration-200"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : taskDispatched ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {taskDispatched ? 'Sent!' : 'Dispatch'}
                </button>
              </div>

              {taskDispatched && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
                  <CheckCircle className="h-6 w-6 text-emerald-400 mx-auto" />
                  <p className="mt-2 text-sm text-emerald-300 font-medium">
                    Task dispatched to the agent workforce!
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Melli and the agents are working on it. You&apos;ll see updates in your dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="flex min-h-screen items-center justify-center bg-card p-6">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-red-600/5" aria-hidden />

      <div className="w-full max-w-xl">
        {/* Step indicator */}
        <div className="flex justify-center mb-8">
          <StepIndicator current={step} total={totalSteps} />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-8 shadow-2xl">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {step < totalSteps - 1 ? (
            <button
              onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
              disabled={!canAdvance()}
              className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-40 transition-all duration-200"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-medium text-white hover:from-emerald-500 hover:to-teal-500 transition-all duration-200"
            >
              Enter Your Universe
              <Sparkles className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}