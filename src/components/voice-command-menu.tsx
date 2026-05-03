'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import {
  useVoiceCommand,
  VoiceCommandProvider,
  type VoiceState,
} from './voice-command-provider';

export { useVoiceCommand } from './voice-command-provider';
export { VoiceCommandProvider } from './voice-command-provider';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Waveform Visualizer                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function WaveformBars({ active }: { active: boolean }) {
  const barCount = 24;
  return (
    <div className="flex items-center gap-[2px] h-4">
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full bg-amber-400/80"
          animate={
            active
              ? {
                  height: [3, 8 + Math.random() * 8, 3],
                  opacity: [0.4, 0.9, 0.4],
                }
              : { height: 3, opacity: 0.2 }
          }
          transition={
            active
              ? {
                  duration: 0.4 + Math.random() * 0.4,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  delay: i * 0.03,
                  ease: 'easeInOut',
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mic Button                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STATE_COLORS: Record<VoiceState, { bg: string; ring: string; icon: string }> = {
  OFF: {
    bg: 'bg-zinc-800/90',
    ring: 'ring-zinc-600/40',
    icon: 'text-zinc-400',
  },
  LISTENING: {
    bg: 'bg-zinc-800/90',
    ring: 'ring-amber-500/60',
    icon: 'text-amber-400',
  },
  ACTIVE: {
    bg: 'bg-zinc-800/90',
    ring: 'ring-amber-400',
    icon: 'text-amber-300',
  },
  PROCESSING: {
    bg: 'bg-zinc-800/90',
    ring: 'ring-blue-500/60',
    icon: 'text-blue-400',
  },
  SPEAKING: {
    bg: 'bg-zinc-800/90',
    ring: 'ring-emerald-500/60',
    icon: 'text-emerald-400',
  },
};

function MicButton() {
  const { voiceState, isSupported, error, toggleListening } = useVoiceCommand();
  const colors = STATE_COLORS[voiceState];
  const isOff = voiceState === 'OFF';

  if (!isSupported) return null;

  return (
    <div className="relative">
      {/* Pulse ring for active states */}
      <AnimatePresence>
        {voiceState === 'LISTENING' && (
          <motion.div
            className="absolute inset-0 rounded-full ring-2 ring-amber-500/50"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {voiceState === 'ACTIVE' && (
          <motion.div
            className="absolute inset-0 rounded-full ring-2 ring-amber-400"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0.2, 0.8] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {voiceState === 'PROCESSING' && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-400 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}
        {voiceState === 'SPEAKING' && (
          <motion.div
            className="absolute inset-0 rounded-full ring-2 ring-emerald-400/60"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.15, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleListening}
        className={`
          relative z-10 flex items-center justify-center
          w-10 h-10 rounded-full
          ${colors.bg} ring-1 ${colors.ring}
          backdrop-blur-md shadow-lg shadow-black/20
          transition-colors duration-200
          hover:ring-2 hover:brightness-110
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
        `}
        whileTap={{ scale: 0.92 }}
        title={
          isOff
            ? 'Start voice commands (say "Hey Melli")'
            : 'Stop voice commands'
        }
        aria-label={isOff ? 'Start voice input' : 'Stop voice input'}
      >
        {voiceState === 'SPEAKING' ? (
          <Volume2 className={`w-4 h-4 ${colors.icon}`} />
        ) : isOff ? (
          <MicOff className={`w-4 h-4 ${colors.icon}`} />
        ) : (
          <Mic className={`w-4 h-4 ${colors.icon}`} />
        )}
      </motion.button>

      {/* Error tooltip */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full mt-2 right-0 w-56 px-3 py-2 rounded-lg
              bg-red-950/90 border border-red-800/40 text-red-300 text-xs
              backdrop-blur-md shadow-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Top Banner                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function VoiceBanner() {
  const {
    voiceState,
    interimTranscript,
    lastTranscript,
    lastResponse,
  } = useVoiceCommand();

  const showBanner =
    voiceState === 'ACTIVE' ||
    voiceState === 'PROCESSING' ||
    voiceState === 'SPEAKING';

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-[9999] overflow-hidden"
        >
          <div
            className={`
              flex items-center gap-3 px-4 py-2
              backdrop-blur-xl border-b
              ${
                voiceState === 'SPEAKING'
                  ? 'bg-emerald-950/80 border-emerald-800/30'
                  : voiceState === 'PROCESSING'
                    ? 'bg-blue-950/80 border-blue-800/30'
                    : 'bg-zinc-900/90 border-amber-800/30'
              }
            `}
          >
            {/* Left: state indicator */}
            <div className="flex items-center gap-2 shrink-0">
              {voiceState === 'ACTIVE' && (
                <>
                  <motion.div
                    className="w-2 h-2 rounded-full bg-amber-400"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  <span className="text-xs font-medium text-amber-300/90 tracking-wide uppercase">
                    Listening
                  </span>
                </>
              )}
              {voiceState === 'PROCESSING' && (
                <>
                  <motion.div
                    className="w-2 h-2 rounded-full bg-blue-400"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                  <span className="text-xs font-medium text-blue-300/90 tracking-wide uppercase">
                    Processing
                  </span>
                </>
              )}
              {voiceState === 'SPEAKING' && (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-300/90 tracking-wide uppercase">
                    Melli
                  </span>
                </>
              )}
            </div>

            {/* Center: waveform or transcript */}
            <div className="flex-1 flex items-center justify-center min-w-0">
              {voiceState === 'ACTIVE' && (
                <div className="flex items-center gap-3">
                  <WaveformBars active />
                  {interimTranscript && (
                    <span className="text-sm text-zinc-300/80 truncate max-w-sm">
                      {interimTranscript}
                    </span>
                  )}
                </div>
              )}
              {voiceState === 'PROCESSING' && (
                <span className="text-sm text-zinc-400 truncate max-w-md">
                  {lastTranscript}
                </span>
              )}
              {voiceState === 'SPEAKING' && lastResponse && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-emerald-200/90 truncate max-w-lg"
                >
                  {lastResponse}
                </motion.span>
              )}
            </div>

            {/* Right: visual balance spacer */}
            <div className="w-16 shrink-0" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Composite Component                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * VoiceCommandMenu — A floating mic button + top banner for voice commands.
 *
 * Place this anywhere in your layout. It renders:
 * 1. A small floating mic button (positioned by parent or absolutely)
 * 2. A top-of-screen banner when actively listening/processing/responding
 *
 * Must be rendered inside a VoiceCommandProvider (which itself must be
 * inside a JessicaProvider).
 */
function VoiceCommandMenuInner() {
  return (
    <>
      <VoiceBanner />
      <MicButton />
    </>
  );
}

/**
 * Self-contained voice command menu with its own provider.
 * Drop this component anywhere — it brings its own context.
 * Requires JessicaProvider to be an ancestor.
 */
export function VoiceCommandMenu() {
  return (
    <VoiceCommandProvider>
      <VoiceCommandMenuInner />
    </VoiceCommandProvider>
  );
}

/**
 * Standalone mic button without the banner, for embedding in toolbars.
 * Must be inside a VoiceCommandProvider.
 */
export function VoiceCommandMicButton() {
  return <MicButton />;
}

export default VoiceCommandMenu;
