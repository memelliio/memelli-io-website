'use client';

import React, { useCallback, useMemo } from 'react';
import { Mic, MicOff, Volume2, Loader2, AlertCircle } from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';
import type { VoiceState, VoiceSettings } from '../../hooks/useVoice';

import { LoadingGlobe } from '@/components/ui/loading-globe';
// ─── Props ───────────────────────────────────────────────────────────────────

export interface VoiceButtonProps {
  onTranscript?: (text: string) => void;
  onStateChange?: (state: VoiceState) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTranscript?: boolean;
}

// ─── Size map ────────────────────────────────────────────────────────────────

const SIZES = {
  sm: { button: 40, icon: 16, ring: 48, label: 'text-xs' },
  md: { button: 56, icon: 22, ring: 68, label: 'text-sm' },
  lg: { button: 72, icon: 28, ring: 88, label: 'text-base' },
} as const;

// ─── Keyframes (injected once via <style>) ───────────────────────────────────

const KEYFRAMES = `
@keyframes vb-pulse-ring {
  0%   { transform: scale(1);   opacity: 0.6; }
  100% { transform: scale(1.8); opacity: 0; }
}
@keyframes vb-pulse-ring-2 {
  0%   { transform: scale(1);   opacity: 0.4; }
  100% { transform: scale(2.2); opacity: 0; }
}
@keyframes vb-pulse-ring-3 {
  0%   { transform: scale(1);   opacity: 0.25; }
  100% { transform: scale(2.6); opacity: 0; }
}
@keyframes vb-spin-dots {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes vb-bar {
  0%, 100% { transform: scaleY(0.3); }
  50%      { transform: scaleY(1); }
}
@keyframes vb-shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-3px); }
  40%      { transform: translateX(3px); }
  60%      { transform: translateX(-2px); }
  80%      { transform: translateX(2px); }
}
@keyframes vb-idle-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
  50%      { box-shadow: 0 0 12px 2px rgba(59,130,246,0.25); }
}
`;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
}

// ─── VoiceButton Component ───────────────────────────────────────────────────

export default function VoiceButton({
  onTranscript,
  onStateChange,
  size = 'md',
  className = '',
  showTranscript = false,
}: VoiceButtonProps) {
  // Inject CSS keyframes on first render
  React.useEffect(() => { injectStyles(); }, []);

  const voice = useVoice(onTranscript);
  const {
    state,
    transcript,
    sttSupported,
    startListening,
    stopListening,
    stopSpeaking,
    resetError,
  } = voice;

  // Notify parent of state changes
  const prevStateRef = React.useRef(state);
  React.useEffect(() => {
    if (state !== prevStateRef.current) {
      prevStateRef.current = state;
      onStateChange?.(state);
    }
  }, [state, onStateChange]);

  const s = SIZES[size];

  const handleClick = useCallback(() => {
    switch (state) {
      case 'listening':
        stopListening();
        break;
      case 'speaking':
        stopSpeaking();
        break;
      case 'error':
        resetError();
        break;
      case 'thinking':
        break; // no-op
      default:
        if (sttSupported) startListening();
    }
  }, [state, sttSupported, startListening, stopListening, stopSpeaking, resetError]);

  const isDisabled = state === 'thinking' || (!sttSupported && state === 'idle');

  // ── Render helpers ───────────────────────────────────────────────────────

  const icon = useMemo(() => {
    const iconSize = s.icon;
    switch (state) {
      case 'idle':
        return <Mic style={{ width: iconSize, height: iconSize }} />;
      case 'listening':
        return <MicOff style={{ width: iconSize, height: iconSize }} className="relative z-10" />;
      case 'thinking':
        return <Loader2 style={{ width: iconSize, height: iconSize }} className="relative z-10" />;
      case 'speaking':
        return <Volume2 style={{ width: iconSize, height: iconSize }} className="relative z-10" />;
      case 'error':
        return <AlertCircle style={{ width: iconSize, height: iconSize }} />;
    }
  }, [state, s.icon]);

  const title = useMemo(() => ({
    idle: sttSupported ? 'Start voice input' : 'Voice not supported',
    listening: 'Tap to stop listening',
    thinking: 'Processing...',
    speaking: 'Tap to stop speaking',
    error: 'Tap to retry',
  }[state]), [state, sttSupported]);

  // ── Accent colors per state ──────────────────────────────────────────────

  const accent = {
    idle:      { border: 'rgba(59,130,246,0.5)',  bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', text: '#93c5fd' },
    listening: { border: 'rgba(239,68,68,0.7)',    bg: 'linear-gradient(135deg, #1c1917 0%, #1a0a0a 100%)', text: '#fca5a5' },
    thinking:  { border: 'rgba(59,130,246,0.5)',   bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', text: '#93c5fd' },
    speaking:  { border: 'rgba(34,197,94,0.6)',    bg: 'linear-gradient(135deg, #0a1a0f 0%, #0f172a 100%)', text: '#86efac' },
    error:     { border: 'rgba(239,68,68,0.6)',    bg: 'linear-gradient(135deg, #1c1917 0%, #1a0a0a 100%)', text: '#fca5a5' },
  }[state];

  // ── Button style ─────────────────────────────────────────────────────────

  const buttonStyle: React.CSSProperties = {
    width: s.button,
    height: s.button,
    borderRadius: '50%',
    border: `2px solid ${accent.border}`,
    background: accent.bg,
    color: accent.text,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    transition: 'border-color 0.3s, box-shadow 0.3s, background 0.3s',
    opacity: isDisabled ? 0.4 : 1,
    ...(state === 'idle' && !isDisabled ? { animation: 'vb-idle-glow 3s ease-in-out infinite' } : {}),
    ...(state === 'error' ? { animation: 'vb-shake 0.5s ease-in-out' } : {}),
  };

  // ── Pulsing rings (listening) ────────────────────────────────────────────

  const renderListeningRings = () => {
    if (state !== 'listening') return null;
    const ringBase: React.CSSProperties = {
      position: 'absolute',
      borderRadius: '50%',
      border: '2px solid rgba(239,68,68,0.4)',
      top: '50%',
      left: '50%',
      width: s.button,
      height: s.button,
      marginLeft: -(s.button / 2),
      marginTop: -(s.button / 2),
      pointerEvents: 'none',
    };
    return (
      <>
        <span style={{ ...ringBase, animation: 'vb-pulse-ring 1.5s ease-out infinite' }} />
        <span style={{ ...ringBase, animation: 'vb-pulse-ring-2 1.5s ease-out infinite 0.3s' }} />
        <span style={{ ...ringBase, animation: 'vb-pulse-ring-3 1.5s ease-out infinite 0.6s' }} />
      </>
    );
  };

  // ── Spinning dots (thinking) ─────────────────────────────────────────────

  const renderThinkingDots = () => {
    if (state !== 'thinking') return null;
    const dotCount = 8;
    const radius = s.button / 2 + 6;
    return (
      <span
        style={{
          position: 'absolute',
          width: s.button + 12,
          height: s.button + 12,
          top: '50%',
          left: '50%',
          marginLeft: -(s.button + 12) / 2,
          marginTop: -(s.button + 12) / 2,
          animation: 'vb-spin-dots 2s linear infinite',
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: dotCount }).map((_, i) => {
          const angle = (360 / dotCount) * i;
          const rad = (angle * Math.PI) / 180;
          const x = radius + radius * Math.cos(rad) - 2;
          const y = radius + radius * Math.sin(rad) - 2;
          return (
            <span
              key={i}
              style={{
                position: 'absolute',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: '#93c5fd',
                opacity: 0.3 + (i / dotCount) * 0.7,
                left: x,
                top: y,
              }}
            />
          );
        })}
      </span>
    );
  };

  // ── Sound wave bars (speaking) ───────────────────────────────────────────

  const renderSpeakingBars = () => {
    if (state !== 'speaking') return null;
    const barCount = 5;
    const barWidth = Math.max(2, Math.round(s.button * 0.06));
    const barGap = Math.max(2, Math.round(s.button * 0.04));
    const totalWidth = barCount * barWidth + (barCount - 1) * barGap;
    const maxBarH = s.button * 0.45;
    return (
      <span
        style={{
          position: 'absolute',
          bottom: -maxBarH - 8,
          left: '50%',
          marginLeft: -(totalWidth / 2),
          display: 'flex',
          alignItems: 'flex-end',
          gap: barGap,
          height: maxBarH,
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: barCount }).map((_, i) => (
          <span
            key={i}
            style={{
              width: barWidth,
              height: maxBarH,
              borderRadius: barWidth,
              background: '#86efac',
              transformOrigin: 'bottom',
              animation: `vb-bar 0.8s ease-in-out ${i * 0.12}s infinite`,
            }}
          />
        ))}
      </span>
    );
  };

  return (
    <div className={className} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        {renderListeningRings()}
        {renderThinkingDots()}
        <button
          type="button"
          onClick={handleClick}
          disabled={isDisabled}
          title={title}
          aria-label={title}
          style={buttonStyle}
        >
          {icon}
        </button>
        {renderSpeakingBars()}
      </div>

      {/* Error label */}
      {state === 'error' && (
        <span className={`${s.label} text-red-400`}>Tap to retry</span>
      )}

      {/* Live transcript */}
      {showTranscript && transcript && state !== 'idle' && (
        <span
          className={`${s.label} text-zinc-400 max-w-[240px] text-center truncate`}
          title={transcript}
        >
          {transcript}
        </span>
      )}
    </div>
  );
}

// ─── Legacy VoiceButton (backward-compatible default-like export) ────────────
// Used by the AI dashboard page with explicit state/callback props.

export interface LegacyVoiceButtonProps {
  voiceState: VoiceState;
  sttSupported: boolean;
  ttsSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onResetError: () => void;
  disabled?: boolean;
}

export function LegacyVoiceButton({
  voiceState,
  sttSupported,
  ttsSupported: _ttsSupported,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  onResetError,
  disabled,
}: LegacyVoiceButtonProps) {
  const handleClick = () => {
    if (disabled) return;
    switch (voiceState) {
      case 'listening':  return onStopListening();
      case 'speaking':   return onStopSpeaking();
      case 'error':      return onResetError();
      case 'thinking':   return;
      default:
        if (sttSupported) onStartListening();
    }
  };

  const title = {
    idle:      sttSupported ? 'Start voice input' : 'Voice not supported in this browser',
    listening: 'Stop listening',
    thinking:  'Processing\u2026',
    speaking:  'Stop speaking',
    error:     'Voice error \u2014 click to reset',
  }[voiceState];

  const isDisabled = disabled || voiceState === 'thinking' || (!sttSupported && voiceState === 'idle');

  const baseClass =
    'relative shrink-0 flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-200';

  const stateClass = {
    idle:      sttSupported
                 ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                 : 'text-zinc-700 cursor-not-allowed',
    listening: 'bg-red-600/20 text-red-400 hover:bg-red-600/30',
    thinking:  'bg-red-600/10 text-red-400 cursor-default',
    speaking:  'bg-red-600/20 text-red-400 hover:bg-red-600/30',
    error:     'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30',
  }[voiceState];

  const iconEl = {
    idle:      <Mic className="h-4 w-4" />,
    listening: <MicOff className="h-4 w-4 relative z-10" />,
    thinking:  <LoadingGlobe size="sm" />,
    speaking:  <Volume2 className="h-4 w-4 relative z-10" />,
    error:     <AlertCircle className="h-4 w-4" />,
  }[voiceState];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      title={title}
      className={[
        baseClass,
        stateClass,
        isDisabled ? 'opacity-40 cursor-not-allowed' : '',
      ].filter(Boolean).join(' ')}
    >
      {voiceState === 'listening' && (
        <span className="absolute inset-0 rounded-lg animate-ping bg-red-500/30" />
      )}
      {voiceState === 'speaking' && (
        <>
          <span className="absolute inset-0 rounded-lg animate-ping bg-red-500/20" />
          <span className="absolute inset-1 rounded-md animate-ping bg-red-500/15 [animation-delay:150ms]" />
        </>
      )}
      {iconEl}
    </button>
  );
}

// ─── VoicePanel ──────────────────────────────────────────────────────────────

export interface VoicePanelProps {
  onTranscript?: (text: string) => void;
  onStateChange?: (state: VoiceState) => void;
  className?: string;
}

export function VoicePanel({
  onTranscript,
  onStateChange,
  className = '',
}: VoicePanelProps) {
  React.useEffect(() => { injectStyles(); }, []);

  const voice = useVoice(onTranscript);
  const {
    state,
    transcript,
    settings,
    availableVoices,
    sttSupported,
    startListening,
    stopListening,
    stopSpeaking,
    resetError,
    updateSettings,
  } = voice;

  const prevStateRef = React.useRef(state);
  React.useEffect(() => {
    if (state !== prevStateRef.current) {
      prevStateRef.current = state;
      onStateChange?.(state);
    }
  }, [state, onStateChange]);

  const handleClick = useCallback(() => {
    switch (state) {
      case 'listening':
        stopListening();
        break;
      case 'speaking':
        stopSpeaking();
        break;
      case 'error':
        resetError();
        break;
      case 'thinking':
        break;
      default:
        if (sttSupported) startListening();
    }
  }, [state, sttSupported, startListening, stopListening, stopSpeaking, resetError]);

  const isDisabled = state === 'thinking' || (!sttSupported && state === 'idle');

  // Grouped voices by language
  const voiceOptions = useMemo(() => {
    return availableVoices
      .filter(v => v.lang.startsWith('en'))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [availableVoices]);

  const stateLabel = {
    idle: 'Ready',
    listening: 'Listening...',
    thinking: 'Processing...',
    speaking: 'Speaking...',
    error: 'Error',
  }[state];

  const stateColor = {
    idle: 'text-zinc-500',
    listening: 'text-red-400',
    thinking: 'text-blue-400',
    speaking: 'text-green-400',
    error: 'text-red-400',
  }[state];

  // Build the accent for the embedded button
  const accent = {
    idle:      { border: 'rgba(59,130,246,0.5)',  bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', text: '#93c5fd' },
    listening: { border: 'rgba(239,68,68,0.7)',    bg: 'linear-gradient(135deg, #1c1917 0%, #1a0a0a 100%)', text: '#fca5a5' },
    thinking:  { border: 'rgba(59,130,246,0.5)',   bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', text: '#93c5fd' },
    speaking:  { border: 'rgba(34,197,94,0.6)',    bg: 'linear-gradient(135deg, #0a1a0f 0%, #0f172a 100%)', text: '#86efac' },
    error:     { border: 'rgba(239,68,68,0.6)',    bg: 'linear-gradient(135deg, #1c1917 0%, #1a0a0a 100%)', text: '#fca5a5' },
  }[state];

  const btnSize = 56;
  const iconSize = 22;

  const buttonStyle: React.CSSProperties = {
    width: btnSize,
    height: btnSize,
    borderRadius: '50%',
    border: `2px solid ${accent.border}`,
    background: accent.bg,
    color: accent.text,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    transition: 'border-color 0.3s, box-shadow 0.3s, background 0.3s',
    opacity: isDisabled ? 0.4 : 1,
    ...(state === 'idle' && !isDisabled ? { animation: 'vb-idle-glow 3s ease-in-out infinite' } : {}),
    ...(state === 'error' ? { animation: 'vb-shake 0.5s ease-in-out' } : {}),
  };

  const iconEl = useMemo(() => {
    switch (state) {
      case 'idle':      return <Mic style={{ width: iconSize, height: iconSize }} />;
      case 'listening': return <MicOff style={{ width: iconSize, height: iconSize }} className="relative z-10" />;
      case 'thinking':  return <Loader2 style={{ width: iconSize, height: iconSize }} className="relative z-10" />;
      case 'speaking':  return <Volume2 style={{ width: iconSize, height: iconSize }} className="relative z-10" />;
      case 'error':     return <AlertCircle style={{ width: iconSize, height: iconSize }} />;
    }
  }, [state]);

  // Listening rings for panel button
  const listeningRings = state === 'listening' ? (
    <>
      {[0, 0.3, 0.6].map((delay, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            borderRadius: '50%',
            border: '2px solid rgba(239,68,68,0.4)',
            top: '50%',
            left: '50%',
            width: btnSize,
            height: btnSize,
            marginLeft: -(btnSize / 2),
            marginTop: -(btnSize / 2),
            pointerEvents: 'none',
            animation: `vb-pulse-ring${i === 0 ? '' : i === 1 ? '-2' : '-3'} 1.5s ease-out infinite ${delay}s`,
          }}
        />
      ))}
    </>
  ) : null;

  const inputClass =
    'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-colors';

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center gap-4 ${className}`}>
      {/* Button */}
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
        {listeningRings}
        <button
          type="button"
          onClick={handleClick}
          disabled={isDisabled}
          aria-label={stateLabel}
          style={buttonStyle}
        >
          {iconEl}
        </button>
      </div>

      {/* State label */}
      <span className={`text-sm font-medium ${stateColor}`}>{stateLabel}</span>

      {/* Transcript display */}
      {transcript && (
        <div className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-300 min-h-[40px] max-h-[120px] overflow-y-auto">
          {transcript}
        </div>
      )}

      {/* Error retry hint */}
      {state === 'error' && (
        <span className="text-xs text-red-400">Tap to retry</span>
      )}

      {/* Controls */}
      <div className="w-full space-y-3 pt-2 border-t border-zinc-800">
        {/* Voice selector */}
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Voice</label>
          <select
            className={inputClass}
            value={settings.voiceURI}
            onChange={(e) => updateSettings({ voiceURI: e.target.value })}
          >
            {voiceOptions.length === 0 && (
              <option value="">No voices available</option>
            )}
            {voiceOptions.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>

        {/* Volume */}
        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            Volume &mdash; {Math.round(settings.volume * 100)}%
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
            className="w-full accent-blue-500"
          />
        </div>

        {/* Speed */}
        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            Speed &mdash; {settings.rate.toFixed(1)}x
          </label>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={settings.rate}
            onChange={(e) => updateSettings({ rate: parseFloat(e.target.value) })}
            className="w-full accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
