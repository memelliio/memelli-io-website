"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  ShieldAlert,
  FileText,
  CreditCard,
  CircleAlert,
} from "lucide-react";

const RED = "var(--brand-color, #C41E3A)";
const RED_2 = "#A8182F";
const INK = "#0B0B0F";
const GREEN = "#10B981";
const AMBER = "#F59E0B";
const GRAY = "#6B7280";

const API_BASE =
  (typeof window !== "undefined" &&
    (window as { MEMELLI_API_URL?: string }).MEMELLI_API_URL) ||
  "";  // same-origin — Next.js api routes live in this app

// ── Types ────────────────────────────────────────────────────────

type Tab = "scores" | "reports" | "disputes";

type ScoreEntry = { bureau: string; score: number };

type ReportRow = {
  id: string;
  createdAt: string;
  decisionTier?: string;
};

type DisputeItem = {
  category: string;
  description: string;
  severity: string;
  bureau?: string;
};

// ── Helpers ──────────────────────────────────────────────────────

function getToken(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("memelli_token") ||
    localStorage.getItem("memelli_live_token") ||
    ""
  );
}

function getLocalScores(): ScoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("memelli_prequal_result");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const data = parsed?.data ?? parsed;
    const scores = data?.credit_scores ?? data?.scores;
    if (Array.isArray(scores)) return scores as ScoreEntry[];
  } catch {
    // noop
  }
  return [];
}

function bandFor(score: number) {
  if (score >= 740) return { label: "Very Good", color: GREEN };
  if (score >= 670) return { label: "Good", color: GREEN };
  if (score >= 580) return { label: "Fair", color: AMBER };
  return { label: "Poor", color: RED };
}

// ── Main component ───────────────────────────────────────────────

export function Credit() {
  const [tab, setTab] = useState<Tab>("scores");
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [reportsErr, setReportsErr] = useState<string | null>(null);
  const [disputesErr, setDisputesErr] = useState<string | null>(null);

  // Scores: read from localStorage first
  useEffect(() => {
    const local = getLocalScores();
    if (local.length) {
      setScores(local);
      return;
    }
    // Fall back to /api/credit/latest
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/api/credit/latest`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json) return;
        const data = json?.data ?? json;
        const raw = data?.credit_scores ?? data?.scores;
        if (Array.isArray(raw)) setScores(raw as ScoreEntry[]);
      })
      .catch(() => {
        // silently ignore — empty state covers it
      });
  }, []);

  // Reports tab: fetch on open
  useEffect(() => {
    if (tab !== "reports") return;
    const token = getToken();
    if (!token) return;
    setLoadingReports(true);
    setReportsErr(null);
    fetch(`${API_BASE}/api/credit/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const rows = json?.data ?? json?.reports ?? (Array.isArray(json) ? json : []);
        setReports(Array.isArray(rows) ? rows : []);
      })
      .catch((e: Error) => setReportsErr(e.message))
      .finally(() => setLoadingReports(false));
  }, [tab]);

  // Disputes tab: fetch on open via /api/credit-reports/disputes/:contactId
  useEffect(() => {
    if (tab !== "disputes") return;
    const token = getToken();
    if (!token) return;
    // Decode contactId from JWT sub claim
    let contactId: string | null = null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      contactId = payload?.sub ?? null;
    } catch {
      // noop
    }
    if (!contactId) return;
    setLoadingDisputes(true);
    setDisputesErr(null);
    fetch(`${API_BASE}/api/credit-reports/disputes/${contactId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const data = json?.data ?? json;
        const items =
          data?.dispute_items ??
          data?.disputes ??
          data?.issues ??
          (Array.isArray(data) ? data : []);
        setDisputes(Array.isArray(items) ? items : []);
      })
      .catch((e: Error) => setDisputesErr(e.message))
      .finally(() => setLoadingDisputes(false));
  }, [tab]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#FAFAFA",
        color: INK,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* ── Top bar ────────────────────────────────────────────── */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid #E5E7EB",
          padding: "14px 24px 0",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
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
              color: RED,
            }}
          >
            Credit
          </span>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0 }}>
          {(
            [
              { id: "scores" as Tab, label: "Scores", icon: <CreditCard size={11} strokeWidth={2.2} /> },
              { id: "reports" as Tab, label: "Reports", icon: <FileText size={11} strokeWidth={2.2} /> },
              { id: "disputes" as Tab, label: "Disputes", icon: <ShieldAlert size={11} strokeWidth={2.2} /> },
            ] satisfies { id: Tab; label: string; icon: React.ReactNode }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: "0.04em",
                background: "none",
                border: "none",
                borderBottom: tab === t.id ? `2px solid ${RED}` : "2px solid transparent",
                color: tab === t.id ? RED : GRAY,
                cursor: "pointer",
                marginBottom: -1,
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 40px" }}>
        {tab === "scores" && <ScoresTab scores={scores} />}
        {tab === "reports" && (
          <ReportsTab
            reports={reports}
            loading={loadingReports}
            err={reportsErr}
          />
        )}
        {tab === "disputes" && (
          <DisputesTab
            disputes={disputes}
            loading={loadingDisputes}
            err={disputesErr}
          />
        )}
      </div>
    </div>
  );
}

// ── Scores tab ────────────────────────────────────────────────────

function ScoresTab({ scores }: { scores: ScoreEntry[] }) {
  if (scores.length === 0) {
    return (
      <Empty
        icon={<CreditCard size={22} strokeWidth={2} />}
        title="No scores yet"
        body="Complete a pre-qualification pull to see your bureau scores here."
      />
    );
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
      }}
    >
      {scores.map((s) => {
        const band = bandFor(s.score);
        const pct = Math.round(((s.score - 300) / (850 - 300)) * 100);
        return (
          <div
            key={s.bureau}
            style={{
              background: "white",
              border: "1px solid #E5E7EB",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 1px 0 rgba(0,0,0,0.02), 0 8px 24px -16px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                background: INK,
                color: "white",
                padding: "10px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                }}
              >
                {s.bureau}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  color: RED,
                  textTransform: "uppercase",
                }}
              >
                FICO 8
              </span>
            </div>
            <div style={{ padding: "20px 16px 8px" }}>
              <span
                style={{
                  fontSize: 52,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  color: INK,
                  display: "block",
                }}
              >
                {s.score}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: band.color,
                  marginTop: 4,
                  display: "block",
                }}
              >
                {band.label}
              </span>
            </div>
            {/* Score bar */}
            <div style={{ padding: "8px 16px 14px" }}>
              <div
                style={{
                  height: 6,
                  borderRadius: 9999,
                  background:
                    "linear-gradient(90deg, #ef4444 0%, #f59e0b 40%, #10b981 75%, #16a34a 100%)",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: `${pct}%`,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "white",
                    boxShadow: `0 0 0 2px ${band.color}, 0 2px 6px rgba(0,0,0,0.25)`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </div>
            </div>
            <div
              style={{
                padding: "8px 16px",
                background: "#FAFAFA",
                borderTop: "1px solid #F0F0F2",
                fontSize: 10,
                color: GRAY,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Range</span>
              <span style={{ color: INK, fontWeight: 700 }}>300–850</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Reports tab ────────────────────────────────────────────────────

function ReportsTab({
  reports,
  loading,
  err,
}: {
  reports: ReportRow[];
  loading: boolean;
  err: string | null;
}) {
  if (loading) return <Spinner />;
  if (err)
    return (
      <Empty
        icon={<CircleAlert size={22} strokeWidth={2} />}
        title="Could not load reports"
        body={err}
        accent
      />
    );
  if (reports.length === 0)
    return (
      <Empty
        icon={<FileText size={22} strokeWidth={2} />}
        title="No reports on file"
        body="Pull a credit report to see history here."
      />
    );
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 1px 0 rgba(0,0,0,0.02), 0 8px 24px -16px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          background: INK,
          color: "white",
          padding: "9px 16px",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        <span>Report ID</span>
        <span style={{ marginRight: 32 }}>Tier</span>
        <span>Pulled</span>
      </div>
      {reports.map((r, i) => (
        <div
          key={r.id}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            alignItems: "center",
            padding: "12px 16px",
            borderTop: i === 0 ? "none" : "1px solid #F0F0F2",
            fontSize: 12.5,
            color: INK,
          }}
        >
          <span
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 11,
              color: GRAY,
            }}
          >
            {r.id.slice(0, 16)}…
          </span>
          <span
            style={{
              marginRight: 32,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: r.decisionTier ? RED : GRAY,
            }}
          >
            {r.decisionTier ?? "—"}
          </span>
          <span style={{ fontSize: 11, color: GRAY }}>
            {new Date(r.createdAt).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Disputes tab ───────────────────────────────────────────────────

function DisputesTab({
  disputes,
  loading,
  err,
}: {
  disputes: DisputeItem[];
  loading: boolean;
  err: string | null;
}) {
  if (loading) return <Spinner />;
  if (err)
    return (
      <Empty
        icon={<CircleAlert size={22} strokeWidth={2} />}
        title="Could not load disputes"
        body={err}
        accent
      />
    );
  if (disputes.length === 0)
    return (
      <Empty
        icon={<ShieldAlert size={22} strokeWidth={2} />}
        title="No disputes on file"
        body="When negative items are flagged for dispute they will appear here."
      />
    );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {disputes.map((d, i) => {
        const sevColor =
          d.severity === "critical"
            ? RED
            : d.severity === "high"
              ? "#EF4444"
              : d.severity === "medium"
                ? AMBER
                : GRAY;
        return (
          <div
            key={i}
            style={{
              background: "white",
              border: "1px solid #E5E7EB",
              borderRadius: 14,
              padding: "14px 16px",
              boxShadow:
                "0 1px 0 rgba(0,0,0,0.02), 0 8px 24px -16px rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 9999,
                background: `${sevColor}18`,
                color: sevColor,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              <ShieldAlert size={14} strokeWidth={2.4} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: INK,
                  }}
                >
                  {d.category}
                </span>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: 9999,
                    background: `${sevColor}18`,
                    color: sevColor,
                  }}
                >
                  {d.severity}
                </span>
                {d.bureau && (
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: GRAY,
                    }}
                  >
                    {d.bureau}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: GRAY,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {d.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Shared primitives ─────────────────────────────────────────────

function Empty({
  icon,
  title,
  body,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        padding: 40,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span
        style={{
          width: 52,
          height: 52,
          borderRadius: 9999,
          background: accent ? "rgba(196,30,58,0.08)" : "rgba(11,11,15,0.05)",
          color: accent ? RED : INK,
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon}
      </span>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: accent ? RED : GRAY,
        }}
      >
        {title}
      </div>
      <p style={{ fontSize: 13, color: GRAY, margin: 0, maxWidth: 320, lineHeight: 1.6 }}>
        {body}
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: 40,
        color: GRAY,
      }}
    >
      <RefreshCw
        size={20}
        strokeWidth={2}
        style={{ animation: "creditSpin 1s linear infinite" }}
      />
      <style>{`@keyframes creditSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
