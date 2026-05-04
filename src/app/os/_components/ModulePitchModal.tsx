"use client";

import { useEffect } from "react";
import { ArrowRight, Check, Terminal, FileText, X } from "lucide-react";
import { useWindowStore } from "../_lib/window-store";
import { type ModulePitch } from "../_lib/module-pitches";
import {
  BlurIn,
  CountUp,
  FadeIn,
  Reveal,
  Stagger,
  Typewriter,
  type RevealVariant,
} from "@/components/anim";
import { useIsMobileSurface } from "../_lib/viewport-preview-store";

const RED = "#C41E3A";
const RED_2 = "#A8182F";
const INK = "#0B0B0F";
const INK_2 = "#1A1A1F";
const PAPER = "#FFFFFF";
const SOFT = "#FAFAFA";
const LINE = "#E5E7EB";
const MUTED = "#6B7280";
const FONT = "Inter, system-ui, -apple-system, sans-serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

const SHADOW =
  "0 30px 80px -20px rgba(11,11,15,0.45), 0 8px 24px -10px rgba(11,11,15,0.18)";

const LAYOUT_REVEAL: Record<ModulePitch["layout"], RevealVariant> = {
  "split-red": "dissolve",
  "money-tower": "scale-in",
  "terminal-card": "slide-right",
  "tri-stack": "fan-up",
};

// Logo reset — used in every layout to keep aspect ratio
const LOGO_STYLE: React.CSSProperties = {
  height: 48,
  width: "auto",
  maxWidth: 180,
  objectFit: "contain",
  display: "block",
};

export function ModulePitchModal({
  pitch,
  onClose,
}: {
  pitch: ModulePitch;
  onClose: () => void;
}) {
  const openWindow = useWindowStore((s) => s.open);
  const narrow = useIsMobileSurface();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fireSignInTab = () => {
    const btn = document.querySelector(
      "[aria-label='Sign In']",
    ) as HTMLButtonElement | null;
    if (btn) btn.click();
  };

  const handleAction = (action: ModulePitch["primaryCta"]["action"]) => {
    onClose();
    if (action === "sign-in") {
      window.setTimeout(fireSignInTab, 120);
    } else if (action === "sign-up") {
      openWindow("signup");
    } else if (action === "open-app") {
      openWindow(pitch.appId);
    }
  };

  // Lock background scroll while modal is open so iOS doesn't slide the
  // page under the backdrop when the user taps inside the dialog.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const body = document.body;
    const prev = {
      overflow: body.style.overflow,
      touchAction: body.style.touchAction,
      overscroll: body.style.overscrollBehavior,
    };
    body.style.overflow = "hidden";
    body.style.touchAction = "none";
    body.style.overscrollBehavior = "none";
    return () => {
      body.style.overflow = prev.overflow;
      body.style.touchAction = prev.touchAction;
      body.style.overscrollBehavior = prev.overscroll;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={pitch.headline}
      onClick={onClose}
      style={{
        // Fixed so it covers the actual device viewport on real phones,
        // not just the nearest positioned ancestor (which is the OS shell).
        position: "fixed",
        inset: 0,
        background: "rgba(11,11,15,0.62)",
        backdropFilter: "blur(6px)",
        zIndex: 999999,
        display: "grid",
        placeItems: "center",
        padding: narrow ? 8 : 24,
        fontFamily: FONT,
        overscrollBehavior: "contain",
      }}
    >
      <Reveal
        variant={LAYOUT_REVEAL[pitch.layout]}
        duration={620}
        style={{
          // Mobile overlay law: 75vw, max 360px, never edge-to-edge.
          width: narrow ? "min(75vw, 360px)" : "min(95vw, 1180px)",
          minWidth: narrow ? undefined : "60vw",
          minHeight: narrow ? undefined : "60vh",
          // dvh respects iOS Safari URL bar so the modal isn't clipped.
          maxHeight: narrow ? "min(80dvh, 640px)" : "90vh",
          overflow: narrow ? "auto" : undefined,
          WebkitOverflowScrolling: "touch",
          position: "relative",
        }}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 30,
              height: 30,
              border: `1px solid ${LINE}`,
              background: PAPER,
              borderRadius: 8,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              color: INK,
              zIndex: 5,
            }}
          >
            <X size={14} strokeWidth={2.2} />
          </button>

          {pitch.layout === "split-red" && (
            <SplitRedLayout pitch={pitch} onAction={handleAction} narrow={narrow} />
          )}
          {pitch.layout === "money-tower" && (
            <MoneyTowerLayout pitch={pitch} onAction={handleAction} narrow={narrow} />
          )}
          {pitch.layout === "terminal-card" && (
            <TerminalCardLayout pitch={pitch} onAction={handleAction} narrow={narrow} />
          )}
          {pitch.layout === "tri-stack" && (
            <TriStackLayout pitch={pitch} onAction={handleAction} narrow={narrow} />
          )}
        </div>
      </Reveal>
    </div>
  );
}

type LayoutProps = {
  pitch: ModulePitch;
  onAction: (action: ModulePitch["primaryCta"]["action"]) => void;
  narrow: boolean;
};

// ─────────────────────────────────────────────────────────────────────
// LAYOUT 1 — split-red — dissolve entrance, CountUp on hero, stagger bullets
// ─────────────────────────────────────────────────────────────────────
function SplitRedLayout({ pitch, onAction, narrow }: LayoutProps) {
  // For PreQual the heroValue is "60s" — we animate 0→60 with "s" suffix.
  const isCountable = /^\d+/.test(pitch.heroValue);
  const targetN = isCountable ? parseInt(pitch.heroValue, 10) : 0;
  const heroSuffix = isCountable
    ? pitch.heroValue.replace(/^\d+/, "")
    : "";

  return (
    <div
      style={{
        background: PAPER,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: SHADOW,
        display: "grid",
        gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
        height: narrow ? "auto" : "100%",
        minHeight: narrow ? undefined : "60vh",
      }}
    >
      <div
        style={{
          padding: narrow ? "22px 20px 18px" : "40px 36px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          color: INK,
        }}
      >
        <FadeIn delay={120}>
          <Eyebrow color={RED}>{pitch.eyebrow}</Eyebrow>
        </FadeIn>
        <BlurIn delay={180}>
          <Headline>{pitch.headline}</Headline>
        </BlurIn>
        <FadeIn delay={320}>
          <Subhead>{pitch.subhead}</Subhead>
        </FadeIn>
        <div style={{ marginTop: 4 }}>
          <Stagger baseDelay={460} gap={70}>
            {pitch.bullets.map((b, i) => (
              <BulletItem key={i}>{b}</BulletItem>
            ))}
          </Stagger>
        </div>
        <FadeIn delay={460 + pitch.bullets.length * 70 + 80}>
          <CtaRow pitch={pitch} onAction={onAction} />
        </FadeIn>
      </div>

      <div
        style={{
          background: `linear-gradient(135deg, ${RED} 0%, ${RED_2} 100%)`,
          color: PAPER,
          padding: narrow ? "20px 20px 22px" : "32px 32px 28px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: narrow ? 14 : 18,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <DiagonalTexture />

        {/* Logo + scan label */}
        <FadeIn delay={80}>
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <img
              src="/memelli-logo-white.png"
              alt="Memelli"
              style={{ ...LOGO_STYLE, height: 44, maxWidth: 150 }}
            />
            <span
              style={{
                fontFamily:
                  "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.7)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 9999,
                  background: "#10B981",
                  boxShadow: "0 0 8px #10B981",
                }}
              />
              live scan
            </span>
          </div>
        </FadeIn>

        {/* Circular progress ring + 60s counter inside */}
        <FadeIn delay={250}>
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 0",
            }}
          >
            <ProgressRing seconds={isCountable ? targetN : 60} narrow={narrow} />
          </div>
        </FadeIn>

        {/* Live result ticker */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            background: "rgba(0,0,0,0.18)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 10,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontFamily:
              "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
            fontSize: 11,
          }}
        >
          <FadeIn delay={400}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
                paddingBottom: 6,
                borderBottom: "1px solid rgba(255,255,255,0.10)",
                marginBottom: 4,
              }}
            >
              <span>Pre-Qual Scan</span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>soft pull</span>
            </div>
          </FadeIn>
          {[
            { name: "Personal Cards", amount: "$50K", delay: 700 },
            { name: "Business LOC", amount: "$250K", delay: 1000 },
            { name: "Auto Loan", amount: "$35K", delay: 1300 },
            { name: "Personal Loan", amount: "$40K", delay: 1600 },
          ].map((row) => (
            <FadeIn key={row.name} delay={row.delay} distance={4}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  color: PAPER,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Check size={11} strokeWidth={3} color="#10B981" />
                  <span style={{ letterSpacing: "0.04em" }}>
                    {row.name.toLowerCase()}
                  </span>
                </span>
                <span style={{ fontWeight: 700, color: PAPER }}>
                  {row.amount}
                </span>
              </div>
            </FadeIn>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            position: "relative",
            zIndex: 1,
          }}
        >
          {pitch.tags.map((t, i) => (
            <FadeIn
              key={t}
              delay={1900 + i * 80}
              distance={6}
              style={{ display: "inline-flex" }}
            >
              <TagPillOnDark>{t}</TagPillOnDark>
            </FadeIn>
          ))}
        </div>
      </div>
    </div>
  );
}

// PreQual progress ring — animated SVG arc + numeric counter inside
function ProgressRing({ seconds, narrow = false }: { seconds: number; narrow?: boolean }) {
  const size = narrow ? 124 : 168;
  const stroke = narrow ? 7 : 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={PAPER}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: "stroke-dashoffset 1600ms cubic-bezier(0.16,1,0.3,1)",
            animation: "memelli-ring-fill 1700ms cubic-bezier(0.16,1,0.3,1) 250ms forwards",
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: narrow ? 40 : 56,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              color: PAPER,
            }}
          >
            <CountUp to={seconds} duration={1600} delay={250} />
            <span style={{ fontSize: narrow ? 16 : 22, fontWeight: 700, marginLeft: 2 }}>
              s
            </span>
          </div>
          <div
            style={{
              marginTop: 4,
              fontFamily:
                "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            scanning
          </div>
        </div>
      </div>
      <style>{`@keyframes memelli-ring-fill {
        to { stroke-dashoffset: 0 }
      }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// LAYOUT 2 — money-tower — giant CountUp $0 → $500K with K formatter
// ─────────────────────────────────────────────────────────────────────
function MoneyTowerLayout({ pitch, onAction, narrow }: LayoutProps) {
  // $500K → animate 0 → 500000 with $K formatter
  const moneyMatch = pitch.heroValue.match(/\$?([\d.,]+)([KkMm]?)/);
  const baseNum = moneyMatch ? parseFloat(moneyMatch[1].replace(/,/g, "")) : 0;
  const unit = moneyMatch?.[2]?.toUpperCase() ?? "";
  const targetN =
    unit === "M" ? baseNum * 1_000_000 : unit === "K" ? baseNum * 1_000 : baseNum;
  const formatMoney = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
    return `$${Math.round(n)}`;
  };

  return (
    <div
      style={{
        background: `linear-gradient(180deg, ${INK} 0%, ${INK_2} 100%)`,
        color: PAPER,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: SHADOW,
        display: "grid",
        gridTemplateColumns: narrow ? "1fr" : "1.1fr 1fr",
        height: narrow ? "auto" : "100%",
        minHeight: narrow ? undefined : "60vh",
        position: "relative",
      }}
    >
      <DotGrid />

      {/* LEFT — money tower with animated counter */}
      <div
        style={{
          padding: narrow ? "24px 22px" : "44px 36px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1,
          borderRight: `1px solid rgba(255,255,255,0.06)`,
        }}
      >
        <FadeIn delay={80}>
          <img
            src="/memelli-logo-white.png"
            alt="Memelli"
            style={{ ...LOGO_STYLE, height: 52 }}
          />
        </FadeIn>

        <div>
          <FadeIn delay={300}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.5)",
                marginBottom: 14,
              }}
            >
              Up to
            </div>
          </FadeIn>
          <div
            style={{
              fontSize: narrow ? 56 : 132,
              fontWeight: 900,
              letterSpacing: "-0.06em",
              lineHeight: 0.85,
              color: PAPER,
              textShadow: "0 8px 30px rgba(196,30,58,0.35)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <CountUp
              to={targetN}
              duration={1800}
              delay={420}
              format={formatMoney}
            />
          </div>
          <FadeIn delay={1500}>
            <div
              style={{
                marginTop: 18,
                fontSize: 14,
                color: "rgba(255,255,255,0.68)",
                maxWidth: 320,
                lineHeight: 1.5,
              }}
            >
              {pitch.heroSupport}
            </div>
          </FadeIn>
        </div>

        {/* Live lender-match ticker — same energy as PreQual's result rows */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 10,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 7,
            fontFamily:
              "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
            fontSize: 11,
          }}
        >
          <FadeIn delay={1500}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
                paddingBottom: 6,
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 9999,
                    background: "#10B981",
                    boxShadow: "0 0 8px #10B981",
                  }}
                />
                lender match
              </span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>
                back-end fees only
              </span>
            </div>
          </FadeIn>
          {[
            { name: "Business LOC", amount: "$250K", delay: 1700 },
            { name: "Term Loan", amount: "$180K", delay: 1900 },
            { name: "Personal Cards", amount: "$45K", delay: 2100 },
            { name: "Grant Match", amount: "$25K", delay: 2300 },
          ].map((row) => (
            <FadeIn key={row.name} delay={row.delay} distance={4}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  color: PAPER,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Check size={11} strokeWidth={3} color="#10B981" />
                  <span style={{ letterSpacing: "0.04em" }}>
                    {row.name.toLowerCase()}
                  </span>
                </span>
                <span style={{ fontWeight: 700 }}>{row.amount}</span>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* RIGHT — pitch + bullets + CTA */}
      <div
        style={{
          padding: narrow ? "20px 20px 22px" : "44px 36px 36px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          position: "relative",
          zIndex: 1,
        }}
      >
        <FadeIn delay={120}>
          <Eyebrow color={RED}>{pitch.eyebrow}</Eyebrow>
        </FadeIn>
        <BlurIn delay={220}>
          <h2
            style={{
              fontSize: narrow ? 22 : 28,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.08,
              color: PAPER,
            }}
          >
            {pitch.headline}
          </h2>
        </BlurIn>
        <FadeIn delay={380}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {pitch.subhead}
          </p>
        </FadeIn>
        <div>
          <Stagger baseDelay={520} gap={70}>
            {pitch.bullets.map((b, i) => (
              <BulletItem key={i} dark>
                {b}
              </BulletItem>
            ))}
          </Stagger>
        </div>
        <FadeIn delay={520 + pitch.bullets.length * 70 + 80}>
          <CtaRow pitch={pitch} onAction={onAction} dark />
        </FadeIn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// LAYOUT 3 — terminal-card — typewriter logs streaming
// ─────────────────────────────────────────────────────────────────────
function TerminalCardLayout({ pitch, onAction, narrow }: LayoutProps) {
  // Sequential typewriter delays per log line
  const baseDelay = 700;
  const lineGap = 320;
  return (
    <div
      style={{
        background: PAPER,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: SHADOW,
        display: "grid",
        gridTemplateColumns: narrow ? "1fr" : "1fr 1.1fr",
        height: narrow ? "auto" : "100%",
        minHeight: narrow ? undefined : "60vh",
      }}
    >
      <div
        style={{
          padding: narrow ? "22px 20px 18px" : "40px 36px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          color: INK,
        }}
      >
        <FadeIn delay={140}>
          <Eyebrow color={RED}>{pitch.eyebrow}</Eyebrow>
        </FadeIn>
        <BlurIn delay={220}>
          <Headline>{pitch.headline}</Headline>
        </BlurIn>
        <FadeIn delay={360}>
          <Subhead>{pitch.subhead}</Subhead>
        </FadeIn>
        <div>
          <Stagger baseDelay={500} gap={70}>
            {pitch.bullets.map((b, i) => (
              <BulletItem key={i}>{b}</BulletItem>
            ))}
          </Stagger>
        </div>
        <FadeIn delay={500 + pitch.bullets.length * 70 + 80}>
          <CtaRow pitch={pitch} onAction={onAction} />
        </FadeIn>
      </div>

      <div
        style={{
          background: INK,
          color: PAPER,
          padding: narrow ? "20px 18px" : 28,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          fontFamily: MONO,
          fontSize: 11.5,
          lineHeight: 1.55,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <FadeIn delay={120}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingBottom: 12,
              borderBottom: `1px solid rgba(255,255,255,0.10)`,
            }}
          >
            <Terminal size={14} color={RED} />
            <span
              style={{
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.18em",
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
                gap: 6,
                fontFamily: FONT,
                fontSize: 10,
                color: "#10B981",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#10B981",
                  boxShadow: "0 0 8px #10B981",
                }}
              />
              running
            </span>
          </div>
        </FadeIn>

        <TermLine ts="14:02:11" delay={baseDelay + 0 * lineGap}>
          <Tag color="#6366F1">PULL</Tag>{" "}
          <Typewriter
            text="Experian report v.2026-04-30"
            delay={baseDelay + 0 * lineGap + 160}
            speed={18}
          />
        </TermLine>
        <TermLine ts="14:02:13" delay={baseDelay + 1 * lineGap}>
          <Tag color={RED}>FLAG</Tag>{" "}
          <Typewriter
            text="3 collections, 1 late, 1 charge-off"
            delay={baseDelay + 1 * lineGap + 160}
            speed={18}
          />
        </TermLine>
        <TermLine ts="14:02:14" delay={baseDelay + 2 * lineGap}>
          <Tag color="#F59E0B">DRAFT</Tag>{" "}
          <Typewriter
            text="5 dispute letters generated"
            delay={baseDelay + 2 * lineGap + 160}
            speed={18}
          />
        </TermLine>
        <TermLine ts="14:02:18" delay={baseDelay + 3 * lineGap}>
          <Tag color="#6366F1">SEND</Tag>{" "}
          <Typewriter
            text="certified mail · all three bureaus"
            delay={baseDelay + 3 * lineGap + 160}
            speed={18}
          />
        </TermLine>
        <TermLine ts="14:02:19" delay={baseDelay + 4 * lineGap}>
          <Tag color="#10B981">OK</Tag>{" "}
          <Typewriter
            text="tracking active · 30-day window"
            delay={baseDelay + 4 * lineGap + 160}
            speed={18}
          />
        </TermLine>
        <TermLine
          ts="—"
          muted
          delay={baseDelay + 5 * lineGap}
        >
          <Typewriter
            text="watching for bureau response…"
            delay={baseDelay + 5 * lineGap + 160}
            speed={32}
            cursor
          />
        </TermLine>

        {/* Counter trio — items removed, letters sent, points recovered */}
        <FadeIn delay={baseDelay + 6 * lineGap} distance={4}>
          <div
            style={{
              marginTop: "auto",
              paddingTop: 14,
              borderTop: `1px solid rgba(255,255,255,0.10)`,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
              fontFamily: FONT,
            }}
          >
            <RepairStat
              label="Items Removed"
              value={
                <CountUp
                  to={3}
                  duration={1200}
                  delay={baseDelay + 6 * lineGap + 200}
                />
              }
              accent="#10B981"
            />
            <RepairStat
              label="Letters Sent"
              value={
                <CountUp
                  to={12}
                  duration={1300}
                  delay={baseDelay + 6 * lineGap + 350}
                />
              }
              accent="#6366F1"
            />
            <RepairStat
              label="Points Recovered"
              value={
                <>
                  <span style={{ fontSize: "0.7em", marginRight: 1 }}>+</span>
                  <CountUp
                    to={47}
                    duration={1500}
                    delay={baseDelay + 6 * lineGap + 500}
                  />
                </>
              }
              accent={RED}
            />
          </div>
        </FadeIn>
        <FadeIn delay={baseDelay + 6 * lineGap + 700}>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              fontFamily: FONT,
              paddingTop: 12,
            }}
          >
            {pitch.tags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: 9999,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: PAPER,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// LAYOUT 4 — tri-stack — fan reveal of three bureau cards w/ score CountUp
// ─────────────────────────────────────────────────────────────────────
function TriStackLayout({ pitch, onAction, narrow }: LayoutProps) {
  const bureaus: {
    name: string;
    score: number;
    tone: string;
    delta: number;
  }[] = [
    { name: "Experian", score: 742, tone: "#6366F1", delta: 14 },
    { name: "TransUnion", score: 728, tone: "#10B981", delta: 9 },
    { name: "Equifax", score: 735, tone: "#F59E0B", delta: 11 },
  ];
  return (
    <div
      style={{
        background: PAPER,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: SHADOW,
        display: "grid",
        gridTemplateRows: "auto 1fr",
        height: narrow ? "auto" : "100%",
        minHeight: narrow ? undefined : "60vh",
        // bureau ledger uses tabular mono digits — shrink on phone
      }}
    >
      {/* Editorial ledger — one continuous black panel, three bureau slots
          divided by hairlines. No card-with-border pattern. */}
      <div
        style={{
          background: INK,
          color: PAPER,
          position: "relative",
          padding: narrow ? "32px 14px 18px 22px" : "28px 36px 30px 50px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          alignItems: "stretch",
          gap: 0,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Red ink-strip on the left edge */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 6,
            background: `linear-gradient(180deg, ${RED} 0%, ${RED_2} 100%)`,
          }}
        />
        {/* Top eyebrow stripe */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 50,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
            fontFamily:
              "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 9999,
              background: "#10B981",
              boxShadow: "0 0 10px #10B981",
            }}
          />
          live · smartcredit
          <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.35)" }}>
            {new Date().toISOString().slice(0, 10)}
          </span>
        </div>

        {bureaus.map((b, i) => (
          <FadeIn
            key={b.name}
            delay={180 + i * 140}
            distance={20}
            duration={560}
          >
            <div
              style={{
                padding: narrow ? "8px 8px" : "18px 22px",
                borderLeft:
                  i === 0 ? "none" : "1px solid rgba(255,255,255,0.10)",
                display: "flex",
                flexDirection: "column",
                gap: narrow ? 6 : 10,
                minHeight: narrow ? 96 : 132,
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    background: b.tone,
                    transform: "skewX(-12deg)",
                    borderRadius: 1,
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    color: PAPER,
                  }}
                >
                  {b.name}
                </span>
              </div>
              <div
                style={{
                  fontSize: narrow ? 22 : 56,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: PAPER,
                  lineHeight: 0.95,
                  fontVariantNumeric: "tabular-nums",
                  fontFamily:
                    "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
                }}
              >
                <CountUp
                  to={b.score}
                  duration={1300}
                  delay={320 + i * 150}
                />
              </div>
              <FadeIn delay={1100 + i * 150} distance={4}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#10B981",
                    fontFamily:
                      "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <span aria-hidden style={{ fontSize: 9 }}>▲</span>+
                  <CountUp
                    to={b.delta}
                    duration={1100}
                    delay={1300 + i * 150}
                  />
                  <span
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontWeight: 500,
                      letterSpacing: "0.04em",
                      paddingLeft: 4,
                    }}
                  >
                    · 30d
                  </span>
                </div>
              </FadeIn>
              <div style={{ display: "flex", gap: 3, marginTop: "auto" }}>
                {Array.from({ length: 12 }).map((_, k) => {
                  const filled = k < Math.round((b.score - 300) / 70);
                  return (
                    <FadeIn
                      key={k}
                      delay={520 + i * 150 + k * 30}
                      distance={3}
                    >
                      <span
                        style={{
                          display: "block",
                          width: 6,
                          height: 12,
                          background: filled
                            ? b.tone
                            : "rgba(255,255,255,0.10)",
                        }}
                      />
                    </FadeIn>
                  );
                })}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      <div
        style={{
          padding: narrow ? "20px 20px 22px" : "32px 36px",
          display: "grid",
          gridTemplateColumns: narrow ? "1fr" : "1.2fr 1fr",
          gap: narrow ? 16 : 32,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FadeIn delay={780}>
            <Eyebrow color={RED}>{pitch.eyebrow}</Eyebrow>
          </FadeIn>
          <BlurIn delay={840}>
            <Headline>{pitch.headline}</Headline>
          </BlurIn>
          <FadeIn delay={960}>
            <Subhead>{pitch.subhead}</Subhead>
          </FadeIn>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Stagger baseDelay={1080} gap={70}>
            {pitch.bullets.map((b, i) => (
              <BulletItem key={i} compact>
                {b}
              </BulletItem>
            ))}
          </Stagger>
          <FadeIn delay={1080 + pitch.bullets.length * 70 + 80}>
            <CtaRow pitch={pitch} onAction={onAction} />
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────────────

function Eyebrow({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color,
      }}
    >
      {children}
    </span>
  );
}

function Headline({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "clamp(22px, 4.4vw, 32px)",
        fontWeight: 800,
        letterSpacing: "-0.02em",
        margin: 0,
        lineHeight: 1.05,
      }}
    >
      {children}
    </h2>
  );
}

function Subhead({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 14.5,
        lineHeight: 1.55,
        color: MUTED,
        margin: 0,
        maxWidth: 420,
      }}
    >
      {children}
    </p>
  );
}

function BulletItem({
  children,
  dark = false,
  compact = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        fontSize: compact ? 12.5 : 13.5,
        lineHeight: 1.4,
        color: dark ? "rgba(255,255,255,0.92)" : INK,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 18,
          height: 18,
          borderRadius: 9999,
          background: dark ? `${RED}33` : `${RED}1a`,
          color: dark ? PAPER : RED,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <Check size={11} strokeWidth={3} />
      </span>
      <span>{children}</span>
    </div>
  );
}

function CtaRow({
  pitch,
  onAction,
  dark = false,
}: {
  pitch: ModulePitch;
  onAction: (action: ModulePitch["primaryCta"]["action"]) => void;
  dark?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        paddingTop: 6,
      }}
    >
      <button
        type="button"
        onClick={() => onAction(pitch.primaryCta.action)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "13px 22px",
          background: `linear-gradient(135deg, ${RED}, ${RED_2})`,
          color: PAPER,
          border: 0,
          borderRadius: 9999,
          fontSize: 13.5,
          fontWeight: 700,
          letterSpacing: "0.02em",
          cursor: "pointer",
          fontFamily: FONT,
          boxShadow:
            "0 8px 22px -8px rgba(196,30,58,0.55), inset 0 1px 0 rgba(255,255,255,0.18)",
        }}
      >
        {pitch.primaryCta.label}
        <ArrowRight size={14} strokeWidth={2.2} />
      </button>
      {pitch.secondaryCta && (
        <button
          type="button"
          onClick={() => onAction(pitch.secondaryCta!.action)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "13px 22px",
            background: dark ? "transparent" : PAPER,
            color: dark ? PAPER : INK,
            border: `1px solid ${dark ? "rgba(255,255,255,0.25)" : LINE}`,
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.01em",
            cursor: "pointer",
            fontFamily: FONT,
          }}
        >
          {pitch.secondaryCta.label}
        </button>
      )}
    </div>
  );
}

function TagPillOnDark({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "6px 10px",
        borderRadius: 9999,
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.2)",
        color: PAPER,
        marginRight: 6,
      }}
    >
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.45)",
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 16, fontWeight: 700, color: PAPER }}>
        {value}
      </span>
    </div>
  );
}

function RepairStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 3,
          height: "100%",
          background: accent,
        }}
      />
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: PAPER,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function TermLine({
  ts,
  children,
  muted = false,
  delay = 0,
}: {
  ts: string;
  children: React.ReactNode;
  muted?: boolean;
  delay?: number;
}) {
  return (
    <FadeIn delay={delay} distance={4} duration={300}>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "baseline",
          opacity: muted ? 0.55 : 1,
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>
          {ts}
        </span>
        <span style={{ color: PAPER }}>{children}</span>
      </div>
    </FadeIn>
  );
}

function Tag({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        background: `${color}20`,
        color,
        border: `1px solid ${color}55`,
        padding: "1px 7px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginRight: 6,
      }}
    >
      {children}
    </span>
  );
}

function DiagonalTexture() {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(135deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        opacity: 0.4,
        pointerEvents: "none",
      }}
    />
  );
}

function DotGrid() {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        opacity: 0.6,
        pointerEvents: "none",
      }}
    />
  );
}
