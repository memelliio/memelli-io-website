"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useWindowStore } from "../_lib/window-store";

type Slide = {
  id: string;
  eyebrow: string;
  headline: string;
  subhead: string;
  cta: string;
  appId: string;
  accent: string;
};

const SLIDES: Slide[] = [
  {
    id: "funding",
    eyebrow: "0% Funding",
    headline: "Pre-qualify for personal or business funding.",
    subhead:
      "Find out what you qualify for in under 60 seconds. No hard pull, no cost.",
    cta: "Pre-Qualify Now",
    appId: "pre-qualification",
    accent: "linear-gradient(135deg, #C41E3A 0%, #A8182F 100%)",
  },
  {
    id: "credit",
    eyebrow: "Bad Credit",
    headline: "We have software for that.",
    subhead:
      "Monitor reports, dispute errors, track progress — all in one place. Get help today.",
    cta: "Open Credit Repair",
    appId: "credit-repair",
    accent: "linear-gradient(135deg, #18181C 0%, #0F1115 100%)",
  },
  {
    id: "workspace",
    eyebrow: "Business OS",
    headline: "Need a business workspace? Sign up.",
    subhead: "CRM, funding, content, calls, video — one OS for everything.",
    cta: "Open CRM",
    appId: "crm",
    accent: "linear-gradient(135deg, #C41E3A 0%, #18181C 100%)",
  },
];

const ROTATE_MS = 6000;
const TYPE_PER_CHAR_MS = 60;
const TYPE_LINGER_MS = 600;

export function WelcomeBanner() {
  const open = useWindowStore((s) => s.open);
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [typed, setTyped] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [size, setSize] = useState({ w: 720, h: 460 });

  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = Math.max(560, Math.min(900, Math.floor(vw * 0.5)));
      const h = Math.max(380, Math.min(620, Math.floor(vh * 0.5)));
      setSize({ w, h });
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  useEffect(() => {
    if (!visible || leaving || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [visible, leaving, paused]);

  useEffect(() => {
    const target = SLIDES[index].eyebrow;
    setTyped("");
    setCursorVisible(true);
    const timeouts: number[] = [];
    for (let i = 1; i <= target.length; i++) {
      timeouts.push(
        window.setTimeout(
          () => setTyped(target.slice(0, i)),
          i * TYPE_PER_CHAR_MS,
        ),
      );
    }
    timeouts.push(
      window.setTimeout(
        () => setCursorVisible(false),
        target.length * TYPE_PER_CHAR_MS + TYPE_LINGER_MS,
      ),
    );
    return () => timeouts.forEach((t) => window.clearTimeout(t));
  }, [index]);

  const dismiss = (openCta?: string) => {
    setLeaving(true);
    window.setTimeout(() => {
      setVisible(false);
      if (openCta) open(openCta);
    }, 320);
  };

  if (!visible) return null;
  const slide = SLIDES[index];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        position: "fixed",
        left: "50%",
        top: "50%",
        width: size.w,
        height: size.h,
        transform: `translate(-50%, -50%) ${leaving ? "scale(0.96)" : "scale(1)"}`,
        opacity: leaving ? 0 : 1,
        zIndex: 9000,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow:
          "0 40px 80px -20px rgba(15,17,21,0.45), 0 12px 32px -8px rgba(196,30,58,0.25), inset 0 0 0 1px rgba(255,255,255,0.08)",
        background: slide.accent,
        color: "white",
        transition: "opacity 320ms ease, transform 320ms ease",
        willChange: "transform, opacity",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.18) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(196,30,58,0.18) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      <button
        type="button"
        onClick={() => dismiss()}
        aria-label="Dismiss"
        className="grid place-items-center transition"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          zIndex: 2,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.18)";
          e.currentTarget.style.color = "white";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
          e.currentTarget.style.color = "rgba(255,255,255,0.85)";
        }}
      >
        <X size={15} strokeWidth={2} />
      </button>

      <div
        style={{
          position: "relative",
          height: "100%",
          padding: 36,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 18,
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 12px",
            borderRadius: 9999,
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
            alignSelf: "flex-start",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.95)",
          }}
        >
          <span>{typed || " "}</span>
          {cursorVisible && (
            <span
              style={{
                width: 8,
                height: 14,
                background: "white",
                animation: "blink 1s steps(1,end) infinite",
              }}
            />
          )}
        </div>

        <h2
          style={{
            fontSize: Math.max(22, Math.min(34, size.w / 22)),
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            margin: 0,
            maxWidth: "85%",
          }}
        >
          {slide.headline}
        </h2>

        <p
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            maxWidth: "70%",
            color: "rgba(255,255,255,0.82)",
            margin: 0,
          }}
        >
          {slide.subhead}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <button
            type="button"
            onClick={() => dismiss(slide.appId)}
            style={{
              padding: "11px 22px",
              borderRadius: 9999,
              background: "white",
              color: "#0F1115",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.01em",
              border: 0,
              cursor: "pointer",
              boxShadow: "0 6px 20px -4px rgba(0,0,0,0.35)",
            }}
          >
            {slide.cta}
          </button>

          {/* dot indicators */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginLeft: 8,
            }}
          >
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIndex(i)}
                style={{
                  width: i === index ? 22 : 6,
                  height: 6,
                  borderRadius: 9999,
                  background:
                    i === index ? "white" : "rgba(255,255,255,0.35)",
                  border: 0,
                  cursor: "pointer",
                  transition: "width 200ms ease, background 200ms ease",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }`}</style>
    </div>
  );
}
