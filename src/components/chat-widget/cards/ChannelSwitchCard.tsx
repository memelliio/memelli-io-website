'use client';

import { MessageSquare, Mail, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ChannelOption {
  type: string;
  label: string;
  description: string;
}

interface ChannelSwitchCardProps {
  channels: ChannelOption[];
  onSelect: (channelType: string) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CHANNEL_ICONS: Record<string, LucideIcon> = {
  sms: MessageSquare,
  email: Mail,
  call: Phone,
  phone: Phone,
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ChannelSwitchCard({
  channels,
  onSelect,
}: ChannelSwitchCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 backdrop-blur-sm shadow-lg shadow-black/20">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-400/80">
        Continue the conversation
      </p>

      <div className="space-y-2">
        {channels.map((ch) => {
          const Icon = CHANNEL_ICONS[ch.type] ?? MessageSquare;
          return (
            <button
              key={ch.type}
              onClick={() => onSelect(ch.type)}
              className="group flex w-full items-center gap-3 rounded-xl border border-zinc-800
                         bg-zinc-800/40 px-4 py-3.5 text-left transition-all duration-150
                         hover:border-red-500/30 hover:bg-red-950/20"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
                              bg-zinc-800 transition-colors duration-150
                              group-hover:bg-red-500/10">
                <Icon className="h-4 w-4 text-zinc-400 transition-colors duration-150
                                 group-hover:text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug text-zinc-100">{ch.label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{ch.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
