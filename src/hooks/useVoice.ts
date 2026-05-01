'use client';

/**
 * useVoice.ts — backwards-compatibility shim.
 *
 * Other pages import { useVoice, VoiceState, UseVoiceReturn } from './useVoice'.
 * This module re-exports everything from useDeepgram so those imports continue
 * to work without modification.
 *
 * New code should import from useDeepgram directly.
 */

export type { VoiceState, VoiceSettings, DeepgramVoice, UseDeepgramReturn as UseVoiceReturn } from './useDeepgram';
export { useDeepgram as useVoice, DEEPGRAM_VOICES as DEEPGRAM_VOICES_LIST } from './useDeepgram';
