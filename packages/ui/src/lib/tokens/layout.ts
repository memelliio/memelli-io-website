/**
 * Memelli OS — Layout Tokens
 *
 * Breakpoints, grid columns, container widths, sidebar widths, and panel widths.
 */

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/** Media-query helpers (min-width) */
const screens = {
  sm: `${breakpoints.sm}px`,
  md: `${breakpoints.md}px`,
  lg: `${breakpoints.lg}px`,
  xl: `${breakpoints.xl}px`,
  '2xl': `${breakpoints['2xl']}px`,
} as const;

/** Grid column counts (1–12) */
const gridColumns = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 11,
  12: 12,
} as const;

/** Max container widths per breakpoint */
const container = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/** Sidebar widths in pixels */
const sidebar = {
  collapsed: 64,
  default: 256,
  wide: 320,
} as const;

/** Panel widths in pixels */
const panel = {
  sm: 320,
  md: 480,
  lg: 640,
  xl: 800,
} as const;

export const layout = {
  breakpoints,
  screens,
  gridColumns,
  container,
  sidebar,
  panel,
} as const;

export type Layout = typeof layout;
export type BreakpointKey = keyof typeof breakpoints;
export type GridColumnKey = keyof typeof gridColumns;
export type ContainerKey = keyof typeof container;
export type SidebarKey = keyof typeof sidebar;
export type PanelKey = keyof typeof panel;
