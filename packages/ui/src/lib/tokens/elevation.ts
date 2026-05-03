/**
 * Memelli OS — Elevation Tokens
 *
 * Box shadows tuned for dark backgrounds, glass morphism, and z-index layers.
 * 2026 Apple aesthetic: subtle depth with ambient glow.
 */

const shadow = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.4)',

  /** Glass card — subtle border light + depth */
  glass: '0 0 0 1px rgba(255, 255, 255, 0.04), 0 4px 24px -4px rgba(0, 0, 0, 0.5)',
  /** Glass elevated — floating panels */
  'glass-lg': '0 0 0 1px rgba(255, 255, 255, 0.06), 0 8px 40px -8px rgba(0, 0, 0, 0.6)',

  /** Brand red ambient glow */
  'glow-sm': '0 0 12px 0 rgba(215, 38, 56, 0.1)',
  'glow-md': '0 0 20px 0 rgba(215, 38, 56, 0.15), 0 0 60px 0 rgba(215, 38, 56, 0.05)',
  'glow-lg': '0 0 30px 0 rgba(215, 38, 56, 0.2), 0 0 80px 0 rgba(215, 38, 56, 0.08)',

  /** Red brand glow */
  'glow-red': '0 0 20px 0 rgba(215, 38, 56, 0.15), 0 0 60px 0 rgba(215, 38, 56, 0.05)',

  /** Card hover state */
  'card-hover': '0 8px 25px -5px rgba(0, 0, 0, 0.4), 0 0 20px rgba(215, 38, 56, 0.06)',
} as const;

const zIndex = {
  hide: -1,
  auto: 'auto' as const,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
  tooltip: 1700,
  command: 1800,
} as const;

export const elevation = {
  shadow,
  zIndex,
} as const;

export type Elevation = typeof elevation;
export type ZIndexLayer = keyof typeof zIndex;
