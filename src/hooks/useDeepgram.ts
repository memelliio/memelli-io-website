'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { tts, stt, stopSpeaking as dgStop } from '../lib/deepgram';

// ── Types ────────────────────────────────────────────────────────────────────

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

/** Subset of the old VoiceSettings kept for backwards compatibility. */
export interface VoiceSettings {
  voiceURI: string;
  rate: number;
  pitch: number;
  volume: number;
  continuousMode: boolean;
  lang: string;
}

export interface DeepgramVoice {
  voiceURI: string;
  name: string;
  lang: string;
}

export const DEEPGRAM_VOICES: DeepgramVoice[] = [
  { voiceURI: 'aura-2-aurora-en', name: 'Aurora (Female)', lang: 'en' },
  { voiceURI: 'aura-2-asteria-en', name: 'Asteria (Female)', lang: 'en' },
  { voiceURI: 'aura-2-luna-en', name: 'Luna (Female)', lang: 'en' },
  { voiceURI: 'aura-2-stella-en', name: 'Stella (Female)', lang: 'en' },
  { voiceURI: 'aura-2-athena-en', name: 'Athena (Female)', lang: 'en' },
  { voiceURI: 'aura-2-hera-en', name: 'Hera (Female)', lang: 'en' },
  { voiceURI: 'aura-2-orion-en', name: 'Orion (Male)', lang: 'en' },
  { voiceURI: 'aura-2-arcas-en', name: 'Arcas (Male)', lang: 'en' },
  { voiceURI: 'aura-2-perseus-en', name: 'Perseus (Male)', lang: 'en' },
  { voiceURI: 'aura-2-angus-en', name: 'Angus (Male)', lang: 'en' },
  { voiceURI: 'aura-2-orpheus-en', name: 'Orpheus (Male)', lang: 'en' },
  { voiceURI: 'aura-2-helios-en', name: 'Helios (Male)', lang: 'en' },
  { voiceURI: 'aura-2-zeus-en', name: 'Zeus (Male)', lang: 'en' },
];

export interface UseDeepgramReturn {
  state: VoiceState;
  transcript: string;
  startListening(): void;
  stopListening(): void;
  speak(text: string, onEnd?: () => void): void;
  stopSpeaking(): void;
  voice: string;
  setVoice(v: string): void;
  // ── Backwards-compatibility surface (mirrors old UseVoiceReturn) ──────────
  settings: VoiceSettings;
  availableVoices: DeepgramVoice[];
  sttSupported: boolean;
  ttsSupported: boolean;
  updateSettings(partial: Partial<VoiceSettings>): void;
  resetError(): void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_VOICE = 'aura-2-aurora-en';
/** Stop recording after this many ms of silence. */
const SILENCE_TIMEOUT_MS = 800;

// ── Hook ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'memelli_voice_settings';
const DEFAULT_SETTINGS: VoiceSettings = {
  voiceURI: DEFAULT_VOICE,
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  continuousMode: false,
  lang: 'en-US',
};

function loadSettings(): VoiceSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { return DEFAULT_SETTINGS; }
}

function persistSettings(s: VoiceSettings) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function useDeepgram(
  onTranscript?: (text: string) => void,
): UseDeepgramReturn {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [voice, setVoice] = useState(DEFAULT_VOICE);
  const [settings, setSettings] = useState<VoiceSettings>(loadSettings);

  const mountedRef = useRef(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const browserRecognitionRef = useRef<any>(null);
  const silenceRafRef = useRef<number | null>(null);
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
      }
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (browserRecognitionRef.current) {
        try { browserRecognitionRef.current.stop(); } catch { /* ignore */ }
        browserRecognitionRef.current = null;
      }
      if (silenceRafRef.current) cancelAnimationFrame(silenceRafRef.current);
      dgStop();
    };
  }, []);

  // ── Silence detection ─────────────────────────────────────────────────────
  const startSilenceDetection = useCallback((stream: MediaStream) => {
    if (typeof window === 'undefined') return;
    try {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let lastSoundTime = Date.now();

      const check = () => {
        if (
          !mountedRef.current ||
          !mediaRecorderRef.current ||
          mediaRecorderRef.current.state === 'inactive'
        ) {
          audioCtx.close();
          return;
        }
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((s, v) => s + v, 0) / dataArray.length;

        if (avg > 10) {
          lastSoundTime = Date.now();
        } else if (Date.now() - lastSoundTime > SILENCE_TIMEOUT_MS) {
          audioCtx.close();
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === 'recording'
          ) {
            mediaRecorderRef.current.stop();
          }
          return;
        }
        silenceRafRef.current = requestAnimationFrame(check);
      };

      silenceRafRef.current = requestAnimationFrame(check);
    } catch {
      // AudioContext unavailable — no silence detection, user stops manually
    }
  }, []);

  // ── STT dispatch ─────────────────────────────────────────────────────────
  const sendToSTT = useCallback(
    async (audioBlob: Blob) => {
      if (!mountedRef.current) return;
      setState('thinking');

      const text = await stt(audioBlob);

      if (!mountedRef.current) return;
      if (!text) { setState('idle'); return; }

      setTranscript(text);
      setState('thinking');
      onTranscript?.(text);
    },
    [onTranscript],
  );

  // ── stopListening ─────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (silenceRafRef.current) {
      cancelAnimationFrame(silenceRafRef.current);
      silenceRafRef.current = null;
    }

    if (browserRecognitionRef.current) {
      try { browserRecognitionRef.current.stop(); } catch { /* ignore */ }
      browserRecognitionRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop(); // onstop will send to STT
    } else {
      mediaRecorderRef.current = null;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      if (mountedRef.current) setState(s => (s === 'listening' ? 'idle' : s));
    }
  }, []);

  // ── startListening ────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Stop any in-progress speech first
    dgStop();

    // ── Try getUserMedia (Deepgram path) ──────────────────────────────────
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          if (!mountedRef.current) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }

          streamRef.current = stream;
          audioChunksRef.current = [];

          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : 'audio/mp4';

          const recorder = new MediaRecorder(stream, { mimeType });

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          recorder.onstop = () => {
            stream.getTracks().forEach(t => t.stop());
            streamRef.current = null;
            mediaRecorderRef.current = null;

            const blob = new Blob(audioChunksRef.current, { type: mimeType });
            audioChunksRef.current = [];

            if (blob.size > 0) {
              sendToSTT(blob);
            } else if (mountedRef.current) {
              setState('idle');
            }
          };

          recorder.onerror = () => {
            stream.getTracks().forEach(t => t.stop());
            streamRef.current = null;
            mediaRecorderRef.current = null;
            if (mountedRef.current) setState('error');
          };

          mediaRecorderRef.current = recorder;
          recorder.start(250);
          setState('listening');
          startSilenceDetection(stream);
        })
        .catch(() => {
          // getUserMedia failed — fall back to browser Web Speech API
          startBrowserSTT();
        });
      return;
    }

    // ── Fall back: browser Web Speech API ────────────────────────────────
    startBrowserSTT();

    function startBrowserSTT() {
      if (typeof window === 'undefined') return;
      const SR =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SR) {
        if (mountedRef.current) setState('error');
        return;
      }

      const recognition = new SR();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      browserRecognitionRef.current = recognition;

      recognition.onstart = () => {
        if (mountedRef.current) setState('listening');
      };
      recognition.onresult = (event: any) => {
        const text: string = event.results?.[0]?.[0]?.transcript || '';
        if (text && mountedRef.current) {
          setTranscript(text);
          setState('thinking');
          onTranscript?.(text);
        }
      };
      recognition.onerror = (event: any) => {
        if (mountedRef.current) {
          setState(event.error === 'no-speech' ? 'idle' : 'error');
        }
      };
      recognition.onend = () => {
        if (mountedRef.current) setState(s => (s === 'listening' ? 'idle' : s));
      };

      try { recognition.start(); } catch {
        if (mountedRef.current) setState('error');
      }
    }
  }, [startSilenceDetection, sendToSTT, onTranscript]);

  // ── speak ─────────────────────────────────────────────────────────────────
  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!text) { onEnd?.(); return; }
      if (!mountedRef.current) { onEnd?.(); return; }

      setState('speaking');

      tts(text, voiceRef.current, () => {
        if (mountedRef.current) setState('idle');
        onEnd?.();
      });
    },
    [],
  );

  // ── stopSpeaking ──────────────────────────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    dgStop();
    if (mountedRef.current) setState('idle');
  }, []);

  // ── Backwards-compatible helpers ──────────────────────────────────────────
  const updateSettings = useCallback((partial: Partial<VoiceSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      persistSettings(next);
      // Sync voiceURI → voice
      if (partial.voiceURI) setVoice(partial.voiceURI);
      return next;
    });
  }, []);

  const resetError = useCallback(() => {
    setState(s => (s === 'error' ? 'idle' : s));
  }, []);

  const sttSupported =
    typeof window !== 'undefined' &&
    (!!navigator.mediaDevices?.getUserMedia ||
      !!(window as any).webkitSpeechRecognition ||
      !!(window as any).SpeechRecognition);

  return {
    state,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    voice,
    setVoice,
    settings,
    availableVoices: DEEPGRAM_VOICES,
    sttSupported,
    ttsSupported: true,
    updateSettings,
    resetError,
  };
}
