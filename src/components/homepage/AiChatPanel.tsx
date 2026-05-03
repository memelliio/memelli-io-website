'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

/* ─── Types ─── */

type MsgKind = 'user' | 'thinking' | 'ai-score' | 'ai-blockers';

interface Message {
  id: number;
  kind: MsgKind;
  delay: number; // ms after mount before appearing
}

const SCRIPT: Message[] = [
  { id: 1, kind: 'user', delay: 600 },
  { id: 2, kind: 'thinking', delay: 2000 },
  { id: 3, kind: 'ai-score', delay: 3800 },
  { id: 4, kind: 'user', delay: 6400 },
  { id: 5, kind: 'thinking', delay: 7800 },
  { id: 6, kind: 'ai-blockers', delay: 9400 },
];

/* ─── Animated Progress Ring ─── */

function ScoreRing({ value, size = 72 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <svg width={size} height={size} className="drop-shadow-lg">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(124,58,237,0.15)"
        strokeWidth={6}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="fill-white font-bold text-lg"
        style={{ fontSize: 18 }}
      >
        {value}%
      </text>
    </svg>
  );
}

/* ─── Typing Dots ─── */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2">
      {/* logo pulse */}
      <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-600 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-lg bg-blue-500/40"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="text-white font-bold text-[10px] relative z-10 select-none">M</span>
      </div>

      <div className="flex gap-1 ml-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-blue-400"
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.18,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Floating Particles ─── */

function Particles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-px h-px rounded-full"
          style={{
            left: `${8 + Math.random() * 84}%`,
            top: `${8 + Math.random() * 84}%`,
            background: i % 2 === 0 ? 'rgba(124,58,237,0.35)' : 'rgba(59,130,246,0.3)',
            width: 2,
            height: 2,
          }}
          animate={{
            y: [0, -20 - Math.random() * 30, 0],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Subtle Grid Overlay ─── */

function GridOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.03]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(124,58,237,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.5) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    />
  );
}

/* ─── Message Bubbles ─── */

const msgAnim = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};

function UserBubble({ text }: { text: string }) {
  return (
    <motion.div {...msgAnim} className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 bg-gradient-to-r from-blue-600/90 to-blue-500/80 text-white text-[13px] leading-relaxed shadow-lg shadow-blue-900/20">
        {text}
      </div>
    </motion.div>
  );
}

function AiScoreCard() {
  return (
    <motion.div {...msgAnim} className="flex justify-start gap-2.5">
      {/* avatar */}
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-600 flex items-center justify-center mt-0.5">
        <span className="text-white font-bold text-[10px] select-none">M</span>
      </div>

      {/* card */}
      <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-white/[0.06] bg-white/[0.04] backdrop-blur-md p-4 space-y-3 shadow-xl shadow-black/20">
        <p className="text-[hsl(var(--foreground))] text-[13px] leading-relaxed">
          Based on your profile, here&apos;s your{' '}
          <span className="text-blue-400 font-semibold">instant readiness assessment</span>:
        </p>

        {/* score row */}
        <div className="flex items-center gap-4">
          <ScoreRing value={72} />
          <div className="space-y-1">
            <p className="text-white font-semibold text-sm">Funding Readiness Score</p>
            <p className="text-[hsl(var(--muted-foreground))] text-xs">
              <span className="text-amber-400 font-medium">2 items</span> need attention
            </p>
          </div>
        </div>

        {/* action buttons */}
        <div className="flex gap-2 pt-1">
          <button className="px-3 py-1.5 rounded-lg bg-blue-600/90 text-white text-[11px] font-medium hover:bg-blue-500 transition-colors cursor-default">
            View Full Report
          </button>
          <button className="px-3 py-1.5 rounded-lg border border-white/10 text-[hsl(var(--foreground))] text-[11px] font-medium hover:bg-white/5 transition-colors cursor-default">
            Start Fixing Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function AiBlockersCard() {
  const items = [
    { ok: true, label: 'Business age', detail: 'Qualified', color: 'text-emerald-400' },
    { ok: false, label: 'Credit utilization', detail: 'Too high', color: 'text-red-400' },
    { ok: false, label: 'Recent inquiries', detail: '4 in 90 days', color: 'text-red-400' },
  ];

  return (
    <motion.div {...msgAnim} className="flex justify-start gap-2.5">
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-600 flex items-center justify-center mt-0.5">
        <span className="text-white font-bold text-[10px] select-none">M</span>
      </div>

      <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-white/[0.06] bg-white/[0.04] backdrop-blur-md p-4 space-y-3 shadow-xl shadow-black/20">
        <p className="text-[hsl(var(--foreground))] text-[13px] leading-relaxed">
          Here&apos;s what&apos;s{' '}
          <span className="text-blue-400 font-semibold">blocking your approval</span>:
        </p>

        <div className="space-y-2">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.15, duration: 0.35 }}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] ${
                item.ok
                  ? 'bg-emerald-500/[0.07] border border-emerald-500/10'
                  : 'bg-red-500/[0.07] border border-red-500/10'
              }`}
            >
              <span className={`font-bold text-sm ${item.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {item.ok ? <CheckCircle2 className="w-3.5 h-3.5 inline" /> : <XCircle className="w-3.5 h-3.5 inline" />}
              </span>
              <span className="text-[hsl(var(--foreground))] font-medium">{item.label}:</span>
              <span className={`${item.color} font-semibold ml-auto`}>{item.detail}</span>
            </motion.div>
          ))}
        </div>

        {/* recommendation */}
        <div className="flex items-center gap-2 pt-1 pl-1">
          <span className="text-blue-400 text-sm">→</span>
          <span className="text-[hsl(var(--muted-foreground))] text-[12px]">
            Recommended:{' '}
            <span className="text-blue-400 font-semibold">Credit optimization program</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Panel ─── */

export default function AiChatPanel() {
  const [visible, setVisible] = useState<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    SCRIPT.forEach((msg) => {
      timers.push(
        setTimeout(() => {
          setVisible((prev) => {
            // if it's a thinking indicator, remove previous thinking first
            if (msg.kind === 'thinking') {
              return [...prev.filter((id) => {
                const m = SCRIPT.find((s) => s.id === id);
                return m?.kind !== 'thinking';
              }), msg.id];
            }
            // if it's an AI response, remove the thinking indicator
            if (msg.kind === 'ai-score' || msg.kind === 'ai-blockers') {
              return [...prev.filter((id) => {
                const m = SCRIPT.find((s) => s.id === id);
                return m?.kind !== 'thinking';
              }), msg.id];
            }
            return [...prev, msg.id];
          });
        }, msg.delay)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  // auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [visible]);

  const renderMessage = useCallback((msg: Message) => {
    switch (msg.kind) {
      case 'user':
        return (
          <UserBubble
            key={msg.id}
            text={
              msg.id === 1
                ? 'Can I qualify for business funding?'
                : "What's blocking my approval?"
            }
          />
        );
      case 'thinking':
        return (
          <motion.div key={`thinking-${msg.id}`} {...msgAnim} className="flex justify-start gap-2.5 pl-0.5">
            <TypingIndicator />
          </motion.div>
        );
      case 'ai-score':
        return <AiScoreCard key={msg.id} />;
      case 'ai-blockers':
        return <AiBlockersCard key={msg.id} />;
      default:
        return null;
    }
  }, []);

  return (
    <div className="relative w-full max-w-[420px] mx-auto select-none" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* outer glow border */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-blue-500/30 via-blue-500/20 to-blue-600/30 blur-[1px]" />

      {/* panel */}
      <div className="relative rounded-2xl border border-white/[0.08] bg-[hsl(var(--card))] backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/40">
        {/* background effects */}
        <Particles />
        <GridOverlay />

        {/* header bar */}
        <div className="relative z-10 flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06]">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs select-none">M</span>
            </div>
            {/* pulse ring */}
            <motion.div
              className="absolute -inset-1 rounded-xl border border-blue-500/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <div>
            <p className="text-white text-sm font-semibold tracking-tight">Memelli AI</p>
            <p className="text-emerald-400 text-[10px] font-medium flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </p>
          </div>
          <div className="ml-auto flex gap-1">
            {[1, 2, 3].map((d) => (
              <div key={d} className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--muted-foreground))]" />
            ))}
          </div>
        </div>

        {/* messages area */}
        <div
          ref={scrollRef}
          className="relative z-10 px-4 py-4 space-y-3 overflow-y-auto"
          style={{ height: 420, scrollbarWidth: 'none' }}
        >
          <AnimatePresence mode="popLayout">
            {SCRIPT.filter((m) => visible.includes(m.id)).map(renderMessage)}
          </AnimatePresence>
        </div>

        {/* input bar (visual only) */}
        <div className="relative z-10 px-4 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5">
            <span className="text-[hsl(var(--muted-foreground))] text-[13px] flex-1">Ask Memelli AI anything...</span>
            <div className="w-7 h-7 rounded-lg bg-blue-600/80 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
