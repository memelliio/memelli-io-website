'use client';

import { memo } from 'react';
import { Activity } from 'lucide-react';

interface Dispatch {
  task: string;
  domain: string;
  status: string;
  dispatchedAt: string;
}

interface MUAActivityProps {
  dispatches: Dispatch[];
}

function MUAActivity({ dispatches }: MUAActivityProps) {
  if (!dispatches.length) return null;

  return (
    <div className="border-t border-white/[0.04] px-5 py-2.5 animate-[mua-fade_0.2s_ease-out]">
      <div className="flex items-center gap-2 mb-1.5">
        <Activity className="h-3 w-3 text-red-400 animate-pulse" />
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
          {dispatches.length} active
        </span>
      </div>
      <div className="space-y-1">
        {dispatches.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
              d.status === 'dispatched' ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'
            }`} />
            <span className="text-zinc-400 truncate flex-1">{d.task?.slice(0, 50)}</span>
            <span className="text-zinc-600 shrink-0 font-mono text-[9px]">{d.domain}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(MUAActivity);
