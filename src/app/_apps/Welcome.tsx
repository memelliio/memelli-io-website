"use client";

import { ArrowRight } from "lucide-react";
import { useWindowStore } from "../_lib/window-store";

const RED = "var(--brand-color, #C41E3A)";
const INK = "#0B0B0F";
const GRAY = "#6B7280";

const TILES: { title: string; desc: string; appId: string }[] = [
  { title: "Pre-Qualification", desc: "Soft-pull funding match.", appId: "pre-qualification" },
  { title: "Credit Repair", desc: "6-step bureau dispute round.", appId: "credit-repair" },
  { title: "Credit Reports", desc: "Tri-bureau live pull.", appId: "credit-reports" },
  { title: "CRM", desc: "Pipelines and contacts.", appId: "crm" },
  { title: "Memelli Terminal", desc: "Chat with Claude, Groq, Bar — chat lives inside the terminal.", appId: "memelli-terminal" },
  { title: "Notes", desc: "Quick scratchpad.", appId: "notes" },
];

export function Welcome() {
  const open = useWindowStore((s) => s.open);
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
          Welcome
        </span>
      </div>

      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "20px 24px 40px",
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
            }}
          >
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
              Memelli OS
            </div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: "-0.6px",
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              Your business,{" "}
              <span style={{ color: RED }}>one operating system.</span>
            </h1>
          </div>

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
              Members
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
              Welcome
            </div>
          </div>

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
            <span>Get Started</span>
            <span style={{ color: RED }}>v0.1</span>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          {TILES.map((t) => (
            <button
              key={t.appId}
              type="button"
              onClick={() => open(t.appId)}
              style={{
                background: "white",
                border: "1px solid #E5E7EB",
                borderRadius: 14,
                padding: 16,
                textAlign: "left",
                cursor: "pointer",
                transition: "all 150ms",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                position: "relative",
                boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = RED;
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 22px -8px rgba(196,30,58,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E5E7EB";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 1px 0 rgba(0,0,0,0.02)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: INK,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {t.title}
                </span>
                <ArrowRight
                  size={13}
                  strokeWidth={2.4}
                  color={GRAY}
                  className="welcome-arrow"
                />
              </div>
              <span
                style={{
                  fontSize: 11.5,
                  color: GRAY,
                  lineHeight: 1.4,
                }}
              >
                {t.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
