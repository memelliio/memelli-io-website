'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const commandPairs = [
  {
    command: 'Call John Smith about his application',
    result:
      'Initiating call to John Smith... Connected via business line. CRM note added.',
    highlights: ['Connected via business line', 'CRM note added'],
  },
  {
    command: "What's blocking Sarah's approval?",
    result:
      'Credit utilization at 78% (target: <30%). 3 recent inquiries. Recommended: Credit optimization program.',
    highlights: ['78%', '<30%', '3 recent inquiries', 'Credit optimization program'],
  },
  {
    command: 'Add a new product to the Atlanta store',
    result:
      'Product form ready. Store: Atlanta Credit Repair. Category: Services. Price field awaiting input.',
    highlights: ['Atlanta Credit Repair', 'Services', 'Price field awaiting input'],
  },
  {
    command: 'Generate a landing page for funding consultants',
    result:
      'Website Builder activated. Template: Professional Services. Pages: Home, About, Services, Contact, Forum. SEO categories configured.',
    highlights: [
      'Website Builder activated',
      'Professional Services',
      'Home, About, Services, Contact, Forum',
      'SEO categories configured',
    ],
  },
  {
    command: "Show me this week's lead performance",
    result:
      '47 new leads. 12 qualified. 3 converted. Top source: Forum SEO (68%). Pipeline value: $34,200.',
    highlights: ['47 new leads', '12 qualified', '3 converted', 'Forum SEO (68%)', '$34,200'],
  },
];

function highlightText(text: string, highlights: string[]) {
  if (!highlights.length) return text;

  const parts: { text: string; bold: boolean }[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let earliestIndex = remaining.length;
    let matchedHighlight = '';

    for (const h of highlights) {
      const idx = remaining.indexOf(h);
      if (idx !== -1 && idx < earliestIndex) {
        earliestIndex = idx;
        matchedHighlight = h;
      }
    }

    if (matchedHighlight) {
      if (earliestIndex > 0) {
        parts.push({ text: remaining.slice(0, earliestIndex), bold: false });
      }
      parts.push({ text: matchedHighlight, bold: true });
      remaining = remaining.slice(earliestIndex + matchedHighlight.length);
    } else {
      parts.push({ text: remaining, bold: false });
      remaining = '';
    }
  }

  return parts.map((p, i) =>
    p.bold ? (
      <span key={i} className="text-blue-300 font-semibold">
        {p.text}
      </span>
    ) : (
      <span key={i}>{p.text}</span>
    )
  );
}

function TypedText({
  text,
  onComplete,
  speed = 35,
}: {
  text: string;
  onComplete?: () => void;
  speed?: number;
}) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed('');

    const interval = setInterval(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <>
      {displayed}
      {displayed.length < text.length && (
        <motion.span
          className="inline-block w-[2px] h-[1.1em] bg-[hsl(var(--muted))] ml-[1px] align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
        />
      )}
    </>
  );
}

export default function ConnectedAgentsSection() {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showResult, setShowResult] = useState(false);
  const [visiblePairs, setVisiblePairs] = useState<
    { command: string; result: string; highlights: string[]; showResult: boolean }[]
  >([]);
  const sequenceStarted = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });

  useEffect(() => {
    if (inView && !sequenceStarted.current) {
      sequenceStarted.current = true;
      setActiveIndex(0);
    }
  }, [inView]);

  const handleCommandComplete = () => {
    setShowResult(true);
  };

  useEffect(() => {
    if (!showResult || activeIndex < 0) return;

    const pair = commandPairs[activeIndex];
    setVisiblePairs((prev) => {
      const updated = [...prev];
      const existing = updated.findIndex((p) => p.command === pair.command);
      if (existing !== -1) {
        updated[existing] = { ...updated[existing], showResult: true };
      }
      return updated;
    });

    const timer = setTimeout(() => {
      setShowResult(false);
      const next = activeIndex + 1;
      if (next < commandPairs.length) {
        setActiveIndex(next);
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [showResult, activeIndex]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const pair = commandPairs[activeIndex];
    setVisiblePairs((prev) => {
      if (prev.some((p) => p.command === pair.command)) return prev;
      return [...prev, { ...pair, showResult: false }];
    });
  }, [activeIndex]);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [visiblePairs, showResult]);

  return (
    <section
      ref={ref}
      className="relative py-24 overflow-hidden"
      style={{ backgroundColor: '#09090b' }}
    >
      {/* Background radial gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(147,51,234,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            One Command. The Whole System Moves.
          </h2>
          <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-3xl mx-auto">
            The biggest feature isn&apos;t each tool &mdash; it&apos;s that everything is
            connected and agents coordinate across the entire platform.
          </p>
        </motion.div>

        {/* Command Panel */}
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div
            className="rounded-2xl border border-white/10 overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, rgba(24,24,27,0.85) 0%, rgba(9,9,11,0.95) 100%)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 0 80px rgba(147,51,234,0.06), 0 4px 32px rgba(0,0,0,0.5)',
            }}
          >
            {/* Panel header */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs text-[hsl(var(--muted-foreground))] font-mono">
                memelli-agent-console
              </span>
            </div>

            {/* Chat area */}
            <div
              ref={panelRef}
              className="p-6 space-y-5 min-h-[340px] max-h-[520px] overflow-y-auto"
              style={{ scrollBehavior: 'smooth' }}
            >
              <AnimatePresence mode="popLayout">
                {visiblePairs.map((pair, i) => {
                  const isActive = i === visiblePairs.length - 1 && activeIndex < commandPairs.length;
                  return (
                    <motion.div
                      key={pair.command}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-3"
                    >
                      {/* User command — right-aligned */}
                      <div className="flex justify-end">
                        <div className="bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-sm px-4 py-2.5 rounded-2xl rounded-br-md max-w-[85%] font-mono">
                          {isActive && !pair.showResult ? (
                            <TypedText
                              text={pair.command}
                              onComplete={handleCommandComplete}
                            />
                          ) : (
                            pair.command
                          )}
                        </div>
                      </div>

                      {/* AI result — left-aligned */}
                      {pair.showResult && (
                        <motion.div
                          className="flex justify-start"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <div
                            className="text-sm text-[hsl(var(--foreground))] px-4 py-3 rounded-2xl rounded-bl-md max-w-[85%] border border-blue-500/20 leading-relaxed"
                            style={{
                              background:
                                'linear-gradient(135deg, rgba(147,51,234,0.08) 0%, rgba(24,24,27,0.6) 100%)',
                            }}
                          >
                            <div className="w-1 h-full absolute left-0 top-0 rounded-l-2xl bg-blue-500/40 hidden" />
                            {highlightText(pair.result, pair.highlights)}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {visiblePairs.length === 0 && (
                <div className="flex items-center justify-center h-[280px]">
                  <motion.span
                    className="inline-block w-[2px] h-5 bg-[hsl(var(--muted-foreground))]"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-14"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30">
            Try the Agent Workflow
          </button>
        </motion.div>
      </div>
    </section>
  );
}
