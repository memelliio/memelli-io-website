"use client";

import { useEffect, useState } from "react";
import { Check, Terminal, X } from "lucide-react";
import { useWindowStore } from "../_lib/window-store";
import {
  CountUp,
  FadeIn,
  Stagger,
  Typewriter,
} from "@/components/anim";

type SlideId = "workspace";

type Slide = {
  id: SlideId;
  eyebrow: string;
  headline: string;
  subhead: string;
  cta: string;
  appId: string;
  accent: string;
};

const DEFAULT_SLIDES: Slide[] = [
  {
    id: "workspace",
    eyebrow: "Business OS · One Account",
    headline: "Run the whole business from one workspace.",
    subhead:
      "CRM, funding, content, calls, video — every module signs in once and shares the same data.",
    cta: "Open CRM",
    appId: "crm",
    accent: "linear-gradient(135deg, #C41E3A 0%, #18181C 100%)",
  },
];

const ROTATE_MS = 7500;
const PAPER = "#FFFFFF";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

/* Module‑scope cache for the fetched slides */
let cachedSlides: Slide[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 60 seconds

export function WelcomeBanner() {
  const open = useWindowStore((s) => s.open);
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);

  /* Fetch slides once per mount, using the 60 s cache */
  useEffect(() => {
    if (cachedSlides && Date.now() - cacheTimestamp < CACHE_TTL) {
      setSlides(cachedSlides);
      return;
    }

    fetch("/api/os-node/os-config-welcome-slides")
      .then((res) => res.text())
      .then((code) => {
        const m: { exports: any } = { exports: {} };
        // eslint-disable-next-line no-new-func
        const fn = new Function("module", "exports", code);
        fn(m, m.exports);
        const fetched: Slide[] = m.exports?.slides;
        if (Array.isArray(fetched) && fetched.length) {
          cachedSlides = fetched;
          cacheTimestamp = Date.now();
          setSlides(fetched);
        }
      })
      .catch(() => {
        // Silently ignore errors – keep default slides
      });
  }, []);

  /* Rotation logic */
  useEffect(() => {
    if (!visible || leaving || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [visible, leaving, paused, slides]);

  const dismiss = (openCta?: string) => {
    setLeaving(true);
    window.setTimeout(() => {
      setVisible(false);
      if (openCta) open(openCta);
    }, 320);
  };

  if (!visible) return null;
  const slide = slides[index];

  return (
    <div
      className="memelli-welcome-banner-root"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        position: "fixed",
        left: "50%",
        top: "50%",
        width: "clamp(640px, 60vw, 980px)",
        height: "clamp(420px, 56vh, 600px)",
        transform: `translate(-50%, -50%) ${leaving ? "scale(0.96)" : "scale(1)"}`,
        opacity: leaving ? 0 : 1,
        zIndex: 9000,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow:
          "0 40px 80px -20px rgba(15,17,21,0.45), 0 12px 32px -8px rgba(196,30,58,0.25), inset 0 0 0 1px rgba(255,255,255,0.08)",
        background: slide.accent,
        color: PAPER,
        transition: "opacity 320ms ease, transform 320ms ease",
        willChange: "transform, opacity",
        display: "grid",
        gridTemplateColumns: "1.05fr 1fr",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
.memelli-welcome-banner { display: flex; flex-direction: row; align-items: center; gap: 16px; }
.memelli-welcome-banner > .memelli-banner-text { flex: 1; min-width: 0; }
@media (max-width: 480px) {
  .memelli-welcome-banner { flex-direction: column; align-items: flex-start; gap: 10px; }
}
.memelli-welcome-banner-root {
  /* Mobile scaling – roughly 50% smaller */
}
@media (max-width: 900px) {
  .memelli-welcome-banner-root {
    zoom: 0.5;
  }
}
`,
        }}
      />
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.14) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(196,30,58,0.16) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      <button
        type="button"
        onClick={() => dismiss()}
        aria-label="Dismiss"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "rgba(255,255,255,0.10)",
          color: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(255,255,255,0.14)",
          backdropFilter: "blur(8px)",
          zIndex: 3,
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
        }}
      >
        <X size={15} strokeWidth={2} />
      </button>

      {/* LEFT — pitch text + CTA */}
      <div
        className="memelli-welcome-banner"
        style={{
          position: "relative",
          padding: "36px 32px",
          display: "flex",
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        <div className="memelli-banner-text">
          <FadeIn delay={80}>
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
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.95)",
                fontFamily: MONO,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 9999,
                  background: "#10B981",
                  boxShadow: "0 0 8px #10B981",
                }}
              />
              <span>{slide.eyebrow}</span>
            </div>
          </FadeIn>

          <FadeIn delay={180} distance={8}>
            <h2
              style={{
                fontSize: "clamp(24px, 2.4vw, 36px)",
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              {slide.headline}
            </h2>
          </FadeIn>

          <FadeIn delay={320}>
            <p
              style={{
                fontSize: 14.5,
                lineHeight: 1.55,
                maxWidth: 360,
                color: "rgba(255,255,255,0.85)",
                margin: 0,
              }}
            >
              {slide.subhead}
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={520}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 6,
            }}
          >
            <button
              type="button"
              onClick={() => dismiss(slide.appId)}
              style={{
                padding: "12px 22px",
                borderRadius: 9999,
                background: PAPER,
                color: "#0F1115",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.02em",
                border: 0,
                cursor: "pointer",
                boxShadow: "0 6px 20px -4px rgba(0,0,0,0.35)",
                fontFamily: "inherit",
              }}
            >
              {slide.cta}
            </button>

            <div style={{ display: "flex", gap: 6 }}>
              {slides.map((s, i) => (
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
                      i === index ? PAPER : "rgba(255,255,255,0.35)",
                    border: 0,
                    cursor: "pointer",
                    transition: "width 200ms ease, background 200ms ease",
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* RIGHT — per-slide animated visual. Keyed on slide.id so the
          primitives remount + replay their entrance on each rotation. */}
      <div
        key={slide.id}
        style={{
          position: "relative",
          padding: "32px 32px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 14,
          zIndex: 1,
          borderLeft: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {slide.id === "workspace" && <WorkspaceVisual />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Per-slide visuals
// ─────────────────────────────────────────────────────────────────────

function FundingVisual() {
  return (
    <>
      <FadeIn delay={120}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.6)",
            fontFamily: MONO,
          }}
        >
          Up to
        </div>
      </FadeIn>
      <div
        style={{
          fontSize: "clamp(56px, 8vw, 96px)",
          fontWeight: 900,
          letterSpacing: "-0.06em",
          lineHeight: 0.9,
          color: PAPER,
          fontVariantNumeric: "tabular-nums",
          textShadow: "0 8px 30px rgba(255,255,255,0.18)",
        }}
      >
        $
        <CountUp to={500} duration={1500} delay={250} />
        K
      </div>
      <FadeIn delay={1100}>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.45,
            maxWidth: 320,
          }}
        >
          Personal + business funding qualified, back-end fees only.
        </div>
      </FadeIn>

      <div
        style={{
          marginTop: 8,
          background: "rgba(0,0,0,0.18)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10,
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          fontFamily: MONO,
          fontSize: 11,
        }}
      >
        <FadeIn delay={1300}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
              paddingBottom: 6,
              borderBottom: "1px solid rgba(255,255,255,0.10)",
              marginBottom: 4,
            }}
          >
            Lender match
          </div>
        </FadeIn>
        {[
          { name: "business loc", amount: "$250K", delay: 1500 },
          { name: "term loan", amount: "$180K", delay: 1700 },
          { name: "personal cards", amount: "$45K", delay: 1900 },
          { name: "grant match", amount: "$25K", delay: 2100 },
        ].map((r) => (
          <FadeIn key={r.name} delay={r.delay} distance={4}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: PAPER,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  letterSpacing: "0.04em",
                }}
              >
                <Check size={10} strokeWidth={3} color="#10B981" />
                {r.name}
              </span>
              <span style={{ fontWeight: 700 }}>{r.amount}</span>
            </div>
          </FadeIn>
        ))}
      </div>
    </>
  );
}

function CreditVisual() {
  const baseDelay = 250;
  const lineGap = 320;
  return (
    <>
      <FadeIn delay={120}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingBottom: 8,
            borderBottom: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <Terminal size={13} color="var(--brand-color, #C41E3A)" />
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: PAPER,
            }}
          >
            dispute-runner.live
          </span>
          <span
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 10,
              color: "#10B981",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#10B981",
                boxShadow: "0 0 8px #10B981",
              }}
            />
            running
          </span>
        </div>
      </FadeIn>

      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          lineHeight: 1.55,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <CreditLine
          ts="14:02:11"
          tag="PULL"
          tagColor="#6366F1"
          text="Experian report v.2026-04-30"
          delay={baseDelay + 0 * lineGap}
        />
        <CreditLine
          ts="14:02:13"
          tag="FLAG"
          tagColor="var(--brand-color, #C41E3A)"
          text="3 collections, 1 late, 1 charge-off"
          delay={baseDelay + 1 * lineGap}
        />
        <CreditLine
          ts="14:02:14"
          tag="DRAFT"
          tagColor="#F59E0B"
          text="5 dispute letters generated"
          delay={baseDelay + 2 * lineGap}
        />
        <CreditLine
          ts="14:02:18"
          tag="SEND"
          tagColor="#6366F1"
          text="certified mail · all three bureaus"
          delay={baseDelay + 3 * lineGap}
        />
        <CreditLine
          ts="14:02:19"
          tag="OK"
          tagColor="#10B981"
          text="tracking active · 30-day window"
          delay={baseDelay + 4 * lineGap}
        />
      </div>

      <FadeIn delay={baseDelay + 5 * lineGap}>
        <div
          style={{
            marginTop: "auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.10)",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <RepairChip
            label="Removed"
            value={<CountUp to={3} duration={1100} delay={baseDelay + 5 * lineGap + 200} />}
            tone="#10B981"
          />
          <RepairChip
            label="Letters"
            value={<CountUp to={12} duration={1200} delay={baseDelay + 5 * lineGap + 320} />}
            tone="#6366F1"
          />
          <RepairChip
            label="Recovered"
            value={
              <>
                +
                <CountUp to={47} duration={1300} delay={baseDelay + 5 * lineGap + 440} />
              </>
            }
            tone="var(--brand-color, #C41E3A)"
          />
        </div>
      </FadeIn>
    </>
  );
}

function CreditLine({
  ts,
  tag,
  tagColor,
  text,
  delay,
}: {
  ts: string;
  tag: string;
  tagColor: string;
  text: string;
  delay: number;
}) {
  return (
    <FadeIn delay={delay} distance={4} duration={300}>
      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
        <span style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>{ts}</span>
        <span
          style={{
            background: `${tagColor}22`,
            color: tagColor,
            border: `1px solid ${tagColor}55`,
            padding: "1px 6px",
            borderRadius: 3,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {tag}
        </span>
        <span style={{ color: PAPER, flex: 1 }}>
          <Typewriter text={text} delay={delay + 140} speed={16} />
        </span>
      </div>
    </FadeIn>
  );
}

function RepairChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 8,
        padding: "8px 10px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 3,
          height: "100%",
          background: tone,
        }}
      />
      <div
        style={{
          fontSize: 8.5,
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: PAPER,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function WorkspaceVisual() {
  const tiles = [
    { label: "CRM", n: 28 },
    { label: "Funding", n: 7 },
    { label: "Credit", n: 3 },
    { label: "DocuVault", n: 12 },
    { label: "Phone", n: 4 },
    { label: "Storefront", n: 9 },
  ];
  return (
    <>
      <FadeIn delay={120}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.6)",
            fontFamily: MONO,
          }}
        >
          One workspace · 50+ modules
        </div>
      </FadeIn>
      <FadeIn delay={220}>
        <div
          style={{
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            color: PAPER,
          }}
        >
          <CountUp to={50} duration={1200} delay={250} />
          <span style={{ marginLeft: 4, fontSize: "0.55em", fontWeight: 700 }}>
            modules
          </span>
        </div>
      </FadeIn>
      <FadeIn delay={400}>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.45,
            maxWidth: 320,
          }}
        >
          One sign-in unlocks every surface. Live state across CRM, funding,
          credit, content — they all share the same data.
        </div>
      </FadeIn>

      <div
        style={{
          marginTop: 8,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
        }}
      >
        <Stagger baseDelay={650} gap={70}>
          {tiles.map((t) => (
            <div
              key={t.label}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 8,
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.55)",
                  fontFamily: MONO,
                }}
              >
                {t.label}
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: PAPER,
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {t.n}
              </span>
            </div>
          ))}
        </Stagger>
      </div>
    </>
  );
}