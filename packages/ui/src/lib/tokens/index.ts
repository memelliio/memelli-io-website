/**
 * Memelli OS — Design Tokens (barrel export)
 */

export { colors } from './colors';
export type { Colors, ProductKey, SemanticKey } from './colors';

export { typography } from './typography';
export type { Typography } from './typography';

export { spacing } from './spacing';
export type { Spacing, SpaceKey } from './spacing';

export { elevation } from './elevation';
export type { Elevation, ZIndexLayer } from './elevation';

export { animation } from './animation';
export type { Animation, DurationKey, EasingKey, PresetKey } from './animation';

export { layout } from './layout';
export type { Layout, BreakpointKey, GridColumnKey, ContainerKey, SidebarKey, PanelKey } from './layout';

// ---------------------------------------------------------------------------
// Tailwind Plugin
// ---------------------------------------------------------------------------
import plugin from 'tailwindcss/plugin';
import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { elevation } from './elevation';
import { animation } from './animation';
import { layout } from './layout';

/**
 * Tailwind CSS plugin that extends the theme with all Memelli OS design tokens.
 *
 * Usage in `tailwind.config.ts`:
 * ```ts
 * import { tailwindTokenPlugin } from '@memelli-os/ui/tokens';
 *
 * export default {
 *   plugins: [tailwindTokenPlugin],
 * };
 * ```
 */
export const tailwindTokenPlugin = plugin(
  // --- Plugin function: inject CSS custom properties & base styles ----------
  ({ addBase }) => {
    addBase({
      ':root': {
        '--font-sans': typography.fontFamily.body,
        '--font-mono': typography.fontFamily.mono,
      },
    });
  },
  // --- Config: extend the Tailwind theme ------------------------------------
  {
    theme: {
      extend: {
        // Colors — flatten HSL tokens into `hsl(<value>)` for Tailwind
        colors: {
          zinc: Object.fromEntries(
            Object.entries(colors.zinc).map(([k, v]) => [k, `hsl(${v})`]),
          ),
          primary: Object.fromEntries(
            Object.entries(colors.primary).map(([k, v]) => [k, `hsl(${v})`]),
          ),
          // Product accents — e.g. `bg-commerce-500`
          ...Object.fromEntries(
            Object.entries(colors.product).map(([name, scale]) => [
              name,
              Object.fromEntries(
                Object.entries(scale).map(([k, v]) => [k, `hsl(${v})`]),
              ),
            ]),
          ),
          // Semantic colors
          success: Object.fromEntries(
            Object.entries(colors.semantic.success).map(([k, v]) => [k, `hsl(${v})`]),
          ),
          warning: Object.fromEntries(
            Object.entries(colors.semantic.warning).map(([k, v]) => [k, `hsl(${v})`]),
          ),
          error: Object.fromEntries(
            Object.entries(colors.semantic.error).map(([k, v]) => [k, `hsl(${v})`]),
          ),
          info: Object.fromEntries(
            Object.entries(colors.semantic.info).map(([k, v]) => [k, `hsl(${v})`]),
          ),
          // Surface & border
          surface: Object.fromEntries(
            Object.entries(colors.surface).map(([k, v]) => [k, `hsl(${v})`]),
          ),
          border: Object.fromEntries(
            Object.entries(colors.border).map(([k, v]) => [k, `hsl(${v})`]),
          ),
          foreground: Object.fromEntries(
            Object.entries(colors.foreground).map(([k, v]) => [k, `hsl(${v})`]),
          ),
          // Brand
          brand: Object.fromEntries(
            Object.entries(colors.brand).map(([k, v]) => [k, `hsl(${v})`]),
          ),
        },

        // Typography
        fontFamily: {
          sans: [typography.fontFamily.body],
          mono: [typography.fontFamily.mono],
        },
        fontSize: Object.fromEntries(
          Object.entries(typography.fontSize).map(([k, v]) => [k, [v.size, { lineHeight: v.lineHeight }]]),
        ),
        fontWeight: Object.fromEntries(
          Object.entries(typography.fontWeight).map(([k, v]) => [k, String(v)]),
        ),
        letterSpacing: { ...typography.letterSpacing },

        // Spacing & border
        spacing: { ...spacing.space },
        borderRadius: { ...spacing.borderRadius },
        borderWidth: { ...spacing.borderWidth },

        // Elevation
        boxShadow: { ...elevation.shadow },
        zIndex: Object.fromEntries(
          Object.entries(elevation.zIndex).map(([k, v]) => [k, String(v)]),
        ),

        // Animation
        transitionDuration: { ...animation.duration },
        transitionTimingFunction: { ...animation.easing },

        // Layout
        screens: { ...layout.screens },
        containers: Object.fromEntries(
          Object.entries(layout.container).map(([k, v]) => [k, `${v}px`]),
        ),
      },
    },
  },
);
