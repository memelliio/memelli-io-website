import "server-only";
import { pool } from "./db";

export type OsTheme = {
  cssVars: Record<string, string>;
  notes?: string;
};

const FALLBACK: OsTheme = {
  cssVars: {
    "--mellibar-bg": "linear-gradient(180deg, #0F1115 0%, #18181C 70%, #0F1115 100%)",
    "--taskbar-bg": "linear-gradient(180deg, #0F1115 0%, #18181C 70%, #0F1115 100%)",
    "--taskbar-fg": "#FFFFFF",
    "--taskbar-border-top": "1px solid rgba(196,30,58,0.18)",
    "--accent-red": "#C41E3A",
    "--accent-red-dark": "#A8182F",
    "--ink": "#0F1115",
    "--muted": "#6B7280",
    "--surface": "#FFFFFF",
    "--line": "#E5E7EB",
    "--window-list-bg": "rgba(255,255,255,0.92)",
    "--window-list-fg": "#0F1115",
  },
};

export async function loadOsTheme(): Promise<OsTheme> {
  try {
    const r = await pool.query<{ code_text: string }>(
      "SELECT code_text FROM memelli_io_website.nodes WHERE active=true AND name='os-theme' ORDER BY version DESC LIMIT 1",
    );
    if (!r.rows[0]) return FALLBACK;
    const j = JSON.parse(r.rows[0].code_text) as Partial<OsTheme>;
    return { cssVars: { ...FALLBACK.cssVars, ...(j.cssVars || {}) }, notes: j.notes };
  } catch {
    return FALLBACK;
  }
}

export function themeToCss(theme: OsTheme): string {
  const lines = Object.entries(theme.cssVars).map(([k, v]) => `${k}: ${v};`);
  return `:root{${lines.join("")}}`;
}

export async function loadOsExtraCss(): Promise<string> {
  try {
    const r = await pool.query<{ code_text: string }>(
      "SELECT code_text FROM memelli_io_website.nodes WHERE active=true AND name='os-extra-css' ORDER BY version DESC LIMIT 1",
    );
    return r.rows[0]?.code_text ?? "";
  } catch {
    return "";
  }
}
