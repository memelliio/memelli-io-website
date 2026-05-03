/**
 * Memelli OS — Typography Tokens
 *
 * Font families: Inter for body text, Inter + system stack for headings.
 * Sizes follow a modular scale from xs to 4xl, each paired with a default line height.
 * Weights span light (300) through black (900).
 */

const fontFamily = {
  body: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  heading:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, system-ui, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
} as const;

/**
 * Each entry pairs a CSS font-size value with its recommended line-height.
 */
const fontSize = {
  xs:   { size: '0.75rem',   lineHeight: '1rem' },     // 12px / 16px
  sm:   { size: '0.875rem',  lineHeight: '1.25rem' },   // 14px / 20px
  base: { size: '1rem',      lineHeight: '1.5rem' },    // 16px / 24px
  lg:   { size: '1.125rem',  lineHeight: '1.75rem' },   // 18px / 28px
  xl:   { size: '1.25rem',   lineHeight: '1.75rem' },   // 20px / 28px
  '2xl': { size: '1.5rem',   lineHeight: '2rem' },      // 24px / 32px
  '3xl': { size: '1.875rem', lineHeight: '2.25rem' },   // 30px / 36px
  '4xl': { size: '2.25rem',  lineHeight: '2.5rem' },    // 36px / 40px
} as const;

const fontWeight = {
  light:    300,
  normal:   400,
  medium:   500,
  semibold: 600,
  bold:     700,
  extrabold: 800,
  black:    900,
} as const;

const letterSpacing = {
  tighter: '-0.05em',
  tight:   '-0.025em',
  normal:  '0em',
  wide:    '0.025em',
  wider:   '0.05em',
  widest:  '0.1em',
} as const;

/**
 * Preset heading styles — convenience objects that compose size, weight,
 * line-height, and letter-spacing for h1 through h6.
 */
const headings = {
  h1: {
    size:          fontSize['4xl'].size,
    weight:        fontWeight.bold,
    lineHeight:    fontSize['4xl'].lineHeight,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    size:          fontSize['3xl'].size,
    weight:        fontWeight.bold,
    lineHeight:    fontSize['3xl'].lineHeight,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    size:          fontSize['2xl'].size,
    weight:        fontWeight.semibold,
    lineHeight:    fontSize['2xl'].lineHeight,
    letterSpacing: letterSpacing.normal,
  },
  h4: {
    size:          fontSize.xl.size,
    weight:        fontWeight.semibold,
    lineHeight:    fontSize.xl.lineHeight,
    letterSpacing: letterSpacing.normal,
  },
  h5: {
    size:          fontSize.lg.size,
    weight:        fontWeight.medium,
    lineHeight:    fontSize.lg.lineHeight,
    letterSpacing: letterSpacing.normal,
  },
  h6: {
    size:          fontSize.base.size,
    weight:        fontWeight.medium,
    lineHeight:    fontSize.base.lineHeight,
    letterSpacing: letterSpacing.wide,
  },
} as const;

export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  headings,
} as const;

export type Typography = typeof typography;
