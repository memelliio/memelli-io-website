"use client";

/**
 * Memelli Partner Program — thin INDEX of the asset bundle.
 *
 * Reads /preview/memelli-partner-program/_manifest.json at runtime,
 * shows brand header + one CTA to the live partner site + asset
 * thumbnail grid. No marketing pitch on this page — the live site
 * at /preview/memelli-partner-program/ is the marketing surface.
 */

import { useEffect, useState } from "react";

// Local narrow-viewport hook so /package renders correctly on iPhone 11 / 360-430px phones
// without dragging in the OS shell's viewport-preview-store.
function useIsNarrow(): boolean {
  const [narrow, setNarrow] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.matchMedia("(max-width: 600px)").matches;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 600px)");
    setNarrow(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setNarrow(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return narrow;
}

const RED = "#C41E3A";
const RED_DEEP = "#A8182F";
const INK = "#0B0B0F";
const PAPER = "#FFFFFF";
const SOFT = "#F5F5F5";
const LINE = "#E5E7EB";
const MUTED = "#6B7280";
const FONT = "Inter, system-ui, -apple-system, sans-serif";

type Asset = {
  label: string;
  file: string;
  alt?: string;
  thumb: string;
  category: string;
  kind: "png" | "pdf";
  size?: string;
};

type Manifest = {
  brandName: string;
  shortName: string;
  tagline: string;
  siteUrl: string;
  siteFile: string;
  brand: string;
  builtAt: string;
  assets: Asset[];
};

const MANIFEST_URL = "/preview/memelli-partner-program/_manifest.json";

export default function PackagePage() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const narrow = useIsNarrow();

  // Try DB-backed API first (revenue_generator_projects + asset_bundles + asset_items),
  // fall back to the on-disk _manifest.json. Both return the same shape.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/revenue-generator/projects/memelli-partner-program", { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          if (alive && j?.brandName) {
            setManifest(j);
            return;
          }
        }
      } catch {
        /* fall through to manifest */
      }
      try {
        const r = await fetch(MANIFEST_URL, { cache: "no-store" });
        if (!r.ok) throw new Error(`manifest ${r.status}`);
        const j = await r.json();
        if (alive) setManifest(j);
      } catch (e) {
        if (alive) setError(String(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <div style={{ padding: 64, fontFamily: FONT, color: INK, background: PAPER, minHeight: "100vh" }}>
        <h1 style={{ margin: 0, fontWeight: 900 }}>Manifest failed to load</h1>
        <pre style={{ marginTop: 16, color: MUTED, fontFamily: "ui-monospace, Menlo, Consolas, monospace" }}>{error}</pre>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div style={{ padding: 64, fontFamily: FONT, color: MUTED, background: PAPER, minHeight: "100vh" }}>
        Loading partner kit…
      </div>
    );
  }

  // Group assets by category
  const grouped = manifest.assets.reduce<Record<string, Asset[]>>((acc, a) => {
    (acc[a.category] = acc[a.category] || []).push(a);
    return acc;
  }, {});
  const orderedCategories = ["Identity", "Print", "Social", "Reference"].filter((c) => grouped[c]);

  return (
    <div style={{ minHeight: "100dvh", background: PAPER, color: INK, fontFamily: FONT }}>
      {/* HEADER */}
      <header
        style={{
          padding: narrow ? "12px 14px" : "20px 28px",
          background: PAPER,
          borderBottom: `1px solid ${LINE}`,
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: narrow ? 8 : 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/preview/memelli-partner-program/assets/logo-mark.png"
            alt="Memelli Partner Program"
            style={{ height: 38, width: "auto", display: "block" }}
          />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: "0.10em" }}>MEMELLI</div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.32em",
                color: MUTED,
                marginTop: 4,
              }}
            >
              PARTNER  PROGRAM
            </div>
          </div>
        </div>
        <a
          href={manifest.siteUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            padding: narrow ? "8px 14px" : "10px 18px",
            borderRadius: 999,
            background: RED,
            color: PAPER,
            fontSize: narrow ? 12 : 13,
            fontWeight: 700,
            letterSpacing: "-0.1px",
            textDecoration: "none",
            boxShadow: `0 6px 18px -8px ${RED}`,
            whiteSpace: "nowrap",
          }}
        >
          {narrow ? "Live site →" : "View the live partner site →"}
        </a>
      </header>

      {/* HERO */}
      <section
        style={{
          padding: narrow ? "36px 18px 24px" : "80px 28px 56px",
          textAlign: "center",
          maxWidth: 880,
          marginInline: "auto",
        }}
      >
        <div
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.32em",
            color: RED,
            textTransform: "uppercase",
            marginBottom: 18,
          }}
        >
          Demo bundle · {manifest.builtAt}
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: narrow ? 28 : "clamp(34px, 4.6vw, 52px)",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            lineHeight: 1.06,
          }}
        >
          {manifest.brandName}
        </h1>
        <p
          style={{
            color: MUTED,
            marginTop: narrow ? 12 : 18,
            fontSize: narrow ? 14 : 17,
            lineHeight: 1.5,
          }}
        >
          {manifest.tagline}
        </p>
        <div
          style={{
            display: "inline-flex",
            gap: 10,
            marginTop: 28,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <a
            href={manifest.siteUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "13px 22px",
              borderRadius: 999,
              background: `linear-gradient(135deg, ${RED}, ${RED_DEEP})`,
              color: PAPER,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow:
                "0 8px 22px -8px rgba(196,30,58,0.55), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            View the live partner site →
          </a>
          <a
            href={manifest.brand}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "13px 22px",
              borderRadius: 999,
              background: PAPER,
              color: INK,
              border: `1px solid ${LINE}`,
              fontSize: 13.5,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            brand.json
          </a>
        </div>
      </section>

      {/* ASSET INDEX */}
      <section
        style={{
          padding: narrow ? "0 14px 40px" : "0 28px 80px",
          maxWidth: 1180,
          marginInline: "auto",
        }}
      >
        {orderedCategories.map((cat) => (
          <div key={cat} style={{ marginTop: 32 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: INK,
                }}
              >
                {cat}
              </span>
              <span style={{ flex: 1, height: 1, background: LINE }} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: MUTED,
                  fontFamily: "ui-monospace, Menlo, Consolas, monospace",
                }}
              >
                {grouped[cat].length} {grouped[cat].length === 1 ? "asset" : "assets"}
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: narrow
                  ? "repeat(2, 1fr)"
                  : "repeat(auto-fill, minmax(240px, 1fr))",
                gap: narrow ? 10 : 16,
              }}
            >
              {grouped[cat].map((a) => (
                <AssetCard key={a.file} asset={a} />
              ))}
            </div>
          </div>
        ))}

        {/* Bottom note */}
        <div
          style={{
            marginTop: 56,
            padding: "28px 32px",
            background: SOFT,
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            fontSize: 14,
            color: MUTED,
            lineHeight: 1.55,
          }}
        >
          This is a finished partner kit. Drop into the database, plug in Stripe, it ships.
          The live site is at{" "}
          <a href={manifest.siteUrl} target="_blank" rel="noreferrer" style={{ color: RED, fontWeight: 700 }}>
            {manifest.siteUrl}
          </a>
          . Asset manifest is at{" "}
          <a href={MANIFEST_URL} target="_blank" rel="noreferrer" style={{ color: RED, fontWeight: 700 }}>
            _manifest.json
          </a>
          .
        </div>
      </section>
    </div>
  );
}

function AssetCard({ asset }: { asset: Asset }) {
  return (
    <div
      style={{
        background: PAPER,
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <a
        href={asset.alt || asset.file}
        target="_blank"
        rel="noreferrer"
        style={{
          aspectRatio: "4 / 3",
          background: SOFT,
          display: "block",
          overflow: "hidden",
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        <img
          src={asset.thumb}
          alt={asset.label}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </a>
      <div style={{ padding: "14px 16px 8px", flex: 1 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.32em",
            color: RED,
            textTransform: "uppercase",
          }}
        >
          {asset.category} · {asset.kind.toUpperCase()}
          {asset.size ? ` · ${asset.size}` : ""}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: INK,
            marginTop: 4,
            letterSpacing: "-0.1px",
          }}
        >
          {asset.label}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "10px 14px 12px",
          borderTop: `1px solid ${LINE}`,
          background: SOFT,
        }}
      >
        <a
          href={asset.file}
          download
          style={{
            flex: 1,
            padding: "8px 12px",
            background: INK,
            color: PAPER,
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          Download
        </a>
        <a
          href={asset.alt || asset.file}
          target="_blank"
          rel="noreferrer"
          style={{
            flex: 1,
            padding: "8px 12px",
            background: PAPER,
            color: INK,
            border: `1px solid ${LINE}`,
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          View
        </a>
      </div>
    </div>
  );
}
