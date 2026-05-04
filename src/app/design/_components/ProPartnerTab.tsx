"use client";

/**
 * ProPartnerTab — folded-in /pro-partner content rendered as a tab on /design.
 *
 * Replaces the standalone /pro-partner route per the operator's
 * "single source of truth" rule. Wraps:
 *   • Hero strip with Memelli logo reveal animation (LogoReveal)
 *   • "What you can resell" curated grid — 1 example per category from
 *     the live warehouse rows (websites / print / mockups / music / motion)
 *   • Apply CTA at the bottom
 *
 * Brand: editorial Memelli skin (white paper, red #C41E3A, ink, Inter).
 * No paid services. Lucide stroke SVGs only.
 */

import { useMemo } from "react";
import LogoReveal from "./LogoReveal";
import type { WarehouseRow } from "../_lib/api";

const RED = "#C41E3A";
const INK = "#0B0B0F";
const PAPER = "#FFFFFF";
const SOFT = "#FAFAFA";
const LINE = "#E5E7EB";
const LINE_SOFT = "#F0F0F2";
const MUTED = "#6B7280";
const FONT = "Inter, system-ui, -apple-system, sans-serif";
const SHADOW = "0 1px 0 rgba(0,0,0,0.02), 0 8px 24px -16px rgba(0,0,0,0.08)";

type PreviewManifest = {
  slugs?: Record<
    string,
    { preview_url: string | null; requires_build: boolean }
  >;
};

type CuratedKey =
  | "website"
  | "print"
  | "mockup"
  | "music"
  | "motion"
  | "icons";

const CURATED: { key: CuratedKey; label: string; matches: (a: WarehouseRow) => boolean }[] =
  [
    {
      key: "website",
      label: "Website",
      matches: (a) =>
        a.category === "landing-page" ||
        (a.category as string) === "mobile-template" ||
        (a.category as string) === "admin-dashboard",
    },
    {
      key: "print",
      label: "Print",
      matches: (a) =>
        (a.category as string) === "print" ||
        (a.category as string) === "banner-set" ||
        (a.category as string) === "brochure" ||
        (a.category as string) === "flyer",
    },
    {
      key: "mockup",
      label: "Mockup",
      matches: (a) => (a.category as string) === "mockup",
    },
    {
      key: "music",
      label: "Music",
      matches: (a) => (a.category as string) === "music",
    },
    {
      key: "motion",
      label: "Motion",
      matches: (a) =>
        (a.category as string) === "motion" ||
        (a.category as string) === "video",
    },
    {
      key: "icons",
      label: "Icons",
      matches: (a) =>
        (a.category as string) === "icon-set" ||
        (a.category as string) === "lottie" ||
        (a.category as string) === "animated-svg",
    },
  ];

function getSlug(a: WarehouseRow): string | null {
  return (a as unknown as { meta?: { slug?: string } }).meta?.slug ?? null;
}

export default function ProPartnerTab({
  assets,
  manifest,
}: {
  assets: WarehouseRow[];
  manifest: PreviewManifest | null;
}) {
  // Pick one approved-or-raw example per category; fallback to first match.
  const curated = useMemo(() => {
    const out: { key: CuratedKey; label: string; row: WarehouseRow | null }[] =
      [];
    for (const c of CURATED) {
      const matches = assets.filter(c.matches);
      const preferred =
        matches.find((a) => a.status === "approved") ??
        matches.find((a) => a.status === "usable") ??
        matches.find((a) => a.status === "raw") ??
        matches[0] ??
        null;
      out.push({ key: c.key, label: c.label, row: preferred });
    }
    return out;
  }, [assets]);

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: SOFT,
        color: INK,
        fontFamily: FONT,
      }}
    >
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section style={{ background: PAPER, borderBottom: `1px solid ${LINE}` }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "56px 24px 64px",
            display: "grid",
            gap: 28,
            justifyItems: "center",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: RED,
              padding: "6px 12px",
              border: `1px solid ${RED}33`,
              background: `${RED}08`,
              borderRadius: 9999,
              fontWeight: 600,
            }}
          >
            Pro Partner Program
          </span>

          <h1
            style={{
              maxWidth: 760,
              fontSize: "clamp(34px, 5vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.08,
              margin: 0,
              color: INK,
            }}
          >
            Resell the entire Memelli arsenal{" "}
            <span style={{ color: RED }}>as your own.</span>
          </h1>
          <p
            style={{
              maxWidth: 620,
              fontSize: 17,
              lineHeight: 1.55,
              color: MUTED,
              margin: 0,
            }}
          >
            Your branding, your pricing. Our templates, logos, motion, video,
            and website builds — ready to white-label.
          </p>

          <div style={{ width: "min(820px, 100%)", marginTop: 12 }}>
            <LogoReveal />
          </div>

          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: MUTED,
              margin: 0,
            }}
          >
            Pure CSS · renders in seconds · white-labeled per client
          </p>
        </div>
      </section>

      {/* ── Curated grid ────────────────────────────────────────── */}
      <section style={{ background: SOFT, padding: "56px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ marginBottom: 24, maxWidth: 720 }}>
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: MUTED,
                fontWeight: 600,
              }}
            >
              What you can resell
            </span>
            <h2
              style={{
                marginTop: 8,
                fontSize: "clamp(26px, 3.6vw, 36px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                color: INK,
              }}
            >
              One catalog. Six arsenals.{" "}
              <span style={{ color: RED }}>Your branding.</span>
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 14,
            }}
          >
            {curated.map(({ key, label, row }) => (
              <CuratedCard
                key={key}
                label={label}
                row={row}
                manifest={manifest}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Apply CTA ───────────────────────────────────────────── */}
      <section style={{ background: PAPER, padding: "64px 0 88px" }}>
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "0 24px",
            textAlign: "center",
            display: "grid",
            gap: 18,
            justifyItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: RED,
              padding: "6px 12px",
              border: `1px solid ${RED}33`,
              background: `${RED}08`,
              borderRadius: 9999,
              fontWeight: 600,
            }}
          >
            Apply
          </span>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              margin: 0,
              color: INK,
            }}
          >
            Become a Pro Partner today.
          </h2>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.5,
              color: MUTED,
              margin: 0,
              maxWidth: 540,
            }}
          >
            Stop building from scratch. Resell the catalog under your brand and
            keep the spread.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            <a
              href="/contact?intent=pro-partner"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 44,
                padding: "0 22px",
                fontSize: 13,
                fontWeight: 600,
                color: PAPER,
                background:
                  "linear-gradient(120deg, #C41E3A 0%, #E0294A 60%, #C41E3A 100%)",
                border: "none",
                borderRadius: 9999,
                textDecoration: "none",
                fontFamily: FONT,
                boxShadow: "0 8px 24px -8px rgba(196,30,58,0.55)",
              }}
            >
              Apply
            </a>
            <a
              href="/contact?intent=pro-partner-call"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 44,
                padding: "0 22px",
                fontSize: 13,
                fontWeight: 600,
                color: INK,
                background: PAPER,
                border: `1px solid ${LINE}`,
                borderRadius: 9999,
                textDecoration: "none",
                fontFamily: FONT,
              }}
            >
              Schedule a call
            </a>
          </div>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: MUTED,
              margin: "10px 0 0",
            }}
          >
            White-label · full catalog · you set the price
          </p>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function CuratedCard({
  label,
  row,
  manifest,
}: {
  label: string;
  row: WarehouseRow | null;
  manifest: PreviewManifest | null;
}) {
  if (!row) {
    return (
      <article
        style={{
          background: PAPER,
          border: `1px dashed ${LINE}`,
          borderRadius: 10,
          padding: 22,
          display: "grid",
          alignContent: "center",
          minHeight: 200,
          color: MUTED,
          textAlign: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: MUTED,
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 12 }}>Renderer running…</span>
      </article>
    );
  }

  const slug = getSlug(row);
  const previewUrl = slug ? manifest?.slugs?.[slug]?.preview_url ?? null : null;
  const cat = row.category as string;
  const isWebsite =
    cat === "landing-page" ||
    cat === "mobile-template" ||
    cat === "admin-dashboard";
  const isMusic = cat === "music";
  const isMotion = cat === "motion" || cat === "video";

  return (
    <article
      style={{
        background: PAPER,
        border: `1px solid ${LINE}`,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: SHADOW,
        display: "grid",
        gridTemplateRows: "auto auto",
      }}
    >
      <div
        style={{
          aspectRatio: "16 / 10",
          background: LINE_SOFT,
          overflow: "hidden",
          display: "block",
          position: "relative",
        }}
      >
        <img
          src={row.thumbUrl}
          alt={row.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = "0.15";
            (e.currentTarget as HTMLImageElement).style.objectFit = "contain";
          }}
        />
        <span
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            padding: "2px 8px",
            background: RED,
            color: PAPER,
            fontSize: 9,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            borderRadius: 9999,
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>

      {isMusic && (
        <div style={{ padding: "8px 12px 0" }}>
          <audio
            controls
            preload="metadata"
            style={{ width: "100%", height: 32 }}
            src={
              (row as unknown as { meta?: { audio_url?: string } }).meta
                ?.audio_url ??
              (row as unknown as { url?: string }).url ??
              row.thumbUrl
            }
          />
        </div>
      )}
      {isMotion && (
        <div style={{ padding: "8px 12px 0" }}>
          <video
            controls
            preload="metadata"
            playsInline
            poster={row.thumbUrl}
            src={(row as unknown as { url?: string }).url ?? row.thumbUrl}
            style={{ width: "100%", borderRadius: 6, background: "#000" }}
          />
        </div>
      )}

      <div style={{ padding: "12px 14px 14px", display: "grid", gap: 8 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: INK,
            letterSpacing: "-0.1px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={row.name}
        >
          {row.name}
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: MUTED,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "0.04em",
          }}
        >
          {row.source} · {row.license}
        </div>

        {isWebsite && previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: 4,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              height: 30,
              padding: "0 12px",
              border: `1px solid ${RED}`,
              color: RED,
              background: PAPER,
              borderRadius: 9999,
              fontSize: 11.5,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: FONT,
              alignSelf: "start",
            }}
          >
            Open Live
          </a>
        )}
      </div>
    </article>
  );
}
