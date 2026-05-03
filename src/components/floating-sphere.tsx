'use client';

import { useCallback, useEffect, useState } from 'react';
import { useVoiceSession } from '../providers/voice-session';
import UniversalGlobe from './universal-globe';
import type { GlobeState } from './universal-globe';

/**
 * FloatingSphere — compact AI presence for public & auth pages.
 * 3-state sphere (sleep / idle / live) in the bottom-right corner.
 * Click opens MUA chat. Shows "Hey Melli" tooltip on register page.
 * Uses UniversalGlobe — the single globe component for all contexts.
 */

function mapVoiceToGlobeState(
  sessionState: string,
  isSpeaking: boolean
): GlobeState {
  if (isSpeaking) return 'live';
  switch (sessionState) {
    case 'listening': return 'live';
    case 'processing': return 'live';
    case 'active': return 'idle';
    default: return 'sleep';
  }
}

interface FloatingSphereProps {
  /** Show "Hey Melli" prompt tooltip */
  showPrompt?: boolean;
  /** Custom prompt text */
  promptText?: string;
}

export default function FloatingSphere({
  showPrompt = false,
  promptText = 'Hey Melli — need help?',
}: FloatingSphereProps) {
  const { sessionState, isSpeaking, isBackgroundListening } = useVoiceSession();
  const [chatOpen, setChatOpen] = useState(false);
  const [promptVisible, setPromptVisible] = useState(showPrompt);

  // Listen for chat open/close
  useEffect(() => {
    const h = (e: Event) => setChatOpen((e as CustomEvent).detail?.isOpen ?? false);
    window.addEventListener('sphere-chat-state', h);
    return () => window.removeEventListener('sphere-chat-state', h);
  }, []);

  // Auto-dismiss prompt after 8s
  useEffect(() => {
    if (!promptVisible) return;
    const t = setTimeout(() => setPromptVisible(false), 8000);
    return () => clearTimeout(t);
  }, [promptVisible]);

  const handleClick = useCallback(() => {
    setPromptVisible(false);
    window.dispatchEvent(new CustomEvent('sphere-chat-toggle'));
  }, []);

  const globeState = mapVoiceToGlobeState(sessionState, isSpeaking);
  const isActive = sessionState !== 'inactive' || isBackgroundListening;

  // When chat is open, show a smaller orb — never hide completely
  // On mobile, ensure minimum 56px tap target
  const SPHERE_SIZE = chatOpen ? 36 : 72;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ease-out ${
        chatOpen ? 'bottom-auto top-4 right-4 safe-area-right safe-area-top' : 'bottom-6 right-6 max-md:bottom-[72px] safe-area-right'
      }`}
    >
      {/* "Hey Melli" prompt bubble — only when chat is closed */}
      {promptVisible && !chatOpen && (
        <div
          className="absolute bottom-full right-0 mb-3 whitespace-nowrap rounded-2xl border border-white/[0.06] bg-zinc-900/80 px-4 py-2.5 text-[13px] font-medium text-zinc-200 shadow-xl shadow-black/40 backdrop-blur-xl"
          style={{
            animation: 'floatingSphereSlideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}
          onClick={() => setPromptVisible(false)}
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            {promptText}
          </div>
          {/* Speech tail */}
          <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-r border-b border-white/[0.06] bg-zinc-900/80 backdrop-blur-xl" />
        </div>
      )}

      {/* Sphere — uses UniversalGlobe with built-in WebGL detection + CSS fallback */}
      <div
        className={`relative transition-all duration-300 ease-out cursor-pointer ${
          chatOpen
            ? 'hover:scale-105 active:scale-95'
            : 'hover:scale-110 hover:translate-y-[-2px] active:scale-95'
        }`}
        style={{ animation: 'sphereBreathe 3s ease-in-out infinite' }}
      >
        <UniversalGlobe
          state={globeState}
          size={SPHERE_SIZE}
          onClick={handleClick}
        />
      </div>

      {/* Status dot — only when not minimized */}
      {!chatOpen && (
        <span className="absolute top-0 right-0">
          <span
            className={`relative inline-flex h-3 w-3 rounded-full border-2 border-zinc-900 ${
              isActive ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-zinc-600'
            }`}
          />
          {sessionState === 'listening' && (
            <span className="absolute inset-0 inline-flex h-3 w-3 animate-ping rounded-full bg-red-500 opacity-75" />
          )}
        </span>
      )}

      {/* Keyframes */}
      <style jsx>{`
        @keyframes floatingSphereSlideUp {
          0% { opacity: 0; transform: translateY(8px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sphereBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
