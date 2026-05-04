"use client";

/**
 * LogoReveal — pure CSS/JS Memelli logo reveal animation.
 *
 * No paid services, no Lottie, no After Effects. Just CSS keyframes
 * driven by a `playKey` and a CSS `--reveal-speed` var so the operator
 * can replay + adjust speed.
 *
 * Editorial Memelli skin: white card, red `#C41E3A` accent, soft shadow.
 *
 * Used on /pro-partner as the hero proof: "every Pro Partner gets a
 * custom-branded reveal like this rendered with their client's logo."
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const MIN_SPEED = 0.5;
const MAX_SPEED = 2.0;

export default function LogoReveal() {
  const [playKey, setPlayKey] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Replay by bumping the key — re-mounts the inner `.reveal-stage`,
  // which re-fires the CSS animation from frame 0.
  const replay = useCallback(() => {
    setPlayKey((k) => k + 1);
  }, []);

  // Autoplay once on mount — feels alive when the page loads.
  useEffect(() => {
    replay();
  }, [replay]);

  // Speed is just a CSS custom prop; keyframe timings reference it.
  // 1.0 = normal, 0.5 = half speed (longer), 2.0 = double speed.
  const durationMultiplier = 1 / speed;

  return (
    <div className="memelli-card overflow-hidden">
      <div
        ref={stageRef}
        key={playKey}
        className="reveal-stage relative w-full"
        style={{
          aspectRatio: "720 / 400",
          background:
            "radial-gradient(ellipse at center, #ffffff 0%, #f8f9fb 60%, #eef0f5 100%)",
          ["--reveal-mult" as string]: durationMultiplier.toString(),
        }}
      >
        {/* Red sweep — left-to-right wash that reveals the mark */}
        <div className="reveal-sweep" aria-hidden="true" />

        {/* Logo — fades + scales in after the sweep */}
        <div className="reveal-logo">
          <Image
            src="/memelli-logo.png"
            alt="Memelli"
            width={240}
            height={201}
            priority
            unoptimized
          />
        </div>

        {/* Wordmark — letters drift up + fade in */}
        <div className="reveal-word">
          <span style={{ ["--i" as string]: 0 }}>M</span>
          <span style={{ ["--i" as string]: 1 }}>E</span>
          <span style={{ ["--i" as string]: 2 }}>M</span>
          <span style={{ ["--i" as string]: 3 }}>E</span>
          <span style={{ ["--i" as string]: 4 }}>L</span>
          <span style={{ ["--i" as string]: 5 }}>L</span>
          <span style={{ ["--i" as string]: 6 }}>I</span>
        </div>

        {/* Underscore tick — final accent */}
        <div className="reveal-tick" aria-hidden="true" />
      </div>

      {/* Controls strip */}
      <div className="flex items-center justify-between gap-4 border-t border-[hsl(var(--border))] bg-white px-5 py-3">
        <button
          type="button"
          onClick={replay}
          className="memelli-pill is-active"
          style={{ cursor: "pointer" }}
        >
          Replay reveal
        </button>
        <label className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
          <span>Speed</span>
          <input
            type="range"
            min={MIN_SPEED}
            max={MAX_SPEED}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="accent-[hsl(var(--primary))]"
            style={{ width: 140 }}
          />
          <span className="font-semibold tabular-nums text-[hsl(var(--foreground))]">
            {speed.toFixed(1)}x
          </span>
        </label>
      </div>

      <style jsx>{`
        .reveal-stage {
          /* every keyframe duration multiplies by --reveal-mult so the slider
             actually changes timing without remount */
          --base-mult: var(--reveal-mult, 1);
        }

        .reveal-sweep {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            115deg,
            transparent 0%,
            transparent 35%,
            #c41e3a 50%,
            transparent 65%,
            transparent 100%
          );
          background-size: 250% 100%;
          background-position: -100% 0;
          animation: sweep calc(1100ms * var(--base-mult)) cubic-bezier(0.65, 0, 0.35, 1)
            forwards;
          mix-blend-mode: multiply;
          opacity: 0.9;
        }

        @keyframes sweep {
          0% {
            background-position: -100% 0;
            opacity: 0;
          }
          25% {
            opacity: 0.9;
          }
          70% {
            background-position: 100% 0;
            opacity: 0.9;
          }
          100% {
            background-position: 200% 0;
            opacity: 0;
          }
        }

        .reveal-logo {
          position: absolute;
          left: 50%;
          top: 38%;
          transform: translate(-50%, -50%) scale(0.6);
          opacity: 0;
          animation: logoIn calc(900ms * var(--base-mult))
            cubic-bezier(0.34, 1.4, 0.64, 1) calc(700ms * var(--base-mult))
            forwards;
        }

        @keyframes logoIn {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.6);
            filter: blur(6px);
          }
          60% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.08);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
            filter: blur(0);
          }
        }

        .reveal-word {
          position: absolute;
          left: 50%;
          bottom: 22%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.18em;
          font-family: var(--font-inter), Inter, system-ui, sans-serif;
          font-weight: 800;
          font-size: clamp(28px, 5vw, 44px);
          letter-spacing: 0.18em;
          color: #0f1115;
        }

        .reveal-word span {
          opacity: 0;
          transform: translateY(14px);
          animation: letterIn calc(420ms * var(--base-mult))
            cubic-bezier(0.22, 1, 0.36, 1)
            calc((1300ms + (var(--i) * 70ms)) * var(--base-mult)) forwards;
        }

        @keyframes letterIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .reveal-tick {
          position: absolute;
          left: 50%;
          bottom: 18%;
          transform: translateX(-50%) scaleX(0);
          transform-origin: center;
          width: 64px;
          height: 3px;
          background: #c41e3a;
          border-radius: 2px;
          animation: tickIn calc(380ms * var(--base-mult)) cubic-bezier(0.22, 1, 0.36, 1)
            calc(2000ms * var(--base-mult)) forwards;
        }

        @keyframes tickIn {
          to {
            transform: translateX(-50%) scaleX(1);
          }
        }
      `}</style>
    </div>
  );
}
