'use client';

import { createContext, useContext, type ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type VoiceState = 'OFF' | 'LISTENING' | 'ACTIVE' | 'PROCESSING' | 'SPEAKING';

export interface VoiceCommandContextValue {
  voiceState: VoiceState;
  isListening: boolean;
  isActive: boolean;
  isProcessing: boolean;
  lastTranscript: string;
  interimTranscript: string;
  lastResponse: string;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

// ─── Context (no-op — voice is handled globally by GlobalMemelliOrb) ─────────

const VoiceCommandContext = createContext<VoiceCommandContextValue>({
  voiceState: 'OFF',
  isListening: false,
  isActive: false,
  isProcessing: false,
  lastTranscript: '',
  interimTranscript: '',
  lastResponse: '',
  isSupported: false,
  error: null,
  startListening: () => {},
  stopListening: () => {},
  toggleListening: () => {},
});

export function useVoiceCommand(): VoiceCommandContextValue {
  return useContext(VoiceCommandContext);
}

// ─── Provider (no-op shell) ───────────────────────────────────────────────────

export function VoiceCommandProvider({ children }: { children: ReactNode }) {
  return (
    <VoiceCommandContext.Provider value={{
      voiceState: 'OFF',
      isListening: false,
      isActive: false,
      isProcessing: false,
      lastTranscript: '',
      interimTranscript: '',
      lastResponse: '',
      isSupported: false,
      error: null,
      startListening: () => {},
      stopListening: () => {},
      toggleListening: () => {},
    }}>
      {children}
    </VoiceCommandContext.Provider>
  );
}
