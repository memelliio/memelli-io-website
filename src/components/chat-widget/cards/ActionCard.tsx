'use client';

import { Zap, type LucideIcon } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ActionItem {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick: () => void;
}

interface ActionCardProps {
  title: string;
  description: string;
  actions: ActionItem[];
  icon?: LucideIcon;
  executing?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function variantClasses(variant: ActionItem['variant']): string {
  switch (variant) {
    case 'primary':
      return 'bg-red-600 text-white hover:bg-red-500';
    case 'ghost':
      return 'bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50';
    case 'secondary':
    default:
      return 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600';
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ActionCard({
  title,
  description,
  actions,
  icon: Icon = Zap,
  executing = false,
}: ActionCardProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 transition-shadow
        ${executing ? 'shadow-[0_0_16px_rgba(239,68,68,0.25)] border-red-500/30' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
            ${executing ? 'bg-red-500/20 animate-pulse' : 'bg-red-600/10'}`}
        >
          <Icon className="h-4 w-4 text-red-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-[13px] font-semibold tracking-tight text-zinc-100">{title}</h4>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p>
        </div>
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors
                          ${variantClasses(a.variant)}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
