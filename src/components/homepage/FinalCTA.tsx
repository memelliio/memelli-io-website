'use client';

import { ArrowRight, Sparkles } from 'lucide-react';

interface FinalCTAProps {
  onTalkToAI?: () => void;
  onExplore?: () => void;
}

export default function FinalCTA({ onTalkToAI, onExplore }: FinalCTAProps) {
  return (
    <section className="relative overflow-hidden bg-[hsl(var(--background))] px-4 py-28 sm:px-6 sm:py-36">
      {/* Radial background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(147,51,234,0.08) 0%, rgba(126,34,206,0.04) 40%, transparent 80%)',
        }}
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Start with a conversation.
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
          Ask the AI about funding, credit, business growth, or anything
          Memelli OS can help unlock.
        </p>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {/* Primary glowing button */}
          <button
            type="button"
            data-track="final-cta-talk"
            onClick={onTalkToAI}
            className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-red-600 to-violet-600 px-8 py-4 text-base font-bold text-white shadow-[0_0_32px_-4px_rgba(147,51,234,0.5)] transition-all hover:from-red-500 hover:to-violet-500 hover:shadow-[0_0_48px_-4px_rgba(147,51,234,0.6)]"
          >
            <Sparkles className="h-5 w-5" />
            Talk to the AI
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Secondary glass button */}
          <button
            type="button"
            data-track="final-cta-explore"
            onClick={onExplore}
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-8 py-4 text-base font-semibold text-white backdrop-blur-xl transition-all hover:border-white/[0.15] hover:bg-white/[0.08]"
          >
            Explore Memelli OS
          </button>
        </div>

        <p className="mt-20 text-sm text-[hsl(var(--muted-foreground))]">Powered by Memelli OS</p>
      </div>
    </section>
  );
}
