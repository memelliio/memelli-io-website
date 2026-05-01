/**
 * Memelli OS — Animation Tokens
 *
 * Duration scale, easing functions, and transition presets.
 * 2026 Apple aesthetic: natural spring physics, smooth state changes.
 */

const duration = {
  fastest: '50ms',
  faster: '100ms',
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
  slowest: '700ms',
  /** Page transitions */
  page: '400ms',
} as const;

const easing = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Slight overshoot — button presses, toggles */
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  /** Apple-style gentle spring — cards, panels */
  appleSpring: 'cubic-bezier(0.25, 1, 0.5, 1)',
  /** Bounce settle — notifications, toasts */
  bounce: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  /** Smooth decel — slides, modals */
  smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

/**
 * Transition presets.
 * Each preset contains a CSS property target, duration key, and easing key.
 */
const presets = {
  fade: {
    property: 'opacity',
    duration: 'normal' as const,
    easing: 'easeOut' as const,
  },
  slideUp: {
    property: 'transform, opacity',
    duration: 'normal' as const,
    easing: 'smooth' as const,
  },
  slideDown: {
    property: 'transform, opacity',
    duration: 'normal' as const,
    easing: 'smooth' as const,
  },
  slideLeft: {
    property: 'transform, opacity',
    duration: 'normal' as const,
    easing: 'smooth' as const,
  },
  slideRight: {
    property: 'transform, opacity',
    duration: 'normal' as const,
    easing: 'smooth' as const,
  },
  scale: {
    property: 'transform, opacity',
    duration: 'fast' as const,
    easing: 'spring' as const,
  },
  collapse: {
    property: 'height, opacity',
    duration: 'slow' as const,
    easing: 'easeInOut' as const,
  },
  /** Apple-style card entrance */
  cardIn: {
    property: 'transform, opacity',
    duration: 'slow' as const,
    easing: 'appleSpring' as const,
  },
  /** Hover lift transition */
  lift: {
    property: 'transform, box-shadow',
    duration: 'normal' as const,
    easing: 'easeOut' as const,
  },
} as const;

export const animation = {
  duration,
  easing,
  presets,
} as const;

export type Animation = typeof animation;
export type DurationKey = keyof typeof duration;
export type EasingKey = keyof typeof easing;
export type PresetKey = keyof typeof presets;
