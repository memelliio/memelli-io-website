'use client';

import { memo } from 'react';
import { Activity, Users, Cpu, Shield, BarChart3, Zap, CreditCard, DollarSign, type LucideIcon } from 'lucide-react';

interface Suggestion {
  label: string;
  icon: LucideIcon;
  prompt: string;
}

const SUGGESTIONS: Suggestion[] = [
  { label: 'System Health', icon: Activity, prompt: 'System health' },
  { label: 'Contacts', icon: Users, prompt: 'Contacts' },
  { label: 'Agents', icon: Cpu, prompt: 'Agents' },
  { label: 'Credit', icon: CreditCard, prompt: 'Credit overview' },
  { label: 'Funding', icon: DollarSign, prompt: 'Funding options' },
  { label: 'Analytics', icon: BarChart3, prompt: 'Analytics' },
  { label: 'Diagnostics', icon: Shield, prompt: 'Diagnostics' },
  { label: 'Workflows', icon: Zap, prompt: 'Workflows' },
];

interface MUASuggestionsProps {
  onSelect: (prompt: string) => void;
}

function MUASuggestions({ onSelect }: MUASuggestionsProps) {
  return (
    <div className="px-5 py-4 animate-[mua-fade_0.4s_ease-out]">
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-3">Quick actions</p>
      <div className="grid grid-cols-2 gap-2">
        {SUGGESTIONS.map(s => (
          <button
            key={s.label}
            onClick={() => onSelect(s.prompt)}
            className="group flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left transition-all duration-200 hover:bg-white/[0.06] hover:border-white/[0.1] active:scale-[0.98] backdrop-blur-md"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400 group-hover:text-red-400 group-hover:bg-red-500/10 transition-all">
              <s.icon className="h-4 w-4" />
            </div>
            <span className="text-[13px] font-medium text-zinc-300 group-hover:text-white transition-colors">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(MUASuggestions);
