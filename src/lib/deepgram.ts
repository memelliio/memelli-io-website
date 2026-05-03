/**
 * deepgram.ts — clean Deepgram client module
 *
 * Provides:
 *   tts(text, voice?)  → plays audio, returns the HTMLAudioElement
 *   stt(audioBlob)     → returns transcript string
 *   stopSpeaking()     → stops current playback immediately
 *   isSpeaking()       → true while audio is playing
 *
 * All browser APIs are guarded with typeof window !== 'undefined'.
 */

// ── Global audio player (single instance prevents overlap) ──────────────────

let _gAudio: HTMLAudioElement | null = null;

export function stopSpeaking(): void {
  if (_gAudio) {
    _gAudio.onended = null;
    _gAudio.onerror = null;
    try { _gAudio.pause(); _gAudio.src = ''; } catch { /* ignore */ }
    _gAudio = null;
  }
  if (typeof window !== 'undefined') {
    window.speechSynthesis?.cancel();
  }
}

export function isSpeaking(): boolean {
  return _gAudio !== null && !_gAudio.paused;
}

// ── Browser speech synthesis fallback ───────────────────────────────────────

function speakBrowser(text: string, onEnd?: () => void): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();

  const doSpeak = () => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    utter.lang = 'en-US';
    utter.onend = () => onEnd?.();
    utter.onerror = () => onEnd?.();
    if (synth.paused) synth.resume();
    synth.speak(utter);
  };

  // Chrome requires a tick gap between cancel() and speak()
  setTimeout(doSpeak, 50);
}

// ── TTS via Next.js proxy ────────────────────────────────────────────────────

const DEFAULT_VOICE = 'aura-2-aurora-en';

/**
 * Speak `text` via Deepgram TTS (streaming when MediaSource supports audio/mpeg,
 * otherwise blob, otherwise browser speechSynthesis fallback).
 *
 * Returns the HTMLAudioElement that is playing.
 * Stops any previously playing audio before starting.
 */
export function tts(
  text: string,
  voice?: string,
  onEnd?: () => void,
): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!text) { onEnd?.(); return null; }

  // Stop previous playback
  stopSpeaking();

  const voiceId = voice || DEFAULT_VOICE;

  // Guard: onEnd fires exactly once
  let fired = false;
  const fireOnce = () => { if (!fired) { fired = true; onEnd?.(); } };

  // ── Blob fallback via /api/voice/tts ──────────────────────────────────────
  function speakViaBlob(blobText: string, blobVoice: string): void {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);

    fetch('/api/voice/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ text: blobText, voice: blobVoice }),
    })
      .finally(() => clearTimeout(timer))
      .then(async (res) => {
        if (!res.ok) { speakBrowser(blobText, fireOnce); return; }
        return res.blob();
      })
      .then((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        _gAudio = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (_gAudio === audio) _gAudio = null;
          fireOnce();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          if (_gAudio === audio) _gAudio = null;
          speakBrowser(blobText, fireOnce);
        };

        audio.play().catch(() => {
          URL.revokeObjectURL(url);
          if (_gAudio === audio) _gAudio = null;
          speakBrowser(blobText, fireOnce);
        });
      })
      .catch(() => speakBrowser(blobText, fireOnce));
  }

  // ── Streaming TTS via MediaSource API ─────────────────────────────────────
  function speakStreaming(streamText: string, streamVoice: string): void {
    const ms = new MediaSource();
    const url = URL.createObjectURL(ms);
    const audio = new Audio(url);
    _gAudio = audio;

    ms.addEventListener('sourceopen', async () => {
      let sb: SourceBuffer;
      try {
        sb = ms.addSourceBuffer('audio/mpeg');
      } catch {
        URL.revokeObjectURL(url);
        if (_gAudio === audio) _gAudio = null;
        speakViaBlob(streamText, streamVoice);
        return;
      }

      const queue: Uint8Array<ArrayBuffer>[] = [];
      let streamEnded = false;
      let sbBusy = false;

      const flush = () => {
        if (sbBusy || !queue.length) {
          if (!sbBusy && streamEnded && !queue.length) {
            try { ms.endOfStream(); } catch { /* ignore */ }
          }
          return;
        }
        sbBusy = true;
        try { sb.appendBuffer(queue.shift()!); } catch {
          sbBusy = false;
          flush();
        }
      };

      sb.addEventListener('updateend', () => { sbBusy = false; flush(); });

      audio.play().catch(() => { /* may fail before data arrives; ok */ });

      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (_gAudio === audio) _gAudio = null;
        fireOnce();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (_gAudio === audio) _gAudio = null;
        fireOnce();
      };

      try {
        const res = await fetch('/api/voice/stream-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: streamText, voice: streamVoice }),
        });

        if (!res.ok || !res.body) {
          URL.revokeObjectURL(url);
          if (_gAudio === audio) _gAudio = null;
          speakViaBlob(streamText, streamVoice);
          return;
        }

        const reader = res.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) { streamEnded = true; flush(); break; }
          queue.push(value);
          flush();
        }
      } catch {
        URL.revokeObjectURL(url);
        if (_gAudio === audio) _gAudio = null;
        speakViaBlob(streamText, streamVoice);
      }
    }, { once: true });
  }

  if (
    typeof MediaSource !== 'undefined' &&
    MediaSource.isTypeSupported('audio/mpeg')
  ) {
    speakStreaming(text, voiceId);
  } else {
    speakViaBlob(text, voiceId);
  }

  // Return the audio element reference (may be set asynchronously for blob path)
  return _gAudio;
}

// ── STT via Next.js proxy ────────────────────────────────────────────────────

/**
 * Send `audioBlob` to the Next.js /api/voice/stt proxy.
 * Returns the transcript string (empty string on failure).
 * No auth token required — the route is public.
 */
export async function stt(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  try {
    const res = await fetch('/api/voice/stt', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) return '';

    const json = (await res.json()) as { text?: string; confidence?: number };
    return json.text ?? '';
  } catch {
    return '';
  }
}
