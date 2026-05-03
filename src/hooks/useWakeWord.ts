'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * useWakeWord — continuous browser Web Speech API wake-word detector.
 *
 * Chrome allows auto-start once mic permission has been granted for the origin.
 * Uses continuous=false + instant restart (more reliable than continuous=true
 * which Chrome drops after ~30s silence).
 *
 * Returns `{ blocked }`:
 *   blocked=false → listening / trying to listen
 *   blocked=true  → mic permission denied — caller should show "Enable mic" UI
 *
 * @param words       Wake phrases to listen for (matched as substrings, lowercase)
 * @param onDetected  Called once per wake-word hit
 * @param enabled     Set false to pause detection
 */
export function useWakeWord(
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

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    let cancelled = false;
    let recRef: any = null;
    let blockedPermanently = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function addTimer(ms: number, fn: () => void): void {
      if (cancelled) return;
      const t = setTimeout(() => {
        const idx = timers.indexOf(t);
        if (idx !== -1) timers.splice(idx, 1);
        fn();
      }, ms);
      timers.push(t);
    }

    function startWake() {
      if (cancelled || blockedPermanently) return;

      const rec = new SR();
      rec.lang = 'en-US';
      rec.continuous = false;     // restart on end — more reliable than continuous=true
      rec.interimResults = true;  // catch partial phrases
      rec.maxAlternatives = 1;
      recRef = rec;

      rec.onresult = (e: any) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t: string = (e.results[i][0].transcript || '').toLowerCase();
          const hit = wordsRef.current.some(w => t.includes(w.toLowerCase()));
          if (hit) {
            try { rec.stop(); } catch { /* ignore */ }
            recRef = null;
            onDetectedRef.current();
            return;
          }
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          blockedPermanently = true;
          setBlocked(true);
          return;
        }
        if (e.error === 'aborted') return;
        if (!cancelled) {
          addTimer(e.error === 'no-speech' ? 100 : 800, startWake);
        }
      };

      rec.onend = () => {
        if (!cancelled && !blockedPermanently && recRef === rec) {
          recRef = null;
          addTimer(100, startWake);
        }
      };

      try {
        rec.start();
      } catch {
        if (!cancelled) addTimer(1000, startWake);
      }
    }

    // Check permission state before starting so we can surface blocked UI immediately
    if (navigator.permissions) {
      let permResult: PermissionStatus | null = null;

      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((result) => {
          permResult = result;
          if (cancelled) return;

          if (result.state === 'denied') {
            blockedPermanently = true;
            setBlocked(true);
            return;
          }

          if (result.state === 'prompt') {
            // Not yet granted — show the enable button so the user gets a clear click target.
            // Chrome's auto-prompt in the address bar is too subtle to notice.
            setBlocked(true);
            // Still attempt to start in background — if Chrome prompts and user allows, onchange fires.
            addTimer(400, startWake);
            result.onchange = () => {
              if (result.state === 'granted') { blockedPermanently = false; setBlocked(false); if (!cancelled && !recRef) addTimer(200, startWake); }
              if (result.state === 'denied') { blockedPermanently = true; setBlocked(true); }
            };
            return;
          }

          // 'granted' — auto-start, no UI prompt needed
          setBlocked(false);
          addTimer(400, startWake);

          result.onchange = () => {
            if (result.state === 'granted') {
              blockedPermanently = false;
              setBlocked(false);
              if (!cancelled && !recRef) addTimer(200, startWake);
            }
            if (result.state === 'denied') {
              blockedPermanently = true;
              setBlocked(true);
            }
          };
        })
        .catch(() => {
          // permissions API unavailable — just try
          if (!cancelled) addTimer(500, startWake);
        });

      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
        timers.length = 0;
        if (permResult) permResult.onchange = null;
        if (recRef) {
          try { recRef.abort(); } catch { /* ignore */ }
          recRef = null;
        }
      };
    }

    // No permissions API — just try after short delay
    addTimer(500, startWake);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      timers.length = 0;
      if (recRef) {
        try { recRef.abort(); } catch { /* ignore */ }
        recRef = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { blocked };
}

/**
 * Request microphone permission explicitly (call on user button click).
 * Returns true if granted.
 */
export async function requestMicPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop()); // immediately release
    return true;
  } catch {
    return false;
  }
}
