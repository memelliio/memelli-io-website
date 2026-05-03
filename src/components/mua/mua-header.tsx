'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';
import { X } from 'lucide-react';
import type { SphereState } from '../sphere-animated';

const SphereAnimated = dynamic(() => import('../sphere-animated'), { ssr: false });

type MUAStatus = 'idle' | 'thinking' | 'speaking' | 'listening' | 'error';

interface MUAHeaderProps {
  status: MUAStatus;
  title?: string;
  subtitle?: string;
  transcript?: string;
  onClose: () => void;
  onDragStart?: (e: React.MouseEvent) => void;
}

const STATUS_CONFIG: Record<MUAStatus, { color: string; label: string }> = {
  idle: { color: 'bg-zinc-500', label: 'Ready' },
  thinking: { color: 'bg-amber-400 animate-pulse', label: 'Thinking...' },
  speaking: { color: 'bg-red-400', label: 'Speaking' },
  listening: { color: 'bg-emerald-400 animate-pulse', label: 'Listening' },
  error: { color: 'bg-red-500', label: 'Reconnecting...' },
};

/** Map MUA status to sphere-animated state */
function toSphereState(status: MUAStatus): SphereState {
  switch (status) {
    case 'idle': return 'idle';
    case 'thinking': return 'thinking';
    case 'speaking': return 'speaking';
    case 'listening': return 'listening';
    case 'error': return 'error';
  }
}

function MUAHeader({ status, title = 'Melli', subtitle, transcript, onClose, onDragStart }: MUAHeaderProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div
      className="relative shrink-0 md:cursor-grab md:active:cursor-grabbing select-none bg-zinc-950/80 backdrop-blur-3xl"
      onMouseDown={onDragStart}
    >
      {/* Traffic light dots + title */}
      <div className="flex items-center gap-4 px-5 py-3">
        {/* Left: Animated Sphere + info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Animated Sphere Avatar */}
          <div className="relative shrink-0 w-10 h-10">
            <SphereAnimated state={toSphereState(status)} size={40} />
            <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 ${cfg.color}`} />
          </div>

          {/* Title + status */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-white tracking-tight">{title}</h3>
              <span className="text-[10px] text-zinc-500 font-mono">{cfg.label}</span>
            </div>
            {transcript ? (
              <p className="text-[12px] text-zinc-300 truncate animate-pulse mt-0.5">&ldquo;{transcript}&rdquo;</p>
            ) : subtitle ? (
              <p className="text-[12px] text-zinc-500 truncate mt-0.5">{subtitle}</p>
            ) : null}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="flex h-10 w-10 md:h-7 md:w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-all"
          >
            <X className="h-5 w-5 md:h-4 md:w-4" />
          </button>
        </div>
      </div>

      {/* Bottom border — subtle */}
      <div className="h-px bg-gradient-to-r from-transparent via-zinc-800/40 to-transparent" />
    </div>
  );
}

export default memo(MUAHeader);
