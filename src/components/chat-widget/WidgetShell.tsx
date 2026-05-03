'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface TenantBranding {
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
}

interface WidgetShellProps {
  onClose: () => void;
  onMinimize: () => void;
  conversationId?: string;
  tenantBranding?: TenantBranding;
  header: ReactNode;
  thread: ReactNode;
  quickActions?: ReactNode;
  composer: ReactNode;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animation variants                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

const shellVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 380, damping: 30 },
  },
  exit: {
    opacity: 0,
    y: 24,
    scale: 0.97,
    transition: { duration: 0.18 },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function WidgetShell({
  header,
  thread,
  quickActions,
  composer,
}: WidgetShellProps) {
  return (
    <>
      {/* Desktop shell */}
      <motion.div
        variants={shellVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed bottom-6 right-6 z-[9999] hidden w-[420px] flex-col
                   overflow-hidden rounded-2xl border border-zinc-800/50
                   bg-[#0A0A0B]/95 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl
                   md:flex"
        style={{ maxHeight: 680 }}
      >
        {/* Header */}
        <div className="shrink-0">{header}</div>

        {/* Thread (scrollable) */}
        <div className="min-h-0 flex-1 overflow-y-auto">{thread}</div>

        {/* Quick actions rail */}
        {quickActions && <div className="shrink-0">{quickActions}</div>}

        {/* Composer */}
        <div className="shrink-0">{composer}</div>
      </motion.div>

      {/* Mobile shell */}
      <motion.div
        variants={shellVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-x-2 inset-y-4 z-[9999] flex flex-col
                   overflow-hidden rounded-2xl border border-zinc-800/50
                   bg-[#0A0A0B]/95 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl
                   md:hidden"
      >
        <div className="shrink-0">{header}</div>
        <div className="min-h-0 flex-1 overflow-y-auto">{thread}</div>
        {quickActions && <div className="shrink-0">{quickActions}</div>}
        <div className="shrink-0">{composer}</div>
      </motion.div>
    </>
  );
}
