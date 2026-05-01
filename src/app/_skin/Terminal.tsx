"use client";

// Terminal skin — for ADMIN/OPS surfaces only.
// Editorial skin (banner + angled bars + big white pages) stays on CLIENT-facing
// surfaces (Sign Up, Welcome, Credit Repair walkthrough, Pre-Qual).

import { RED, RED_2 } from "./tokens";

// White admin skin — Memelli editorial family. NO BLACK BACKGROUNDS.
// Names kept for backwards compatibility with imports already in place.
export const TINK = "#FAFAFA"; // outer surface (was dark)
export const TINK_2 = "#FFFFFF"; // primary card surface
export const TINK_3 = "#FAFBFD"; // recessed card surface
export const TFG = "#0B0B0F"; // primary text (was light)
export const TFG_DIM = "#6B7280";
export const TFG_FAINT = "#9CA3AF";
export const TLINE = "#E5E7EB";
export const TLINE_STRONG = "#D1D5DB";
export const TGREEN = "#10B981";
export const TAMBER = "#F59E0B";
export const TINFO = "#6366F1";
export const TMONO =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

// ── Shell ───────────────────────────────────────────────────────

export function TerminalShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: TINK,
        color: TFG,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {children}
    </div>
  );
}

// ── Sticky terminal-style header ────────────────────────────────

export function TerminalHeader({
  title,
  subtitle,
  status = "live",
  right,
}: {
  title: string;
  subtitle?: string;
  status?: "live" | "warn" | "down" | "muted";
  right?: React.ReactNode;
}) {
  const dot =
    status === "live"
      ? RED
      : status === "warn"
        ? TAMBER
        : status === "down"
          ? "#ef4444"
          : TFG_FAINT;
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 5,
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #FAFBFD 100%)",
        borderBottom: `1px solid ${TLINE}`,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: dot,
            boxShadow: `0 0 10px ${dot}`,
            animation: "termPulse 1.6s ease-in-out infinite",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: TFG_DIM,
            }}
          >
            {subtitle ?? "Memelli OS"}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: TFG,
              letterSpacing: "-0.005em",
              marginTop: 1,
            }}
          >
            {title}
          </div>
        </div>
        {right && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {right}
          </div>
        )}
      </div>
      <style>{`@keyframes termPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .55; transform: scale(.85); } }`}</style>
    </div>
  );
}

// ── Tab bar ─────────────────────────────────────────────────────

export function TerminalTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; icon?: React.ComponentType<{ size?: number; strokeWidth?: number }> }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        background: TINK_2,
        border: `1px solid ${TLINE}`,
        borderRadius: 10,
        padding: 4,
        overflowX: "auto",
      }}
    >
      {tabs.map((t) => {
        const isActive = t.id === active;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 11px",
              borderRadius: 7,
              border: 0,
              background: isActive
                ? `linear-gradient(135deg, ${RED}, ${RED_2})`
                : "transparent",
              color: isActive ? "white" : TFG_DIM,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {Icon && <Icon size={11} strokeWidth={2.2} />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Section block (replaces editorial Section for admin) ───────

export function TerminalSection({
  title,
  hint,
  right,
  accent,
  children,
}: {
  title: string;
  hint?: string;
  right?: React.ReactNode;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: TINK_2,
        border: `1px solid ${TLINE}`,
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "9px 14px",
          borderBottom: `1px solid ${TLINE}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: accent
            ? "linear-gradient(180deg, rgba(196,30,58,0.10), transparent)"
            : TINK_2,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: accent ? RED : TFG_DIM,
          }}
        >
          <span
            aria-hidden
            style={{
              fontFamily: TMONO,
              color: RED,
              fontWeight: 800,
            }}
          >
            $
          </span>
          {title}
        </span>
        {hint && (
          <span
            style={{
              fontSize: 10.5,
              color: TFG_FAINT,
              letterSpacing: "0.04em",
            }}
          >
            {hint}
          </span>
        )}
        {right && (
          <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {right}
          </span>
        )}
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </section>
  );
}

// ── Card / KPI / Status / Index for terminal ───────────────────

export function TerminalCard({
  children,
  pad = 12,
  rail,
}: {
  children: React.ReactNode;
  pad?: number;
  rail?: string;
}) {
  return (
    <div
      style={{
        background: TINK_3,
        border: `1px solid ${TLINE}`,
        borderRadius: 8,
        padding: pad,
        position: "relative",
        boxShadow: rail ? `inset 3px 0 0 ${rail}` : undefined,
      }}
    >
      {children}
    </div>
  );
}

export function TerminalKpi({
  label,
  value,
  delta,
  tone = "muted",
  index,
  total,
}: {
  label: string;
  value: string | number;
  delta?: string;
  tone?: "ok" | "warn" | "bad" | "info" | "muted";
  index?: number;
  total?: number;
}) {
  const fg =
    tone === "ok"
      ? TGREEN
      : tone === "warn"
        ? TAMBER
        : tone === "bad"
          ? RED
          : tone === "info"
            ? TINFO
            : TFG_DIM;
  return (
    <div
      style={{
        background: TINK_3,
        border: `1px solid ${TLINE}`,
        borderRadius: 8,
        padding: 12,
        position: "relative",
      }}
    >
      {index != null && (
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: TFG_FAINT,
            fontFamily: TMONO,
          }}
        >
          {String(index).padStart(2, "0")}
          {total != null && ` / ${String(total).padStart(2, "0")}`}
        </div>
      )}
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: TFG_FAINT,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: TFG,
          marginTop: 2,
          fontFamily: TMONO,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>
      {delta && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: fg,
            marginTop: 2,
            letterSpacing: "0.04em",
          }}
        >
          {delta}
        </div>
      )}
    </div>
  );
}

export function TerminalChip({
  tone = "muted",
  children,
}: {
  tone?: "ok" | "warn" | "bad" | "info" | "muted";
  children: React.ReactNode;
}) {
  const cfg = {
    ok: { bg: "rgba(16,185,129,0.12)", fg: TGREEN },
    warn: { bg: "rgba(245,158,11,0.14)", fg: TAMBER },
    bad: { bg: "rgba(196,30,58,0.10)", fg: "#C41E3A" },
    info: { bg: "rgba(99,102,241,0.10)", fg: "#6366F1" },
    muted: { bg: "rgba(15,17,21,0.05)", fg: TFG_DIM },
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
        borderRadius: 9999,
        background: cfg.bg,
        color: cfg.fg,
        border: `1px solid ${cfg.fg}33`,
      }}
    >
      {children}
    </span>
  );
}

export function TerminalIndex({ i, total }: { i: number; total?: number }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.16em",
        color: TFG_FAINT,
        fontFamily: TMONO,
      }}
    >
      {String(i).padStart(2, "0")}
      {total != null && (
        <span style={{ color: TFG_FAINT }}>
          {" "}/ {String(total).padStart(2, "0")}
        </span>
      )}
    </span>
  );
}

// ── Functional input/form primitives (admin = functional, not editorial) ─

export function TerminalInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "password" | "tel" | "number";
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: TINK,
        border: `1px solid ${TLINE_STRONG}`,
        color: TFG,
        fontSize: 13,
        padding: "8px 10px",
        borderRadius: 6,
        outline: "none",
        width: "100%",
        fontFamily: "inherit",
        transition: "border-color 120ms",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = RED;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${RED}20`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = TLINE_STRONG;
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

export function TerminalLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: "block",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: TFG_DIM,
        marginBottom: 5,
      }}
    >
      {children}
    </label>
  );
}

export function TerminalButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  const sm = size === "sm";
  const cfg = {
    primary: {
      bg: `linear-gradient(135deg, ${RED}, ${RED_2})`,
      fg: "white",
      bd: "transparent",
    },
    ghost: {
      bg: "transparent",
      fg: TFG_DIM,
      bd: TLINE_STRONG,
    },
    danger: {
      bg: "transparent",
      fg: RED,
      bd: `${RED}40`,
    },
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: sm ? "5px 10px" : "7px 12px",
        fontSize: sm ? 10.5 : 11.5,
        fontWeight: 700,
        letterSpacing: "0.04em",
        borderRadius: 6,
        border: `1px solid ${cfg.bd}`,
        background: cfg.bg,
        color: cfg.fg,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ── Table primitives ────────────────────────────────────────────

export function TerminalTable({
  cols,
  children,
}: {
  cols: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: TINK_3,
        border: `1px solid ${TLINE}`,
        borderRadius: 6,
        overflow: "hidden",
        // Pass `cols` via CSS variable so child rows match.
        ["--tt-cols" as never]: cols,
      }}
    >
      {children}
    </div>
  );
}

export function TerminalThead({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "var(--tt-cols)",
        background: TINK,
        color: TFG_DIM,
        borderBottom: `1px solid ${TLINE}`,
      }}
    >
      {children}
    </div>
  );
}

export function TerminalTh({ children }: { children?: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "7px 10px",
        fontSize: 9,
        letterSpacing: "0.18em",
        fontWeight: 700,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

export function TerminalTr({
  children,
  onClick,
  rail,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  rail?: string;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "var(--tt-cols)",
        alignItems: "center",
        padding: "8px 10px",
        borderTop: `1px solid ${TLINE}`,
        cursor: onClick ? "pointer" : "default",
        background: TINK_2,
        boxShadow: rail ? `inset 3px 0 0 ${rail}` : undefined,
        transition: "background 120ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = TINK_3;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = TINK_2;
      }}
    >
      {children}
    </div>
  );
}

export function TerminalTd({
  children,
  mono,
  bold,
  color,
  align = "left",
}: {
  children: React.ReactNode;
  mono?: boolean;
  bold?: boolean;
  color?: string;
  align?: "left" | "right";
}) {
  return (
    <div
      style={{
        padding: "0 10px",
        fontSize: 12.5,
        fontWeight: bold ? 700 : 500,
        color: color ?? TFG,
        fontFamily: mono ? TMONO : "inherit",
        fontVariantNumeric: mono ? "tabular-nums" : undefined,
        textAlign: align,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}
