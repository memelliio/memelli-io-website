'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Minus,
  X,
  MoreVertical,
  RotateCcw,
  Phone,
  Mail,
  Sparkles,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface TenantBranding {
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
}

interface WidgetHeaderProps {
  assistantName?: string;
  subtitle?: string;
  isReturning?: boolean;
  conversationStage?: 'greeting' | 'qualifying' | 'helping' | 'converting' | 'closing';
  tenantBranding?: TenantBranding;
  onMinimize: () => void;
  onClose: () => void;
  onRestart?: () => void;
  onChannelSwitch?: (channel: string) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function resolveSubtitle(
  subtitle?: string,
  isReturning?: boolean,
  stage?: string,
): string {
  if (subtitle) return subtitle;
  if (isReturning) return 'We saved your place';
  switch (stage) {
    case 'qualifying':
      return 'Getting to know you';
    case 'helping':
      return 'Helping with your request';
    case 'converting':
      return 'Let\u2019s make it happen';
    case 'closing':
      return 'Wrapping up';
    default:
      return 'AI Concierge';
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function WidgetHeader({
  assistantName = 'Melli AI',
  subtitle,
  isReturning,
  conversationStage,
  onMinimize,
  onClose,
  onRestart,
  onChannelSwitch,
}: WidgetHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const resolvedSubtitle = resolveSubtitle(subtitle, isReturning, conversationStage);

  return (
    <div className="relative flex items-center gap-3 bg-[#0A0A0B] border-b border-white/[0.06] px-4 py-3">
      {/* Avatar + identity */}
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-500 shadow-lg shadow-red-600/20">
        <Sparkles className="h-4 w-4 text-white" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-100 truncate">
            {assistantName}
          </span>
          {/* Online dot */}
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
        </div>
        <p className="text-xs text-zinc-400 truncate">{resolvedSubtitle}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onMinimize}
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300
                     transition-colors duration-150"
          aria-label="Minimize"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300
                       transition-colors duration-150"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-white/[0.06]
                           bg-[#111113] py-1 shadow-2xl backdrop-blur-xl"
              >
                {onRestart && (
                  <button
                    onClick={() => { onRestart(); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-300
                               hover:bg-white/[0.04]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Restart conversation
                  </button>
                )}
                {onChannelSwitch && (
                  <>
                    <button
                      onClick={() => { onChannelSwitch('sms'); setMenuOpen(false); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-300
                                 hover:bg-white/[0.04]"
                    >
                      <Phone className="h-3.5 w-3.5" /> Continue by SMS
                    </button>
                    <button
                      onClick={() => { onChannelSwitch('email'); setMenuOpen(false); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-300
                                 hover:bg-white/[0.04]"
                    >
                      <Mail className="h-3.5 w-3.5" /> Email me details
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300
                     transition-colors duration-150"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
