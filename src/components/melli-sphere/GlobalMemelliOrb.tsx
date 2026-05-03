'use client';

/**
 * GlobalMemelliOrb — persistent floating Memelli assistant on every page.
 *
 * Voice system:
 *   - useDeepgram  → Deepgram TTS + STT via Next.js proxy routes
 *   - useWakeWord  → continuous browser Web Speech API wake-word listener
 *     (runs only when the orb is closed and idle)
 *
 * heroMode=true renders inline in the homepage hero; heroMode=false (default)
 * renders as the persistent bottom-right floating overlay.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import nextDynamic from 'next/dynamic';
import { DEFAULT_SPHERE_CONFIG, type SphereConfig } from './sphere-config';
import { useDeepgram } from '../../hooks/useDeepgram';
import { useDeepgramWakeWord, requestMicPermission } from '../../hooks/useDeepgramWakeWord';
import { useSiteConfig } from '../../hooks/useSiteConfig';

const HomeSphere = nextDynamic(
  () => import('./HomeSphere').then(m => ({ default: m.HomeSphere })),
  { ssr: false },
);

const SphereControls = nextDynamic(
  () => import('./SphereControls').then(m => ({ default: m.SphereControls })),
  { ssr: false },
);

/* ── Voice form-fill field definitions ──────────────────────────────────── */

const FORM_FIELDS = [
  { key: 'firstName',      question: "What's your first name?" },
  { key: 'lastName',       question: 'And your last name?' },
  { key: 'phone',          question: 'Your phone number?' },
  { key: 'email',          question: 'Your email address?' },
  { key: 'creditUsername', question: 'Your Smart Credit username or email?' },
  { key: 'creditPassword', question: 'And your Smart Credit password?' },
];

/* ── Extract core answer from a full spoken sentence ────────────────────── */

function extractAnswer(transcript: string, key: string): string {
  const t = transcript.trim();
  // Email: find email-like pattern
  if (key === 'email') {
    const m = t.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    if (m) return m[0];
  }
  // Phone: find digit string
  if (key === 'phone') {
    const m = t.match(/[\d\s\-\+\(\)]{7,}/);
    if (m) return m[0].trim();
  }
  // "my name is X", "I'm X", "it's X", "call me X"
  const namedMatch = t.match(/(?:my (?:first |last )?name is|i(?:'m| am)|it(?:'s| is)|call me|they call me)\s+(.+)/i);
  if (namedMatch) return namedMatch[1].trim().replace(/[.,!?]$/, '');
  // "my business/company/store is X", "it's called X"
  const bizMatch = t.match(/(?:my (?:business|company|store)(?: name)? is|it(?:'s| is) called|called)\s+(.+)/i);
  if (bizMatch) return bizMatch[1].trim().replace(/[.,!?]$/, '');
  // Strip generic lead-ins
  const stripped = t
    .replace(/^(?:it(?:'s| is)|i(?:'m| am)|my \w+(?: \w+)? is|the answer is|that(?:'s| is))\s+/i, '')
    .replace(/^["']|["']$/g, '');
  return stripped || t;
}

/* ── Constants (static fallbacks only — dynamic values come from useSiteConfig) ── */

/* ── Props ───────────────────────────────────────────────────────────────── */

interface GlobalMemelliOrbProps {
  /**
   * heroMode=true  → renders inline at large size inside the homepage hero
   *                   section (no fixed positioning, no floating button).
   * heroMode=false → (default) renders as the persistent floating overlay
   *                   fixed to the bottom-right of every page.
   */
  heroMode?: boolean;
  /**
   * formMode=true → suppress chat UI below the globe; state is pushed via
   * window.__memelliChatState so the form panel can render it instead.
   */
  formMode?: boolean;
  /** Hide conversation bubbles (userText/replyText) below the orb */
  hideChat?: boolean;
  /** Hide quick-prompt suggestion pills */
  hidePrompts?: boolean;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function GlobalMemelliOrb({ heroMode = false, formMode = false, hideChat = false, hidePrompts = false }: GlobalMemelliOrbProps) {
  const router = useRouter();
  usePathname(); // subscribe to route changes
  // Dev mode: globe uses Claude endpoint when accessed from dev.memelli.io
  const isDevMode = typeof window !== 'undefined' &&
    (window.location.hostname === 'dev.memelli.io' ||
     window.location.hostname.startsWith('dev.'));

  const config = useSiteConfig();
  const greeting: string = config.orb_greeting || "Hey, welcome! How can I help you today?";
  const wakeWords: string[] = config.orb_wake_words || ['hey memelli', 'hey melli'];
  const quickPrompts: string[] = config.orb_quick_prompts || ['What can you do?', 'Start free trial'];

  // Ref so callbacks always use the latest greeting even if config loads after mount
  const greetingRef = useRef(greeting);
  greetingRef.current = greeting;

  const [open, setOpen] = useState(false);
  const [userText, setUserText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [greeted, setGreeted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [sphereConfig, setSphereConfig] = useState<SphereConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('memelli_sphere_config');
        if (saved) return { ...DEFAULT_SPHERE_CONFIG, ...JSON.parse(saved) };
      } catch { /* ignore */ }
    }
    return DEFAULT_SPHERE_CONFIG;
  });

  const openRef = useRef(false);
  const greetedRef = useRef(false);
  const conversationRef = useRef(false);
  const lastNavRef = useRef<string | null>(null);
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const formFillRef = useRef(false);

  // Stable callback refs so effects & callbacks always see latest version
  const startListenRef = useRef<() => void>(() => {});
  const sendMsgRef = useRef<(m: string) => void>(() => {});

  // Web Audio analyser (hero mode)
  const analyserRef = useRef<AnalyserNode | null>(null);
  const analyserBufRef = useRef<Uint8Array | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  openRef.current = open;
  greetedRef.current = greeted;

  /* ── Deepgram hook ────────────────────────────────────────────────────── */

  const onTranscript = useCallback((text: string) => {
    sendMsgRef.current(text);
  }, []);

  const dg = useDeepgram(onTranscript);

  useEffect(() => {
    startListenRef.current = dg.startListening;
  }, [dg.startListening]);

  /* ── Wake word hook ───────────────────────────────────────────────────── */

  const onWakeWord = useCallback(() => {
    setOpen(true);
    conversationRef.current = true;
    if (!greetedRef.current) {
      setGreeted(true);
      dg.speak(greetingRef.current, () => setTimeout(() => startListenRef.current(), 400));
    } else {
      startListenRef.current();
    }
  }, [dg]);

  // Enable wake word only when orb is closed and idle
  const { blocked: micBlocked } = useDeepgramWakeWord(wakeWords, onWakeWord, !open && dg.state === 'idle');

  const handleEnableMic = useCallback(async () => {
    const granted = await requestMicPermission();
    if (granted) {
      // Permission granted — open the orb to start conversation immediately
      // (wake word will auto-start next page load since permission is now stored)
      setOpen(true);
      conversationRef.current = true;
      if (!greetedRef.current) {
        setGreeted(true);
        dg.speak(greetingRef.current, () => setTimeout(() => startListenRef.current(), 400));
      } else {
        dg.startListening();
      }
    }
  }, [dg]);

  /* ── Wire TTS audio into Web Audio analyser (hero mode) ──────────────── */

  useEffect(() => {
    if (!heroMode) return;
    // Poll for audio level to drive sphere animation
    let raf: number;
    function sample() {
      const analyser = analyserRef.current;
      const buf = analyserBufRef.current;
      if (analyser && buf) {
        analyser.getByteTimeDomainData(buf as Uint8Array<ArrayBuffer>);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        setAudioLevel(Math.min(1, Math.sqrt(sum / buf.length) * 3.5));
      } else {
        setAudioLevel(0);
      }
      raf = requestAnimationFrame(sample);
    }
    raf = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(raf);
  }, [heroMode]);

  /* ── Voice form fill ──────────────────────────────────────────────────── */

  const askFormField = useCallback(
    (fieldIndex: number) => {
      const field = FORM_FIELDS[fieldIndex];
      if (!field) {
        dg.speak(
          "Perfect! Review your info and hit Sign Up when you're ready.",
          () => { formFillRef.current = false; },
        );
        return;
      }

      if (typeof window === 'undefined') { askFormField(fieldIndex + 1); return; }

      const SR =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      // Tell the form which field is active so it can highlight it
      if (typeof window !== 'undefined') {
        (window as any).__memelliCurrentField = field.key;
        const onFieldChange = (window as any).__memelliOnFieldChange;
        if (typeof onFieldChange === 'function') onFieldChange(field.key);
      }

      setReplyText(field.question);
      dg.speak(field.question, () => {
        if (!SR) { askFormField(fieldIndex + 1); return; }

        const rec = new SR();
        rec.lang = 'en-US';
        rec.interimResults = false;

        rec.onresult = (e: any) => {
          const raw: string = e.results?.[0]?.[0]?.transcript || '';
          const answer = raw.toLowerCase() === 'skip' ? 'skip' : extractAnswer(raw, field.key);
          if (answer.toLowerCase() !== 'skip') {
            const setters = (window as any).__memelliFormSetters as
              | Record<string, (v: string) => void>
              | undefined;
            if (setters?.[field.key]) setters[field.key](answer);
          }
          const confirm =
            answer.toLowerCase() === 'skip' ? 'Skipped.' : `Got it.`;
          dg.speak(confirm, () => askFormField(fieldIndex + 1));
        };

        rec.onerror = () => askFormField(fieldIndex + 1);
        rec.onend = () => { /* no-op */ };

        try { rec.start(); } catch { askFormField(fieldIndex + 1); }
      });
    },
    [dg],
  );

  /* ── Send message to AI ───────────────────────────────────────────────── */

  const sendMessage = useCallback(
    async (msg: string) => {
      if (!msg.trim()) return;
      dg.stopSpeaking();
      setUserText(msg);
      setReplyText('');

      const isAuthed =
        typeof window !== 'undefined' &&
        !!(
          localStorage.getItem('memelli_live_token') ||
          localStorage.getItem('memelli_token')
        );

      try {
        // Read live page context registered by the current page
        const pageContext = typeof window !== 'undefined'
          ? ((window as any).__memelliPageContext as string | null | undefined) ?? null
          : null;

        const userToken =
          localStorage.getItem('memelli_live_token') ||
          localStorage.getItem('memelli_token') ||
          null;

        const res = await fetch(isDevMode ? '/api/ai/dev-voice' : '/api/ai/orb-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: msg,
            history: historyRef.current,
            lastNavHref: lastNavRef.current,
            isAuthed,
            userToken,
            pageContext,
          }),
        });
        const data = res.ok
          ? ((await res.json()) as Record<string, unknown>)
          : null;

        const nestedData = data?.data as Record<string, unknown> | undefined;
        const response: string =
          (data?.responseText as string | undefined) ??
          (nestedData?.responseText as string | undefined) ??
          "I'm Memelli — ask me anything about your OS.";
        const navHref: string | null =
          (data?.navHref as string | null | undefined) ??
          (nestedData?.navHref as string | null | undefined) ??
          null;
        const action: string | null =
          (data?.action as string | null | undefined) ?? null;

        if (action === 'start_onboarding') {
          const onboard = (window as any).__memelliOnboard as
            | (() => void)
            | undefined;
          if (typeof onboard === 'function') {
            setReplyText(response);
            dg.speak(response, () => onboard());
            return;
          }
        }

        if (navHref) lastNavRef.current = navHref;

        historyRef.current = [
          ...historyRef.current,
          { role: 'user' as const, content: msg },
          { role: 'assistant' as const, content: response },
        ].slice(-6);

        setReplyText(response);

        dg.speak(response, () => {
          if (!conversationRef.current) return;
          if (navHref && isAuthed) {
            const openModule = (window as any).__memelliOpenModule as
              | ((id: string) => void)
              | undefined;
            if (typeof openModule === 'function' && navHref.startsWith('/dashboard/')) {
              const id = navHref.split('/').pop() ?? '';
              setTimeout(() => { openModule(id); }, 400);
            } else {
              setTimeout(() => { router.push(navHref); }, 600);
            }
          } else if (navHref) {
            setTimeout(() => { router.push(navHref); }, 600);
          } else {
            setTimeout(() => startListenRef.current(), 400);
          }
        });
      } catch {
        const fb =
          "I'm Memelli — your AI business OS. Ask me to open any module or answer questions.";
        setReplyText(fb);
        dg.speak(fb, () => {
          if (conversationRef.current) setTimeout(() => startListenRef.current(), 400);
        });
      }
    },
    [dg, router],
  );

  useEffect(() => { sendMsgRef.current = sendMessage; }, [sendMessage]);

  // Map VoiceState (includes 'error') to OrbMode for display — declared here so
  // it's available to the useEffect below and to the render section below.
  const mode: 'idle' | 'listening' | 'thinking' | 'speaking' =
    dg.state === 'error' ? 'idle' : dg.state;

  // Expose sendMessage + live state so the form panel can render its own chat UI
  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).__memelliSend = (msg: string) => sendMsgRef.current(msg);
    return () => { delete (window as any).__memelliSend; };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cb = (window as any).__memelliChatStateCallback;
    if (typeof cb === 'function') cb({ replyText, userText, mode, greeted, inputVal });
  }, [replyText, userText, mode, greeted, inputVal]);

  /* ── Onboarding trigger (exposed on window) ───────────────────────────── */

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onboard = () => {
      // Stop any current speech/listening and reset into intake mode
      dg.stopSpeaking();
      dg.stopListening();
      setOpen(true);
      conversationRef.current = true;
      setGreeted(true);
      formFillRef.current = false;
      setUserText('');

      // Slide the form in immediately — don't wait for TTS
      const showForm = (window as any).__memelliShowSignup as (() => void) | undefined;
      if (typeof showForm === 'function') showForm();

      const msg = "Perfect. Let's get you set up. I'll ask a few quick questions.";
      setReplyText(msg);
      dg.speak(msg, () => {
        formFillRef.current = true;
        setTimeout(() => askFormField(0), 1200);
      });
    };
    (window as any).__memelliOnboard = onboard;
    return () => { delete (window as any).__memelliOnboard; };
  }, [dg, router, askFormField]);

  /* ── Handlers ─────────────────────────────────────────────────────────── */

  function handleOrbClick() {
    // In hero mode the sphere is always visible — treat as if open=true
    const isOpen = heroMode || open;
    if (!isOpen) {
      setOpen(true);
      conversationRef.current = true;
      if (!greeted) {
        setGreeted(true);
        dg.speak(greetingRef.current, () => setTimeout(() => startListenRef.current(), 400));
      } else {
        dg.startListening();
      }
    } else {
      if (dg.state === 'speaking') {
        dg.stopSpeaking();
      } else if (dg.state === 'listening') {
        dg.stopListening();
        conversationRef.current = false;
      } else {
        // idle or error — start conversation
        conversationRef.current = true;
        if (!greeted) {
          setGreeted(true);
          dg.speak(greetingRef.current, () => setTimeout(() => startListenRef.current(), 400));
        } else {
          dg.startListening();
        }
      }
    }
  }

  function closePanel() {
    dg.stopSpeaking();
    dg.stopListening();
    conversationRef.current = false;
    formFillRef.current = false;
    setOpen(false);
    setUserText('');
    setReplyText('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inputVal.trim()) { sendMessage(inputVal); setInputVal(''); }
  }

  const orbColor = {
    idle:      { bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.3)',  glow: 'rgba(220,38,38,0.2)' },
    listening: { bg: 'rgba(220,38,38,0.3)',  border: 'rgba(220,38,38,0.7)',  glow: 'rgba(220,38,38,0.4)' },
    thinking:  { bg: 'rgba(249,115,22,0.2)', border: 'rgba(249,115,22,0.5)', glow: 'rgba(249,115,22,0.3)' },
    speaking:  { bg: 'rgba(220,38,38,0.25)', border: 'rgba(220,38,38,0.6)',  glow: 'rgba(220,38,38,0.35)' },
  }[mode];

  /* ── Hero mode render ─────────────────────────────────────────────────── */

  if (heroMode) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full select-none">
        {/* Sphere — click to talk */}
        <div
          className="relative cursor-pointer w-[270px] h-[270px] sm:w-[380px] sm:h-[380px] lg:w-[460px] lg:h-[460px] overflow-hidden"
          onClick={handleOrbClick}
          title={mode === 'speaking' ? 'Tap to stop' : 'Click to talk to Melli'}
        >
          <div className="scale-[0.519] sm:scale-[0.731] lg:scale-[0.885] origin-top-left" style={{ width: 460, height: 460 }}>
            <HomeSphere state={mode} size={460} audioLevel={audioLevel} config={sphereConfig} />

            {/* Live controls — expands from right edge of sphere */}
            <SphereControls
              config={sphereConfig}
              onChange={(patch) => setSphereConfig(c => ({ ...c, ...patch }))}
              onSave={(cfg) => {
                setSphereConfig(cfg);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('memelli_sphere_config', JSON.stringify(cfg));
                }
              }}
            />

            {/* Idle mic invite */}
            {mode === 'idle' && (
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-3 pb-4">
                <div className="text-center pointer-events-none">
                  <p className="text-2xl md:text-3xl font-black text-white/80 tracking-tight leading-none">
                    &ldquo;Hey Memelli&rdquo;
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1 tracking-widest uppercase">
                    {greeted ? 'or tap to speak' : 'say it or tap to start'}
                  </p>
                </div>
                {micBlocked ? (
                  <button
                    onClick={handleEnableMic}
                    className="flex items-center gap-1.5 bg-amber-600/20 border border-amber-500/40 rounded-full px-3 py-1.5 backdrop-blur-sm hover:bg-amber-600/30 transition-colors"
                  >
                    <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                    </svg>
                    <span className="text-[10px] text-amber-300/90 font-semibold tracking-wide">Tap to enable Hey Memelli</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-red-600/15 border border-red-500/25 rounded-full px-3 py-1.5 backdrop-blur-sm pointer-events-none">
                    <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                    </svg>
                    <span className="text-[10px] text-red-300/80 font-medium tracking-wide">Listening for wake word</span>
                  </div>
                )}
              </div>
            )}

            {/* Stop button when speaking */}
            {mode === 'speaking' && (
              <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                <button
                  onClick={(e) => { e.stopPropagation(); dg.stopSpeaking(); conversationRef.current = false; }}
                  className="flex items-center gap-1.5 bg-red-700/60 border border-red-500/50 rounded-full px-3 py-1.5 backdrop-blur-sm hover:bg-red-600/70 transition-colors"
                >
                  <svg className="w-3 h-3 text-white fill-white" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
                  <span className="text-[11px] text-white font-medium tracking-wide">Stop</span>
                </button>
              </div>
            )}

            {/* State label */}
            {(mode === 'listening' || mode === 'thinking') && (
              <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                <span className="text-xs font-medium tracking-widest text-white/60 uppercase">
                  {mode === 'listening' ? 'Listening…' : 'Thinking…'}
                </span>
              </div>
            )}
          </div>{/* end scale wrapper */}
        </div>

        {/* Conversation bubbles — hidden in formMode or hideChat */}
        {!formMode && !hideChat && (replyText || userText) && (
          <div className="mt-4 flex flex-col gap-2 w-full max-w-xs px-4">
            {userText && (
              <div
                className="self-end px-3 py-2 rounded-2xl text-xs text-white/70 border border-white/10 max-w-[90%] text-right"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                {userText}
              </div>
            )}
            {replyText && (
              <div
                className="self-start px-4 py-3 rounded-2xl text-sm text-white/90 border border-red-500/20 max-w-[95%]"
                style={{ background: 'linear-gradient(135deg, rgba(153,27,27,0.4), rgba(127,29,29,0.25))' }}
              >
                {replyText}
              </div>
            )}
          </div>
        )}

        {/* Text input — hidden in formMode */}
        {!formMode && (mode === 'listening' || (mode === 'idle' && greeted)) && (
          <div className="mt-3 w-full max-w-xs px-4">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Speak or type…"
                autoFocus
                className="flex-1 bg-white/[0.08] border border-red-500/30 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/60 transition-colors"
              />
              <button
                type="submit"
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-red-600/80 flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z" /></svg>
              </button>
            </form>
          </div>
        )}

        {/* Quick prompts — hidden in formMode or hidePrompts */}
        {!formMode && !hidePrompts && mode === 'idle' && (
          <div className="mt-5 flex flex-wrap gap-1.5 justify-center px-4 max-w-xs">
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-[11px] text-white/40 hover:text-white/80 border border-white/[0.08] hover:border-red-500/40 rounded-full px-2.5 py-1 transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── Floating mode render (default — all other pages) ─────────────────── */

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[9990] flex flex-col items-end gap-3 pointer-events-none">

      {/* ── Expanded panel ──────────────────────────────────────────────── */}
      {open && (
        <div
          className="pointer-events-auto w-72 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(10,10,10,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{
                  backgroundColor:
                    mode === 'listening'
                      ? '#ef4444'
                      : mode === 'thinking'
                      ? '#f97316'
                      : '#dc2626',
                }}
              />
              <span className="text-xs font-bold text-zinc-300">Memelli</span>
              <span className="text-[10px] text-zinc-600 capitalize">{mode}</span>
            </div>
            <button
              onClick={closePanel}
              className="text-zinc-600 hover:text-zinc-300 transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          {/* Sphere */}
          <div className="flex justify-center py-3 cursor-pointer" onClick={handleOrbClick}>
            <HomeSphere
              state={mode}
              size={100}
              audioLevel={mode === 'speaking' ? 0.15 : 0}
              config={{ preset: 'classic', intensity: 1, idleBrightness: 0.7, activeBrightness: 1.2, showLogo: true } as any}
            />
          </div>

          {/* Chat bubbles */}
          {(userText || replyText) && (
            <div className="px-3 pb-2 flex flex-col gap-1.5 max-h-36 overflow-y-auto">
              {userText && (
                <div className="self-end text-xs text-white/60 bg-white/5 border border-white/[0.08] rounded-xl px-2.5 py-1.5 max-w-[90%] text-right">
                  {userText}
                </div>
              )}
              {replyText && (
                <div
                  className="self-start text-xs text-white/80 rounded-xl px-2.5 py-1.5 max-w-[95%]"
                  style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.2)' }}
                >
                  {replyText}
                </div>
              )}
            </div>
          )}

          {/* Text input */}
          <div className="px-3 pb-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder={mode === 'listening' ? 'Listening…' : 'Ask Memelli…'}
                className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 flex-shrink-0"
                style={{
                  background: inputVal.trim()
                    ? 'linear-gradient(135deg,#dc2626,#f97316)'
                    : 'rgba(255,255,255,0.06)',
                }}
              >
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Orb button — animated sphere, no M ───────────────────────── */}
      <button
        onClick={micBlocked && !open ? handleEnableMic : handleOrbClick}
        className="pointer-events-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden transition-all duration-300 relative"
        style={{
          boxShadow: `0 0 24px ${orbColor.glow}, 0 4px 16px rgba(0,0,0,0.6)`,
          border: `1.5px solid ${orbColor.border}`,
        }}
        title="Hey Memelli — click to talk"
      >
        {mode === 'listening' && (
          <div
            className="absolute inset-0 rounded-full animate-ping z-10 pointer-events-none"
            style={{ border: '2px solid rgba(220,38,38,0.4)' }}
          />
        )}
        <HomeSphere
          state={mode}
          size={64}
          audioLevel={mode === 'speaking' ? 0.2 : mode === 'listening' ? 0.1 : 0}
          config={{ preset: 'classic', intensity: 1, idleBrightness: 0.8, activeBrightness: 1.3, showLogo: true } as any}
        />
        {!open && mode === 'idle' && !micBlocked && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-zinc-600 tracking-wider pointer-events-none">
            Hey Memelli
          </div>
        )}
        {!open && micBlocked && (
          <div
            className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-amber-400/80 tracking-wide pointer-events-none bg-black/60 rounded-full px-2 py-0.5 flex items-center gap-1"
            title="Tap to enable microphone"
          >
            <svg className="w-2.5 h-2.5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
            </svg>
            Tap to enable
          </div>
        )}
      </button>
    </div>
  );
}
