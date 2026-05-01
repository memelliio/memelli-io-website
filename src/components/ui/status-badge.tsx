import { cn } from '@/lib/utils';

type StatusBadgeProps = {
  status: string;
  type?: 'order' | 'deal' | 'enrollment' | 'article' | 'general';
};

type ColorClass = string;

const ORDER_COLORS: Record<string, ColorClass> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  CONFIRMED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  PROCESSING: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  SHIPPED: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  DELIVERED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/30',
  REFUNDED: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

const DEAL_COLORS: Record<string, ColorClass> = {
  OPEN: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  WON: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  LOST: 'bg-red-500/15 text-red-400 border-red-500/30',
  ON_HOLD: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  QUALIFIED: 'bg-red-500/15 text-red-400 border-red-500/30',
  PROPOSAL: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
};

const ENROLLMENT_COLORS: Record<string, ColorClass> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  COMPLETED: 'bg-red-500/15 text-red-400 border-red-500/30',
  DROPPED: 'bg-red-500/15 text-red-400 border-red-500/30',
  PAUSED: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  PENDING: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

const ARTICLE_COLORS: Record<string, ColorClass> = {
  DRAFT: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  PUBLISHED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  INDEXED: 'bg-red-500/15 text-red-400 border-red-500/30',
  ARCHIVED: 'bg-zinc-600/15 text-zinc-500 border-zinc-600/30',
};

// Fallback colors for general status by first character bucket
const GENERAL_FALLBACK_COLORS: ColorClass[] = [
  'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'bg-red-500/15 text-red-400 border-red-500/30',
  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  'bg-pink-500/15 text-pink-400 border-pink-500/30',
];

function getGeneralColor(status: string): ColorClass {
  const code = (status.charCodeAt(0) ?? 0) % GENERAL_FALLBACK_COLORS.length;
  return GENERAL_FALLBACK_COLORS[code];
}

function getColorClass(status: string, type: StatusBadgeProps['type']): ColorClass {
  const upper = status.toUpperCase();

  switch (type) {
    case 'order':
      return ORDER_COLORS[upper] ?? getGeneralColor(status);
    case 'deal':
      return DEAL_COLORS[upper] ?? getGeneralColor(status);
    case 'enrollment':
      return ENROLLMENT_COLORS[upper] ?? getGeneralColor(status);
    case 'article':
      return ARTICLE_COLORS[upper] ?? getGeneralColor(status);
    default:
      // Try all maps before falling back
      return (
        ORDER_COLORS[upper] ??
        DEAL_COLORS[upper] ??
        ENROLLMENT_COLORS[upper] ??
        ARTICLE_COLORS[upper] ??
        getGeneralColor(status)
      );
  }
}

function formatLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status, type = 'general' }: StatusBadgeProps) {
  const colorClass = getColorClass(status, type);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        colorClass
      )}
    >
      {formatLabel(status)}
    </span>
  );
}
