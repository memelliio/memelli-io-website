'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface AIExperienceDemoProps {
  onStartConversation?: () => void;
}

interface DemoMessage {
  role: 'user' | 'ai';
  text: string;
}

const conversation: DemoMessage[] = [
  { role: 'user', text: 'How much funding can I qualify for?' },
  { role: 'ai', text: 'That depends on a few factors. Are you looking for personal funding or business funding?' },
  { role: 'user', text: 'Business funding.' },
  { role: 'ai', text: 'Great. I can help with that. Are you already in business, or are you just getting started?' },
  { role: 'user', text: 'Just getting started.' },
  { role: 'ai', text: 'Perfect. I can still guide you through the right path. Want to see the fastest options first?' },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--muted-foreground))]"
            style={{
              animation: 'typing-bounce 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function AIExperienceDemo({ onStartConversation }: AIExperienceDemoProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState<DemoMessage[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [demoComplete, setDemoComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animatingRef = useRef(false);

  const runDemo = useCallback(() => {
    if (animatingRef.current) return;
    animatingRef.current = true;

    let index = 0;

    const showNext = () => {
      if (index >= conversation.length) {
        setShowTyping(false);
        setDemoComplete(true);
        animatingRef.current = false;
        return;
      }

      const msg = conversation[index];

      if (msg.role === 'ai') {
        setShowTyping(true);
        setTimeout(() => {
          setShowTyping(false);
          setVisibleMessages((prev) => [...prev, msg]);
          index++;
          setTimeout(showNext, 800);
        }, 1200);
      } else {
        setVisibleMessages((prev) => [...prev, msg]);
        index++;
        setTimeout(showNext, 1000);
      }
    };

    showNext();
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          runDemo();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [started, runDemo]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleMessages, showTyping]);

  return (
    <section
      ref={sectionRef}
      className="relative bg-[hsl(var(--background))] px-4 py-28 sm:px-6 sm:py-36"
    >
      {/* Keyframes for typing dots */}
      <style jsx>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>

      <div className="mx-auto max-w-2xl">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
          A real AI operating experience
        </h2>

        {/* Chat shell */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.04] bg-[hsl(var(--muted))] shadow-2xl shadow-black/60 backdrop-blur-xl">
          {/* Header bar */}
          <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-5 py-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/15">
              <Sparkles className="h-3.5 w-3.5 text-red-400" />
            </div>
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">Melli AI</span>
            <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex max-h-[400px] min-h-[320px] flex-col gap-3 overflow-y-auto p-5"
          >
            {visibleMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ai' && (
                  <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/15">
                    <Sparkles className="h-3.5 w-3.5 text-red-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-red-600 text-white'
                      : 'bg-white/[0.06] text-[hsl(var(--foreground))] backdrop-blur-sm'
                  }`}
                  style={{
                    animation: 'fadeSlideIn 0.3s ease-out forwards',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {showTyping && (
              <div className="flex justify-start">
                <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/15">
                  <Sparkles className="h-3.5 w-3.5 text-red-400" />
                </div>
                <div className="rounded-2xl bg-white/[0.06] backdrop-blur-sm">
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>

          {/* CTA after demo */}
          {demoComplete && onStartConversation && (
            <div className="border-t border-white/[0.06] px-5 py-4">
              <button
                type="button"
                onClick={onStartConversation}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_-4px_rgba(147,51,234,0.5)] transition-all hover:from-red-500 hover:to-violet-500 hover:shadow-[0_0_36px_-4px_rgba(147,51,234,0.6)]"
              >
                Start your own conversation
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline animation keyframe */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
