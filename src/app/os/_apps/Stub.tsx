"use client";

import { ArrowRight, ExternalLink } from "lucide-react";

const RED = "#C41E3A";
const RED_2 = "#A8182F";
const INK = "#0B0B0F";
const GRAY = "#6B7280";

export function Stub({
  appLabel,
  title,
  blurb,
  ctaHref,
  ctaLabel,
}: {
  appLabel: string;
  title: string;
  blurb: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#FAFAFA",
        color: INK,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* Sticky brand strip */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "white",
          borderBottom: "1px solid #E5E7EB",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: GRAY,
          }}
        >
          Memelli
        </span>
        <span
          style={{ width: 1, height: 14, background: "#E5E7EB" }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "3px 10px",
            borderRadius: 9999,
            background: "rgba(196,30,58,0.08)",
            color: RED,
          }}
        >
          {appLabel}
        </span>
      </div>

      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "24px 24px 40px",
        }}
      >
        {/* Editorial hero */}
        <div
          style={{
            background: "white",
            border: "1px solid #E5E7EB",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 24px 0",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: RED,
                  marginBottom: 6,
                }}
              >
                {appLabel}
              </div>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                  lineHeight: 1.05,
                  margin: 0,
                  maxWidth: 480,
                }}
              >
                {title}
              </h1>
            </div>
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.18em",
                color: GRAY,
                textTransform: "uppercase",
                textAlign: "right",
                lineHeight: 1.7,
              }}
            >
              <div>Module</div>
              <div style={{ color: INK, fontWeight: 800 }}>v0.1</div>
            </div>
          </div>

          {/* Angled bars */}
          <div
            style={{
              display: "flex",
              marginTop: 18,
              height: 40,
              position: "relative",
            }}
          >
            <div
              style={{
                flex: "0 0 60%",
                background: RED,
                clipPath:
                  "polygon(0 0, 100% 0, calc(100% - 40px) 100%, 0 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                padding: "0 22px",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
              }}
            >
              {appLabel}
            </div>
            <div
              style={{
                flex: 1,
                background: "#C9C9CD",
                clipPath:
                  "polygon(40px 0, 100% 0, 100% 100%, 0 100%)",
                marginLeft: -40,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: "0 22px",
                color: INK,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
              }}
            >
              Memelli OS
            </div>
          </div>

          {/* Ink strip */}
          <div
            style={{
              background: INK,
              color: "white",
              padding: "8px 22px",
              fontSize: 9,
              letterSpacing: "0.32em",
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
              textTransform: "uppercase",
            }}
          >
            <span>{ctaHref ? "Live Surface" : "Coming Soon"}</span>
            <span style={{ color: RED }}>
              {ctaHref ? "READY" : "WIP"}
            </span>
          </div>
        </div>

        {/* Body card */}
        <div
          style={{
            marginTop: 16,
            background: "white",
            border: "1px solid #E5E7EB",
            borderRadius: 16,
            padding: 28,
            boxShadow:
              "0 1px 0 rgba(0,0,0,0.02), 0 8px 24px -16px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: GRAY,
            }}
          >
            About
          </span>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: GRAY,
              margin: 0,
              maxWidth: 560,
            }}
          >
            {blurb}
          </p>

          {ctaHref ? (
            <a
              href={ctaHref}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "11px 20px",
                borderRadius: 9999,
                border: 0,
                background: `linear-gradient(135deg, ${RED}, ${RED_2})`,
                color: "white",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.04em",
                cursor: "pointer",
                textDecoration: "none",
                boxShadow:
                  "0 0 0 1px rgba(196,30,58,0.4), 0 8px 22px -8px rgba(196,30,58,0.55)",
                marginTop: 6,
              }}
            >
              {ctaLabel || "Open"}
              <ExternalLink size={12} strokeWidth={2.4} />
            </a>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 9999,
                border: "1px dashed #E5E7EB",
                color: GRAY,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginTop: 6,
              }}
            >
              Coming soon
              <ArrowRight size={12} strokeWidth={2} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
