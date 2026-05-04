"use client";

/**
 * Logo Lab — Memelli Partner Program logo iteration board.
 *
 * Pulls every rendered logo variant from
 *   /preview/memelli-partner-program/assets/
 * and groups them by source method:
 *   ⓪ AI · DashScope Wan 2.7-image (real logo software)
 *   ① Concept · custom SVG (real design, no AI)
 *   ② Royals PSD overlay (first pass — text-swap on a hotel crest, weak)
 *   ③ Surface variants (on light / on dark / mark only)
 *
 * No DB, no fetch — purely static asset references. Add new variants by
 * dropping more PNGs into the folder.
 */

const RED = "#C41E3A";
const INK = "#0B0B0F";
const PAPER = "#FFFFFF";
const LINE = "#E5E7EB";
const SOFT = "#F5F5F5";
const MUTED = "#6B7280";

type Variant = {
  id: string;
  label: string;
  badge: string;
  note: string;
  file: string;
  dark?: boolean;
  wide?: boolean;
};

const ASSETS = "/preview/memelli-partner-program/assets";

const AI: Variant[] = [
  { id: "ai-1", badge: "AI-1", label: "Mono · chevron", note: "M monogram + ascending chevrons (tier elevation). Editorial serif. Brand red and ink.", file: `${ASSETS}/logo-ai-1-mono-chevron.png` },
  { id: "ai-2", badge: "AI-2", label: "Circular seal", note: "Curved MEMELLI / PARTNER · PROGRAM badge. Premium certified-partner / notary-stamp feel.", file: `${ASSETS}/logo-ai-2-circular-seal.png` },
  { id: "ai-3", badge: "AI-3", label: "Interlocking MP", note: "M (ink) overlaps P (red). Most direct partnership cue. Modern minimalist.", file: `${ASSETS}/logo-ai-3-interlocking-mp.png` },
  { id: "ai-4", badge: "AI-4", label: "Shield", note: "Red shield + ink M monogram + full lockup. Heraldic without old-fashioned.", file: `${ASSETS}/logo-ai-4-chevron-shield.png` },
];

const SVG_CONCEPTS: Variant[] = [
  { id: "c1", badge: "C1", label: "Chevron crown", note: "Three descending chevrons over an editorial M. Tier / elevation cue.", file: `${ASSETS}/logo-c1-chevron-crown.png` },
  { id: "c2", badge: "C2", label: "Circular seal", note: "Center M + corner ticks. Reads premium / authoritative / signed.", file: `${ASSETS}/logo-c2-circular-seal.png` },
  { id: "c3", badge: "C3", label: "Interlocking MP", note: "M (ink) + P (red) overlapping. Direct partnership cue.", file: `${ASSETS}/logo-c3-interlocking-mp.png` },
  { id: "c4", badge: "C4", label: "Stacked editorial", note: "Big M, red rule, MEMELLI wordmark, PARTNER PROGRAM tagline. Magazine-masthead.", file: `${ASSETS}/logo-c4-stacked-editorial.png` },
];

const ROYALS_OVERLAY: Variant[] = [
  { id: "primary", badge: "RO-1", label: "Royals · Playfair", note: "First pass: text-swap on the royals hotel crest. Wrong concept for a partner program.", file: `${ASSETS}/logo.png` },
  { id: "v1-cinzel", badge: "RO-2", label: "Royals · Cinzel", note: "Classical crest serif. Same hotel crest underneath.", file: `${ASSETS}/logo-v1-cinzel.png` },
  { id: "v2-marcellus", badge: "RO-3", label: "Royals · Marcellus", note: "Refined editorial serif on the hotel crest.", file: `${ASSETS}/logo-v2-marcellus.png` },
  { id: "v3-inter-black", badge: "RO-4", label: "Royals · Inter Black", note: "Modern sans on the hotel crest.", file: `${ASSETS}/logo-v3-inter-black.png` },
];

const SURFACES: Variant[] = [
  { id: "on-light", badge: "S-1", label: "On light · 1600×1000", note: "logo-on-light.png — paste on white surface", file: `${ASSETS}/logo-on-light.png`, wide: true },
  { id: "on-dark", badge: "S-2", label: "On dark · 1600×1000", note: "logo-on-dark.png — white text on ink, paste on dark surface", file: `${ASSETS}/logo-on-dark.png`, wide: true, dark: true },
  { id: "mark", badge: "S-3", label: "Mark only · 600×600", note: "logo-mark.png — just the crest / monogram", file: `${ASSETS}/logo-mark.png` },
];

function Tile({ v, defaultDark = false }: { v: Variant; defaultDark?: boolean }) {
  const isDark = v.dark ?? defaultDark;
  return (
    <div
      style={{
        background: isDark ? INK : PAPER,
        border: `1px solid ${isDark ? "#1A1A1F" : LINE}`,
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <a
        href={v.file}
        target="_blank"
        rel="noreferrer"
        style={{
          aspectRatio: v.wide ? "16 / 10" : "1 / 1",
          background: isDark ? "#000" : SOFT,
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
        }}
      >
        <img
          src={v.file}
          alt={v.label}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = "0.2";
            (e.currentTarget as HTMLImageElement).style.filter = "grayscale(1)";
            (e.currentTarget as HTMLImageElement).alt = "still rendering…";
          }}
        />
      </a>
      <div
        style={{
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          borderTop: `1px solid ${isDark ? "#1A1A1F" : LINE}`,
          color: isDark ? PAPER : INK,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: RED,
          }}
        >
          <span
            style={{
              background: RED,
              color: PAPER,
              padding: "2px 6px",
              borderRadius: 3,
              fontSize: 9,
              letterSpacing: "0.18em",
              marginRight: 6,
            }}
          >
            {v.badge}
          </span>
          {v.label}
        </span>
        <span style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.8)" : MUTED, lineHeight: 1.4 }}>
          {v.note}
        </span>
      </div>
    </div>
  );
}

function SectionHeader({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginTop: 32, marginBottom: 14 }}>
      <h2
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: INK,
          margin: 0,
          paddingBottom: 8,
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        {children}
      </h2>
      {sub && (
        <p style={{ marginTop: 8, color: MUTED, fontSize: 13, lineHeight: 1.5, maxWidth: 720 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default function LogoLabTab() {
  return (
    <div style={{ padding: "20px 28px 80px", overflow: "auto", height: "100%" }}>
      <div style={{ marginBottom: 14 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: RED,
          }}
        >
          Logo Lab · Memelli Partner Program
        </span>
        <h1 style={{ marginTop: 6, fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", color: INK }}>
          Pick the direction.
        </h1>
        <p style={{ marginTop: 8, color: MUTED, fontSize: 14, lineHeight: 1.5, maxWidth: 720 }}>
          Three tracks side-by-side: <b>AI-generated</b> via DashScope Wan 2.7-image (real logo software, parallel dispatch),
          <b> concept-driven SVG</b> (real design, no AI), and the <b>royals-PSD overlay</b> first pass for comparison. Click any
          tile to open the file. Tell me which one and I&apos;ll render the full surface set (light / dark / mark / favicon / business-card lockup) from that source.
        </p>
      </div>

      <SectionHeader sub="DashScope Wan 2.7-image. 4 concept-driven prompts fired in parallel through the CF Worker relay (US egress). Real partner-program logos.">
        ⓪ AI · Wan 2.7-image
      </SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {AI.map((v) => <Tile key={v.id} v={v} />)}
      </div>

      <SectionHeader sub="Hand-coded SVG with real partnership concept (no stolen template crest). Editable in any vector tool.">
        ① Concept · custom SVG
      </SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {SVG_CONCEPTS.map((v) => <Tile key={v.id} v={v} />)}
      </div>

      <SectionHeader sub="First pass — text-swap on the royals hotel crest. Listed for comparison; the concept is wrong for a partner program (it's a hotel coat of arms).">
        ② Royals PSD overlay (weak)
      </SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {ROYALS_OVERLAY.map((v) => <Tile key={v.id} v={v} />)}
      </div>

      <SectionHeader sub="Auto-rendered against the picked source. Once you choose ⓪ or ① above, I'll re-render these surfaces from that direction.">
        ③ Surface variants
      </SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {SURFACES.map((v) => <Tile key={v.id} v={v} />)}
      </div>
    </div>
  );
}
