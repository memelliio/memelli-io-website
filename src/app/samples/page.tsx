// /samples — operator-facing asset preview page.
// Editorial Memelli skin (white + #C41E3A red + black, Inter).
// Renders:
//   1. Live Memelli logo reveal (CSS keyframe animation, hand-crafted)
//   2. Website templates (5)        — PNG thumb -> click to open modal with live iframe
//   3. Print / business cards (5)   — JPG thumb -> click to download/copy ZIP path
//   4. Motion previews              — placeholder note (none in Downloads at audit time)
//   5. Animated icons               — placeholder note (none in Downloads at audit time)
//
// Manifest produced by .scratch/samples-render.mjs at build/refresh time.
// Static import is fine because the manifest sits inside apps/web/public/samples/.
"use client";

import { useEffect, useState } from "react";
import MemelliLogoReveal from "./_components/MemelliLogoReveal";

type WebsiteEntry = {
  slug: string;
  name: string;
  sourceZip: string;
  category: string;
  preview: string;
  iframeSrc: string;
  landingHtml: string;
};

type PrintEntry = {
  slug: string;
  name: string;
  sourceZip: string;
  category: string;
  subKind?: string;
  preview: string;
  downloadHint: string;
};

type Manifest = {
  generatedAt: string;
  websiteTemplates: WebsiteEntry[];
  print: PrintEntry[];
  motion: { slug: string; name: string; src: string }[];
  icons: { slug: string; name: string; src: string }[];
  failed: { kind: string; file: string; reason: string }[];
};

export default function SamplesPage() {
  const [m, setM] = useState<Manifest | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [openSite, setOpenSite] = useState<WebsiteEntry | null>(null);
  const [openImg, setOpenImg] = useState<PrintEntry | null>(null);

  useEffect(() => {
    fetch("/samples/manifest.json", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`manifest ${r.status}`);
        return r.json();
      })
      .then(setM)
      .catch((e) => setLoadErr(String(e?.message || e)));
  }, []);

  return (
    <main className="samples-root">
      {/* Header */}
      <header className="samples-header">
        <div className="samples-header-inner">
          <div className="samples-brand">
            <img
              src="/memelli-logo.png"
              alt="Memelli"
              className="samples-brand-logo"
            />
            <div className="samples-brand-text">
              <div className="samples-brand-eyebrow">Operator preview</div>
              <h1 className="samples-brand-title">Asset samples</h1>
            </div>
          </div>
          <div className="samples-meta">
            {m ? (
              <span>
                generated {new Date(m.generatedAt).toLocaleString()}
              </span>
            ) : (
              <span>loading manifest…</span>
            )}
          </div>
        </div>
      </header>

      {/* Section 1: Logo Reveal */}
      <section className="samples-section samples-section-reveal">
        <SectionHeading
          eyebrow="01 · Logo reveal"
          title="Memelli logo — live CSS reveal"
          sub="Hand-crafted on-page animation. No After Effects, no SaaS render. Replay and scrub speed below."
        />
        <div className="reveal-host">
          <MemelliLogoReveal />
        </div>
      </section>

      {/* Section 2: Website templates */}
      <section className="samples-section">
        <SectionHeading
          eyebrow="02 · Website templates"
          title="Coaching · fitness · education landing pages"
          sub="Click any preview to open the live HTML in an iframe modal."
        />
        {!m && !loadErr && <Loading />}
        {loadErr && <ErrorNote msg={loadErr} />}
        {m && (
          <div className="samples-grid samples-grid-website">
            {m.websiteTemplates.map((t) => (
              <button
                key={t.slug}
                className="card card-website"
                onClick={() => setOpenSite(t)}
              >
                <div className="card-thumb-wrap">
                  <img src={t.preview} alt={t.name} className="card-thumb" />
                </div>
                <div className="card-meta">
                  <div className="card-name">{t.name}</div>
                  <div className="card-sub">{t.category}</div>
                  <div className="card-cta">
                    <span>Open live</span>
                    <span aria-hidden>→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Print / cards */}
      <section className="samples-section">
        <SectionHeading
          eyebrow="03 · Print · cards · banners"
          title="Business cards, brochures, banner sets"
          sub="Click any preview to view full-size. PSD / AI / EPS source files live in your Downloads folder."
        />
        {m && (
          <div className="samples-grid samples-grid-print">
            {m.print.map((p) => (
              <button
                key={p.slug}
                className="card card-print"
                onClick={() => setOpenImg(p)}
              >
                <div className="card-thumb-wrap card-thumb-wrap-print">
                  <img src={p.preview} alt={p.name} className="card-thumb" />
                </div>
                <div className="card-meta">
                  <div className="card-name">{p.name}</div>
                  <div className="card-sub">{p.category}</div>
                  <div className="card-cta">
                    <span>View full</span>
                    <span aria-hidden>→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Section 4: Motion */}
      <section className="samples-section">
        <SectionHeading
          eyebrow="04 · Motion / logo reveals"
          title="Bundled MP4 previews"
          sub="Auto-extracted from any After Effects pack present in Downloads."
        />
        {m && m.motion.length === 0 && (
          <EmptyNote>
            No After Effects packs (.aep / .mogrt) found in Downloads at audit
            time. The pipeline is ready — drop a pack into{" "}
            <code>C:\Users\ADMIN\Downloads</code> and re-run{" "}
            <code>node .scratch/samples-render.mjs</code>.
          </EmptyNote>
        )}
        {m && m.motion.length > 0 && (
          <div className="samples-grid samples-grid-motion">
            {m.motion.map((mo) => (
              <video
                key={mo.slug}
                src={mo.src}
                muted
                loop
                playsInline
                controls
                className="card-video"
              />
            ))}
          </div>
        )}
      </section>

      {/* Section 5: Animated icons */}
      <section className="samples-section">
        <SectionHeading
          eyebrow="05 · Animated icons"
          title="Lottie + animated SVG packs"
          sub="When present, Lottie JSON renders inline via lottie-web (MIT). Animated SVGs play natively."
        />
        {m && m.icons.length === 0 && (
          <EmptyNote>
            No icon packs (Lottie JSON / animated SVG) found in Downloads at
            audit time. The category is wired and will populate automatically
            when one shows up.
          </EmptyNote>
        )}
      </section>

      {/* Failures (if any) */}
      {m && m.failed.length > 0 && (
        <section className="samples-section samples-section-failures">
          <SectionHeading
            eyebrow="appendix"
            title="Audit failures"
            sub="Items in Downloads that could not be rendered. Each row carries the reason."
          />
          <ul className="failure-list">
            {m.failed.map((f, i) => (
              <li key={i} className="failure-row">
                <span className="failure-kind">{f.kind}</span>
                <span className="failure-file">{f.file}</span>
                <span className="failure-reason">{f.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Modal — live website iframe */}
      {openSite && (
        <Modal onClose={() => setOpenSite(null)} title={openSite.name}>
          <iframe
            src={openSite.iframeSrc}
            title={openSite.name}
            className="modal-iframe"
            sandbox="allow-same-origin allow-scripts"
          />
          <div className="modal-iframe-meta">
            source ZIP:{" "}
            <code className="modal-source-path">{openSite.sourceZip}</code>
          </div>
        </Modal>
      )}

      {/* Modal — full image view */}
      {openImg && (
        <Modal onClose={() => setOpenImg(null)} title={openImg.name}>
          <div className="modal-image-wrap">
            <img src={openImg.preview} alt={openImg.name} />
          </div>
          <div className="modal-iframe-meta">
            {openImg.downloadHint}
            <br />
            source ZIP:{" "}
            <code className="modal-source-path">{openImg.sourceZip}</code>
          </div>
        </Modal>
      )}

      <style jsx>{`
        :global(html), :global(body) {
          background: #fafafa;
          color: #0f0f0f;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            "Segoe UI", Roboto, sans-serif;
        }

        .samples-root {
          min-height: 100vh;
          background: linear-gradient(180deg, #ffffff 0%, #f7f5f5 100%);
          color: #0f0f0f;
          padding-bottom: 96px;
        }

        .samples-header {
          background: #ffffff;
          border-bottom: 1px solid #ececec;
          padding: 28px 0;
        }
        .samples-header-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }
        .samples-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .samples-brand-logo {
          width: 46px;
          height: 46px;
          object-fit: contain;
        }
        .samples-brand-eyebrow {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #c41e3a;
          font-weight: 500;
        }
        .samples-brand-title {
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 2px 0 0;
        }
        .samples-meta {
          font-size: 12px;
          color: #6b6b6b;
        }

        .samples-section {
          max-width: 1280px;
          margin: 0 auto;
          padding: 56px 28px 12px;
        }

        .samples-section-reveal {
          padding-top: 56px;
        }
        .reveal-host {
          max-width: 920px;
          margin: 24px 0 0;
        }

        .samples-grid {
          display: grid;
          gap: 22px;
          margin-top: 28px;
        }
        .samples-grid-website,
        .samples-grid-print,
        .samples-grid-motion {
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }

        .card {
          background: #ffffff;
          border: 1px solid #ececec;
          border-radius: 14px;
          overflow: hidden;
          padding: 0;
          text-align: left;
          cursor: pointer;
          transition: transform 180ms ease, box-shadow 180ms ease,
            border-color 180ms ease;
          font-family: inherit;
          color: inherit;
          display: flex;
          flex-direction: column;
        }
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(20, 0, 0, 0.07),
            0 2px 6px rgba(0, 0, 0, 0.04);
          border-color: #d8d8d8;
        }
        .card-thumb-wrap {
          aspect-ratio: 16 / 10;
          overflow: hidden;
          background: #f3f3f3;
          border-bottom: 1px solid #ececec;
        }
        .card-thumb-wrap-print {
          aspect-ratio: 1 / 1;
          background: #f7f7f7;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .card-thumb-wrap-print .card-thumb {
          object-fit: contain;
          padding: 16px;
        }
        .card-meta {
          padding: 16px 18px 18px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .card-name {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.005em;
          text-transform: capitalize;
          color: #1a1a1a;
        }
        .card-sub {
          font-size: 12px;
          color: #6b6b6b;
        }
        .card-cta {
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #c41e3a;
          font-size: 13px;
          font-weight: 500;
        }

        /* Empty / error notes */
        .empty-note,
        .error-note,
        .loading-note {
          margin-top: 20px;
          padding: 16px 18px;
          background: #ffffff;
          border: 1px dashed #d8d8d8;
          border-radius: 12px;
          font-size: 13px;
          color: #4d4d4d;
        }
        .empty-note code {
          background: #f4f4f4;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }
        .error-note {
          border-color: #f0c4cb;
          color: #88121f;
          background: #fff5f7;
        }

        /* Failure list */
        .samples-section-failures {
          padding-top: 32px;
        }
        .failure-list {
          margin-top: 18px;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .failure-row {
          display: grid;
          grid-template-columns: 110px 1fr 1fr;
          gap: 14px;
          padding: 10px 14px;
          background: #fff;
          border: 1px solid #f0d8dc;
          border-radius: 10px;
          font-size: 12px;
        }
        .failure-kind {
          color: #c41e3a;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .failure-file {
          color: #1f1f1f;
          font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
          word-break: break-all;
        }
        .failure-reason {
          color: #6b6b6b;
        }

        /* Modal */
        :global(.samples-modal-backdrop) {
          position: fixed;
          inset: 0;
          background: rgba(20, 0, 0, 0.55);
          backdrop-filter: blur(6px);
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
        }
        :global(.samples-modal) {
          background: #ffffff;
          border-radius: 14px;
          width: min(1200px, 100%);
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
        }
        :global(.samples-modal-head) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid #ececec;
          flex-shrink: 0;
        }
        :global(.samples-modal-title) {
          font-size: 14px;
          font-weight: 600;
          color: #0f0f0f;
          text-transform: capitalize;
        }
        :global(.samples-modal-close) {
          background: #c41e3a;
          color: #fff;
          border: 0;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
        }
        :global(.samples-modal-body) {
          flex: 1;
          overflow: auto;
          background: #f5f5f5;
        }
        .modal-iframe {
          width: 100%;
          height: 75vh;
          border: 0;
          background: #ffffff;
          display: block;
        }
        .modal-iframe-meta {
          padding: 14px 20px;
          border-top: 1px solid #ececec;
          font-size: 12px;
          color: #4d4d4d;
          background: #fff;
          flex-shrink: 0;
        }
        .modal-source-path {
          background: #f4f4f4;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
        }
        .modal-image-wrap {
          padding: 24px;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-image-wrap img {
          max-width: 100%;
          max-height: 78vh;
          border-radius: 6px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
        }
      `}</style>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="section-heading">
      <div className="section-eyebrow">{eyebrow}</div>
      <h2 className="section-title">{title}</h2>
      <p className="section-sub">{sub}</p>
      <style jsx>{`
        .section-heading {
          max-width: 760px;
        }
        .section-eyebrow {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #c41e3a;
          font-weight: 500;
        }
        .section-title {
          margin: 8px 0 6px;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.015em;
          color: #0f0f0f;
        }
        .section-sub {
          margin: 0;
          color: #4d4d4d;
          font-size: 14px;
          line-height: 1.55;
        }
      `}</style>
    </div>
  );
}

function Loading() {
  return <div className="loading-note">loading manifest…</div>;
}
function ErrorNote({ msg }: { msg: string }) {
  return <div className="error-note">manifest error: {msg}</div>;
}
function EmptyNote({ children }: { children: React.ReactNode }) {
  return <div className="empty-note">{children}</div>;
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="samples-modal-backdrop" onClick={onClose}>
      <div className="samples-modal" onClick={(e) => e.stopPropagation()}>
        <div className="samples-modal-head">
          <div className="samples-modal-title">{title}</div>
          <button
            type="button"
            className="samples-modal-close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="samples-modal-body">{children}</div>
      </div>
    </div>
  );
}
