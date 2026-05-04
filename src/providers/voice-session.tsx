'use client';

import { createContext, useContext } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type VoiceSessionState = 'inactive' | 'active' | 'listening' | 'processing';

export interface VoiceSessionContextValue {
  sessionState: VoiceSessionState;
  transcript: string;
  lastCommand: string;
  timeRemaining: number;
  isSupported: boolean;
  activate: () => void;
  deactivate: () => void;
  isSpeaking: boolean;
  speak: (text: string) => void;
  isBackgroundListening: boolean;
  micPermissionDenied: boolean;
  voiceError: string | null;
  clearVoiceError: () => void;
}

// ─── Context (no-op — voice is handled globally by GlobalMemelliOrb) ─────────

const VoiceSessionContext = createContext<VoiceSessionContextValue>({
  sessionState: 'inactive',
  transcript: '',
  lastCommand: '',
  timeRemaining: 0,
  isSupported: false,
  activate: () => {},
  deactivate: () => {},
  isSpeaking: false,
  speak: () => {},
  isBackgroundListening: false,
  micPermissionDenied: false,
  voiceError: null,
  clearVoiceError: () => {},
});

export function useVoiceSession() {
  return useContext(VoiceSessionContext);
}

// ─── Provider (no-op shell — SpeechRecognition lives in GlobalMemelliOrb) ────

export function VoiceSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <VoiceSessionContext.Provider value={{
      sessionState: 'inactive',
      transcript: '',
      lastCommand: '',
      timeRemaining: 0,
      isSupported: false,
      activate: () => {},
      deactivate: () => {},
      isSpeaking: false,
      speak: () => {},
      isBackgroundListening: false,
      micPermissionDenied: false,
      voiceError: null,
      clearVoiceError: () => {},
    }}>
      {children}
    </VoiceSessionContext.Provider>
  );
}
