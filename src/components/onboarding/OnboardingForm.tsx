'use client';

/**
 * OnboardingForm — full-screen intake wizard shown once on first dashboard load.
 * Stores completion in localStorage under 'memelli_onboarding_complete'.
 * On finish, calls onComplete() so the parent can dismiss and show the dashboard.
 *
 * All questions, industries, and goals are loaded dynamically from /api/config.
 * Hardcoded arrays below serve as fallbacks only (used while loading or if config unavailable).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSiteConfig } from '../../hooks/useSiteConfig';

/* ── Melli TTS (Deepgram Aura 2 → browser speechSynthesis fallback) ─── */
let _obAudio: HTMLAudioElement | null = null;
function obSpeak(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined') return;
  if (_obAudio) { try { _obAudio.pause(); _obAudio.src = ''; } catch { /* ignore */ } _obAudio = null; }
  fetch('/api/voice/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice: 'aura-2-aurora-en', format: 'mp3' }),
  }).then(r => {
    if (!r.ok) throw new Error();
    return r.blob();
  }).then(blob => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    _obAudio = audio;
    audio.onended = () => { URL.revokeObjectURL(url); _obAudio = null; onEnd?.(); };
    audio.onerror = () => { URL.revokeObjectURL(url); _obAudio = null; onEnd?.(); };
    audio.play().catch(() => { _obAudio = null; onEnd?.(); });
  }).catch(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      if (onEnd) u.onend = onEnd;
      window.speechSynthesis.speak(u);
    } else { onEnd?.(); }
  });
}
function obStopSpeak() {
  if (_obAudio) { try { _obAudio.pause(); _obAudio.src = ''; } catch { /* ignore */ } _obAudio = null; }
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
}

import nextDynamic from 'next/dynamic';
import { DEFAULT_SPHERE_CONFIG } from '../melli-sphere/sphere-config';
import { MelliCommandBar } from '../melli-sphere/MelliCommandBar';

const HomeSphere = nextDynamic(
  () => import('../melli-sphere/HomeSphere').then(m => ({ default: m.HomeSphere })),
  { ssr: false }
);

/* ── Fallback data (used only when /api/config is unavailable) ───────── */
interface OnboardingQuestion {
  step: number;
  voice: string;
  sphere: string;
}

const FALLBACK_QUESTIONS: OnboardingQuestion[] = [
  { step: 1, voice: "Let's get started. What's your first name?",          sphere: "Let's get started."             },
  { step: 2, voice: "Good to meet you. What kind of business are you building?", sphere: "Tell me about your business." },
  { step: 3, voice: "Which tools do you need most right now?",              sphere: "Pick what you need most."       },
  { step: 4, voice: "Last one — what's your main focus?",                   sphere: "What's your main goal right now?" },
];

const FALLBACK_INDUSTRIES = [
  'E-Commerce', 'Coaching / Education', 'Real Estate', 'Agency / Marketing',
  'Finance / Credit', 'Health & Wellness', 'SaaS / Tech', 'Other',
];

const FALLBACK_GOALS = [
  'Generate more leads',
  'Automate my business ops',
  'Build a digital product',
  'Repair / build credit',
  'Launch a new revenue stream',
  'Manage clients & deals',
  'Watch & stream content',
  'Just exploring',
];

const TOOLS = [
  { id: 'crm',             label: 'CRM & Pipelines',     accent: '#3b82f6' },
  { id: 'live-tv',         label: 'Live TV',              accent: '#ef4444' },
  { id: 'vpn',             label: 'Infinity VPN',         accent: '#22c55e' },
  { id: 'ai-agents',       label: 'AI Agents',            accent: '#10b981' },
  { id: 'commerce',        label: 'Commerce & Stores',    accent: '#f97316' },
  { id: 'phone',           label: 'Phone System',         accent: '#4ade80' },
  { id: 'revenue-builder', label: 'Revenue Builder',      accent: '#f97316' },
  { id: 'credit',          label: 'Credit Engine',        accent: '#fbbf24' },
  { id: 'analytics',       label: 'Analytics',            accent: '#ec4899' },
  { id: 'automation',      label: 'Automation',           accent: '#38bdf8' },
];

type Step = 1 | 2 | 3 | 4;

interface OnboardingFormProps {
  onComplete: () => void;
  /** Renders without the full-screen overlay — embeds inline in a parent container */
  inline?: boolean;
}

type FormState = {
  firstName: string;
  lastName: string;
  businessName: string;
  industry: string;
  size: string;
  tools: string[];
  goal: string;
};

function MicBtn({ onResult, active }: { onResult: (t: string) => void; active: boolean }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  function toggle() {
    if (listening) {
      recRef.current?.abort();
      setListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    recRef.current = rec;
    setListening(true);
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      if (t.trim()) onResult(t.trim());
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    try { rec.start(); } catch { setListening(false); }
  }

  if (!active) return null;
  return (
    <button type="button" onClick={toggle}
      className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
      style={{ background: listening ? 'rgba(220,38,38,0.8)' : 'rgba(255,255,255,0.06)', border: '1px solid', borderColor: listening ? '#dc2626' : 'rgba(255,255,255,0.1)' }}
      title={listening ? 'Listening…' : 'Speak your answer'}>
      <svg className={`w-4 h-4 ${listening ? 'text-white animate-pulse' : 'text-zinc-500'}`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-1 3a1 1 0 0 1 2 0v8a1 1 0 0 1-2 0V4zM7 11a5 5 0 0 0 10 0h2a7 7 0 0 1-6 6.93V21h-2v-3.07A7 7 0 0 1 5 11h2z"/>
      </svg>
    </button>
  );
}

/* ── Inline steps (used inside hero column — no overlay/sphere wrapper) ── */
function InlineSteps({
  step, form, set, toggleTool, next, back, finish,
  canNext1, canNext2, canNext3, canFinish, hasMic,
  industries, goals,
}: {
  step: Step; form: FormState;
  set: (k: keyof FormState, v: string | string[]) => void;
  toggleTool: (id: string) => void;
  next: () => void; back: () => void; finish: () => void;
  canNext1: boolean; canNext2: boolean; canNext3: boolean; canFinish: boolean;
  hasMic: boolean;
  industries: string[];
  goals: string[];
}) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="flex items-center gap-1.5 mb-5">
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <div key={s} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: s <= step ? 'linear-gradient(90deg,#dc2626,#f97316)' : 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(10,10,10,0.85)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#dc2626,#f97316,#dc2626)' }} />
        <div className="p-6">

          {step === 1 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-red-400 mb-1 font-medium">Welcome</p>
              <h2 className="text-xl font-black text-white mb-4">What&apos;s your name?</h2>
              <div className="flex gap-2 mb-3">
                <input autoFocus className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/60 transition-colors" placeholder="First name" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                <MicBtn active={hasMic} onResult={t => {
                  const parts = t.trim().split(/\s+/);
                  set('firstName', parts[0] || t);
                  if (parts.length > 1) set('lastName', parts.slice(1).join(' '));
                }} />
              </div>
              <div className="flex gap-2 mb-3">
                <input className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/60 transition-colors" placeholder="Last name" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                <MicBtn active={hasMic} onResult={t => set('lastName', t)} />
              </div>
              <div className="flex gap-2">
                <input className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/60 transition-colors" placeholder="Business name (optional)" value={form.businessName} onChange={e => set('businessName', e.target.value)} />
                <MicBtn active={hasMic} onResult={t => set('businessName', t === 'skip' ? '' : t)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-red-400 mb-1 font-medium">Your Business</p>
              <h2 className="text-xl font-black text-white mb-4">What industry?</h2>
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {industries.map(ind => (
                  <button key={ind} onClick={() => set('industry', ind)} className="text-left px-3 py-2 rounded-xl text-sm transition-all"
                    style={{ borderWidth: 1, borderColor: form.industry === ind ? '#dc2626' : 'rgba(255,255,255,0.07)', background: form.industry === ind ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.03)', color: form.industry === ind ? '#fff' : '#a1a1aa' }}>
                    {ind}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {['Solo', '2–10', '11–50', '50+'].map(s => (
                  <button key={s} onClick={() => set('size', s)} className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={{ borderWidth: 1, borderColor: form.size === s ? '#f97316' : 'rgba(255,255,255,0.08)', background: form.size === s ? 'rgba(249,115,22,0.12)' : 'transparent', color: form.size === s ? '#f97316' : '#71717a' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-red-400 mb-1 font-medium">Your Tools</p>
              <h2 className="text-xl font-black text-white mb-4">What will you use most?</h2>
              <div className="grid grid-cols-2 gap-1.5">
                {TOOLS.map(tool => {
                  const active = form.tools.includes(tool.id);
                  return (
                    <button key={tool.id} onClick={() => toggleTool(tool.id)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-all"
                      style={{ borderWidth: 1, borderColor: active ? `${tool.accent}55` : 'rgba(255,255,255,0.07)', background: active ? `${tool.accent}14` : 'rgba(255,255,255,0.02)', color: active ? '#fff' : '#71717a' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: active ? tool.accent : 'rgba(255,255,255,0.15)' }} />
                      {tool.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-red-400 mb-1 font-medium">Final Step</p>
              <h2 className="text-xl font-black text-white mb-4">Your #1 goal this month?</h2>
              <div className="flex flex-col gap-1.5">
                {goals.map(g => (
                  <button key={g} onClick={() => set('goal', g)} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm text-left transition-all"
                    style={{ borderWidth: 1, borderColor: form.goal === g ? '#dc2626' : 'rgba(255,255,255,0.07)', background: form.goal === g ? 'rgba(220,38,38,0.1)' : 'rgba(255,255,255,0.02)', color: form.goal === g ? '#fff' : '#a1a1aa' }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: form.goal === g ? '#ef4444' : 'rgba(255,255,255,0.2)' }} />
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-5">
            <button onClick={back} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors" style={{ visibility: step === 1 ? 'hidden' : 'visible' }}>← Back</button>
            {step < 4 ? (
              <button onClick={next} disabled={step === 1 ? !canNext1 : step === 2 ? !canNext2 : !canNext3}
                className="flex items-center gap-2 font-bold px-5 py-2 rounded-xl text-sm transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', boxShadow: '0 0 20px rgba(220,38,38,0.3)' }}>
                Continue →
              </button>
            ) : (
              <button onClick={finish} disabled={!canFinish}
                className="flex items-center gap-2 font-black px-6 py-2.5 rounded-xl text-sm transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#dc2626,#f97316)', color: '#fff', boxShadow: '0 0 28px rgba(220,38,38,0.4)' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Launch My OS
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="text-center text-zinc-700 text-xs mt-3">Step {step} of 4 · Private · Powers your AI</p>
    </div>
  );
}

export function OnboardingForm({ onComplete, inline = false }: OnboardingFormProps) {
  const siteConfig = useSiteConfig();

  // Derive dynamic config values with fallbacks
  const questions: OnboardingQuestion[] = (siteConfig.onboarding_questions as OnboardingQuestion[] | undefined)?.length
    ? (siteConfig.onboarding_questions as OnboardingQuestion[])
    : FALLBACK_QUESTIONS;

  const industries: string[] = (siteConfig.onboarding_industries as string[] | undefined)?.length
    ? (siteConfig.onboarding_industries as string[])
    : FALLBACK_INDUSTRIES;

  const goals: string[] = (siteConfig.onboarding_goals as string[] | undefined)?.length
    ? (siteConfig.onboarding_goals as string[])
    : FALLBACK_GOALS;

  // Build lookup maps from questions array
  const voiceQuestions: Record<number, string> = {};
  const spherePrompts: Record<number, string> = {};
  for (const q of questions) {
    voiceQuestions[q.step] = q.voice;
    spherePrompts[q.step] = q.sphere;
  }

  const [step, setStep] = useState<Step>(1);
  const [sphereState, setSphereState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('speaking');
  const [melliMsg, setMelliMsg] = useState(spherePrompts[1] ?? FALLBACK_QUESTIONS[0].sphere);
  const [hasMic, setHasMic] = useState(false);
  const speakingRef = useRef(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    industry: '',
    size: '',
    tools: [] as string[],
    goal: '',
  });

  // Sync melliMsg when config loads (step 1 prompt may have changed)
  useEffect(() => {
    setMelliMsg(spherePrompts[step] ?? FALLBACK_QUESTIONS[0].sphere);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteConfig]);

  // Detect mic availability
  useEffect(() => {
    setHasMic(!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);
  }, []);

  // Speak question when step changes
  const stepRef = useRef(step);
  useEffect(() => { stepRef.current = step; }, [step]);

  const speakStep = useCallback((s: number) => {
    const text = voiceQuestions[s] ?? FALLBACK_QUESTIONS[(s - 1) % FALLBACK_QUESTIONS.length]?.voice ?? '';
    obStopSpeak();
    speakingRef.current = true;
    setSphereState('speaking');
    obSpeak(text, () => {
      speakingRef.current = false;
      if (stepRef.current === s) setSphereState('idle');
    });
  // voiceQuestions changes when siteConfig loads — intentionally omitted to avoid re-triggering mid-step
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteConfig]);

  // Speak on step change (full-screen overlay mode)
  useEffect(() => {
    if (inline) return;
    const t = setTimeout(() => speakStep(step), 300);
    return () => { clearTimeout(t); obStopSpeak(); };
  }, [step, inline, speakStep]);

  // Speak step 1 greeting on first render (inline mode too)
  useEffect(() => {
    const t = setTimeout(() => speakStep(1), 600);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function set(key: keyof typeof form, value: string | string[]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  // Expose setters for voice orb form-fill
  useEffect(() => {
    (window as any).__memelliFormSetters = {
      firstName: (v: string) => set('firstName', v),
      lastName:  (v: string) => set('lastName', v),
      email:     (v: string) => set('firstName', v), // email not in this form, map to firstName fallback
      phone:     () => {},
      password:  () => {},
    };
    return () => { delete (window as any).__memelliFormSetters; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleTool(id: string) {
    set('tools', form.tools.includes(id)
      ? form.tools.filter(t => t !== id)
      : [...form.tools, id]
    );
  }

  function next() {
    if (step < 4) {
      const ns = (step + 1) as Step;
      setStep(ns);
      setMelliMsg(spherePrompts[ns] ?? FALLBACK_QUESTIONS[(ns - 1) % FALLBACK_QUESTIONS.length]?.sphere ?? '');
      setSphereState('thinking');
      setTimeout(() => { speakStep(ns); }, 400);
    }
  }
  function back() {
    if (step > 1) {
      const ns = (step - 1) as Step;
      setStep(ns);
      setMelliMsg(spherePrompts[ns] ?? FALLBACK_QUESTIONS[(ns - 1) % FALLBACK_QUESTIONS.length]?.sphere ?? '');
    }
  }

  function finish() {
    localStorage.setItem('memelli_onboarding_complete', 'true');
    localStorage.setItem('melli_onboarding_complete', 'true'); // legacy hook key
    try {
      localStorage.setItem('memelli_onboarding_data', JSON.stringify(form));
    } catch { /* ignore */ }
    onComplete();
  }

  const canNext1 = form.firstName.trim().length > 0;
  const canNext2 = form.industry.length > 0;
  const canNext3 = form.tools.length > 0;
  const canFinish = form.goal.length > 0;

  // Inline mode — just render the steps card with no wrapper/sphere
  if (inline) {
    return (
      <InlineSteps
        step={step} form={form} set={set} toggleTool={toggleTool}
        next={next} back={back} finish={finish}
        canNext1={canNext1} canNext2={canNext2} canNext3={canNext3} canFinish={canFinish}
        hasMic={hasMic}
        industries={industries}
        goals={goals}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 40%, rgba(120,10,5,0.18) 0%, rgba(0,0,0,0) 70%), #0a0a0a' }}>

      {/* Grid lines */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <div className="relative w-full max-w-4xl mx-4 flex items-center gap-10">

        {/* ── Left — Sphere guide ──────────────────────────────── */}
        <div className="hidden lg:flex flex-col items-center flex-shrink-0 gap-3" style={{ width: 300 }}>
          <HomeSphere
            state={sphereState}
            size={220}
            audioLevel={sphereState === 'speaking' ? 0.18 : 0}
            config={{ ...DEFAULT_SPHERE_CONFIG, idleBrightness: 0.8, activeBrightness: 1.2 }}
          />
          <div className="text-center px-2">
            <p className="text-white font-bold text-sm mb-1">Melli</p>
            <p className="text-zinc-400 text-sm leading-relaxed transition-all duration-300 min-h-[2.5rem]">
              {melliMsg}
            </p>
          </div>

          {/* Command bar — skip the form, just ask Melli */}
          <MelliCommandBar
            placeholder='Say "load live tv" or "open crm"'
            onResponse={(text) => {
              setMelliMsg(text);
              setSphereState('thinking');
              setTimeout(() => setSphereState('speaking'), 800);
            }}
            onLaunch={(_ids) => {
              localStorage.setItem('memelli_onboarding_complete', 'true');
              setTimeout(() => onComplete(), 1200);
            }}
          />

          <button
            onClick={() => {
              setMelliMsg(spherePrompts[step] ?? FALLBACK_QUESTIONS[(step - 1) % FALLBACK_QUESTIONS.length]?.sphere ?? '');
              setSphereState('speaking');
            }}
            className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Skip to form →
          </button>
        </div>

        {/* ── Right — Form ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
        {/* Progress bar */}
        <div className="flex items-center gap-1.5 mb-6">
          {([1, 2, 3, 4] as Step[]).map((s) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{ background: s <= step ? 'linear-gradient(90deg,#dc2626,#f97316)' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        <div className="bg-zinc-950/95 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
          {/* Red top bar */}
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#dc2626,#f97316,#dc2626)' }} />

          <div className="p-7">

            {/* ── Step 1 — Who are you ─────────────────────────────── */}
            {step === 1 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-red-400 mb-2 font-medium">Welcome</p>
                <h2 className="text-2xl font-black text-white mb-1">What&apos;s your name?</h2>
                <p className="text-zinc-400 text-sm mb-6">Takes about 60 seconds.</p>

                <div className="flex gap-3 mb-4">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5 block">First Name</label>
                    <input
                      autoFocus
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/60 transition-colors"
                      placeholder="First"
                      value={form.firstName}
                      onChange={e => set('firstName', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5 block">Last Name</label>
                    <input
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/60 transition-colors"
                      placeholder="Last"
                      value={form.lastName}
                      onChange={e => set('lastName', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5 block">Business Name <span className="text-zinc-700 normal-case not-uppercase">(optional)</span></label>
                  <input
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/60 transition-colors"
                    placeholder="Your business or brand name"
                    value={form.businessName}
                    onChange={e => set('businessName', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* ── Step 2 — Your Business ───────────────────────────── */}
            {step === 2 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-red-400 mb-2 font-medium">Your Business</p>
                <h2 className="text-2xl font-black text-white mb-1">What industry are you in?</h2>
                <p className="text-zinc-400 text-sm mb-5">We&apos;ll tune your experience to match.</p>

                <div className="grid grid-cols-2 gap-2 mb-5">
                  {industries.map(ind => (
                    <button
                      key={ind}
                      onClick={() => set('industry', ind)}
                      className="text-left px-3.5 py-2.5 rounded-xl border text-sm transition-all"
                      style={{
                        borderColor: form.industry === ind ? '#dc2626' : 'rgba(255,255,255,0.08)',
                        background: form.industry === ind ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.03)',
                        color: form.industry === ind ? '#fff' : '#a1a1aa',
                      }}
                    >
                      {ind}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 block">Team Size</label>
                  <div className="flex gap-2">
                    {['Solo', '2–10', '11–50', '50+'].map(s => (
                      <button
                        key={s}
                        onClick={() => set('size', s)}
                        className="flex-1 py-2 rounded-xl border text-xs font-bold transition-all"
                        style={{
                          borderColor: form.size === s ? '#f97316' : 'rgba(255,255,255,0.08)',
                          background: form.size === s ? 'rgba(249,115,22,0.12)' : 'transparent',
                          color: form.size === s ? '#f97316' : '#71717a',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3 — Tools ──────────────────────────────────── */}
            {step === 3 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-red-400 mb-2 font-medium">Your Tools</p>
                <h2 className="text-2xl font-black text-white mb-1">What will you use most?</h2>
                <p className="text-zinc-400 text-sm mb-5">Select everything that applies.</p>

                <div className="grid grid-cols-2 gap-2">
                  {TOOLS.map(tool => {
                    const active = form.tools.includes(tool.id);
                    return (
                      <button
                        key={tool.id}
                        onClick={() => toggleTool(tool.id)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm text-left transition-all"
                        style={{
                          borderColor: active ? `${tool.accent}66` : 'rgba(255,255,255,0.07)',
                          background: active ? `${tool.accent}14` : 'rgba(255,255,255,0.02)',
                          color: active ? '#fff' : '#71717a',
                          boxShadow: active ? `0 0 12px ${tool.accent}22` : 'none',
                        }}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
                          style={{ background: active ? tool.accent : 'rgba(255,255,255,0.15)' }} />
                        {tool.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Step 4 — Goal ───────────────────────────────────── */}
            {step === 4 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-red-400 mb-2 font-medium">Final Step</p>
                <h2 className="text-2xl font-black text-white mb-1">What&apos;s your #1 goal?</h2>
                <p className="text-zinc-400 text-sm mb-5">Right now, this month.</p>

                <div className="flex flex-col gap-2">
                  {goals.map(g => (
                    <button
                      key={g}
                      onClick={() => set('goal', g)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all"
                      style={{
                        borderColor: form.goal === g ? '#dc2626' : 'rgba(255,255,255,0.07)',
                        background: form.goal === g ? 'rgba(220,38,38,0.1)' : 'rgba(255,255,255,0.02)',
                        color: form.goal === g ? '#fff' : '#a1a1aa',
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: form.goal === g ? '#ef4444' : 'rgba(255,255,255,0.2)' }} />
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nav buttons */}
            <div className="flex items-center justify-between mt-7">
              <button
                onClick={back}
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
              >
                ← Back
              </button>

              {step < 4 ? (
                <button
                  onClick={next}
                  disabled={step === 1 ? !canNext1 : step === 2 ? !canNext2 : !canNext3}
                  className="flex items-center gap-2 font-bold px-6 py-2.5 rounded-xl text-sm transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', boxShadow: '0 0 24px rgba(220,38,38,0.3)' }}
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={finish}
                  disabled={!canFinish}
                  className="flex items-center gap-2 font-black px-7 py-3 rounded-xl text-sm transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #f97316)', color: '#fff', boxShadow: '0 0 32px rgba(220,38,38,0.4)' }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  Launch My OS
                </button>
              )}
            </div>
          </div>
        </div>

          <p className="text-center text-zinc-700 text-xs mt-4">
            Step {step} of 4 · Your data stays private and powers your AI
          </p>
        </div>{/* end form col */}
      </div>{/* end flex row */}
    </div>
  );
}
