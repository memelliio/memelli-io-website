'use client';

import { memo } from 'react';

function MUATyping() {
  return (
    <div className="flex items-start gap-3 animate-[mua-fade_0.2s_ease-out]">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-800 ring-2 ring-amber-500/50 animate-pulse shrink-0 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-white/20" />
      </div>
      <div className="rounded-2xl rounded-tl-md bg-white/[0.04] backdrop-blur-md border border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-zinc-400">Melli is typing</span>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-[mua-dot_1.4s_ease-in-out_infinite]" />
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-[mua-dot_1.4s_ease-in-out_0.2s_infinite]" />
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-[mua-dot_1.4s_ease-in-out_0.4s_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(MUATyping);
