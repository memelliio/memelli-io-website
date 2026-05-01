'use client';

import { useCallback, useEffect, useState } from 'react';
import { useVoiceSession } from '../providers/voice-session';
import UniversalGlobe from './universal-globe';
import type { GlobeState } from './universal-globe';

const KEYFRAMES = `
@keyframes mua-slide-up {
  0%   { opacity: 0; transform: translateY(8px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
`;

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.textContent = KEYFRAMES;
  document.head.appendChild(s);
}

function mapVoiceToGlobeState(
  sessionState: string,
  isSpeaking: boolean
): GlobeState {
  if (isSpeaking) return 'live';
  switch (sessionState) {
    case 'listening': return 'idle';
    case 'processing': return 'live';
    case 'active': return 'idle';
    default: return 'sleep';
  }
}

export default function SphereIndicator() {
  const { sessionState, isSpeaking, isBackgroundListening } = useVoiceSession();
  const [chatOpen, setChatOpen] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [showResponse, setShowResponse] = useState(false);

  useEffect(() => { inject(); }, []);

  useEffect(() => {
    const h = (e: Event) => setChatOpen((e as CustomEvent).detail?.isOpen ?? false);
    window.addEventListener('sphere-chat-state', h);
    return () => window.removeEventListener('sphere-chat-state', h);
  }, []);

  // Listen for MUA responses to show as text overlay on sphere
  useEffect(() => {
    const h = (e: Event) => {
      const text = (e as CustomEvent).detail?.text;
      if (text && typeof text === 'string') {
        setLastResponse(text.length > 120 ? text.slice(0, 120) + '...' : text);
        setShowResponse(true);
        // Auto-hide after 6 seconds
        const t = setTimeout(() => setShowResponse(false), 6000);
        return () => clearTimeout(t);
      }
    };
    window.addEventListener('mua-response-text', h);
    return () => window.removeEventListener('mua-response-text', h);
  }, []);

  const handleClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent('sphere-chat-toggle'));
  }, []);

  if (chatOpen) return null;

  const globeState = mapVoiceToGlobeState(sessionState, isSpeaking);
  const isActive = sessionState !== 'inactive' || isBackgroundListening;

  return (
    <div
      className="fixed bottom-4 right-4 z-[60]"
    >
      <div className="relative transition-all duration-300 ease-out hover:scale-105 hover:translate-y-[-2px] active:scale-95 cursor-pointer">
        <UniversalGlobe
          state={globeState}
          size={140}
          onClick={handleClick}
        />
      </div>

      {/* Status dot */}
      <span className="absolute top-0 right-0">
        <span className={`relative inline-flex h-4 w-4 rounded-full border-2 border-zinc-900 ${isActive ? 'bg-red-500 shadow-[0_0_12px_rgba(225,29,46,0.5)]' : 'bg-zinc-600'}`} />
        {sessionState === 'listening' && <span className="absolute inset-0 inline-flex h-4 w-4 animate-ping rounded-full bg-red-500 opacity-75" />}
      </span>

      {/* MUA text response overlay — shows Melli's last response as floating text */}
      {showResponse && lastResponse && (
        <div
          className="absolute bottom-full right-0 mb-3 max-w-[280px] rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-6 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7)]"
          style={{ animation: 'mua-slide-up 0.25s cubic-bezier(0.16,1,0.3,1)' }}
          onClick={() => setShowResponse(false)}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(225,29,46,0.3)]" />
            <span className="text-[11px] font-medium text-zinc-100 tracking-tight">Melli</span>
          </div>
          <p className="text-[13px] leading-relaxed text-zinc-100">{lastResponse}</p>
          {/* Speech tail */}
          <div className="absolute -bottom-1.5 right-8 w-3 h-3 rotate-45 border-r border-b border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl" />
        </div>
      )}
    </div>
  );
}