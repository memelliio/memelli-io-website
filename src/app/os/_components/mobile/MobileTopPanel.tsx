"use client";

import { useEffect, useState } from "react";
import {
  Battery,
  Briefcase,
  LogIn,
  LogOut,
  Menu,
  Signal,
  User as UserIcon,
  Wifi,
  X,
} from "lucide-react";
import { useOsMode, type OsMode } from "../../_lib/os-mode-store";
import { useAuth } from "@/contexts/auth";
import { useWindowStore } from "../../_lib/window-store";

const RED = "#C41E3A";
const RED_2 = "#A8182F";
const INK = "#0B0B0F";
const PAPER = "#FFFFFF";
const LINE = "#E5E7EB";
const MUTED = "#6B7280";

const MODES: { id: OsMode; label: string; icon: typeof UserIcon }[] = [
  { id: "personal", label: "Personal", icon: UserIcon },
  { id: "business", label: "Business", icon: Briefcase },
];

export function MobileTopPanel() {
  const mode = useOsMode((s) => s.mode);
  const setMode = useOsMode((s) => s.setMode);
  const { user, login, logout } = useAuth();
  const addPage = useWindowStore((s) => s.addPage);
  const [time, setTime] = useState(() => fmt(new Date()));
  const [drawer, setDrawer] = useState(false);
  const [signinOpen, setSigninOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setTime(fmt(new Date())), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErr(null);
    setSubmitting(true);
    try {
      await login(email.trim(), pw, true);
      setSigninOpen(false);
      setEmail("");
      setPw("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* iOS status bar with notch */}
      <div
        style={{
          flex: "0 0 auto",
          position: "relative",
          height: 48,
          padding: "0 22px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          color: INK,
          fontFamily:
            "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.02em",
        }}
      >
        <span style={{ justifySelf: "start" }}>{time}</span>
        <span
          aria-hidden
          style={{
            width: 96,
            height: 28,
            borderRadius: 9999,
            background: INK,
            marginTop: 4,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        />
        <span
          style={{
            justifySelf: "end",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Signal size={12} strokeWidth={2.4} />
          <Wifi size={12} strokeWidth={2.4} />
          <Battery size={14} strokeWidth={2.2} />
        </span>
      </div>

      {/* Header strip — hamburger · logo · auth chip + mode pill */}
      <div
        style={{
          flex: "0 0 auto",
          padding: "8px 12px 6px",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: 10,
          borderBottom: `1px solid rgba(15,17,21,0.06)`,
          background: PAPER,
        }}
      >
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Open menu"
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: "rgba(15,17,21,0.04)",
            border: `1px solid ${LINE}`,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            color: INK,
          }}
        >
          <Menu size={16} strokeWidth={2.2} />
        </button>

        <img
          src="/memelli-logo.png"
          alt="Memelli"
          style={{
            justifySelf: "center",
            height: 28,
            width: "auto",
            maxWidth: 120,
            objectFit: "contain",
            display: "block",
          }}
        />

        {user ? (
          <button
            type="button"
            onClick={() => logout()}
            aria-label="Sign out"
            title="Sign out"
            style={{
              height: 36,
              padding: "0 12px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 9999,
              border: 0,
              background: PAPER,
              color: RED,
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              boxShadow: "inset 0 0 0 1px rgba(196,30,58,0.25)",
            }}
          >
            <LogOut size={12} strokeWidth={2.4} />
            Out
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSigninOpen(true)}
            style={{
              height: 36,
              padding: "0 14px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 9999,
              border: 0,
              background: `linear-gradient(135deg, ${RED}, ${RED_2})`,
              color: PAPER,
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              boxShadow: "0 6px 16px -6px rgba(196,30,58,0.5)",
            }}
          >
            <LogIn size={12} strokeWidth={2.4} />
            Sign In
          </button>
        )}
      </div>

      {/* CRM mode toggle — both Personal + Business pills always visible */}
      <div
        style={{
          flex: "0 0 auto",
          padding: "8px 14px 8px",
          background: PAPER,
          borderBottom: `1px solid rgba(15,17,21,0.06)`,
          display: "flex",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            background: "#FAFBFD",
            border: `1px solid ${LINE}`,
            borderRadius: 9999,
            padding: 3,
          }}
        >
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 14px",
                  borderRadius: 9999,
                  border: 0,
                  background: active
                    ? `linear-gradient(135deg, ${RED}, ${RED_2})`
                    : "transparent",
                  color: active ? PAPER : MUTED,
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "Inter, system-ui, sans-serif",
                  boxShadow: active
                    ? "0 4px 12px -4px rgba(196,30,58,0.4)"
                    : "none",
                }}
              >
                <Icon size={11} strokeWidth={2.4} />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hamburger drawer (slides from left) */}
      {drawer && (
        <div
          onClick={() => setDrawer(false)}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(11,11,15,0.45)",
            zIndex: 200,
            backdropFilter: "blur(2px)",
          }}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: "82%",
              maxWidth: 320,
              background: PAPER,
              boxShadow: "20px 0 40px -10px rgba(15,17,21,0.4)",
              display: "flex",
              flexDirection: "column",
              transform: "translateX(0)",
              transition: "transform 280ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <header
              style={{
                padding: "16px 18px",
                borderBottom: `1px solid ${LINE}`,
                display: "grid",
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
              }}
            >
              <strong
                style={{
                  fontSize: 13,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: INK,
                }}
              >
                Memelli
              </strong>
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Close menu"
                style={{
                  width: 30,
                  height: 30,
                  background: "transparent",
                  border: 0,
                  borderRadius: 8,
                  cursor: "pointer",
                  color: MUTED,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <X size={14} strokeWidth={2.2} />
              </button>
            </header>
            <nav
              style={{
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                flex: 1,
                overflowY: "auto",
              }}
            >
              <DrawerItem
                onClick={() => {
                  addPage();
                  setDrawer(false);
                }}
              >
                + Add Page
              </DrawerItem>
              <DrawerItem
                onClick={() => {
                  setDrawer(false);
                }}
              >
                My Journey
              </DrawerItem>
              {!user && (
                <DrawerItem
                  onClick={() => {
                    setDrawer(false);
                    setSigninOpen(true);
                  }}
                >
                  Sign In
                </DrawerItem>
              )}
              {user && (
                <DrawerItem
                  onClick={() => {
                    setDrawer(false);
                    logout();
                  }}
                >
                  Sign Out
                </DrawerItem>
              )}
            </nav>
          </aside>
        </div>
      )}

      {/* Sign-in sheet (slide-up from bottom) */}
      {signinOpen && !user && (
        <div
          onClick={() => setSigninOpen(false)}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(11,11,15,0.55)",
            zIndex: 300,
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={onSubmit}
            style={{
              width: "100%",
              maxWidth: 480,
              background: PAPER,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "0 -20px 50px -10px rgba(15,17,21,0.45)",
            }}
          >
            <span
              aria-hidden
              style={{
                alignSelf: "center",
                width: 44,
                height: 4,
                borderRadius: 9999,
                background: "rgba(15,17,21,0.18)",
                marginBottom: 6,
              }}
            />
            <strong
              style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                color: INK,
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              Sign in
            </strong>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              style={inputStyle}
            />
            <input
              type="password"
              required
              autoComplete="current-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password"
              style={inputStyle}
            />
            {err && (
              <div
                role="alert"
                style={{
                  fontSize: 12,
                  color: RED,
                  background: `${RED}10`,
                  border: `1px solid ${RED}33`,
                  padding: "8px 10px",
                  borderRadius: 8,
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                {err}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 4,
                height: 44,
                background: submitting
                  ? `${RED}80`
                  : `linear-gradient(135deg, ${RED}, ${RED_2})`,
                color: PAPER,
                border: 0,
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                cursor: submitting ? "wait" : "pointer",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => setSigninOpen(false)}
              style={{
                height: 36,
                background: "transparent",
                border: 0,
                color: MUTED,
                fontSize: 12.5,
                cursor: "pointer",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </>
  );
}

const inputStyle: React.CSSProperties = {
  height: 44,
  padding: "0 14px",
  border: `1px solid ${LINE}`,
  borderRadius: 12,
  outline: "none",
  fontSize: 14,
  background: "#FAFAFA",
  color: INK,
  fontFamily: "Inter, system-ui, sans-serif",
};

function DrawerItem({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left",
        background: "transparent",
        border: 0,
        padding: "12px 14px",
        borderRadius: 9,
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 600,
        color: INK,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {children}
    </button>
  );
}

function fmt(d: Date): string {
  return d
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\s/g, "");
}
