"use client";

import {
  RED,
  RED_2,
  RED_GLOW,
  INK,
  SOFT,
  PAPER,
  LINE,
  LINE_SOFT,
  GRAY_MID,
  MUTED,
  RADIUS,
  RADIUS_PILL,
  SHADOW_CARD,
  TRACK_EYEBROW,
  TRACK_WIDE,
  TRACK_TIGHTER,
} from "./tokens";

// ── EditorialShell — top-level wrapper for any app surface ──────────

export function EditorialShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: SOFT,
        color: INK,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {children}
    </div>
  );
}

// ── BrandHeader — sticky brand strip with pill + optional right slot

export function BrandHeader({
  app,
  right,
}: {
  app: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 5,
        background: PAPER,
        borderBottom: `1px solid ${LINE}`,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: TRACK_WIDE,
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            Memelli
          </span>
          <span
            style={{ width: 1, height: 14, background: LINE }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "3px 10px",
              borderRadius: RADIUS_PILL,
              background: "rgba(196,30,58,0.08)",
              color: RED,
            }}
          >
            {app}
          </span>
        </div>
        {right && (
          <div
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {right}
          </div>
        )}
      </div>
    </div>
  );
}

// ── EditorialHero — eyebrow + title + angled bars + ink strip ──────

export function EditorialHero({
  eyebrow,
  title,
  redLabel,
  grayLabel,
  inkLeft,
  inkRight,
  meta,
  accent,
}: {
  eyebrow: string;
  title: React.ReactNode;
  redLabel?: string;
  grayLabel?: string;
  inkLeft?: string;
  inkRight?: string;
  meta?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: PAPER,
        border: `1px solid ${LINE}`,
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
              letterSpacing: TRACK_EYEBROW,
              textTransform: "uppercase",
              color: accent ? RED : MUTED,
              marginBottom: 6,
            }}
          >
            {eyebrow}
          </div>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: TRACK_TIGHTER,
              lineHeight: 1.05,
              margin: 0,
              maxWidth: 540,
              color: INK,
            }}
          >
            {title}
          </h1>
        </div>
        {meta}
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
            color: PAPER,
            display: "flex",
            alignItems: "center",
            padding: "0 22px",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: TRACK_EYEBROW,
            textTransform: "uppercase",
          }}
        >
          {redLabel ?? eyebrow}
        </div>
        <div
          style={{
            flex: 1,
            background: GRAY_MID,
            clipPath: "polygon(40px 0, 100% 0, 100% 100%, 0 100%)",
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
          {grayLabel ?? "Memelli OS"}
        </div>
      </div>

      <div
        style={{
          background: INK,
          color: PAPER,
          padding: "8px 22px",
          fontSize: 9,
          letterSpacing: TRACK_EYEBROW,
          fontWeight: 600,
          display: "flex",
          justifyContent: "space-between",
          textTransform: "uppercase",
        }}
      >
        <span>{inkLeft ?? "Live Surface"}</span>
        <span style={{ color: RED }}>{inkRight ?? "READY"}</span>
      </div>
    </div>
  );
}

// ── Section — eyebrow + title + 6px angled mini-bar + body card ────

export function Section({
  eyebrow,
  title,
  icon,
  accent,
  right,
  children,
}: {
  eyebrow: string;
  title: string;
  icon?: React.ReactNode;
  accent?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: PAPER,
        border: `1px solid ${LINE}`,
        borderRadius: RADIUS,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px 0",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: TRACK_EYEBROW,
              textTransform: "uppercase",
              color: accent ? RED : MUTED,
              marginBottom: 4,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {icon}
            {eyebrow}
          </div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: TRACK_TIGHTER,
              lineHeight: 1.1,
              margin: 0,
              color: INK,
            }}
          >
            {title}
          </h2>
        </div>
        {right}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 14,
          height: 6,
        }}
      >
        <div
          style={{
            flex: "0 0 60%",
            background: accent ? RED : INK,
            clipPath:
              "polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)",
          }}
        />
        <div
          style={{
            flex: 1,
            background: GRAY_MID,
            clipPath: "polygon(14px 0, 100% 0, 100% 100%, 0 100%)",
            marginLeft: -14,
          }}
        />
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </section>
  );
}

// ── Card — minimal white surface used inside sections ──────────────

export function Card({
  children,
  pad = 16,
  flat,
}: {
  children: React.ReactNode;
  pad?: number;
  flat?: boolean;
}) {
  return (
    <div
      style={{
        background: PAPER,
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        padding: pad,
        boxShadow: flat ? "none" : SHADOW_CARD,
      }}
    >
      {children}
    </div>
  );
}

// ── Eyebrow — small tracked uppercase label ────────────────────────

export function Eyebrow({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      style={{
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: TRACK_WIDE,
        textTransform: "uppercase",
        color: accent ? RED : MUTED,
      }}
    >
      {children}
    </span>
  );
}

// ── Buttons ─────────────────────────────────────────────────────────

export function PrimaryPill({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 16px",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "0.04em",
        borderRadius: RADIUS_PILL,
        border: 0,
        background: `linear-gradient(135deg, ${RED}, ${RED_2})`,
        color: PAPER,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        boxShadow: RED_GLOW,
      }}
    >
      {children}
    </button>
  );
}

export function OutlinePill({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "8px 12px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        borderRadius: RADIUS_PILL,
        border: `1px solid ${LINE}`,
        background: PAPER,
        color: MUTED,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ── Index — `01 / 12` numeric index used on every list item ──────

export function Index({
  i,
  total,
  active,
  size = "sm",
}: {
  i: number;
  total?: number;
  active?: boolean;
  size?: "sm" | "md";
}) {
  const fontSize = size === "md" ? 11 : 9.5;
  return (
    <span
      style={{
        fontSize,
        fontWeight: 800,
        letterSpacing: "0.16em",
        color: active ? RED : MUTED,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {String(i).padStart(2, "0")}
      {total != null && (
        <span style={{ color: MUTED, fontWeight: 600 }}>
          {" "}/ {String(total).padStart(2, "0")}
        </span>
      )}
    </span>
  );
}

// ── Stat — label + value ───────────────────────────────────────────

export function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: MUTED,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: accent ? RED : INK,
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Status pill (tone-driven) ──────────────────────────────────────

export type Tone = "ok" | "warn" | "bad" | "info" | "muted";

export function StatusChip({
  tone,
  children,
}: {
  tone: Tone;
  children: React.ReactNode;
}) {
  const cfg = {
    ok: { bg: "rgba(16,185,129,0.10)", fg: "#10B981" },
    warn: { bg: "rgba(245,158,11,0.10)", fg: "#F59E0B" },
    bad: { bg: "rgba(196,30,58,0.10)", fg: RED },
    info: { bg: "rgba(99,102,241,0.10)", fg: "#6366F1" },
    muted: { bg: LINE_SOFT, fg: MUTED },
  }[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        padding: "3px 8px",
        borderRadius: RADIUS_PILL,
        background: cfg.bg,
        color: cfg.fg,
        border: `1px solid ${cfg.fg}33`,
      }}
    >
      {children}
    </span>
  );
}
