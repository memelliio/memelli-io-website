/**
 * Memelli OS — Color Tokens
 *
 * All colors are expressed as HSL channel strings so they can be used with
 * Tailwind's `hsl(var(--...))` pattern or composed directly.
 *
 * Convention: `"H S% L%"` (space-separated, no commas, no `hsl()` wrapper).
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const hsl = (h: number, s: number, l: number) => `${h} ${s}% ${l}%` as const;

// ---------------------------------------------------------------------------
// Base palette — zinc scale (slight blue-ish tint, Tailwind zinc-inspired)
// ---------------------------------------------------------------------------
const zinc = {
  50: hsl(240, 5, 96),
  100: hsl(240, 6, 90),
  200: hsl(240, 5, 84),
  300: hsl(240, 5, 65),
  400: hsl(240, 4, 46),
  500: hsl(240, 4, 36),
  600: hsl(240, 5, 26),
  700: hsl(240, 5, 20),
  800: hsl(240, 6, 14),
  900: hsl(240, 6, 10),
  950: hsl(240, 10, 4),
} as const;

// ---------------------------------------------------------------------------
// Primary brand scale (355°) — derived from brand primary #D72638
// ---------------------------------------------------------------------------
const primary = {
  50: hsl(355, 91, 97),
  100: hsl(355, 91, 94),
  200: hsl(355, 90, 87),
  300: hsl(355, 88, 78),
  400: hsl(355, 86, 70),
  500: hsl(355, 72, 50),  // closest to #D72638
  600: hsl(355, 74, 42),
  700: hsl(355, 76, 34),
  800: hsl(355, 75, 26),
  900: hsl(355, 72, 18),
  950: hsl(355, 74, 10),
} as const;

// ---------------------------------------------------------------------------
// Product accent palette — one hue per product module
// ---------------------------------------------------------------------------
const buildAccent = (h: number) =>
  ({
    50: hsl(h, 85, 97),
    100: hsl(h, 85, 92),
    200: hsl(h, 80, 82),
    300: hsl(h, 75, 70),
    400: hsl(h, 72, 60),
    500: hsl(h, 70, 50),
    600: hsl(h, 72, 42),
    700: hsl(h, 75, 34),
    800: hsl(h, 78, 26),
    900: hsl(h, 80, 18),
    950: hsl(h, 82, 10),
  }) as const;

const product = {
  /** Master / primary brand — red 355° */
  master: buildAccent(355),
  /** Commerce — emerald 160° */
  commerce: buildAccent(160),
  /** CRM — blue 220° */
  crm: buildAccent(220),
  /** Coaching — amber 38° */
  coaching: buildAccent(38),
  /** Forum SEO — teal 175° */
  forumSeo: buildAccent(175),
  /** LeadPulse — rose 350° */
  leadPulse: buildAccent(350),
  /** Communications — indigo 245° */
  communications: buildAccent(245),
  /** Credit — orange 25° */
  credit: buildAccent(25),
  /** Approval — green 142° */
  approval: buildAccent(142),
  /** Website Builder — cyan 190° */
  websiteBuilder: buildAccent(190),
} as const;

// ---------------------------------------------------------------------------
// Semantic colors
// ---------------------------------------------------------------------------
const semantic = {
  success: {
    light: hsl(142, 70, 45),
    DEFAULT: hsl(142, 70, 50),
    dark: hsl(142, 70, 60),
    foreground: hsl(142, 85, 97),
    muted: hsl(142, 40, 15),
  },
  warning: {
    light: hsl(38, 92, 45),
    DEFAULT: hsl(38, 92, 50),
    dark: hsl(38, 92, 60),
    foreground: hsl(38, 92, 97),
    muted: hsl(38, 40, 15),
  },
  error: {
    light: hsl(0, 84, 50),
    DEFAULT: hsl(0, 84, 60),
    dark: hsl(0, 84, 70),
    foreground: hsl(0, 85, 97),
    muted: hsl(0, 40, 15),
  },
  info: {
    light: hsl(220, 70, 45),
    DEFAULT: hsl(220, 70, 55),
    dark: hsl(220, 70, 65),
    foreground: hsl(220, 85, 97),
    muted: hsl(220, 40, 15),
  },
} as const;

// ---------------------------------------------------------------------------
// Surface scales (dark theme first-class, 2026 glass-aware)
// ---------------------------------------------------------------------------
const surface = {
  /** Page background — deepened for contrast */
  background: hsl(240, 10, 3.5),
  /** Default text on background */
  foreground: hsl(0, 0, 98),
  /** Card surface — slightly raised */
  card: hsl(240, 6, 6),
  /** Card text */
  cardForeground: hsl(0, 0, 98),
  /** Popover / dropdown surface */
  popover: hsl(240, 6, 8),
  /** Popover text */
  popoverForeground: hsl(0, 0, 98),
  /** Muted surface — subtle backgrounds */
  muted: hsl(240, 6, 10),
  /** Muted text */
  mutedForeground: hsl(0, 0, 64),
  /** Slightly raised — overlays */
  overlay: hsl(240, 6, 8),
  /** Modal / command palette */
  modal: hsl(240, 6, 10),
  /** Inputs, code blocks — inset feel */
  inset: hsl(240, 6, 4),
  /** Hover state for interactive surfaces */
  hover: hsl(240, 4, 12),
  /** Active / pressed state */
  active: hsl(240, 4, 16),
  /** Glass surface base (use with opacity) */
  glass: hsl(240, 6, 8),
  /** Raised card — slightly brighter than card */
  raised: hsl(240, 6, 8),
  /** Sunken — inset containers */
  sunken: hsl(240, 8, 3),
} as const;

// ---------------------------------------------------------------------------
// Border scales
// ---------------------------------------------------------------------------
const border = {
  /** Default subtle border */
  DEFAULT: hsl(240, 4, 16),
  /** Slightly more visible */
  muted: hsl(240, 4, 12),
  /** Strong contrast border */
  strong: hsl(240, 4, 24),
  /** Focus ring — brand red */
  focus: hsl(355, 80, 58),
} as const;

// ---------------------------------------------------------------------------
// Foreground scales
// ---------------------------------------------------------------------------
const foreground = {
  DEFAULT: hsl(0, 0, 98),
  muted: hsl(0, 0, 64),
  subtle: hsl(0, 0, 45),
  inverted: hsl(0, 0, 5),
} as const;

// ---------------------------------------------------------------------------
// Brand colors
// ---------------------------------------------------------------------------
const brand = {
  /** Primary brand — #D72638 (red 355°) */
  primary: hsl(355, 72, 50),
  /** Primary foreground — white text on primary */
  primaryForeground: hsl(0, 0, 100),
  /** Secondary — muted red tint */
  secondary: hsl(355, 30, 18),
  /** Secondary foreground */
  secondaryForeground: hsl(355, 91, 94),
  /** Accent — lighter red for highlights */
  accent: hsl(355, 60, 70),
  /** Accent foreground */
  accentForeground: hsl(0, 0, 5),
  /** Memelli.com brand red — #D72638 */
  red: hsl(355, 72, 50),
  /** Brand red foreground — white */
  redForeground: hsl(0, 0, 100),
} as const;

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
export const colors = {
  zinc,
  primary,
  product,
  semantic,
  surface,
  border,
  foreground,
  brand,
} as const;

export type Colors = typeof colors;
export type ProductKey = keyof typeof product;
export type SemanticKey = keyof typeof semantic;
