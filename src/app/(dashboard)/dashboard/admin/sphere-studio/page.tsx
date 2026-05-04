'use client';

/**
 * Sphere Studio — admin page to preview and configure the Melli sphere live.
 * Full-screen preview with real-time controls on the right.
 * Changes can be saved as brand defaults (future: persist to user profile/API).
 */

import { useState } from 'react';
import nextDynamic from 'next/dynamic';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { DEFAULT_SPHERE_CONFIG, SPHERE_PRESETS, type SphereConfig } from '../../../../../components/melli-sphere/sphere-config';

const HomeSphere = nextDynamic(
  () => import('../../../../../components/melli-sphere/HomeSphere').then((m) => ({ default: m.HomeSphere })),
  { ssr: false, loading: () => (
    <div className="w-80 h-80 rounded-full animate-pulse" style={{ background: 'radial-gradient(circle at 40% 35%, #ef4444, #7f1d1d)' }} />
  )}
);

const SphereControls = nextDynamic(
  () => import('../../../../../components/melli-sphere/SphereControls').then((m) => ({ default: m.SphereControls })),
  { ssr: false }
);

const STATES = ['idle', 'listening', 'thinking', 'speaking'] as const;
type SphereState = typeof STATES[number];

export default function SphereStudioPage() {
  const [config, setConfig] = useState<SphereConfig>(DEFAULT_SPHERE_CONFIG);
  const [previewState, setPreviewState] = useState<SphereState>('idle');
  const [audioSim, setAudioSim] = useState(0);

  return (
    <div className="bg-card min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-8 py-5 border-b border-border">
        <Link href="/dashboard/admin" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-red-400" />
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Sphere Studio</h1>
        </div>
        <span className="text-xs text-muted-foreground">Live preview — adjust controls to configure your brand sphere</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Preview canvas */}
        <div className="flex-1 flex flex-col items-center justify-center bg-card relative gap-8">
          {/* Sphere preview — extra right padding so the trigger button clears the sphere */}
          <div className="relative" style={{ width: 400, height: 400, marginRight: 56 }}>
            <HomeSphere state={previewState} size={400} audioLevel={audioSim} config={config} />
            <SphereControls config={config} onChange={(patch) => setConfig(c => ({ ...c, ...patch }))} />
          </div>

          {/* State simulator */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Simulate State</p>
            <div className="flex gap-2">
              {STATES.map((s) => (
                <button
                  key={s}
                  onClick={() => setPreviewState(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    previewState === s
                      ? 'bg-red-600/30 border-red-500/50 text-red-300'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Audio simulator */}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground w-16">Audio Sim</span>
              <input
                type="range" min={0} max={1} step={0.01} value={audioSim}
                onChange={(e) => setAudioSim(parseFloat(e.target.value))}
                className="w-32 h-1.5 accent-red-500"
              />
              <span className="text-[10px] font-mono text-muted-foreground w-8">{(audioSim * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Config panel */}
        <div className="w-72 border-l border-border bg-card p-6 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-1">Current Config</h2>
            <p className="text-xs text-muted-foreground">These settings will apply to the homepage sphere.</p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Quick Presets</p>
            <div className="flex flex-col gap-1.5">
              {SPHERE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setConfig(p.config)}
                  className="text-left px-3 py-2 rounded-xl text-xs text-foreground border border-border hover:border-red-500/40 hover:text-white transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Config readout */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Active Values</p>
            <div className="space-y-1.5 font-mono text-xs">
              {Object.entries(config).map(([key, val]) => (
                <div key={key} className="flex justify-between text-muted-foreground">
                  <span className="text-muted-foreground">{key}</span>
                  <span className="text-foreground">
                    {typeof val === 'boolean' ? (val ? 'on' : 'off') : typeof val === 'number' ? val.toFixed(2) : String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border" />

          <button
            onClick={() => setConfig(DEFAULT_SPHERE_CONFIG)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  );
}
