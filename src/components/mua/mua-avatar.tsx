'use client';

import { memo } from 'react';

type AvatarState = 'idle' | 'thinking' | 'speaking' | 'listening';

interface MUAAvatarProps {
  state?: AvatarState;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-12 h-12',
};

const GLOW_MAP = {
  idle: '',
  thinking: 'shadow-[0_0_12px_rgba(251,191,36,0.3)]',
  speaking: 'shadow-[0_0_12px_rgba(147,51,234,0.3)]',
  listening: 'shadow-[0_0_12px_rgba(52,211,153,0.3)]',
};

const RING_MAP = {
  idle: 'ring-zinc-700',
  thinking: 'ring-amber-500/50 animate-pulse',
  speaking: 'ring-red-500/50 animate-[mua-breathe_2s_ease-in-out_infinite]',
  listening: 'ring-emerald-500/50 animate-pulse',
};

function MUAAvatar({ state = 'idle', size = 'md' }: MUAAvatarProps) {
  return (
    <div className={`relative ${SIZE_MAP[size]} shrink-0`}>
      <div
        className={`${SIZE_MAP[size]} rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-800 ring-2 ${RING_MAP[state]} ${GLOW_MAP[state]} flex items-center justify-center transition-all duration-300`}
      >
        {/* Inner glow orb */}
        <div className="w-3/5 h-3/5 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
      </div>
      {/* Status indicator */}
      {state !== 'idle' && (
        <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 ${
          state === 'thinking' ? 'bg-amber-400 animate-pulse' :
          state === 'speaking' ? 'bg-red-400' :
          'bg-emerald-400 animate-pulse'
        }`} />
      )}
    </div>
  );
}

export default memo(MUAAvatar);
