"use client";

/**
 * WedSnap Tab — full brand bundle showcase for the wedding-photography demo.
 *
 * Demonstrates "what every Memelli-built brand looks like":
 *   1. Brand kit summary (colors, fonts, voice, contact)
 *   2. Logo (Wan 2.7-image AI-generated, R2-hosted)
 *   3. Print + mockup renders (server-side PSD pipeline via design.memelli.io)
 *   4. Social banners (Instagram / Facebook / Twitter — Wan 2.7-image)
 *   5. Brand site (live preview iframe + open-in-new-tab)
 *
 * Data sources:
 *   - Brand info: hard-coded from .scratch/wedsnap-bundle/_state.json
 *   - Renders: GET /api/design/render?brand_kit_id=<wedsnap-uuid>
 *   - Local files: /preview/wedsnap/assets/*
 *   - Site: /preview/wedsnap/index.html
 */

import { useEffect, useState } from "react";

const RED = "#C41E3A";
const INK = "#0B0B0F";
const PAPER = "#FFFFFF";
const LINE = "#E5E7EB";
const SOFT = "#F5F5F5";
const MUTED = "#6B7280";

const WEDSNAP_BRAND_KIT_ID = "11ea6335-2024-4d11-bc8a-7e3dfec1eb35";
const ASSETS = "/preview/wedsnap/assets";
const SITE_URL = "/preview/wedsnap/index.html";

const BRAND = {
  name: "WedSnap",
  niche: "Wedding photography · Charleston, SC",
  tagline: "Real moments, beautifully kept.",
  primary: "#B86A8C",
  accent: "#E8C5A0",
  ink: "#3A2D2A",
  paper: "#FAF5EF",
  heading: "Playfair Display",
  body: "Inter",
  voice: "warm",
  email: "hello@wedsnap.com",
  phone: "+1 (888) 555-0123",
  url: "https://wedsnap.com",
  address: "WedSnap Studios · Charleston, SC",
  brandKitId: WEDSNAP_BRAND_KIT_ID,
};

type Render = {
  id: string;
  template_id: string;
  template_slug: string;
  template_kind?: string;
  brand_kit_id: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";
  output_url?: string;
  error_text?: string;
  enqueued_at?: string;
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#94A3B8",
  RUNNING: "#F59E0B",
  SUCCESS: "#10B981",
  FAILED: "#DC2626",
  CANCELLED: "#6B7280",
};

const SOCIAL_BANNERS = [
  { id: "instagram", label: "Instagram · 1080×1080", file: `${ASSETS}/banner-instagram.png`, ratio: "1/1" },
  { id: "facebook",  label: "Facebook · 1200×630",   file: `${ASSETS}/banner-facebook.png`,  ratio: "16/9" },
  { id: "twitter",   label: "Twitter · 1500×500",     file: `${ASSETS}/banner-twitter.png`,   ratio: "3/1" },
];

export default function WedSnapTab() {
  const [renders, setRenders] = useState<Render[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/design/render?brand_kit_id=${WEDSNAP_BRAND_KIT_ID}&limit=50`, {
          cache: "no-store",
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (!cancelled) setRenders(j.renders || j.data?.renders || []);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const t = setInterval(load, 8000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return (
    <main style={{ padding: 24, overflowY: "auto", height: "100%", background: PAPER, fontFamily: "Inter,system-ui,sans-serif" }}>
      <Header />

      {/* Brand kit summary */}
      <Section title="Brand kit" subtitle={`brand_kit_id ${WEDSNAP_BRAND_KIT_ID}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <BrandCard />
          <PaletteCard />
        </div>
      </Section>

      {/* Logo */}
      <Section title="Logo" subtitle="Wan 2.7-image · Nutlope 5-slot framework · Hosted on R2 + brand_kits.logo_master_url">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Tile
            file={`${ASSETS}/logo.png`}
            label="Logo · master"
            note="On warm cream — what shows on the website nav and contact pieces."
            background={BRAND.paper}
            ratio="1/1"
          />
          <Tile
            file={`${ASSETS}/logo.png`}
            label="Logo · ink reverse"
            note="Same file, set on deep ink ground for footers and dark UI."
            background={BRAND.ink}
            ratio="1/1"
          />
        </div>
      </Section>

      {/* Live brand site */}
      <Section title="Brand site" subtitle={SITE_URL}>
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden", background: PAPER }}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${LINE}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: SOFT }}>
            <div style={{ fontSize: 12, color: INK }}>
              <strong>WedSnap</strong> — Charleston wedding photography studio · single-page live site
            </div>
            <a href={SITE_URL} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: RED, textDecoration: "none", fontWeight: 600 }}>Open in new tab ↗</a>
          </div>
          <iframe src={SITE_URL} title="WedSnap" sandbox="allow-scripts allow-same-origin" style={{ width: "100%", height: 560, border: "none", background: PAPER }} />
        </div>
      </Section>

      {/* Renders from design.memelli.io */}
      <Section title="Print + mockup renders" subtitle="Server-side PSD pipeline · design.memelli.io · ag-psd smart-object swap">
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: MUTED, fontSize: 13 }}>Loading renders…</div>
        ) : err ? (
          <div style={{ padding: 16, background: `${RED}10`, color: RED, borderRadius: 8, fontSize: 13 }}>Error: {err}</div>
        ) : renders.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: MUTED, fontSize: 13 }}>No renders yet for this brand kit.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {renders.map((r) => (
              <RenderTile key={r.id} render={r} />
            ))}
          </div>
        )}
      </Section>

      {/* Social banners */}
      <Section title="Social banners" subtitle="Wan 2.7-image · cinematic still-life with negative space for overlay text">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {SOCIAL_BANNERS.map((b) => (
            <Tile key={b.id} file={b.file} label={b.label} note="Pure photography — overlay copy is added per-post in CRM." ratio={b.ratio} background={SOFT} />
          ))}
        </div>
      </Section>
    </main>
  );
}

function Header() {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ display: "inline-block", width: 6, height: 18, background: BRAND.primary, borderRadius: 2 }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: BRAND.primary }}>WedSnap · Brand Bundle Demo</span>
      </div>
      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", color: INK, marginBottom: 8 }}>What every Memelli-built brand looks like</h1>
      <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, maxWidth: 760 }}>
        End-to-end demonstration of the brand-bundle pipeline for the wedding-photography niche. One niche, one brand kit, one logo, one site, eight print/mockup renders, three social banners — all rendered from the same kernel-DB source of truth.
      </p>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${LINE}` }}>
        <h2 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.32em", textTransform: "uppercase", color: INK }}>{title}</h2>
        <span style={{ fontSize: 11, color: MUTED, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace" }}>{subtitle}</span>
      </div>
      {children}
    </section>
  );
}

function BrandCard() {
  return (
    <div style={{ background: SOFT, padding: 18, borderRadius: 10, border: `1px solid ${LINE}` }}>
      <div style={{ fontSize: 11, color: BRAND.primary, fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", marginBottom: 6 }}>Brand</div>
      <div style={{ fontFamily: "Playfair Display,serif", fontSize: 28, fontWeight: 700, color: INK, marginBottom: 4 }}>{BRAND.name}</div>
      <div style={{ fontFamily: "Playfair Display,serif", fontStyle: "italic", fontSize: 15, color: BRAND.primary, marginBottom: 14 }}>{BRAND.tagline}</div>
      <div style={{ fontSize: 12, color: INK, lineHeight: 1.7 }}>
        <div><strong>Niche:</strong> {BRAND.niche}</div>
        <div><strong>Voice:</strong> {BRAND.voice} · editorial · romantic</div>
        <div><strong>Heading:</strong> {BRAND.heading}</div>
        <div><strong>Body:</strong> {BRAND.body}</div>
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${LINE}`, color: MUTED }}>
          {BRAND.email}<br />{BRAND.phone}<br />{BRAND.address}
        </div>
      </div>
    </div>
  );
}

function PaletteCard() {
  const swatches = [
    { name: "Primary · dusty rose", hex: BRAND.primary, dark: true },
    { name: "Accent · warm cream",  hex: BRAND.accent,  dark: false },
    { name: "Ink · warm espresso",  hex: BRAND.ink,     dark: true },
    { name: "Paper · ivory",        hex: BRAND.paper,   dark: false },
  ];
  return (
    <div style={{ background: SOFT, padding: 18, borderRadius: 10, border: `1px solid ${LINE}` }}>
      <div style={{ fontSize: 11, color: BRAND.primary, fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", marginBottom: 12 }}>Palette</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {swatches.map((s) => (
          <div key={s.hex} style={{ background: s.hex, color: s.dark ? "#FAF5EF" : "#3A2D2A", padding: "16px 12px", borderRadius: 8, fontSize: 11 }}>
            <div style={{ fontWeight: 700 }}>{s.name}</div>
            <div style={{ fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", marginTop: 3, opacity: 0.8 }}>{s.hex}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tile({ file, label, note, background, ratio = "1/1" }: { file: string; label: string; note: string; background: string; ratio?: string }) {
  return (
    <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <a href={file} target="_blank" rel="noreferrer" style={{ aspectRatio: ratio, background, display: "grid", placeItems: "center", overflow: "hidden" }}>
        <img src={file} alt={label} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
      </a>
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${LINE}` }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.32em", textTransform: "uppercase", color: BRAND.primary }}>{label}</div>
        <div style={{ fontSize: 11.5, color: MUTED, marginTop: 4, lineHeight: 1.5 }}>{note}</div>
      </div>
    </div>
  );
}

function RenderTile({ render }: { render: Render }) {
  const color = STATUS_COLOR[render.status] ?? MUTED;
  return (
    <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {render.output_url ? (
        <a href={render.output_url} target="_blank" rel="noreferrer" style={{ aspectRatio: "16/10", background: SOFT, display: "grid", placeItems: "center", overflow: "hidden" }}>
          <img src={render.output_url} alt={render.template_slug} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        </a>
      ) : (
        <div style={{ aspectRatio: "16/10", background: SOFT, display: "grid", placeItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color }}>{render.status}</span>
        </div>
      )}
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${LINE}` }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.32em", textTransform: "uppercase", color }}>
          {render.template_kind || "render"} · {render.status}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: INK, marginTop: 3 }}>{render.template_slug}</div>
        {render.error_text && (
          <div style={{ fontSize: 10.5, color: RED, marginTop: 4, lineHeight: 1.4 }}>{render.error_text.slice(0, 120)}</div>
        )}
      </div>
    </div>
  );
}
