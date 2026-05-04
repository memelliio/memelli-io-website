'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { useVoiceSession } from './voice-session';
import { useJessica } from './jessica-provider';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type GlobeVisualState = 'sleep' | 'idle' | 'live';

export interface MUAState {
  globeState: GlobeVisualState;
  isActive: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  isBackgroundListening: boolean;
  orbStatus: 'idle' | 'listening' | 'thinking' | 'speaking';
}

export interface MUAActions {
  onGlobeClick: () => void;
}

interface MUAContextValue {
  state: MUAState;
  actions: MUAActions;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Context                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MUACtx = createContext<MUAContextValue | null>(null);

// Safe no-op fallback for when MUAProvider hasn't mounted yet (deferred init).
const MUA_FALLBACK: MUAContextValue = {
  state: {
    globeState: 'sleep',
    isActive: false,
    isSpeaking: false,
    isListening: false,
    isBackgroundListening: false,
    orbStatus: 'idle',
  },
  actions: {
    onGlobeClick: () => {},
  },
};

export function useMUA(): MUAContextValue {
  const ctx = useContext(MUACtx);
  return ctx ?? MUA_FALLBACK;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Provider                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function MUAProvider({ children }: { children: ReactNode }) {
  const { sessionState, isSpeaking, isBackgroundListening } =
    useVoiceSession();
  const jessica = useJessica();

  /* ── Derive globe visual state ── */
  const globeState: GlobeVisualState = (() => {
    if (
      jessica.state.isThinking ||
      isSpeaking ||
      jessica.state.activeDispatches.length > 0
    )
      return 'live';
    if (sessionState !== 'inactive') return 'idle';
    return 'sleep';
  })();

  const isActive = sessionState !== 'inactive' || isBackgroundListening;
  const isListening = sessionState === 'listening';

  const orbStatus: MUAState['orbStatus'] = (() => {
    if (isSpeaking) return 'speaking';
    if (jessica.state.isThinking) return 'thinking';
    if (isListening) return 'listening';
    return 'idle';
  })();

  /* ── Globe click handler ── */
  const onGlobeClick = useCallback(() => {
    jessica.actions.toggle();
  }, [jessica.actions]);

  const state: MUAState = {
    globeState,
    isActive,
    isSpeaking,
    isListening,
    isBackgroundListening,
    orbStatus,
  };

  const actions: MUAActions = {
    onGlobeClick,
  };

  return (
    <MUACtx.Provider value={{ state, actions }}>{children}</MUACtx.Provider>
  );
}
