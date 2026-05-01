'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * useDeepgramWakeWord — always-on wake word detector.
 *
 * Strategy (in order of preference):
 *   1. Deepgram STT polling via /api/voice/stt — works in Electron, any browser,
 *      no Google key needed. Records 2.5s chunks, skips silence, sends to Deepgram.
 *   2. Web Speech API fallback — for standard Chrome/Edge if Deepgram key is missing.
 *
 * Returns { blocked } — true if mic permission was denied.
 */
export function useDeepgramWakeWord(
  words: string[],
  onDetected: () => void,
  enabled: boolean,
): { blocked: boolean } {
  const onDetectedRef = useRef(onDetected);
  const wordsRef = useRef(words);
  onDetectedRef.current = onDetected;
  wordsRef.current = words;

  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!enabled) return;
    if (!navigator.mediaDevices?.getUserMedia) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let recorder: MediaRecorder | null = null;
    let audioCtx: AudioContext | null = null;
    let analyserNode: AnalyserNode | null = null;
    let loopTimer: ReturnType<typeof setTimeout> | null = null;

    const CHUNK_MS = 2500;
    const SILENCE_THRESHOLD = 18;

    function clearLoop() {
      if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
    }

    function scheduleNext() {
      if (cancelled) return;
      clearLoop();
      loopTimer = setTimeout(recordChunk, 50);
    }

    function isSilent(): boolean {
      if (!analyserNode) return false;
      const buf = new Uint8Array(analyserNode.frequencyBinCount);
      analyserNode.getByteFrequencyData(buf);
      const avg = buf.reduce((s, v) => s + v, 0) / buf.length;
      return avg < SILENCE_THRESHOLD;
    }

    async function sendChunk(blob: Blob): Promise<void> {
      if (cancelled || blob.size < 1000) return;
      try {
        const form = new FormData();
        form.append('audio', blob, 'wake.webm');
        const res = await fetch('/api/voice/stt', { method: 'POST', body: form });
        if (!res.ok || cancelled) { scheduleNext(); return; }
        const data = (await res.json()) as { text?: string };
        const text = (data.text || '').toLowerCase();
        if (!text || cancelled) { scheduleNext(); return; }
        const hit = wordsRef.current.some(w => text.includes(w.toLowerCase()));
        if (hit) {
          onDetectedRef.current();
        } else {
          scheduleNext();
        }
      } catch {
        if (!cancelled) scheduleNext();
      }
    }

    function recordChunk(): void {
      if (cancelled || !stream) return;

      if (isSilent()) {
        loopTimer = setTimeout(recordChunk, 400);
        return;
      }

      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
        MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';

      const chunks: Blob[] = [];
      let rec: MediaRecorder;
      try {
        rec = new MediaRecorder(stream, { mimeType });
      } catch {
        if (!cancelled) loopTimer = setTimeout(recordChunk, 1000);
        return;
      }

      recorder = rec;
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      rec.onstop = () => {
        recorder = null;
        if (!cancelled) sendChunk(new Blob(chunks, { type: mimeType }));
      };
      rec.onerror = () => {
        recorder = null;
        if (!cancelled) scheduleNext();
      };
      rec.start();
      loopTimer = setTimeout(() => {
        if (rec.state === 'recording') try { rec.stop(); } catch { /* ignore */ }
      }, CHUNK_MS);
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((s) => {
        if (cancelled) { s.getTracks().forEach(t => t.stop()); return; }
        stream = s;
        setBlocked(false);
        try {
          audioCtx = new AudioContext();
          const source = audioCtx.createMediaStreamSource(s);
          analyserNode = audioCtx.createAnalyser();
          analyserNode.fftSize = 512;
          source.connect(analyserNode);
        } catch { /* no silence detection */ }
        loopTimer = setTimeout(recordChunk, 600);
      })
      .catch(() => {
        if (!cancelled) {
          setBlocked(true);
          // Fallback: Web Speech API continuous recognition
          startWebSpeechFallback();
        }
      });

    function startWebSpeechFallback() {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) return;
      let recognition: any = null;
      let restartTimer: ReturnType<typeof setTimeout> | null = null;

      function start() {
        if (cancelled) return;
        try {
          recognition = new SR();
          recognition.lang = 'en-US';
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.onresult = (e: any) => {
            if (cancelled) return;
            for (let i = e.resultIndex; i < e.results.length; i++) {
              const text = (e.results[i][0]?.transcript || '').toLowerCase().trim();
              const hit = wordsRef.current.some(w => text.includes(w.toLowerCase()));
              if (hit) { try { recognition?.stop(); } catch { } onDetectedRef.current(); return; }
            }
          };
          recognition.onerror = () => { if (!cancelled) { restartTimer = setTimeout(start, 1000); } };
          recognition.onend = () => { if (!cancelled) { restartTimer = setTimeout(start, 300); } };
          recognition.start();
        } catch { if (!cancelled) restartTimer = setTimeout(start, 1500); }
      }

      start();
      // Store cleanup on outer scope via closure
      const origCleanup = () => {
        cancelled = true;
        if (restartTimer) clearTimeout(restartTimer);
        try { recognition?.stop(); } catch { }
      };
      // Override the return cleanup
      (window as any).__memelliWakeCleanup = origCleanup;
    }

    return () => {
      cancelled = true;
      clearLoop();
      if (recorder && recorder.state === 'recording') try { recorder.stop(); } catch { }
      stream?.getTracks().forEach(t => t.stop());
      audioCtx?.close().catch(() => { });
      stream = null; recorder = null; audioCtx = null; analyserNode = null;
      // Also clean up Web Speech fallback if it was started
      const wc = (window as any).__memelliWakeCleanup;
      if (typeof wc === 'function') { wc(); delete (window as any).__memelliWakeCleanup; }
    };
  }, [enabled]);

  return { blocked };
}

/**
 * Request microphone permission explicitly (call on user button click).
 * Returns true if granted.
 */
export async function requestMicPermission(): Promise<boolean> {
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
    s.getTracks().forEach(t => t.stop());
    return true;
  } catch {
    return false;
  }
}
