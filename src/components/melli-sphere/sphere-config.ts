/**
 * SphereConfig — all visual parameters for the Melli sphere.
 * Controls color, energy, speed, audio sensitivity, and effects.
 * Can be driven by user preferences, brand settings, or live business data.
 */

export type LogoRotation = 'spin' | 'swing' | 'none';

export interface SphereConfig {
  hue: number;               // 0–360  primary color hue (0=red, 220=blue, 45=gold, 280=purple)
  saturation: number;        // 0–100  color saturation
  energy: number;            // 0–2    overall glow intensity multiplier
  speed: number;             // 0–2    animation speed multiplier
  audioSensitivity: number;  // 0–3    how much audio drives visuals
  pulseEnabled: boolean;     //        outer pulse rings on/off
  logoOpacity: number;       // 0–1    logo visibility
  coronaSize: number;        // 0.5–2  outer glow radius multiplier
  breatheAmp: number;        // 0–2    logo breathing amplitude multiplier

  // ── Logo controls ──────────────────────────────────────────────────────────
  logoBackground: boolean;   //        dark sphere ball behind logo (false = transparent / floating logo)
  logoRotation: LogoRotation;//        'spin' | 'swing' (left↔right) | 'none'
  logoSwingAmp: number;      // 0–1.5  swing amplitude in radians (~0.5 = ±28°)
  logoShake: boolean;        //        audio-reactive position jitter
  logoGlow: boolean;         //        audio-reactive halo glow around logo
  logoWave: boolean;         //        expanding ring bursts from logo on audio
  logoShadow: boolean;       //        glowing edge ring around the sphere ball

  // ── Corona controls ────────────────────────────────────────────────────────
  coronaEnabled: boolean;    //        outer corona glow on/off
  coronaHue: number;         //        -1 = inherit sphere hue, 0–360 = custom color

  // ── Brightness ─────────────────────────────────────────────────────────────
  idleBrightness: number;    // 0–1    canvas brightness when sphere is idle
  activeBrightness: number;  // 0–1    canvas brightness when listening/speaking/thinking
}

export const DEFAULT_SPHERE_CONFIG: SphereConfig = {
  hue: 0,
  saturation: 85,
  energy: 1.0,
  speed: 1.0,
  audioSensitivity: 1.0,
  pulseEnabled: true,
  logoOpacity: 1.0,
  coronaSize: 1.0,
  breatheAmp: 1.0,

  logoBackground: true,
  logoRotation: 'spin',
  logoSwingAmp: 0.5,
  logoShake: false,
  logoGlow: false,
  logoWave: false,
  logoShadow: true,

  coronaEnabled: true,
  coronaHue: -1,

  idleBrightness: 0.55,
  activeBrightness: 1.0,
};

export const SPHERE_PRESETS: { label: string; config: SphereConfig }[] = [
  {
    label: 'Signature Red',
    config: { ...DEFAULT_SPHERE_CONFIG, hue: 0, saturation: 85 },
  },
  {
    label: 'Deep Space',
    config: { ...DEFAULT_SPHERE_CONFIG, hue: 220, saturation: 80, energy: 0.8, coronaSize: 1.3 },
  },
  {
    label: 'Gold Rush',
    config: { ...DEFAULT_SPHERE_CONFIG, hue: 42, saturation: 90, energy: 1.2, breatheAmp: 1.4 },
  },
  {
    label: 'Amethyst',
    config: { ...DEFAULT_SPHERE_CONFIG, hue: 280, saturation: 75, speed: 0.8, coronaSize: 1.5 },
  },
  {
    label: 'Emerald',
    config: { ...DEFAULT_SPHERE_CONFIG, hue: 145, saturation: 70, energy: 0.9, audioSensitivity: 1.5 },
  },
  {
    label: 'Overdrive',
    config: { ...DEFAULT_SPHERE_CONFIG, hue: 10, saturation: 95, energy: 2.0, speed: 1.8, audioSensitivity: 2.5, breatheAmp: 1.8, coronaSize: 1.6, logoGlow: true, logoWave: true },
  },
  {
    label: 'Minimal',
    config: { ...DEFAULT_SPHERE_CONFIG, energy: 0.5, speed: 0.6, pulseEnabled: false, coronaSize: 0.7, breatheAmp: 0.5 },
  },
  {
    label: 'Floating Logo',
    config: { ...DEFAULT_SPHERE_CONFIG, logoBackground: false, logoShadow: false, logoRotation: 'swing', logoSwingAmp: 0.4, logoGlow: true, pulseEnabled: false },
  },
  {
    label: 'Audio Beast',
    config: { ...DEFAULT_SPHERE_CONFIG, audioSensitivity: 2.5, logoShake: true, logoWave: true, logoGlow: true, energy: 1.6, speed: 1.4 },
  },
];

/** Convert hue + saturation to an rgba string at a given lightness and alpha */
export function hslRgba(hue: number, sat: number, light: number, alpha: number): string {
  return `hsla(${hue},${sat}%,${light}%,${alpha})`;
}
