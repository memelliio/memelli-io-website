"use client";

import { useState } from "react";
import {
  Mail,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader,
  ShieldCheck,
  Mic,
} from "lucide-react";

const STEPS = [
  { id: "welcome", label: "Welcome" },
  { id: "username", label: "Email" },
  { id: "password", label: "Password" },
  { id: "pulling", label: "Pulling" },
  { id: "done", label: "Done" },
] as const;

const API_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "https://api.memelli.io";

type StepId = (typeof STEPS)[number]["id"];

function getToken(): string {
  try {
    return localStorage.getItem("memelli_token") || localStorage.getItem("memelli_live_token") || "";
  } catch {
    return "";
  }
}

function getUserId(): string {
  try {
    const t = getToken();
    if (!t) return "";
    // JWT payload is base64-encoded middle segment
    const payload = JSON.parse(atob(t.split(".")[1] || "e30="));
    return (payload.sub as string) || (payload.userId as string) || (payload.id as string) || "";
  } catch {
    return "";
  }
}

export function PreQual() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [done, setDone] = useState(false);
  const [scores, setScores] = useState<{ bureau: string; score: number }[]>([]);

  const stepId: StepId = STEPS[step].id;

  const canAdvance =
    stepId === "welcome"
      ? true
      : stepId === "username"
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        : stepId === "password"
          ? password.length >= 4
          : false;

  const pull = async () => {
    setSubmitting(true);
    setErrorMsg("");
    // advance to "Pulling" step
    const pullingIdx = STEPS.findIndex((s) => s.id === "pulling");
    setStep(pullingIdx);
    try {
      const token = getToken();
      const userId = getUserId();
      const res = await fetch(`${API_BASE}/api/credit/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          smartcredit_email: email.toLowerCase().trim(),
          smartcredit_password: password,
          ...(userId ? { client_id: userId } : {}),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(
          (json.error as string) ||
            (json.message as string) ||
            `Pull failed (${res.status})`,
        );
      }
      // Store full result
      try {
        localStorage.setItem("memelli_prequal_result", JSON.stringify(json));
      } catch {
        /* noop */
      }
      // Extract scores for display
      const data = (json.data ?? json) as Record<string, unknown>;
      const rawScores = (data.credit_scores ?? data.scores) as
        | { bureau: string; score: number }[]
        | undefined;
      if (rawScores && Array.isArray(rawScores)) setScores(rawScores);

      try {
        window.dispatchEvent(
          new CustomEvent("memelli:prequal-complete", {
            detail: { success: true, result: json },
          }),
        );
      } catch {
        /* noop */
      }
      setDone(true);
      const doneIdx = STEPS.findIndex((s) => s.id === "done");
      setStep(doneIdx);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      // go back to password step on error so user can retry
      const pwIdx = STEPS.findIndex((s) => s.id === "password");
      setStep(pwIdx);
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
            <span style={{ width: 1, height: 14, background: "#E5E7EB" }} />
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
              Pre-Qualification
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
            const state = i < step ? "done" : i === step ? "active" : "upcoming";
            const isLast = i === STEPS.length - 1;
            return (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flex: 1,
                  cursor: "default",
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
                    background: state === "upcoming" ? "#E5E7EB" : "var(--brand-color, #C41E3A)",
                    color: state === "upcoming" ? "#9CA3AF" : "white",
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
                {stepId === "welcome" && (
                  <>
                    Welcome to your <span style={{ color: "var(--brand-color, #C41E3A)" }}>pre-qual.</span>
                  </>
                )}
                {stepId === "username" && (
                  <>
                    SmartCredit <span style={{ color: "var(--brand-color, #C41E3A)" }}>email.</span>
                  </>
                )}
                {stepId === "password" && (
                  <>
                    SmartCredit <span style={{ color: "var(--brand-color, #C41E3A)" }}>password.</span>
                  </>
                )}
                {stepId === "pulling" && (
                  <>
                    Pulling your <span style={{ color: "var(--brand-color, #C41E3A)" }}>reports.</span>
                  </>
                )}
                {stepId === "done" && (
                  <>
                    Reports <span style={{ color: "var(--brand-color, #C41E3A)" }}>ready.</span>
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
              <div>3-Bureau</div>
              <div style={{ color: "#0B0B0F", fontWeight: 800 }}>SmartCredit</div>
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
              Pre-Qual
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
              Credit Pull
            </div>
          </div>

          {/* [removed 2026-05-01] Ink strip duplicated the top step rail —
              both surfaces showed the same {stepId} + {n / N}. Step rail at the
              top remains canonical. */}
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
          {stepId === "welcome" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Let Melli guide you — voice CTA. Wires to the OS Memelli Bar
                  via window.__memelliSend (set by the bar host); falls back
                  to a CustomEvent the bar can listen for if the hook is not
                  yet available. Voice runtime wiring is owned by the bar. */}
              <button
                type="button"
                onClick={() => {
                  try {
                    const send = (window as unknown as { __memelliSend?: (s: string) => void }).__memelliSend;
                    if (typeof send === "function") {
                      send("Walk me through pre-qualification");
                    } else {
                      window.dispatchEvent(
                        new CustomEvent("memelli:bar:guide-me", {
                          detail: { module: "prequal" },
                        }),
                      );
                    }
                  } catch {
                    /* noop */
                  }
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  alignSelf: "flex-start",
                  padding: "8px 14px",
                  borderRadius: 9999,
                  border: "1px solid rgba(196,30,58,0.3)",
                  background: "rgba(196,30,58,0.05)",
                  color: "var(--brand-color, #C41E3A)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                }}
              >
                <Mic size={12} strokeWidth={2.4} />
                Let Melli guide you
              </button>

              <p
                style={{
                  fontSize: 14,
                  color: "#0B0B0F",
                  margin: 0,
                  lineHeight: 1.6,
                  fontWeight: 500,
                }}
              >
                We pull your 3-bureau credit report directly from{" "}
                <span style={{ color: "var(--brand-color, #C41E3A)", fontWeight: 800 }}>
                  SmartCredit.com
                </span>{" "}
                — only.
              </p>

              <p
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                We do not use Credit Karma, Experian.com, MyFICO, or any other
                source. Have your SmartCredit email and password ready — two
                short steps and we pull the report. About a minute.
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background: "rgba(16,185,129,0.05)",
                  border: "1px solid rgba(16,185,129,0.18)",
                  borderRadius: 10,
                }}
              >
                <ShieldCheck size={16} strokeWidth={2} color="#10B981" />
                <span
                  style={{ fontSize: 11, color: "#374151", lineHeight: 1.5 }}
                >
                  Credentials are encrypted in transit and never logged.
                </span>
              </div>
            </div>
          )}

          {stepId === "username" && (
            <Field icon={<Mail size={13} />} label="SmartCredit email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@smartcredit.com"
                autoFocus
                style={inputStyle}
              />
            </Field>
          )}

          {stepId === "password" && (
            <Field
              icon={<KeyRound size={13} />}
              label="SmartCredit password"
              action={
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#9CA3AF",
                    padding: 0,
                  }}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              }
            >
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                style={inputStyle}
              />
            </Field>
          )}

          {stepId === "pulling" && !errorMsg && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                padding: "24px 0",
              }}
            >
              <span
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 9999,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(196,30,58,0.07)",
                  color: "var(--brand-color, #C41E3A)",
                  border: "1px solid rgba(196,30,58,0.2)",
                  animation: "spin 1.2s linear infinite",
                }}
              >
                <Loader size={24} strokeWidth={2} />
              </span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0B0B0F",
                  letterSpacing: "-0.2px",
                }}
              >
                Connecting to SmartCredit…
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>
                Fetching TransUnion, Experian, and Equifax data.
                <br />
                This may take 15–30 seconds.
              </div>
            </div>
          )}

          {stepId === "done" && done && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                padding: "16px 0",
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
                Reports pulled.
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                  textAlign: "center",
                  lineHeight: 1.5,
                }}
              >
                Your 3-bureau credit report is ready. Open Credit Reports to
                review scores and disputes.
              </div>
              {scores.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 4,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  {scores.map((s) => (
                    <div
                      key={s.bureau}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "10px 18px",
                        background: "#FAFAFA",
                        border: "1px solid #E5E7EB",
                        borderRadius: 12,
                        minWidth: 90,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          color: s.score >= 680 ? "#10B981" : "var(--brand-color, #C41E3A)",
                          letterSpacing: "-0.5px",
                        }}
                      >
                        {s.score}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "#9CA3AF",
                          marginTop: 2,
                        }}
                      >
                        {s.bureau}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {stepId !== "pulling" && stepId !== "done" && (
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
              onClick={() => step > 0 && !submitting && setStep(step - 1)}
              disabled={step === 0 || submitting}
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
                cursor: step === 0 || submitting ? "not-allowed" : "pointer",
                opacity: step === 0 || submitting ? 0.5 : 1,
              }}
            >
              <ArrowLeft size={12} strokeWidth={2.4} />
              Back
            </button>

            {stepId === "password" ? (
              <button
                type="button"
                onClick={pull}
                disabled={!canAdvance || submitting}
                style={{
                  ...primaryBtn,
                  opacity: canAdvance && !submitting ? 1 : 0.5,
                  cursor: canAdvance && !submitting ? "pointer" : "not-allowed",
                }}
              >
                {submitting ? "Pulling…" : "Pull my credit"}
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

        {errorMsg && (
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

function Field({
  icon,
  label,
  children,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>{label}</span>
        {action}
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
