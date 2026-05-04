"use client";

import { useEffect, useRef } from "react";

type LottieGlobal = {
  loadAnimation: (opts: {
    container: HTMLElement;
    renderer?: "svg" | "canvas" | "html";
    loop?: boolean;
    autoplay?: boolean;
    animationData: unknown;
  }) => { destroy: () => void };
};

let _lottiePromise: Promise<LottieGlobal | null> | null = null;
function loadLottie(): Promise<LottieGlobal | null> {
  if (_lottiePromise) return _lottiePromise;
  _lottiePromise = new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null);
    const w = window as unknown as { lottie?: LottieGlobal };
    if (w.lottie) return resolve(w.lottie);
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js";
    s.async = true;
    s.onload = () => resolve(w.lottie ?? null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return _lottiePromise;
}

export function LottieAnim({
  name,
  loop = true,
  autoplay = true,
  className,
  style,
}: {
  name: string;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let inst: { destroy: () => void } | null = null;
    let cancelled = false;
    (async () => {
      try {
        const [r, lottie] = await Promise.all([
          fetch("/api/os-node/os-lottie-" + name, { cache: "no-store" }),
          loadLottie(),
        ]);
        if (cancelled || !r.ok || !ref.current || !lottie) return;
        const j = (await r.json()) as { ok?: boolean; code?: string };
        if (!j.ok || !j.code) return;
        const m: { exports: { lottie?: unknown } } = { exports: {} };
        try {
          new Function("module", "exports", j.code)(m, m.exports);
        } catch {
          return;
        }
        const data = m.exports.lottie;
        if (!data || cancelled || !ref.current) return;
        inst = lottie.loadAnimation({
          container: ref.current,
          renderer: "svg",
          loop,
          autoplay,
          animationData: data,
        });
      } catch {}
    })();
    return () => {
      cancelled = true;
      try { inst?.destroy(); } catch {}
    };
  }, [name, loop, autoplay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: "100%", height: "100%", ...(style ?? {}) }}
      aria-hidden
    />
  );
}
