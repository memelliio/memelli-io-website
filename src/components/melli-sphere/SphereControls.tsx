'use client';

/**
 * SphereControls — draggable, resizable floating control panel.
 * Renders in a portal so it never overlaps the sphere.
 * Default position: to the right of where it's anchored.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Sliders, X, GripHorizontal } from 'lucide-react';
import {
  type SphereConfig, type LogoRotation,
  SPHERE_PRESETS, DEFAULT_SPHERE_CONFIG,
} from './sphere-config';

interface SphereControlsProps {
  config: SphereConfig;
  onChange: (patch: Partial<SphereConfig>) => void;
  onSave?: (config: SphereConfig) => void;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Slider({
  label, value, min, max, step = 0.01,
  onChange, format = (v: number) => v.toFixed(2),
}: {
  label: string; value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[10px] text-zinc-400">
        <span>{label}</span>
        <span className="text-zinc-300 font-mono">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 accent-red-500 cursor-pointer"
      />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-zinc-400">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-8 h-4 rounded-full transition-colors ${value ? 'bg-red-600' : 'bg-zinc-700'}`}
      >
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${value ? 'left-4' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1.5">{children}</p>
  );
}

// ── Floating panel (rendered in portal) ─────────────────────────────────────

function FloatingPanel({
  config,
  onChange,
  onSave,
  initialX,
  initialY,
  onClose,
}: {
  config: SphereConfig;
  onChange: (patch: Partial<SphereConfig>) => void;
  onSave?: (config: SphereConfig) => void;
  initialX: number;
  initialY: number;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ w: 240, h: 560 });
  const [tab, setTab] = useState<'visual' | 'idle' | 'active'>('visual');
  const dragging = useRef(false);
  const resizing = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // ── Drag ────────────────────────────────────────────────────────────────
  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  }, [pos]);

  // ── Resize ──────────────────────────────────────────────────────────────
  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };
  }, [size]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current) {
        setPos({
          x: Math.max(0, Math.min(window.innerWidth - size.w, e.clientX - dragOffset.current.x)),
          y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y)),
        });
      }
      if (resizing.current) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        setSize({
          w: Math.max(200, Math.min(460, resizeStart.current.w + dx)),
          h: Math.max(320, Math.min(800, resizeStart.current.h + dy)),
        });
      }
    };
    const onUp = () => { dragging.current = false; resizing.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [size.w]);

  const huePreview = `hsl(${config.hue},${config.saturation}%,50%)`;
  const coronaPreview = config.coronaHue >= 0
    ? `hsl(${config.coronaHue},${config.saturation}%,50%)`
    : huePreview;

  const rotModes: LogoRotation[] = ['spin', 'swing', 'none'];

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        zIndex: 9999,
        userSelect: 'none',
      }}
      className="flex flex-col bg-zinc-950/98 border border-zinc-800/80 rounded-xl backdrop-blur-xl shadow-2xl overflow-hidden"
    >
      {/* ── Title bar / drag handle ─────────────────────────────────────── */}
      <div
        onMouseDown={onDragStart}
        className="flex items-center justify-between px-3 py-2 bg-zinc-900/80 border-b border-zinc-800/60 cursor-grab active:cursor-grabbing flex-shrink-0"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-3.5 h-3.5 text-zinc-600" />
          <Sliders className="w-3 h-3 text-zinc-500" />
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium">Sphere Controls</span>
        </div>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="text-zinc-600 hover:text-zinc-300 transition-colors p-0.5 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-zinc-800/60 flex-shrink-0">
        {(['visual', 'idle', 'active'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 text-[10px] uppercase tracking-widest font-medium transition-colors"
            style={{ color: tab === t ? '#fff' : '#52525b', borderBottom: tab === t ? '2px solid #dc2626' : '2px solid transparent' }}
          >
            {t === 'idle' ? 'Idle' : t === 'active' ? 'Active' : 'Visual'}
          </button>
        ))}
      </div>

      {/* ── Scrollable content ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">

        {/* ── Idle tab ─────────────────────────────────────────────── */}
        {tab === 'idle' && (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] text-zinc-500 leading-relaxed">Controls how the sphere looks when nothing is happening — no voice, no audio.</p>
            <Slider
              label="Idle Brightness"
              value={config.idleBrightness}
              min={0.4} max={1} step={0.05}
              onChange={(v) => onChange({ idleBrightness: v })}
              format={(v) => `${Math.round(v * 100)}%`}
            />
            <div className="flex gap-2 mt-2">
              {onSave && (
                <button onClick={() => onSave(config)}
                  className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors">
                  Save
                </button>
              )}
              <button onClick={() => onChange({ idleBrightness: 0.55 })}
                className="flex-1 text-[9px] text-zinc-500 hover:text-zinc-300 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors">
                Reset
              </button>
            </div>
          </div>
        )}

        {/* ── Active tab ───────────────────────────────────────────── */}
        {tab === 'active' && (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] text-zinc-500 leading-relaxed">Controls brightness when Melli is listening, thinking, or speaking.</p>
            <Slider
              label="Active Brightness"
              value={config.activeBrightness}
              min={0.5} max={2} step={0.05}
              onChange={(v) => onChange({ activeBrightness: v })}
              format={(v) => `${Math.round(v * 100)}%`}
            />
            <div className="flex gap-2 mt-2">
              {onSave && (
                <button onClick={() => onSave(config)}
                  className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors">
                  Save
                </button>
              )}
              <button onClick={() => onChange({ activeBrightness: 1.0 })}
                className="flex-1 text-[9px] text-zinc-500 hover:text-zinc-300 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors">
                Reset
              </button>
            </div>
          </div>
        )}

        {tab === 'visual' && (<>
          <div>
            <SectionLabel>Presets</SectionLabel>
            <div className="flex flex-wrap gap-1">
              {SPHERE_PRESETS.map((p) => (
                <button key={p.label} onClick={() => onChange(p.config)}
                  className="text-[9px] px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-300 hover:border-red-500/60 hover:text-white transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-zinc-800" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <SectionLabel>Color</SectionLabel>
              <div className="w-3 h-3 rounded-full border border-zinc-700 flex-shrink-0 mb-1.5" style={{ background: huePreview }} />
            </div>
            <Slider label="Hue" value={config.hue} min={0} max={360} step={1} onChange={(v) => onChange({ hue: v })} format={(v) => `${Math.round(v)}°`} />
            <Slider label="Saturation" value={config.saturation} min={20} max={100} step={1} onChange={(v) => onChange({ saturation: v })} format={(v) => `${Math.round(v)}%`} />
          </div>
          <div className="border-t border-zinc-800" />
          <div className="flex flex-col gap-2">
            <SectionLabel>Intensity</SectionLabel>
            <Slider label="Energy" value={config.energy} min={0} max={2} step={0.05} onChange={(v) => onChange({ energy: v })} format={(v) => v.toFixed(1) + '×'} />
            <Slider label="Speed" value={config.speed} min={0.1} max={2} step={0.05} onChange={(v) => onChange({ speed: v })} format={(v) => v.toFixed(1) + '×'} />
            <Slider label="Audio React" value={config.audioSensitivity} min={0} max={3} step={0.1} onChange={(v) => onChange({ audioSensitivity: v })} format={(v) => v.toFixed(1) + '×'} />
          </div>
          <div className="border-t border-zinc-800" />
          <div className="flex flex-col gap-2">
            <SectionLabel>Logo</SectionLabel>
            <Slider label="Opacity" value={config.logoOpacity} min={0} max={1} step={0.05} onChange={(v) => onChange({ logoOpacity: v })} format={(v) => `${Math.round(v * 100)}%`} />
            <Slider label="Breathe" value={config.breatheAmp} min={0} max={2} step={0.05} onChange={(v) => onChange({ breatheAmp: v })} format={(v) => v.toFixed(1) + '×'} />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-400">Rotation</span>
              <div className="flex gap-1">
                {rotModes.map((mode) => (
                  <button key={mode} onClick={() => onChange({ logoRotation: mode })}
                    className={`flex-1 text-[9px] py-1 rounded border transition-colors capitalize ${config.logoRotation === mode ? 'bg-red-600/30 border-red-500/50 text-red-300' : 'border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'}`}>
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            {config.logoRotation === 'swing' && <Slider label="Swing Angle" value={config.logoSwingAmp} min={0.05} max={1.5} step={0.05} onChange={(v) => onChange({ logoSwingAmp: v })} format={(v) => `${Math.round(v * 57)}°`} />}
            <Toggle label="Background ball" value={config.logoBackground} onChange={(v) => onChange({ logoBackground: v })} />
            <Toggle label="Shadow ring" value={config.logoShadow} onChange={(v) => onChange({ logoShadow: v })} />
            <Toggle label="Glow on audio" value={config.logoGlow} onChange={(v) => onChange({ logoGlow: v })} />
            <Toggle label="Shake on audio" value={config.logoShake} onChange={(v) => onChange({ logoShake: v })} />
            <Toggle label="Wave rings" value={config.logoWave} onChange={(v) => onChange({ logoWave: v })} />
          </div>
          <div className="border-t border-zinc-800" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <SectionLabel>Corona</SectionLabel>
              <div className="w-3 h-3 rounded-full border border-zinc-700 flex-shrink-0 mb-1.5" style={{ background: coronaPreview }} />
            </div>
            <Toggle label="Show corona" value={config.coronaEnabled} onChange={(v) => onChange({ coronaEnabled: v })} />
            {config.coronaEnabled && (<>
              <Slider label="Size" value={config.coronaSize} min={0.4} max={2} step={0.05} onChange={(v) => onChange({ coronaSize: v })} format={(v) => v.toFixed(1) + '×'} />
              <Toggle label="Custom color" value={config.coronaHue >= 0} onChange={(v) => onChange({ coronaHue: v ? config.hue : -1 })} />
              {config.coronaHue >= 0 && <Slider label="Corona hue" value={config.coronaHue} min={0} max={360} step={1} onChange={(v) => onChange({ coronaHue: v })} format={(v) => `${Math.round(v)}°`} />}
            </>)}
          </div>
          <div className="border-t border-zinc-800" />
          <div className="flex flex-col gap-2">
            <SectionLabel>Pulse Rings</SectionLabel>
            <Toggle label="Pulse rings" value={config.pulseEnabled} onChange={(v) => onChange({ pulseEnabled: v })} />
          </div>
          <div className="border-t border-zinc-800" />
          <div className="flex gap-2 mt-1">
            {onSave && <button onClick={() => onSave(config)} className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors">Save Settings</button>}
            <button onClick={() => onChange(DEFAULT_SPHERE_CONFIG)} className="flex-1 text-[9px] text-zinc-500 hover:text-zinc-300 transition-colors text-center py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600">Reset</button>
          </div>
        </>)}
      </div>

      {/* ── Resize handle (bottom-right corner) ────────────────────── */}
      <div
        onMouseDown={onResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end pb-0.5 pr-0.5"
        style={{ zIndex: 1 }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M7 1L1 7M7 4L4 7M7 7" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export function SphereControls({ config, onChange, onSave }: SphereControlsProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });

  useEffect(() => { setMounted(true); }, []);

  const handleOpen = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPanelPos({
        x: Math.min(rect.right + 16, window.innerWidth - 260),
        y: Math.max(rect.top - 60, 20),
      });
    }
    setOpen(true);
  }, []);

  return (
    <>
      {/* Trigger button — sits outside the sphere, doesn't cover it */}
      <button
        ref={triggerRef}
        onClick={open ? () => setOpen(false) : handleOpen}
        className="absolute -right-12 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-900/90 border border-zinc-700/60 backdrop-blur-sm hover:bg-zinc-800/90 hover:border-zinc-600 transition-all shadow-lg"
        title="Sphere controls"
      >
        <Sliders className="w-4 h-4 text-zinc-400" />
      </button>

      {/* Floating panel rendered in portal — never overlaps sphere */}
      {mounted && open && createPortal(
        <FloatingPanel
          config={config}
          onChange={onChange}
          onSave={onSave}
          initialX={panelPos.x}
          initialY={panelPos.y}
          onClose={() => setOpen(false)}
        />,
        document.body
      )}
    </>
  );
}
