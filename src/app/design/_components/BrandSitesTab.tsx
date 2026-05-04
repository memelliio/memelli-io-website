"use client";

/**
 * Brand Sites — every custom HTML/CSS brand site built from a brand_kit row.
 * NOT Envato chassis. These are graphic-driven single-page demos generated
 * for each brand we've defined (HavenStay, BlueLedger, PulseGrid, etc.).
 *
 * Reads /preview/_brand_sites.json (built by .scratch/build-brand-sites-manifest.mjs).
 *
 * Editorial Memelli skin (white paper, red #C41E3A).
 */

import { useEffect, useState } from "react";

const RED = "#C41E3A";
const INK = "#0B0B0F";
const PAPER = "#FFFFFF";
const SOFT = "#FAFAFA";
const LINE = "#E5E7EB";
const MUTED = "#6B7280";
const FONT = "Inter, system-ui, -apple-system, sans-serif";

type Site = {
  slug: string;
  name: string;
  primary_hex: string | null;
  accent_hex: string | null;
  voice_tone: string | null;
  tagline: string | null;
  preview_url: string;
  logo_url: string | null;
  bytes: number;
  built_at: number;
};

type Manifest = {
  generated_at: string;
  count: number;
  sites: Site[];
};

export default function BrandSitesTab() {
  const [data, setData] = useState<Manifest | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/preview/_brand_sites.json", { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = (await r.json()) as Manifest;
        if (!cancelled) setData(j);
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      style={{
        height: "100%",
        overflowY: "auto",
        background: PAPER,
        color: INK,
        fontFamily: FONT,
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 20,
          paddingBottom: 14,
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.4px", margin: 0 }}>
            Brand Sites
          </h1>
          <p style={{ marginTop: 4, marginBottom: 0, color: MUTED, fontSize: 13 }}>
            Custom HTML/CSS brand demos built from <code>brand_kits</code> rows. Most-recent first.
          </p>
        </div>
        <div style={{ fontSize: 12, color: MUTED }}>
          {data ? `${data.count} sites` : err ? "—" : "loading…"}
        </div>
      </div>

      {err ? (
        <div
          style={{
            padding: 24,
            border: `1px solid ${RED}33`,
            background: `${RED}08`,
            borderRadius: 12,
            color: RED,
            fontSize: 13,
          }}
        >
          Failed to load brand sites: {err}
        </div>
      ) : !data ? (
        <div style={{ padding: 60, textAlign: "center", color: MUTED }}>Loading…</div>
      ) : data.sites.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: MUTED }}>
          No brand sites built yet.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 18,
          }}
        >
          {data.sites.map((s) => (
            <Tile key={s.slug} s={s} />
          ))}
        </div>
      )}
    </main>
  );
}

function Tile({ s }: { s: Site }) {
  const primary = s.primary_hex || "#1F2937";
  const accent = s.accent_hex || "#FFFFFF";

  return (
    <div
      style={{
        background: PAPER,
        border: `1px solid ${LINE}`,
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 0 rgba(0,0,0,0.02), 0 8px 24px -16px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          height: 140,
          background: primary,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {s.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.logo_url}
            alt={s.name}
            style={{
              maxWidth: "60%",
              maxHeight: 90,
              objectFit: "contain",
              background: "rgba(255,255,255,0.94)",
              padding: 10,
              borderRadius: 8,
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.6px",
              color: PAPER,
              textShadow: "0 1px 2px rgba(0,0,0,0.18)",
            }}
          >
            {s.name}
          </span>
        )}
        <span
          aria-hidden
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            width: 14,
            height: 14,
            borderRadius: 4,
            background: accent,
            border: `1px solid ${PAPER}`,
          }}
        />
      </div>

      <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: "-0.2px" }}>
            {s.name}
          </h3>
          <span
            style={{
              fontSize: 9,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: MUTED,
              border: `1px solid ${LINE}`,
              padding: "3px 8px",
              borderRadius: 4,
              background: SOFT,
            }}
          >
            {(s.bytes / 1024).toFixed(0)} KB
          </span>
        </div>

        {s.tagline && (
          <p style={{ margin: 0, fontSize: 12, color: INK, lineHeight: 1.4 }}>
            {s.tagline}
          </p>
        )}

        <div style={{ fontSize: 11, color: MUTED, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {s.voice_tone && <span>{s.voice_tone}</span>}
          {s.primary_hex && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span
                aria-hidden
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: s.primary_hex,
                  border: `1px solid ${LINE}`,
                  display: "inline-block",
                }}
              />
              <code style={{ fontSize: 10 }}>{s.primary_hex}</code>
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <a
            href={s.preview_url}
            target="_blank"
            rel="noreferrer noopener"
            style={{
              flex: 1,
              padding: "8px 12px",
              background: INK,
              color: PAPER,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              textAlign: "center",
              textDecoration: "none",
              border: `1px solid ${INK}`,
            }}
          >
            Open Live
          </a>
          <code
            style={{
              padding: "8px 10px",
              fontSize: 10.5,
              color: MUTED,
              background: SOFT,
              border: `1px solid ${LINE}`,
              borderRadius: 8,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            {s.slug}
          </code>
        </div>
      </div>
    </div>
  );
}
