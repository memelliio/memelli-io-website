'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, type LucideIcon } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface TenantBranding {
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  icon?: LucideIcon;
}

type LauncherState = 'dormant' | 'attention' | 'unread' | 'proactive';

interface WidgetLauncherProps {
  onOpen: () => void;
  unreadCount?: number;
  proactivePrompt?: string;
  assistantName?: string;
  tenantBranding?: TenantBranding;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function resolveState(
  unreadCount: number,
  proactivePrompt?: string,
): LauncherState {
  if (proactivePrompt) return 'proactive';
  if (unreadCount > 0) return 'unread';
  return 'dormant';
}

function resolveLabel(
  state: LauncherState,
  proactivePrompt?: string,
  assistantName?: string,
): string {
  switch (state) {
    case 'proactive':
      return proactivePrompt ?? 'Need help?';
    case 'unread':
      return 'Continue where you left off';
    case 'attention':
      return `${assistantName ?? 'Melli AI'} is here`;
    default:
      return 'Ask AI';
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function WidgetLauncher({
  onOpen,
  unreadCount = 0,
  proactivePrompt,
  assistantName,
  tenantBranding,
}: WidgetLauncherProps) {
  const [hovered, setHovered] = useState(false);

  const state = resolveState(unreadCount, proactivePrompt);
  const label = resolveLabel(state, proactivePrompt, assistantName);
  const Icon = tenantBranding?.icon ?? MessageCircle;
  const accent = tenantBranding?.accentColor ?? '#dc2626';

  const isPulsing = state === 'attention' || state === 'proactive';

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      {/* Proactive label preview */}
      <AnimatePresence>
        {(hovered || state === 'proactive') && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="max-w-[240px] rounded-xl bg-zinc-800 px-4 py-2.5 text-sm
                       text-zinc-100 shadow-lg border border-zinc-700/50"
          >
            <p className="leading-snug">{label}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orb button */}
      <motion.button
        onClick={onOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full
                   bg-zinc-900 shadow-2xl outline-none
                   focus-visible:ring-2 focus-visible:ring-red-500/60
                   focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950
                   transition-shadow duration-200"
        style={{
          background: `linear-gradient(135deg, #1a1a1a 0%, #232323 100%)`,
          boxShadow: hovered
            ? `0 0 0 1.5px ${accent}55, 0 0 24px ${accent}22, 0 12px 40px rgba(0,0,0,0.6)`
            : `0 0 0 1.5px ${accent}33, 0 8px 32px rgba(0,0,0,0.5)`,
        }}
        aria-label="Open AI chat"
      >
        {/* Pulse ring */}
        {isPulsing && (
          <span
            className="absolute inset-0 animate-ping rounded-full opacity-20"
            style={{ backgroundColor: accent }}
          />
        )}

        {/* Gradient border ring */}
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, ${accent}, #f87171, ${accent})`,
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))',
            WebkitMask:
              'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))',
          }}
        />

        <Icon className="h-6 w-6 text-zinc-100" />

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center
                         justify-center rounded-full bg-red-600 px-1 text-[11px]
                         font-semibold text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
