// MUA Design Tokens — 2026 Apple dark aesthetic with Memelli purple branding

export const MUA_COLORS = {
  // Panel
  panelBg: 'bg-zinc-950/95',
  panelBorder: 'border-zinc-800/40',
  panelShadow: 'shadow-[0_32px_80px_-12px_rgba(0,0,0,0.9)]',

  // Header
  headerBg: 'bg-zinc-950/80',
  headerBorder: 'border-zinc-800/30',

  // Messages
  userBubble: 'bg-red-600 text-white',
  assistantBubble: 'bg-white/[0.04] backdrop-blur-md text-zinc-100 border border-white/[0.06]',
  systemBubble: 'bg-zinc-900/50 text-zinc-500',

  // Input
  inputBg: 'bg-white/[0.03]',
  inputBorder: 'border-white/[0.06]',
  inputFocusBorder: 'focus:border-red-500/50',
  inputFocusRing: 'focus:ring-1 focus:ring-red-500/20',

  // Accent
  accent: 'text-red-400',
  accentBg: 'bg-red-500/10',
  accentBorder: 'border-red-500/30',
  accentGlow: 'shadow-[0_0_20px_rgba(147,51,234,0.15)]',

  // Status
  active: 'bg-emerald-400',
  thinking: 'bg-amber-400',
  error: 'bg-red-500',
  idle: 'bg-zinc-500',
} as const;

export const MUA_SPACING = {
  panelPadding: 'px-5',
  messagePadding: 'px-4 py-3',
  headerPadding: 'px-5 py-4',
  inputPadding: 'px-4 py-3',
  gap: 'gap-3',
  messageGap: 'space-y-4',
} as const;

export const MUA_RADIUS = {
  panel: 'rounded-2xl',
  message: 'rounded-2xl',
  input: 'rounded-xl',
  button: 'rounded-xl',
  pill: 'rounded-full',
  avatar: 'rounded-full',
} as const;

export const MUA_TYPOGRAPHY = {
  heading: 'text-[15px] font-semibold tracking-tight',
  body: 'text-[14px] leading-relaxed',
  caption: 'text-[12px] text-zinc-500',
  label: 'text-[11px] font-medium uppercase tracking-wider text-zinc-500',
  timestamp: 'text-[10px] text-zinc-600',
} as const;

export const MUA_ANIMATION = {
  messageIn: 'animate-[mua-msg-in_0.3s_ease-out]',
  fadeIn: 'animate-[mua-fade_0.2s_ease-out]',
  slideUp: 'animate-[mua-slide-up_0.25s_cubic-bezier(0.16,1,0.3,1)]',
  spring: 'transition-all duration-200 ease-out',
} as const;
