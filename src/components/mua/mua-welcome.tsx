'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';
import type { SphereState } from '../sphere-animated';

const SphereAnimated = dynamic(() => import('../sphere-animated'), { ssr: false });

interface MUAWelcomeProps {
  onSuggest: (text: string) => void;
  sphereState?: SphereState;
}

const QUICK_PROMPTS = [
  'What can you do?',
  'Show me my funding options',
  'Check system health',
  'Help me with credit',
];

function MUAWelcome({ onSuggest, sphereState = 'idle' }: MUAWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 animate-[mua-fade_0.4s_ease-out]">
      {/* Animated Sphere */}
      <div className="mb-4">
        <SphereAnimated state={sphereState} size={100} />
      </div>

      {/* Wake word CTA */}
      <p className="text-[15px] text-center max-w-[280px] leading-relaxed mb-1">
        <span className="text-white font-semibold">Say </span>
        <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent font-bold text-[16px]">Hey Melli</span>
      </p>
      <p className="text-[13px] text-zinc-400 text-center max-w-[260px] leading-relaxed mb-6">
        to activate your <span className="text-zinc-300 font-medium">Melli OS Cockpit</span>
      </p>

      {/* Quick prompts */}
      <div className="flex flex-wrap justify-center gap-2 max-w-[300px]">
        {QUICK_PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => onSuggest(p)}
            className="rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-md px-3.5 py-1.5 text-[12px] text-zinc-400 transition-all hover:border-white/[0.12] hover:text-zinc-200 hover:bg-white/[0.06] active:scale-[0.97]"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(MUAWelcome);
