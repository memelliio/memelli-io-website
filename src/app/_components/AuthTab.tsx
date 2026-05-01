"use client";

import { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/auth";

const RED = "#C41E3A";
const RED_2 = "#A8182F";
const INK = "#0B0B0F";
const PAPER = "#FFFFFF";
const SOFT = "#FAFAFA";
const LINE = "#E5E7EB";
const MUTED = "#6B7280";

const TASKBAR_H = 52;
const TAB_H = 26;
const RIGHT_OFFSET = 155;

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

export function AuthTab() {
  const { user, login, logout, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Form state (signed-out drawer)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      const target = e.target as Node;
      // Ignore clicks on the tab button itself (it toggles)
      const tabBtn = document.querySelector("[data-auth-tab]");
      if (tabBtn && tabBtn.contains(target)) return;
      if (!ref.current.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      setErr(null);
      setSubmitting(false);
    }
  }, [open]);

  if (isLoading) return null;

  const signedIn = !!user;
  const label = signedIn ? "Account" : "Sign In";
  const Icon = signedIn ? User : LogIn;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErr(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password, remember);
      setOpen(false);
      setEmail("");
      setPassword("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        data-auth-tab
        onClick={() => setOpen((v) => !v)}
        title={label}
        style={{
          position: "fixed",
          bottom: TASKBAR_H,
          right: RIGHT_OFFSET,
          height: TAB_H,
          padding: "0 14px",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          border: 0,
          borderRadius: "8px 8px 0 0",
          background: open
            ? `linear-gradient(180deg, ${RED}, ${RED_2})`
            : PAPER,
          color: open ? PAPER : INK,
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
        <Icon size={11} strokeWidth={2.4} />
        {label}
      </button>

      <div
        ref={ref}
        aria-hidden={!open}
        style={{
          position: "fixed",
          bottom: TASKBAR_H + TAB_H,
          right: RIGHT_OFFSET,
          width: 320,
          maxHeight: open ? 380 : 0,
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(10px)",
          transition:
            "opacity 180ms ease, transform 180ms ease, max-height 180ms ease",
          background: PAPER,
          border: open ? `1px solid ${LINE}` : "1px solid transparent",
          borderRadius: "10px 0 10px 10px",
          boxShadow: "0 12px 40px -12px rgba(15,17,21,0.18)",
          overflow: "hidden",
          pointerEvents: open ? "auto" : "none",
          zIndex: 99995,
        }}
      >
        {signedIn ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 10,
                alignItems: "center",
                padding: "14px 16px",
                borderBottom: `1px solid ${LINE}`,
                background: SOFT,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: RED,
                  color: PAPER,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                }}
              >
                {initials(
                  user ? displayName(user) : undefined,
                  user?.email,
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: INK,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user ? displayName(user) : "Signed in"}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: MUTED,
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.04em",
                  }}
                >
                  {user?.role ?? user?.email ?? ""}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "13px 16px",
                background: PAPER,
                border: 0,
                cursor: "pointer",
                fontSize: 13,
                color: INK,
                fontFamily: "inherit",
                textAlign: "left",
              }}
            >
              <LogOut size={14} strokeWidth={2} />
              <span>Sign out</span>
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 10,
                color: MUTED,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Sign in
            </div>

            <label style={labelStyle}>Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@memelli.com"
              style={inputStyle}
            />

            <label style={{ ...labelStyle, marginTop: 10 }}>Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 12,
                fontSize: 12,
                color: INK,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ accentColor: RED }}
              />
              Remember me
            </label>

            {err && (
              <div
                role="alert"
                style={{
                  marginTop: 10,
                  padding: "8px 10px",
                  background: `${RED}10`,
                  border: `1px solid ${RED}33`,
                  borderRadius: 6,
                  color: RED,
                  fontSize: 11,
                }}
              >
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 14,
                width: "100%",
                height: 36,
                background: submitting
                  ? `${RED}80`
                  : `linear-gradient(180deg, ${RED}, ${RED_2})`,
                color: PAPER,
                border: 0,
                borderRadius: 8,
                cursor: submitting ? "wait" : "pointer",
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontFamily: "inherit",
              }}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: MUTED,
  marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 34,
  padding: "0 11px",
  border: `1px solid ${LINE}`,
  borderRadius: 7,
  outline: "none",
  fontSize: 13,
  background: SOFT,
  color: INK,
  fontFamily: "inherit",
};
