"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LogIn, LogOut, Mail, KeyRound, ArrowRight } from "lucide-react";
import { useWindowStore } from "../_lib/window-store";

const TAB_W = 36;
const DRAWER_W = 320;
const TOKEN_KEYS = ["memelli_dev_token", "memelli_live_token"] as const;

function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!(
      localStorage.getItem("memelli_dev_token") ||
      localStorage.getItem("memelli_live_token")
    );
  } catch {
    return false;
  }
}

export function SignInTab() {
  const openWindow = useWindowStore((s) => s.open);
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const drawerRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setAuthed(isAuthenticated());
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || TOKEN_KEYS.includes(e.key as (typeof TOKEN_KEYS)[number])) {
        setAuthed(isAuthenticated());
      }
    };
    const onAuthState = () => setAuthed(isAuthenticated());
    window.addEventListener("storage", onStorage);
    window.addEventListener("memelli:auth-state", onAuthState as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        "memelli:auth-state",
        onAuthState as EventListener,
      );
    };
  }, []);

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

  const signIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw) return;
    try {
      localStorage.setItem(
        "memelli_dev_token",
        `demo-${Date.now().toString(36)}`,
      );
    } catch {
      /* noop */
    }
    window.dispatchEvent(
      new CustomEvent("memelli:auth-state", {
        detail: { authenticated: true, email },
      }),
    );
    setAuthed(true);
    setEmail("");
    setPw("");
  };

  const signOut = () => {
    try {
      for (const k of TOKEN_KEYS) localStorage.removeItem(k);
    } catch {
      /* noop */
    }
    window.dispatchEvent(
      new CustomEvent("memelli:auth-state", {
        detail: { authenticated: false },
      }),
    );
    setAuthed(false);
  };

  const label = authed ? "Sign Out" : "Sign In";

  return (
    <div
      style={{
        position: "fixed",
        top: 408,
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
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={label}
        style={{
          pointerEvents: "auto",
          width: TAB_W,
          height: 120,
          border: 0,
          margin: 0,
          padding: 0,
          cursor: "pointer",
          color: "white",
          background:
            "linear-gradient(180deg, #C41E3A 0%, #A8182F 100%)",
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
          background:
            "linear-gradient(180deg, #ffffff 0%, #FAFBFD 100%)",
          color: "#0F1115",
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
              color: "#C41E3A",
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
              color: "#0F1115",
            }}
          >
            {authed ? "Account" : "Sign in"}
          </h2>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              color: "rgba(15,17,21,0.55)",
              lineHeight: 1.4,
            }}
          >
            {authed
              ? "You're signed in. Manage your session below."
              : "Pick up where you left off — credit, funding, CRM, all linked to one account."}
          </p>
        </div>

        {authed ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                borderRadius: 12,
                background: "#F4F6FA",
                border: "1px solid #E8EAF0",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #C41E3A, #A8182F)",
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                M
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  Memelli account
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(15,17,21,0.55)",
                  }}
                >
                  briggsmel1604@protonmail.com
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={signOut}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "11px 16px",
                borderRadius: 9999,
                border: "1px solid rgba(196,30,58,0.25)",
                background: "white",
                color: "#C41E3A",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.02em",
                cursor: "pointer",
                transition: "background 150ms, color 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#C41E3A";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.color = "#C41E3A";
              }}
            >
              <LogOut size={14} strokeWidth={2} />
              Sign out
            </button>
          </div>
        ) : (
          <form
            onSubmit={signIn}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <Field label="Email" icon={<Mail size={13} strokeWidth={2} />}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@memelli.com"
                autoComplete="email"
                style={inputStyle}
              />
            </Field>
            <Field label="Password" icon={<KeyRound size={13} strokeWidth={2} />}>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={inputStyle}
              />
            </Field>
            <button
              type="submit"
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
                background: "linear-gradient(135deg, #C41E3A, #A8182F)",
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.02em",
                cursor: "pointer",
                boxShadow:
                  "0 8px 22px -8px rgba(196,30,58,0.55), inset 0 1px 0 rgba(255,255,255,0.18)",
              }}
            >
              <LogIn size={14} strokeWidth={2} />
              Sign in
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
                color: "#C41E3A",
                background: "transparent",
                border: "1px dashed rgba(196,30,58,0.35)",
                borderRadius: 9999,
                cursor: "pointer",
                marginTop: 4,
              }}
            >
              Create account
              <ArrowRight size={12} strokeWidth={2} />
            </button>
          </form>
        )}
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
  color: "#0F1115",
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
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(15,17,21,0.55)",
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
          background: "white",
          border: "1px solid #E8EAF0",
          borderRadius: 10,
          color: "rgba(15,17,21,0.4)",
          transition: "border-color 150ms, box-shadow 150ms",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#C41E3A";
          e.currentTarget.style.boxShadow =
            "0 0 0 3px rgba(196,30,58,0.12)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#E8EAF0";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {icon}
        {children}
      </span>
    </label>
  );
}
