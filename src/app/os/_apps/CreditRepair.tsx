"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  AlertTriangle,
  KeyRound,
  Eye,
  Bell,
  User,
  Loader,
} from "lucide-react";

const API_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "https://api.memelli.io";

function getToken(): string {
  try {
    return (
      localStorage.getItem("memelli_token") ||
      localStorage.getItem("memelli_live_token") ||
      ""
    );
  } catch {
    return "";
  }
}

function getContactId(): string {
  try {
    const t = getToken();
    if (!t) return "";
    const payload = JSON.parse(atob(t.split(".")[1] || "e30="));
    // JWT sub = userId; contactId resolved separately — fall back to sub as best effort
    return (
      (payload.contactId as string) ||
      (payload.contact_id as string) ||
      (payload.sub as string) ||
      ""
    );
  } catch {
    return "";
  }
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

const RED = "#C41E3A";
const RED_2 = "#A8182F";
const INK = "#0B0B0F";

const STEPS = [
  { id: "personal", title: "Personal Info" },
  { id: "negatives", title: "Negative Items" },
  { id: "documents", title: "Documents" },
  { id: "logins", title: "Bureau Logins" },
  { id: "review", title: "Review" },
  { id: "monitoring", title: "Monitoring" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function CreditRepair() {
  const [step, setStep] = useState(0);
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const stepId = STEPS[step].id;

  const handleSubmitRound = async () => {
    setSubmitState("loading");
    setSubmitError("");
    try {
      const contactId = getContactId();
      const res = await fetch(`${API_BASE}/api/credit/letters/generate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ contactId }),
      });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(
          (json.error as string) ||
            (json.message as string) ||
            `Submit failed (${res.status})`,
        );
      }
      setSubmitState("done");
    } catch (e) {
      setSubmitState("error");
      setSubmitError(e instanceof Error ? e.message : String(e));
    }
  };

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
      <Header step={step} />

      <div
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "20px 24px 40px",
        }}
      >
        <Hero step={step} />

        <div
          style={{
            marginTop: 16,
            background: "white",
            border: "1px solid #E5E7EB",
            borderRadius: 16,
            padding: 24,
            minHeight: 320,
            boxShadow:
              "0 1px 0 rgba(0,0,0,0.02), 0 8px 24px -16px rgba(0,0,0,0.08)",
          }}
        >
          {stepId === "personal" && <StepPersonal />}
          {stepId === "negatives" && <StepNegatives />}
          {stepId === "documents" && <StepDocuments />}
          {stepId === "logins" && <StepLogins />}
          {stepId === "review" && <StepReview />}
          {stepId === "monitoring" && <StepMonitoring />}
        </div>

        <Footer
          step={step}
          setStep={setStep}
          onSubmit={handleSubmitRound}
          submitState={submitState}
        />
        {submitError && (
          <div
            role="alert"
            style={{
              marginTop: 10,
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
            {submitError}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Header (sticky stepper) ─────────────────────────────────────

function Header({ step }: { step: number }) {
  return (
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
          maxWidth: 880,
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
            Credit Repair
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

      <div
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "0 24px 14px",
          display: "flex",
          alignItems: "center",
          gap: 6,
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
                gap: 6,
                flex: 1,
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 9999,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10.5,
                  fontWeight: 800,
                  flexShrink: 0,
                  background: state === "upcoming" ? "#E5E7EB" : RED,
                  color: state === "upcoming" ? "#9CA3AF" : "white",
                  boxShadow:
                    state === "active"
                      ? "0 0 0 4px rgba(196,30,58,0.12)"
                      : "none",
                }}
              >
                {state === "done" ? (
                  <Check size={11} strokeWidth={2.6} />
                ) : (
                  i + 1
                )}
              </span>
              {!isLast && (
                <span
                  style={{
                    flex: 1,
                    height: 2,
                    background: state === "done" ? RED : "#E5E7EB",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Editorial Hero ──────────────────────────────────────────────

function Hero({ step }: { step: number }) {
  const s = STEPS[step];
  return (
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
              color: RED,
              marginBottom: 6,
            }}
          >
            Step {step + 1}
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
            {s.title}
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
          <div>Round 01</div>
          <div style={{ color: INK, fontWeight: 800 }}>3 Bureaus</div>
        </div>
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
          Member Flow
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
            color: INK,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
          }}
        >
          Credit Repair
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
        <span>{s.id.toUpperCase()}</span>
        <span style={{ color: RED }}>
          {String(step + 1).padStart(2, "0")} / 0{STEPS.length}
        </span>
      </div>
    </div>
  );
}

// ── Footer ──────────────────────────────────────────────────────

function Footer({
  step,
  setStep,
  onSubmit,
  submitState,
}: {
  step: number;
  setStep: (i: number) => void;
  onSubmit: () => void;
  submitState: "idle" | "loading" | "done" | "error";
}) {
  const isLast = step === STEPS.length - 1;
  const isSubmitting = submitState === "loading";
  const isDone = submitState === "done";
  return (
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
        onClick={() => step > 0 && !isSubmitting && setStep(step - 1)}
        disabled={step === 0 || isSubmitting}
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
          cursor: step === 0 || isSubmitting ? "not-allowed" : "pointer",
          opacity: step === 0 || isSubmitting ? 0.5 : 1,
        }}
      >
        <ChevronLeft size={12} strokeWidth={2.4} />
        Back
      </button>
      <button
        type="button"
        onClick={() => {
          if (isLast) {
            onSubmit();
          } else {
            setStep(step + 1);
          }
        }}
        disabled={isLast && (isSubmitting || isDone)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 18px",
          borderRadius: 9999,
          border: 0,
          background: isDone
            ? "#10B981"
            : `linear-gradient(135deg, ${RED}, ${RED_2})`,
          color: "white",
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.04em",
          cursor:
            isLast && (isSubmitting || isDone) ? "not-allowed" : "pointer",
          boxShadow:
            "0 0 0 1px rgba(196,30,58,0.4), 0 8px 22px -8px rgba(196,30,58,0.55)",
          opacity: isLast && isSubmitting ? 0.6 : 1,
        }}
      >
        {isDone ? (
          <>
            <Check size={12} strokeWidth={2.6} />
            Submitted
          </>
        ) : isLast && isSubmitting ? (
          <>
            <Loader size={12} strokeWidth={2} />
            Submitting...
          </>
        ) : isLast ? (
          "Submit Round 1"
        ) : (
          <>
            Continue
            <ChevronRight size={12} strokeWidth={2.4} />
          </>
        )}
      </button>
    </div>
  );
}

// ── Step bodies ─────────────────────────────────────────────────

const BUREAUS = ["Equifax", "Experian", "TransUnion"];
const PERSONAL_FIELDS = [
  "Legal name",
  "Date of birth",
  "Current address",
  "Employer",
];

type VerifyInfoData = {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  dob?: string;
  ssnLast4?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
};

function StepPersonal() {
  const [marks, setMarks] = useState<Record<string, "ok" | "bad" | null>>({});
  const [verifyInfo, setVerifyInfo] = useState<VerifyInfoData | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingInfo(true);
      setInfoError("");
      try {
        const res = await fetch(`${API_BASE}/api/credit/verify-info`, {
          headers: authHeaders(),
        });
        const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (cancelled) return;
        if (res.ok) {
          const d = (json.data ?? json) as Record<string, unknown>;
          const current = (d.current ?? d) as VerifyInfoData;
          setVerifyInfo(current);
        } else {
          // 401 = not authenticated; show empty cells, not an error
          if (res.status !== 401) {
            setInfoError(
              (json.error as string) || (json.message as string) || "",
            );
          }
        }
      } catch {
        if (!cancelled) setInfoError("Could not load contact info.");
      } finally {
        if (!cancelled) setLoadingInfo(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Map verify-info fields to the bureau table rows
  const fieldValues: Record<string, string> = verifyInfo
    ? {
        "Legal name": [verifyInfo.firstName, verifyInfo.middleName, verifyInfo.lastName]
          .filter(Boolean)
          .join(" "),
        "Date of birth": verifyInfo.dob ?? "",
        "Current address": [
          verifyInfo.address,
          verifyInfo.city,
          verifyInfo.state,
          verifyInfo.zip,
        ]
          .filter(Boolean)
          .join(", "),
        "Employer": "",
      }
    : {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Eyebrow icon={<User size={11} />}>Verify what each bureau has</Eyebrow>

      {infoError && (
        <div
          style={{
            padding: "8px 12px",
            background: "rgba(196,30,58,0.06)",
            border: "1px solid rgba(196,30,58,0.2)",
            borderRadius: 8,
            fontSize: 11,
            color: "#A8182F",
            fontWeight: 600,
          }}
        >
          {infoError}
        </div>
      )}

      {loadingInfo && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            color: "#9CA3AF",
          }}
        >
          <Loader size={12} strokeWidth={2} />
          Loading contact info...
        </div>
      )}

      <div
        style={{
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "150px repeat(3, 1fr)",
            background: INK,
            color: "white",
          }}
        >
          <div style={cellHead}>Field</div>
          {BUREAUS.map((b) => (
            <div key={b} style={cellHead}>
              {b}
            </div>
          ))}
        </div>
        {PERSONAL_FIELDS.map((f) => (
          <div
            key={f}
            style={{
              display: "grid",
              gridTemplateColumns: "150px repeat(3, 1fr)",
              borderTop: "1px solid #F0F0F2",
            }}
          >
            <div style={cellLbl}>{f}</div>
            {BUREAUS.map((b) => {
              const k = `${f}-${b}`;
              const state = marks[k];
              // Pre-populate from verified contact data (same value shown per bureau
              // until tri-bureau data is available from the report)
              const prefill = fieldValues[f] ?? "";
              return (
                <div
                  key={b}
                  style={{
                    padding: 10,
                    borderLeft: "1px solid #F0F0F2",
                    background:
                      state === "ok"
                        ? "rgba(16,185,129,0.04)"
                        : state === "bad"
                          ? "rgba(196,30,58,0.06)"
                          : "white",
                    boxShadow:
                      state === "ok"
                        ? "inset 3px 0 0 #10B981"
                        : state === "bad"
                          ? `inset 3px 0 0 ${RED}`
                          : "none",
                  }}
                >
                  <input
                    placeholder="—"
                    defaultValue={prefill}
                    style={{
                      width: "100%",
                      border: 0,
                      outline: "none",
                      fontSize: 13,
                      background: "transparent",
                      color: INK,
                      fontFamily: "inherit",
                    }}
                  />
                  <div
                    style={{ display: "flex", gap: 4, marginTop: 6 }}
                  >
                    <Mini
                      active={state === "ok"}
                      tone="green"
                      onClick={() =>
                        setMarks((m) => ({
                          ...m,
                          [k]: m[k] === "ok" ? null : "ok",
                        }))
                      }
                    >
                      Correct
                    </Mini>
                    <Mini
                      active={state === "bad"}
                      tone="red"
                      onClick={() =>
                        setMarks((m) => ({
                          ...m,
                          [k]: m[k] === "bad" ? null : "bad",
                        }))
                      }
                    >
                      Mismatch
                    </Mini>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepNegatives() {
  const items = [
    { creditor: "Capital One", amount: "$2,140", status: "Charge-off", bureaus: "EQ · TU" },
    { creditor: "Verizon Wireless", amount: "$418", status: "Collection", bureaus: "EX" },
    { creditor: "Synchrony Bank", amount: "$1,022", status: "Late 60d", bureaus: "EQ · EX · TU" },
  ];
  const [picked, setPicked] = useState<Set<number>>(new Set([0, 1, 2]));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Eyebrow icon={<AlertTriangle size={11} />}>Pick what to dispute</Eyebrow>
      {items.map((it, i) => {
        const on = picked.has(i);
        return (
          <button
            key={i}
            type="button"
            onClick={() =>
              setPicked((p) => {
                const next = new Set(p);
                if (next.has(i)) next.delete(i);
                else next.add(i);
                return next;
              })
            }
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              alignItems: "center",
              gap: 14,
              padding: "12px 14px",
              border: `1px solid ${on ? RED : "#E5E7EB"}`,
              borderRadius: 12,
              background: on ? "rgba(196,30,58,0.04)" : "white",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: on ? RED : "white",
                border: `1px solid ${on ? RED : "#E5E7EB"}`,
                color: "white",
                display: "grid",
                placeItems: "center",
              }}
            >
              {on && <Check size={12} strokeWidth={2.6} />}
            </span>
            <span>
              <span
                style={{ display: "block", fontSize: 14, fontWeight: 700 }}
              >
                {it.creditor}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "#6B7280",
                  marginTop: 2,
                }}
              >
                {it.status} · {it.bureaus}
              </span>
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: RED }}>
              {it.amount}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StepDocuments() {
  const docs = [
    "Government ID",
    "Social Security card",
    "Proof of address (utility bill)",
    "Bank statement",
  ];
  const [uploaded, setUploaded] = useState<Set<number>>(new Set());
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Eyebrow icon={<Upload size={11} />}>Upload supporting docs</Eyebrow>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 10,
        }}
      >
        {docs.map((d, i) => {
          const on = uploaded.has(i);
          return (
            <button
              key={d}
              type="button"
              onClick={() =>
                setUploaded((u) => {
                  const next = new Set(u);
                  if (next.has(i)) next.delete(i);
                  else next.add(i);
                  return next;
                })
              }
              style={{
                padding: "16px 14px",
                border: `1px dashed ${on ? "#10B981" : "#E5E7EB"}`,
                borderRadius: 12,
                background: on ? "rgba(16,185,129,0.04)" : "white",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: INK,
                  }}
                >
                  {d}
                </span>
                {on ? (
                  <Check size={14} strokeWidth={2.6} color="#10B981" />
                ) : (
                  <Upload size={13} strokeWidth={2} color="#9CA3AF" />
                )}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 10.5,
                  color: "#6B7280",
                  marginTop: 4,
                }}
              >
                {on ? "Attached" : "Tap to upload"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type BureauCred = { user: string; pass: string; pin?: string };

function StepLogins() {
  const [creds, setCreds] = useState<Record<string, BureauCred>>({
    Equifax: { user: "", pass: "" },
    Experian: { user: "", pass: "", pin: "" },
    TransUnion: { user: "", pass: "" },
  });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "done" | "error">("idle");
  const [saveMsg, setSaveMsg] = useState("");

  const saveCreds = async () => {
    setSaving(true);
    setSaveStatus("idle");
    setSaveMsg("");
    try {
      const contactId = getContactId();
      const res = await fetch(`${API_BASE}/api/credit/bureau-creds`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          contactId,
          equifax: { user: creds.Equifax.user, pass: creds.Equifax.pass },
          experian: {
            user: creds.Experian.user,
            pass: creds.Experian.pass,
            pin: creds.Experian.pin,
          },
          transunion: {
            user: creds.TransUnion.user,
            pass: creds.TransUnion.pass,
          },
        }),
      });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.status === 404) {
        // Endpoint not yet deployed — record locally, surface notice
        setSaveStatus("error");
        setSaveMsg("Save endpoint not yet available. Credentials will be entered again when ready.");
      } else if (!res.ok) {
        throw new Error(
          (json.error as string) || (json.message as string) || `Save failed (${res.status})`,
        );
      } else {
        setSaveStatus("done");
      }
    } catch (e) {
      setSaveStatus("error");
      setSaveMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Eyebrow icon={<KeyRound size={11} />}>Bureau credentials</Eyebrow>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 10,
        }}
      >
        {BUREAUS.map((b) => (
          <div
            key={b}
            style={{
              padding: 14,
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              background: "white",
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
              {b}
            </span>
            <input
              placeholder="Username"
              value={creds[b].user}
              onChange={(e) =>
                setCreds((c) => ({
                  ...c,
                  [b]: { ...c[b], user: e.target.value },
                }))
              }
              style={loginInput}
            />
            <input
              type="password"
              placeholder="Password"
              value={creds[b].pass}
              onChange={(e) =>
                setCreds((c) => ({
                  ...c,
                  [b]: { ...c[b], pass: e.target.value },
                }))
              }
              style={{ ...loginInput, marginTop: 8 }}
            />
            {b === "Experian" && (
              <input
                placeholder="PIN (Experian)"
                value={creds[b].pin ?? ""}
                onChange={(e) =>
                  setCreds((c) => ({
                    ...c,
                    [b]: { ...c[b], pin: e.target.value },
                  }))
                }
                style={{ ...loginInput, marginTop: 8 }}
              />
            )}
            <a
              href={
                b === "Equifax"
                  ? "https://www.equifax.com/personal/credit-report-services/free-credit-reports/"
                  : b === "Experian"
                    ? "https://www.experian.com/disputes/main.html"
                    : "https://dispute.transunion.com/"
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                marginTop: 8,
                fontSize: 10,
                color: RED,
                fontWeight: 700,
                textDecoration: "none",
                letterSpacing: "0.04em",
              }}
            >
              No account? Create one at {b}
            </a>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={saveCreds}
        disabled={saving || saveStatus === "done"}
        style={{
          alignSelf: "flex-end",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "9px 16px",
          borderRadius: 9999,
          border: 0,
          background:
            saveStatus === "done"
              ? "#10B981"
              : `linear-gradient(135deg, ${RED}, ${RED_2})`,
          color: "white",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.04em",
          cursor: saving || saveStatus === "done" ? "not-allowed" : "pointer",
          opacity: saving ? 0.6 : 1,
          boxShadow: "0 0 0 1px rgba(196,30,58,0.3), 0 4px 14px -6px rgba(196,30,58,0.5)",
        }}
      >
        {saveStatus === "done" ? (
          <>
            <Check size={11} strokeWidth={2.6} />
            Saved
          </>
        ) : saving ? (
          <>
            <Loader size={11} strokeWidth={2} />
            Saving...
          </>
        ) : (
          "Save credentials"
        )}
      </button>

      {saveMsg && (
        <div
          style={{
            padding: "8px 12px",
            background:
              saveStatus === "error"
                ? "rgba(196,30,58,0.06)"
                : "rgba(16,185,129,0.06)",
            border: `1px solid ${saveStatus === "error" ? "rgba(196,30,58,0.2)" : "rgba(16,185,129,0.2)"}`,
            borderRadius: 8,
            fontSize: 11,
            color: saveStatus === "error" ? "#A8182F" : "#059669",
            fontWeight: 600,
          }}
        >
          {saveMsg}
        </div>
      )}
    </div>
  );
}

function StepReview() {
  const summary = [
    { k: "Personal info reviewed", v: "12 cells" },
    { k: "Negative items selected", v: "3" },
    { k: "Documents attached", v: "4 of 4" },
    { k: "Bureau logins", v: "All 3" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Eyebrow icon={<Eye size={11} />}>Final review</Eyebrow>
      {summary.map((row) => (
        <div
          key={row.k}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 14px",
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
            {row.k}
          </span>
          <span
            style={{ fontSize: 13, fontWeight: 700, color: INK }}
          >
            {row.v}
          </span>
        </div>
      ))}
    </div>
  );
}

function StepMonitoring() {
  const opts = [
    { id: "score", label: "Score changes", on: true },
    { id: "new", label: "New accounts opened", on: true },
    { id: "inquiries", label: "Hard inquiries", on: true },
    { id: "fraud", label: "Fraud alerts", on: true },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Eyebrow icon={<Bell size={11} />}>Always-on monitoring</Eyebrow>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 10,
        }}
      >
        {opts.map((o) => (
          <div
            key={o.id}
            style={{
              padding: 14,
              border: `1px solid ${o.on ? RED : "#E5E7EB"}`,
              borderRadius: 12,
              background: o.on ? "rgba(196,30,58,0.04)" : "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>
              {o.label}
            </span>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 9999,
                background: o.on ? RED : "#E5E7EB",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tiny primitives ─────────────────────────────────────────────

function Eyebrow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "#6B7280",
      }}
    >
      {icon}
      {children}
    </span>
  );
}

function Mini({
  active,
  tone,
  children,
  onClick,
}: {
  active: boolean;
  tone: "green" | "red";
  children: React.ReactNode;
  onClick: () => void;
}) {
  const c = tone === "green" ? "#10B981" : RED;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: "0.06em",
        padding: "3px 8px",
        borderRadius: 4,
        border: `1px solid ${active ? c : "#E5E7EB"}`,
        background: active ? c : "white",
        color: active ? "white" : "#6B7280",
        cursor: "pointer",
        textTransform: "uppercase",
      }}
    >
      {children}
    </button>
  );
}

const cellHead: React.CSSProperties = {
  padding: "9px 14px",
  fontSize: 10,
  letterSpacing: "0.2em",
  fontWeight: 700,
  textTransform: "uppercase",
};

const cellLbl: React.CSSProperties = {
  padding: 12,
  fontSize: 10,
  letterSpacing: "0.12em",
  fontWeight: 700,
  textTransform: "uppercase",
  color: "#6B7280",
  background: "#FAFAFA",
  display: "flex",
  alignItems: "center",
};

const loginInput: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 8,
  padding: "8px 10px",
  fontSize: 13,
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  background: "white",
  color: INK,
  outline: "none",
  fontFamily: "inherit",
};
