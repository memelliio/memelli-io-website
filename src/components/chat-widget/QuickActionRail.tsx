'use client';

import { useRef, useState, useEffect } from 'react';
import { type LucideIcon } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface QuickAction {
  label: string;
  icon?: LucideIcon;
  action: string;
}

interface QuickActionRailProps {
  actions: QuickAction[];
  onAction: (action: string) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function QuickActionRail({ actions, onAction }: QuickActionRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function updateFades() {
      if (!el) return;
      setShowLeftFade(el.scrollLeft > 4);
      setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }

    updateFades();
    el.addEventListener('scroll', updateFades, { passive: true });
    return () => el.removeEventListener('scroll', updateFades);
  }, [actions]);

  if (!actions.length) return null;

  return (
    <div className="relative border-t border-zinc-800/40 px-3 py-2.5">
      {/* Left fade */}
      {showLeftFade && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-8
                        bg-gradient-to-r from-zinc-950/90 to-transparent" />
      )}

      {/* Scrollable rail */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.action}
              onClick={() => onAction(a.action)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-800/60
                         bg-zinc-900/30 px-3.5 py-1.5 text-xs text-zinc-300
                         hover:bg-zinc-800/50 hover:border-zinc-700 hover:text-red-400
                         transition-colors whitespace-nowrap"
            >
              {Icon && <Icon className="h-3 w-3" />}
              {a.label}
            </button>
          );
        })}
      </div>

      {/* Right fade */}
      {showRightFade && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-8
                        bg-gradient-to-l from-zinc-950/90 to-transparent" />
      )}
    </div>
  );
}
