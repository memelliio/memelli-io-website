"use client";

import { useState } from "react";
import {
  Mail,
  KeyRound,
  Phone,
  User,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

const STEPS = [
  { id: "identity", label: "Identity" },
  { id: "contact", label: "Contact" },
  { id: "confirm", label: "Confirm" },
  { id: "verify", label: "Verify" },
] as const;

const API_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "https://api.memelli.io";

type StepId = (typeof STEPS)[number]["id"];

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

const EMPTY: Form = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
};

export function SignUp() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [done, setDone] = useState(false);
  const [userId, setUserId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const set = (partial: Partial<Form>) => setForm((f) => ({ ...f, ...partial }));
  const stepId: StepId = STEPS[step].id;

  const phoneDigits = form.phone.replace(/\D/g, "");
  const canAdvance =
    stepId === "identity"
      ? form.firstName.trim() && form.lastName.trim()
      : stepId === "contact"
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
          phoneDigits.length >= 7 &&
          phoneDigits.length <= 15 &&
          form.password.length >= 4
        : stepId === "confirm"
          ? true
          : verifyCode.length === 6;

  const submit = async () => {
    setSubmitting(true);
    setErrorMsg("");
    try {
      const phoneE164 =
        phoneDigits.length === 10 ? "+1" + phoneDigits : "+" + phoneDigits;
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.toLowerCase().trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: phoneE164,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(
          (json.error as string) ||
            (json.message as string) ||
            "Signup failed",
        );
      }
      const data = json.data as Record<string, unknown> | undefined;
      const id = (data?.userId as string) || (json.userId as string) || "";
      if (!id) throw new Error("Signup succeeded but no userId returned");
      setUserId(id);
      const verifyIdx = STEPS.findIndex((s) => s.id === "verify");
      if (verifyIdx >= 0) setStep(verifyIdx);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const verify = async () => {
    if (verifyCode.length !== 6 || !userId) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: verifyCode }),
      });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(
          (json.error as string) ||
            (json.message as string) ||
            "Verification failed",
        );
      }
      const data = json.data as Record<string, unknown> | undefined;
      const token =
        (data?.token as string) ||
        (json.token as string) ||
        (json.access_token as string) ||
        "";
      if (token) {
        // Single source of truth: prefixed key only. AuthProvider's
        // `storage` + `memelli:auth-state` listeners will pick it up
        // and refresh the React context state without a page reload.
        try {
          const host = typeof window !== "undefined" ? window.location.hostname : "";
          let prefix: string;
          if (host === "localhost" || host === "127.0.0.1" || host.startsWith("dev.")) {
            prefix = "dev";
          } else if (host.startsWith("pro.")) {
            prefix = "pro";
          } else {
            prefix = "live";
          }
          localStorage.setItem(`memelli_${prefix}_token`, token);
          localStorage.setItem(`memelli_${prefix}_remember_me`, "true");
        } catch {
          /* noop */
        }
      }
      try {
        window.dispatchEvent(
          new CustomEvent("memelli:auth-state", {
            detail: { authenticated: true, email: form.email, userId },
          }),
        );
      } catch {
        /* noop */
      }
      setDone(true);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#FAFAFA",
        color: "#0B0B0F",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* ── Top stepper bar ─────────────────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "white",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#6B7280",
              }}
            >
              Memelli
            </span>
            <span
              style={{
                width: 1,
                height: 14,
                background: "#E5E7EB",
              }}
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
                color: "var(--brand-color, #C41E3A)",
              }}
            >
              Sign Up
            </span>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#9CA3AF",
            }}
          >
            Step {step + 1} / {STEPS.length}
          </span>
        </div>

        {/* Step rail */}
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "0 24px 14px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {STEPS.map((s, i) => {
            const state =
              i < step ? "done" : i === step ? "active" : "upcoming";
            const isLast = i === STEPS.length - 1;
            return (
              <div
                key={s.id}
                onClick={() => i <= step && setStep(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flex: 1,
                  cursor: i <= step ? "pointer" : "default",
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 9999,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                    flexShrink: 0,
                    background:
                      state === "upcoming" ? "#E5E7EB" : "var(--brand-color, #C41E3A)",
                    color:
                      state === "upcoming" ? "#9CA3AF" : "white",
                    boxShadow:
                      state === "active"
                        ? "0 0 0 4px rgba(196,30,58,0.12)"
                        : "none",
                    transition: "all 150ms",
                  }}
                >
                  {state === "done" ? (
                    <Check size={12} strokeWidth={2.6} />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: state === "active" ? 800 : 600,
                    color:
                      state === "active"
                        ? "var(--brand-color, #C41E3A)"
                        : state === "done"
                          ? "#0B0B0F"
                          : "#9CA3AF",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.label}
                </span>
                {!isLast && (
                  <span
                    style={{
                      flex: 1,
                      height: 2,
                      background: state === "done" ? "var(--brand-color, #C41E3A)" : "#E5E7EB",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
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
            position: "relative",
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
                  color: "var(--brand-color, #C41E3A)",
                  marginBottom: 6,
                }}
              >
                {STEPS[step].label}
              </div>
              <h1
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                {stepId === "identity" && (
                  <>
                    Who's <span style={{ color: "var(--brand-color, #C41E3A)" }}>signing in?</span>
                  </>
                )}
                {stepId === "contact" && (
                  <>
                    How do we <span style={{ color: "var(--brand-color, #C41E3A)" }}>reach you?</span>
                  </>
                )}
                {stepId === "confirm" && (
                  <>
                    All <span style={{ color: "var(--brand-color, #C41E3A)" }}>set.</span>
                  </>
                )}
                {stepId === "verify" && (
                  <>
                    Verify your <span style={{ color: "var(--brand-color, #C41E3A)" }}>phone.</span>
                  </>
                )}
              </h1>
            </div>
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.18em",
                color: "#6B7280",
                textTransform: "uppercase",
                textAlign: "right",
                lineHeight: 1.7,
              }}
            >
              <div>Free</div>
              <div style={{ color: "#0B0B0F", fontWeight: 800 }}>60 sec</div>
            </div>
          </div>

          {/* Angled red + gray bars */}
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
                background: "var(--brand-color, #C41E3A)",
                clipPath: "polygon(0 0, 100% 0, calc(100% - 40px) 100%, 0 100%)",
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
              Member
            </div>
            <div
              style={{
                flex: 1,
                background: "#C9C9CD",
                clipPath: "polygon(40px 0, 100% 0, 100% 100%, 0 100%)",
                marginLeft: -40,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: "0 22px",
                color: "#0B0B0F",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
              }}
            >
              Onboarding
            </div>
          </div>

          {/* Ink strip */}
          <div
            style={{
              background: "#0B0B0F",
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
            <span>{stepId.toUpperCase()}</span>
            <span style={{ color: "var(--brand-color, #C41E3A)" }}>
              {String(step + 1).padStart(2, "0")} / 0{STEPS.length}
            </span>
          </div>
        </div>

        {/* Step card */}
        <div
          style={{
            marginTop: 16,
            background: "white",
            border: "1px solid #E5E7EB",
            borderRadius: 16,
            padding: 24,
            boxShadow:
              "0 1px 0 rgba(0,0,0,0.02), 0 8px 24px -16px rgba(0,0,0,0.08)",
          }}
        >
          {done ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                padding: "20px 0",
              }}
            >
              <span
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 9999,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(16,185,129,0.1)",
                  color: "#10B981",
                  border: "1px solid rgba(16,185,129,0.25)",
                }}
              >
                <Check size={26} strokeWidth={2.6} />
              </span>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "-0.4px",
                }}
              >
                Welcome, {form.firstName || "Memelli"}.
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                  textAlign: "center",
                }}
              >
                You're signed in. Close this and pick an app.
              </div>
            </div>
          ) : stepId === "identity" ? (
            <Grid>
              <Field icon={<User size={13} />} label="First name">
                <input
                  value={form.firstName}
                  onChange={(e) => set({ firstName: e.target.value })}
                  placeholder="Jane"
                  autoFocus
                  style={inputStyle}
                />
              </Field>
              <Field icon={<User size={13} />} label="Last name">
                <input
                  value={form.lastName}
                  onChange={(e) => set({ lastName: e.target.value })}
                  placeholder="Memelli"
                  style={inputStyle}
                />
              </Field>
            </Grid>
          ) : stepId === "contact" ? (
            <Grid>
              <Field icon={<Mail size={13} />} label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set({ email: e.target.value })}
                  placeholder="you@memelli.com"
                  autoFocus
                  style={inputStyle}
                />
              </Field>
              <Field icon={<Phone size={13} />} label="Phone">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                  placeholder="+1 555 0100"
                  style={inputStyle}
                />
              </Field>
              <Field icon={<KeyRound size={13} />} label="Password">
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => set({ password: e.target.value })}
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </Field>
            </Grid>
          ) : stepId === "confirm" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Confirm label="Name">
                {form.firstName} {form.lastName}
              </Confirm>
              <Confirm label="Email">{form.email}</Confirm>
              {form.phone && <Confirm label="Phone">{form.phone}</Confirm>}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                We sent a 6-digit code to{" "}
                <span style={{ color: "#0B0B0F", fontWeight: 700 }}>
                  {form.phone}
                </span>
                . Enter it below.
              </p>
              <Field icon={<KeyRound size={13} />} label="Verification code">
                <input
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) =>
                    setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                  autoFocus
                  style={{ ...inputStyle, letterSpacing: "0.32em", fontWeight: 700 }}
                />
              </Field>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!done && (
          <div
            style={{
              marginTop: 14,
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => step > 0 && setStep(step - 1)}
              disabled={step === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                borderRadius: 9999,
                border: "1px solid #E5E7EB",
                background: "white",
                color: "#6B7280",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.04em",
                cursor: step === 0 ? "not-allowed" : "pointer",
                opacity: step === 0 ? 0.5 : 1,
              }}
            >
              <ArrowLeft size={12} strokeWidth={2.4} />
              Back
            </button>
            {stepId === "confirm" ? (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                style={{
                  ...primaryBtn,
                  opacity: submitting ? 0.6 : 1,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Creating account…" : "Create account"}
                <ArrowRight size={12} strokeWidth={2.4} />
              </button>
            ) : stepId === "verify" ? (
              <button
                type="button"
                onClick={verify}
                disabled={verifyCode.length !== 6 || submitting}
                style={{
                  ...primaryBtn,
                  opacity: verifyCode.length === 6 && !submitting ? 1 : 0.5,
                  cursor:
                    verifyCode.length === 6 && !submitting
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                {submitting ? "Verifying…" : "Verify"}
                <ArrowRight size={12} strokeWidth={2.4} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => canAdvance && setStep(step + 1)}
                disabled={!canAdvance}
                style={{
                  ...primaryBtn,
                  opacity: canAdvance ? 1 : 0.5,
                  cursor: canAdvance ? "pointer" : "not-allowed",
                }}
              >
                Continue
                <ArrowRight size={12} strokeWidth={2.4} />
              </button>
            )}
          </div>
        )}
        {errorMsg && !done && (
          <div
            role="alert"
            style={{
              marginTop: 12,
              padding: "10px 14px",
              background: "rgba(196,30,58,0.06)",
              border: "1px solid rgba(196,30,58,0.25)",
              color: "#A8182F",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Primitives ──────────────────────────────────────────────────

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#6B7280",
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
          height: 40,
          background: "white",
          border: "1px solid #E5E7EB",
          borderRadius: 10,
          color: "#9CA3AF",
        }}
      >
        {icon}
        {children}
      </span>
    </label>
  );
}

function Confirm({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 14px",
        background: "#FAFAFA",
        border: "1px solid #F0F0F2",
        borderRadius: 10,
      }}
    >
      <span
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#6B7280",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#0B0B0F",
        }}
      >
        {children}
      </span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  fontSize: 14,
  background: "transparent",
  border: 0,
  outline: "none",
  color: "#0B0B0F",
  fontFamily: "inherit",
};

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "10px 18px",
  borderRadius: 9999,
  border: 0,
  background: "linear-gradient(135deg, #C41E3A, #A8182F)",
  color: "white",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.04em",
  cursor: "pointer",
  boxShadow:
    "0 0 0 1px rgba(196,30,58,0.4), 0 8px 22px -8px rgba(196,30,58,0.55)",
};
