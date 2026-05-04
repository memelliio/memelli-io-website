"use client";

// MemelliLogoReveal — hand-crafted on-page CSS keyframe reveal.
// No After Effects, no paid services, no native deps. Pure JS + CSS.
// Choreography (when speed = 1x):
//   0.0 - 0.6s : black background, white scan lines sweep horizontally
//   0.6 - 1.1s : red Memelli accent bar wipes in from left
//   1.1 - 1.7s : logo blurs+scales from 0.6 to 1.0 with opacity 0 -> 1
//   1.7 - 2.2s : tagline "Welcome to Memelli" types in below the logo
//   2.2 - 3.0s : settle — particle dust fades out, accent bar holds

import { useEffect, useMemo, useRef, useState } from "react";

const LOGO = "/memelli-logo-white.png";
const TAGLINE = "Welcome to Memelli";

export default function MemelliLogoReveal() {
  const [speed, setSpeed] = useState(1);
  const [playKey, setPlayKey] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Replay handler resets the typer + bumps the key so all CSS animations restart
  const replay = () => {
    setTypedChars(0);
    setPlayKey((k) => k + 1);
  };

  // Type-on effect for the tagline. Starts at the choreographed moment (1700ms / speed)
  useEffect(() => {
    setTypedChars(0);
    const startDelay = 1700 / speed;
    const perChar = 35 / speed;
    const t1 = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i += 1;
        setTypedChars(i);
        if (i >= TAGLINE.length) clearInterval(interval);
      }, perChar);
    }, startDelay);
    return () => clearTimeout(t1);
  }, [playKey, speed]);

  // CSS variable controlling animation speed (animation-duration is multiplied by this)
  // 1 / speed -> at 2x, durations halve.
  const styleVars = useMemo(
    () => ({
      // --speed-mul = 1 / speed
      ["--speed-mul" as any]: (1 / speed).toFixed(3),
    }),
    [speed]
  );

  return (
    <div className="memelli-reveal-wrap">
      <div
        ref={containerRef}
        key={playKey}
        className="memelli-reveal-stage"
        style={styleVars}
      >
        {/* particle scan-lines */}
        <div className="reveal-scan reveal-scan-1" />
        <div className="reveal-scan reveal-scan-2" />
        <div className="reveal-scan reveal-scan-3" />
        {/* accent red wedge */}
        <div className="reveal-accent" />
        {/* logo */}
        <div className="reveal-logo-wrap">
          <img src={LOGO} alt="Memelli" className="reveal-logo" />
        </div>
        {/* tagline */}
        <div className="reveal-tagline">
          <span className="reveal-tagline-text">
            {TAGLINE.slice(0, typedChars)}
          </span>
          <span className="reveal-caret" aria-hidden>
            |
          </span>
        </div>
        {/* drifting particles */}
        <div className="reveal-particles">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="reveal-particle"
              style={{
                left: `${(i * 53) % 100}%`,
                top: `${(i * 37) % 100}%`,
                animationDelay: `${(i % 6) * 120}ms`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="memelli-reveal-controls">
        <button type="button" onClick={replay} className="reveal-btn">
          Replay
        </button>
        <label className="reveal-speed">
          <span className="reveal-speed-label">Speed</span>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
          <span className="reveal-speed-value">{speed.toFixed(1)}x</span>
        </label>
      </div>

      <style jsx>{`
        .memelli-reveal-wrap {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .memelli-reveal-stage {
          position: relative;
          width: 100%;
          aspect-ratio: 720 / 400;
          background: #0a0a0a;
          border-radius: 14px;
          box-shadow: 0 20px 60px rgba(20, 0, 0, 0.18),
            0 4px 12px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          isolation: isolate;
        }

        /* ===== Scan lines ===== */
        .reveal-scan {
          position: absolute;
          left: -40%;
          width: 60%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.55) 50%,
            transparent 100%
          );
          animation: scan-sweep calc(720ms * var(--speed-mul, 1)) ease-out forwards;
          pointer-events: none;
          opacity: 0;
        }
        .reveal-scan-1 {
          top: 28%;
          animation-delay: calc(0ms * var(--speed-mul, 1));
        }
        .reveal-scan-2 {
          top: 50%;
          animation-delay: calc(120ms * var(--speed-mul, 1));
        }
        .reveal-scan-3 {
          top: 72%;
          animation-delay: calc(240ms * var(--speed-mul, 1));
        }
        @keyframes scan-sweep {
          0% {
            transform: translateX(0%);
            opacity: 0.9;
          }
          80% {
            opacity: 0.7;
          }
          100% {
            transform: translateX(240%);
            opacity: 0;
          }
        }

        /* ===== Accent wedge ===== */
        .reveal-accent {
          position: absolute;
          top: 50%;
          left: 0;
          width: 0%;
          height: 4px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            #c41e3a 30%,
            #c41e3a 70%,
            transparent 100%
          );
          transform: translateY(-50%) skewX(-25deg);
          animation: accent-wipe calc(500ms * var(--speed-mul, 1))
            cubic-bezier(0.7, 0, 0.3, 1) forwards;
          animation-delay: calc(600ms * var(--speed-mul, 1));
          box-shadow: 0 0 30px rgba(196, 30, 58, 0.45);
          opacity: 0;
        }
        @keyframes accent-wipe {
          0% {
            width: 0%;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            width: 86%;
            opacity: 1;
          }
        }

        /* ===== Logo ===== */
        .reveal-logo-wrap {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        .reveal-logo {
          max-width: 38%;
          max-height: 50%;
          object-fit: contain;
          filter: blur(8px);
          opacity: 0;
          transform: scale(0.6);
          animation: logo-in calc(620ms * var(--speed-mul, 1))
            cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
          animation-delay: calc(1100ms * var(--speed-mul, 1));
        }
        @keyframes logo-in {
          0% {
            opacity: 0;
            transform: scale(0.6);
            filter: blur(8px);
          }
          60% {
            opacity: 1;
            filter: blur(2px);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
          }
        }

        /* ===== Tagline ===== */
        .reveal-tagline {
          position: absolute;
          bottom: 14%;
          left: 50%;
          transform: translateX(-50%);
          color: #f5f5f5;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          font-size: clamp(14px, 1.5vw, 20px);
          font-weight: 500;
          letter-spacing: 0.04em;
          opacity: 0;
          animation: fade-in calc(400ms * var(--speed-mul, 1)) ease-out forwards;
          animation-delay: calc(1700ms * var(--speed-mul, 1));
          z-index: 3;
        }
        .reveal-tagline-text {
          color: #ffffff;
        }
        .reveal-caret {
          color: #c41e3a;
          margin-left: 2px;
          animation: caret-blink 700ms steps(1) infinite;
        }
        @keyframes caret-blink {
          50% {
            opacity: 0;
          }
        }
        @keyframes fade-in {
          to {
            opacity: 1;
          }
        }

        /* ===== Particles ===== */
        .reveal-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          animation: fade-in calc(800ms * var(--speed-mul, 1)) ease-out forwards;
          animation-delay: calc(900ms * var(--speed-mul, 1));
        }
        .reveal-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.55);
          animation: drift calc(2400ms * var(--speed-mul, 1)) linear infinite;
        }
        @keyframes drift {
          0% {
            transform: translate3d(0, 0, 0);
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          100% {
            transform: translate3d(40px, -60px, 0);
            opacity: 0;
          }
        }

        /* ===== Controls ===== */
        .memelli-reveal-controls {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }
        .reveal-btn {
          background: #c41e3a;
          color: #fff;
          border: 0;
          padding: 10px 18px;
          border-radius: 10px;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          font-weight: 500;
          font-size: 14px;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: background 120ms ease, transform 120ms ease;
        }
        .reveal-btn:hover {
          background: #a01730;
          transform: translateY(-1px);
        }
        .reveal-btn:active {
          transform: translateY(0);
        }
        .reveal-speed {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #1f1f1f;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          font-size: 13px;
        }
        .reveal-speed-label {
          color: #6b6b6b;
        }
        .reveal-speed input[type="range"] {
          width: 160px;
          accent-color: #c41e3a;
        }
        .reveal-speed-value {
          font-variant-numeric: tabular-nums;
          color: #c41e3a;
          font-weight: 500;
          min-width: 36px;
        }
      `}</style>
    </div>
  );
}
