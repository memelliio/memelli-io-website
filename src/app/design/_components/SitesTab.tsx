"use client";

/**
 * Sites — every Envato website chassis we own, listed as brand-swappable
 * templates. Reads from chassis_templates (kind='website') via
 * GET /api/design/render/templates (public list endpoint on design service).
 *
 * Each tile:
 *   • title (wordmark + niche)
 *   • subkind badge (html-static / html-dashboard / html-mobile-pwa / react-spa)
 *   • page count
 *   • dominant brand-color swatch (the swap target)
 *   • "Open Live" button → opens /preview/<slug>/index.html in new tab
 *   • "Render with Brand Kit" button → placeholder (next phase)
 *
 * Editorial Memelli skin (white paper, red #C41E3A).
 */

import { useEffect, useMemo, useState } from "react";

const RED = "#C41E3A";
const INK = "#0B0B0F";
const PAPER = "#FFFFFF";
const SOFT = "#FAFAFA";
const LINE = "#E5E7EB";
const MUTED = "#6B7280";
const FONT = "Inter, system-ui, -apple-system, sans-serif";

type Tpl = {
  id: string;
  slug: string;
  kind: string;
  source_zip?: string | null;
  smart_objects?: {
    subkind?: string;
    pages?: { path: string; label: string }[];
    homepage_variants?: number;
    logo_paths?: string[];
    preview_url?: string;
    needs_build?: boolean;
  };
  editable_text?: {
    wordmark_string?: string;
    primary_hex?: string | null;
    accent_hex?: string | null;
    title_template?: string;
    niche?: string;
    primary_css?: string | null;
  };
  preview_jpg_url?: string | null;
};

const SUBKIND_LABEL: Record<string, string> = {
  "html-static": "HTML",
  "html-dashboard": "DASHBOARD",
  "html-mobile-pwa": "MOBILE PWA",
  "html-mobile": "MOBILE",
  "react-spa": "REACT (build)",
  "nextjs-react": "NEXT.JS (build)",
};

export default function SitesTab() {
  const [tpls, setTpls] = useState<Tpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch("/api/design/render/templates", { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = (await r.json()) as { ok: boolean; templates: Tpl[] };
        const websites = (j.templates || []).filter((t) => t.kind === "website");
        if (!cancelled) setTpls(websites);
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    let pages = 0;
    for (const t of tpls) pages += t.smart_objects?.pages?.length ?? 0;
    return { chassis: tpls.length, pages };
  }, [tpls]);

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
      {/* Header */}
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
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.4px",
              margin: 0,
            }}
          >
            Website Chassis
          </h1>
          <p style={{ marginTop: 4, marginBottom: 0, color: MUTED, fontSize: 13 }}>
            Every Envato website template we own, registered as a brand-swappable chassis.
          </p>
        </div>
        <div style={{ display: "flex", gap: 18, fontSize: 12, color: MUTED }}>
          <Stat label="Chassis" value={totals.chassis} />
          <Stat label="Total Pages" value={totals.pages} />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: MUTED }}>Loading…</div>
      ) : err ? (
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
          Failed to load chassis: {err}
        </div>
      ) : tpls.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: MUTED }}>
          No website chassis registered yet.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 18,
          }}
        >
          {tpls.map((t) => (
            <Tile key={t.id} t={t} />
          ))}
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <span
        style={{
          fontSize: 10,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: MUTED,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 20, fontWeight: 600, color: INK }}>{value}</span>
    </div>
  );
}

function Tile({ t }: { t: Tpl }) {
  const subkind = t.smart_objects?.subkind || "html-static";
  const subkindLabel = SUBKIND_LABEL[subkind] || subkind.toUpperCase();
  const previewUrl = t.smart_objects?.preview_url || `/preview/${t.slug}/index.html`;
  const needsBuild = !!t.smart_objects?.needs_build;
  const pageCount = t.smart_objects?.pages?.length ?? 0;
  const homepageVariants = t.smart_objects?.homepage_variants ?? 1;
  const wordmark = t.editable_text?.wordmark_string || t.slug;
  const niche = t.editable_text?.niche || "";
  const primaryHex = t.editable_text?.primary_hex;
  const accentHex = t.editable_text?.accent_hex;

  const swatchBg = primaryHex || `${RED}10`;

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
      {/* Visual band — preview thumbnail or brand-color band */}
      {t.preview_jpg_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={t.preview_jpg_url}
          alt={wordmark}
          style={{
            width: "100%",
            height: 160,
            objectFit: "cover",
            background: SOFT,
          }}
        />
      ) : (
        <div
          style={{
            height: 160,
            background: swatchBg,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.6px",
              color: subkind === "html-mobile-pwa" || subkind === "html-mobile" ? INK : PAPER,
              mixBlendMode: subkind === "html-mobile-pwa" || subkind === "html-mobile" ? "normal" : "normal",
              textShadow: "0 1px 2px rgba(0,0,0,0.15)",
            }}
          >
            {wordmark}
          </span>
          {accentHex && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                bottom: 10,
                right: 10,
                width: 14,
                height: 14,
                borderRadius: 4,
                background: accentHex,
                border: `1px solid ${PAPER}`,
              }}
            />
          )}
        </div>
      )}

      {/* Body */}
      <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
            {subkindLabel}
          </span>
          {needsBuild && (
            <span
              style={{
                fontSize: 9,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: RED,
                border: `1px solid ${RED}55`,
                padding: "3px 8px",
                borderRadius: 4,
                background: `${RED}08`,
              }}
            >
              Needs Build
            </span>
          )}
        </div>

        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: "-0.2px" }}>
            {wordmark}
          </h3>
          {niche && (
            <p style={{ margin: "2px 0 0 0", fontSize: 11, color: MUTED }}>{niche}</p>
          )}
        </div>

        <div style={{ fontSize: 11, color: MUTED, display: "flex", gap: 12 }}>
          <span>
            <strong style={{ color: INK }}>{pageCount}</strong> pages
          </span>
          {homepageVariants > 1 && (
            <span>
              <strong style={{ color: INK }}>{homepageVariants}</strong> homepages
            </span>
          )}
          {primaryHex && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span
                aria-hidden
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: primaryHex,
                  border: `1px solid ${LINE}`,
                  display: "inline-block",
                }}
              />
              <code style={{ fontSize: 10 }}>{primaryHex}</code>
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => {
              if (needsBuild) {
                e.preventDefault();
                alert(
                  "This chassis is React/Next.js — it needs a build step before it can be opened. The render-service pipeline will handle that automatically when you Render with Brand Kit.",
                );
              }
            }}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: needsBuild ? SOFT : INK,
              color: needsBuild ? MUTED : PAPER,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              textAlign: "center",
              textDecoration: "none",
              border: `1px solid ${needsBuild ? LINE : INK}`,
              cursor: needsBuild ? "not-allowed" : "pointer",
            }}
          >
            Open Live
          </a>
          <button
            type="button"
            onClick={() =>
              alert(
                "Render with Brand Kit — wired in next phase.\n\nThis will dispatch the render service: pick a brand_kit (e.g. memelli-partner-program), it swaps the wordmark / primary hex / accent hex / logo / hero photos throughout the chassis, and outputs a fully-branded multi-page site at /preview/<brand_slug>/<chassis_slug>/.",
              )
            }
            style={{
              padding: "8px 12px",
              background: PAPER,
              color: RED,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              border: `1px solid ${RED}55`,
              cursor: "pointer",
            }}
          >
            Render with Brand Kit
          </button>
        </div>
      </div>
    </div>
  );
}
