"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useWindowStore } from "../_lib/window-store";

const RED = "var(--brand-color, #C41E3A)";
const RED_2 = "#A8182F";
const INK = "#0F1115";
const PAPER = "#FFFFFF";
const LINE = "#E5E7EB";
const MUTED = "rgba(15,17,21,0.55)";

const TAB_W_SIDE = 36;
const TAB_H_SIDE = 120;
const TAB_H_BOTTOM = 26;
const TASKBAR_H = 52;
const DRAWER_W = 320;
const SIDE_TOP = 408;
const BOTTOM_RIGHT = 155; // sits LEFT of JourneyTab (right:16) — gap clears its width

function displayName(u: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): string {
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return full || u.email || "Signed in";
}

function initials(name?: string | null, email?: string | null): string {
  const src = (name || email || "?").trim();
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

export function SignInTab() {
  const { user, login, logout, isLoading } = useAuth();
  const openWindow = useWindowStore((s) => s.open);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (drawerRef.current?.contains(t)) return;
      if (tabRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) {
      setErr(null);
      setSubmitting(false);
    }
  }, [open]);

  if (isLoading) return null;

  const authed = !!user;
  const placement: "side" | "bottom" = authed ? "bottom" : "side";
  const label = authed ? "Sign Out" : "Sign In";

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErr(null);
    setSubmitting(true);
    try {
      await login(email.trim(), pw, true);
      setEmail("");
      setPw("");
      setOpen(false);
      // Take the signed-in user somewhere — pre-qualification is the funnel start.
      // If they've already completed it, the app shows their existing application.
      try { openWindow("pre-qualification"); } catch { /* registry miss is non-fatal */ }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onSignOut = () => {
    setOpen(false);
    logout();
  };

  // ── BOTTOM placement (logged-in) ─────────────────────────────────────
  if (placement === "bottom") {
    return (
      <>
        <button
          ref={tabRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={label}
          title={label}
          style={{
            position: "fixed",
            bottom: TASKBAR_H,
            right: BOTTOM_RIGHT,
            height: TAB_H_BOTTOM,
            padding: "0 14px",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: 0,
            borderRadius: "8px 8px 0 0",
            background: open
              ? `linear-gradient(180deg, ${RED}, ${RED_2})`
              : PAPER,
            color: open ? PAPER : RED,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            boxShadow: open
              ? "0 -4px 12px -4px rgba(196,30,58,0.4)"
              : "0 -2px 8px -2px rgba(15,17,21,0.10)",
            borderTop: `1px solid ${open ? RED : LINE}`,
            borderLeft: `1px solid ${open ? RED : LINE}`,
            borderRight: `1px solid ${open ? RED : LINE}`,
            zIndex: 99996,
          }}
        >
          <LogOut size={11} strokeWidth={2.4} />
          {label}
        </button>

        <div
          ref={drawerRef}
          aria-hidden={!open}
          style={{
            position: "fixed",
            bottom: TASKBAR_H + TAB_H_BOTTOM,
            right: BOTTOM_RIGHT,
            width: 300,
            background: PAPER,
            color: INK,
            border: `1px solid ${LINE}`,
            borderRadius: "12px 12px 0 12px",
            boxShadow:
              "0 -16px 36px -8px rgba(196,30,58,0.18), 0 -6px 18px -4px rgba(15,17,21,0.18)",
            zIndex: 99995,
            transform: open
              ? "translateY(0)"
              : "translateY(20px) scale(0.96)",
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
            transformOrigin: "bottom right",
            transition:
              "transform 280ms cubic-bezier(0.16,1,0.3,1), opacity 200ms",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                paddingBottom: 12,
                borderBottom: `1px solid ${LINE}`,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${RED}, ${RED_2})`,
                  color: PAPER,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                {initials(displayName(user!), user!.email)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayName(user!)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: MUTED,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user!.role ?? user!.email}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              style={{
                marginTop: 12,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "11px 16px",
                borderRadius: 9999,
                border: `1px solid rgba(196,30,58,0.25)`,
                background: PAPER,
                color: RED,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.02em",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <LogOut size={14} strokeWidth={2} />
              Sign out
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── SIDE placement (logged-out) ──────────────────────────────────────
  return (
    <div
      style={{
        position: "fixed",
        top: SIDE_TOP,
        right: 0,
        zIndex: 99998,
        display: "flex",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      <button
        ref={tabRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={label}
        style={{
          pointerEvents: "auto",
          width: TAB_W_SIDE,
          height: TAB_H_SIDE,
          border: 0,
          margin: 0,
          padding: 0,
          cursor: "pointer",
          color: PAPER,
          background: `linear-gradient(180deg, ${RED} 0%, ${RED_2} 100%)`,
          borderTopLeftRadius: 14,
          borderBottomLeftRadius: 14,
          boxShadow:
            "-6px 0 24px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 24px rgba(196,30,58,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: open ? `translateX(-${DRAWER_W}px)` : "translateX(0)",
          transition:
            "transform 480ms cubic-bezier(0.16,1,0.3,1), box-shadow 240ms",
        }}
      >
        <span
          style={{
            display: "inline-block",
            transform: "rotate(180deg)",
            writingMode: "vertical-rl",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            userSelect: "none",
          }}
        >
          {label}
        </span>
      </button>

      <aside
        ref={drawerRef}
        aria-hidden={!open}
        aria-label={label}
        style={{
          pointerEvents: open ? "auto" : "none",
          position: "absolute",
          top: "50%",
          right: 0,
          transform: open
            ? "translate(0, -50%)"
            : `translate(${DRAWER_W}px, -50%)`,
          width: DRAWER_W,
          padding: "26px 24px 24px",
          background: `linear-gradient(180deg, ${PAPER} 0%, #FAFBFD 100%)`,
          color: INK,
          borderTopLeftRadius: 18,
          borderBottomLeftRadius: 18,
          boxShadow:
            "-16px 0 40px -8px rgba(196,30,58,0.18), -6px 0 24px -4px rgba(15,17,21,0.18), inset 0 0 0 1px rgba(196,30,58,0.08)",
          opacity: open ? 1 : 0,
          transition:
            "transform 480ms cubic-bezier(0.16,1,0.3,1), opacity 280ms",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: RED,
            }}
          >
            Memelli
          </span>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              margin: "4px 0 0",
              color: INK,
            }}
          >
            Sign in
          </h2>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              color: MUTED,
              lineHeight: 1.4,
            }}
          >
            Pick up where you left off — credit, funding, CRM, all linked to
            one account.
          </p>
        </div>

        <form
          onSubmit={onSignIn}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          <Field label="Email" icon={<Mail size={13} strokeWidth={2} />}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@memelli.com"
              autoComplete="email"
              style={inputStyle}
            />
          </Field>
          <Field
            label="Password"
            icon={<KeyRound size={13} strokeWidth={2} />}
          >
            <input
              type="password"
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              style={inputStyle}
            />
          </Field>

          {err && (
            <div
              role="alert"
              style={{
                fontSize: 11,
                color: RED,
                background: "rgba(196,30,58,0.08)",
                border: "1px solid rgba(196,30,58,0.20)",
                padding: "8px 10px",
                borderRadius: 8,
              }}
            >
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "11px 16px",
              borderRadius: 9999,
              border: 0,
              marginTop: 4,
              background: submitting
                ? `${RED}80`
                : `linear-gradient(135deg, ${RED}, ${RED_2})`,
              color: PAPER,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.02em",
              cursor: submitting ? "wait" : "pointer",
              boxShadow:
                "0 8px 22px -8px rgba(196,30,58,0.55), inset 0 1px 0 rgba(255,255,255,0.18)",
              fontFamily: "inherit",
            }}
          >
            <LogIn size={14} strokeWidth={2} />
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={() => {
              openWindow("signup");
              setOpen(false);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              width: "100%",
              padding: "10px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: RED,
              background: "transparent",
              border: `1px dashed rgba(196,30,58,0.35)`,
              borderRadius: 9999,
              cursor: "pointer",
              marginTop: 4,
              fontFamily: "inherit",
            }}
          >
            Create account
            <ArrowRight size={12} strokeWidth={2} />
          </button>
        </form>
      </aside>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  fontSize: 13,
  padding: "9px 0",
  background: "transparent",
  border: 0,
  outline: "none",
  color: INK,
  fontFamily: "inherit",
};

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: MUTED,
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 12px",
          height: 38,
          background: PAPER,
          border: `1px solid ${LINE}`,
          borderRadius: 10,
          color: "rgba(15,17,21,0.4)",
          transition: "border-color 150ms, box-shadow 150ms",
        }}
      >
        {icon}
        {children}
      </span>
    </label>
  );
}
