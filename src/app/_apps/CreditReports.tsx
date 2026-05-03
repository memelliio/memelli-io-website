"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Download,
  ShieldAlert,
  Search as SearchIcon,
  CircleAlert,
  CircleCheck,
  CircleMinus,
  Building,
  CreditCard,
  History,
  Gavel,
  User,
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

const PULL_TIMEOUT_MS = 15_000;

type Bureau = "EQ" | "EX" | "TU";
const BUREAUS: { id: Bureau; full: string }[] = [
  { id: "EQ", full: "Equifax" },
  { id: "EX", full: "Experian" },
  { id: "TU", full: "TransUnion" },
];

type Status = "ok" | "warn" | "bad" | "none";

type PersonalRow = {
  field: string;
  values: Record<Bureau, string>;
  flags?: Partial<Record<Bureau, Status>>;
};

type AccountRow = {
  name: string;
  type: string;
  bureauData: Partial<Record<
    Bureau,
    {
      balance: string;
      limit: string;
      util: string;
      status: string;
      flag: Status;
    }
  >>;
};

type NegativeRow = {
  creditor: string;
  type: string;
  amount: string;
  age: string;
  bureauReports: Partial<Record<Bureau, boolean>>;
};

type InquiryRow = {
  bureau: Bureau;
  name: string;
  date: string;
  soft: boolean;
};

type PublicRow = {
  bureau: Bureau;
  type: string;
  status: string;
  note: string;
};

type Report = {
  pulledAt: string | null;
  scores: Record<Bureau, number | null>;
  personal: PersonalRow[];
  accounts: AccountRow[];
  negatives: NegativeRow[];
  inquiries: InquiryRow[];
  publicRecords: PublicRow[];
};

const EMPTY_REPORT: Report = {
  pulledAt: null,
  scores: { EQ: null, EX: null, TU: null },
  personal: [],
  accounts: [],
  negatives: [],
  inquiries: [],
  publicRecords: [],
};

function bandFor(score: number) {
  if (score >= 740) return { label: "Very Good", color: GREEN, range: "740–799" };
  if (score >= 670) return { label: "Good", color: GREEN, range: "670–739" };
  if (score >= 580) return { label: "Fair", color: AMBER, range: "580–669" };
  return { label: "Poor", color: RED, range: "300–579" };
}

async function fetchReport(): Promise<Report> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), PULL_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/api/credit/reports?limit=1`, {
      credentials: "include",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || typeof data !== "object")
      throw new Error("Empty response from API");
    return {
      pulledAt: data.pulledAt ?? null,
      scores: {
        EQ: data.scores?.EQ ?? null,
        EX: data.scores?.EX ?? null,
        TU: data.scores?.TU ?? null,
      },
      personal: Array.isArray(data.personal) ? data.personal : [],
      accounts: Array.isArray(data.accounts) ? data.accounts : [],
      negatives: Array.isArray(data.negatives) ? data.negatives : [],
      inquiries: Array.isArray(data.inquiries) ? data.inquiries : [],
      publicRecords: Array.isArray(data.publicRecords) ? data.publicRecords : [],
    };
  } finally {
    window.clearTimeout(t);
  }
}

async function triggerPull(): Promise<Report> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), PULL_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/api/credit/pull-trigger`, {
      method: "POST",
      credentials: "include",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await fetchReport();
  } finally {
    window.clearTimeout(t);
  }
}

export function CreditReports() {
  const [report, setReport] = useState<Report>(EMPTY_REPORT);
  const [pulling, setPulling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetchReport();
        if (!cancelled) {
          setReport(r);
          setErr(null);
        }
      } catch (e) {
        if (cancelled) return;
        setErr((e as Error).message || "API unreachable");
        setReport(EMPTY_REPORT);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pull = async () => {
    setPulling(true);
    setErr(null);
    try {
      const r = await triggerPull();
      setReport(r);
    } catch (e) {
      setErr((e as Error).message || "Pull failed");
    } finally {
      setPulling(false);
    }
  };

  const pulledAt = report.pulledAt ? new Date(report.pulledAt) : null;
  const hasData =
    report.scores.EQ != null ||
    report.scores.EX != null ||
    report.scores.TU != null ||
    report.personal.length > 0;

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
      <Header
        pulling={pulling}
        pulledAt={pulledAt}
        onPull={pull}
        err={err}
        loading={loading}
        hasData={hasData}
      />

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "20px 24px 48px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {!hasData && !loading && (
          <EmptyState err={err} onPull={pull} pulling={pulling} />
        )}

        {hasData && (
        <>
        <ScoreRow scores={report.scores} />

        <Section
          eyebrow="Personal Info"
          title="Personal Information"
          icon={<User size={11} />}
        >
          <TriBureauRows
            rows={report.personal.map((p) => ({
              key: p.field,
              cells: BUREAUS.map((b) => ({
                tone: p.flags?.[b.id] ?? "none",
                content: p.values[b.id] || "—",
              })),
            }))}
          />
        </Section>

        <Section
          eyebrow="Accounts"
          title="Open & Closed Accounts"
          icon={<CreditCard size={11} />}
        >
          <TriBureauRows
            rows={report.accounts.map((a) => ({
              key: a.name,
              meta: a.type,
              cells: BUREAUS.map((b) => {
                const d = a.bureauData[b.id];
                if (!d) {
                  return { tone: "none" as const, content: <Empty /> };
                }
                return {
                  tone: d.flag,
                  content: <AccountCell d={d} />,
                };
              }),
            }))}
          />
        </Section>

        <Section
          eyebrow="Negatives"
          title="Negative Items"
          icon={<ShieldAlert size={11} />}
          accent
        >
          <TriBureauRows
            rows={report.negatives.map((n) => ({
              key: n.creditor,
              meta: `${n.type} · ${n.age} · ${n.amount}`,
              cells: BUREAUS.map((b) => {
                const reported = n.bureauReports[b.id];
                if (!reported) {
                  return { tone: "none" as const, content: <Empty /> };
                }
                return {
                  tone: "bad" as const,
                  content: <NegativeCell n={n} />,
                };
              }),
            }))}
          />
        </Section>

        <Section
          eyebrow="Inquiries"
          title="Recent Inquiries"
          icon={<SearchIcon size={11} />}
        >
          <TriBureauColumns rows={report.inquiries} renderInquiry />
        </Section>

        <Section
          eyebrow="Public Records"
          title="Public Records"
          icon={<Gavel size={11} />}
        >
          <TriBureauColumns rows={report.publicRecords} renderPublic />
        </Section>
        </>
        )}
      </div>
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────

function EmptyState({
  err,
  onPull,
  pulling,
}: {
  err: string | null;
  onPull: () => void;
  pulling: boolean;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        padding: 32,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      <span
        style={{
          width: 52,
          height: 52,
          borderRadius: 9999,
          background: err
            ? "rgba(196,30,58,0.08)"
            : "rgba(15,17,21,0.05)",
          color: err ? RED : INK,
          display: "grid",
          placeItems: "center",
        }}
      >
        {err ? (
          <CircleAlert size={22} strokeWidth={2.4} />
        ) : (
          <RefreshCw size={22} strokeWidth={2.4} />
        )}
      </span>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: err ? RED : GRAY,
        }}
      >
        {err ? "Pull failed" : "No report yet"}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: "-0.4px",
        }}
      >
        {err ? "Couldn't reach the credit service." : "Pull your tri-bureau report."}
      </div>
      {err && (
        <div
          style={{
            fontSize: 11.5,
            color: GRAY,
            fontFamily: "ui-monospace, monospace",
            background: "#FAFAFA",
            border: "1px solid #F0F0F2",
            borderRadius: 8,
            padding: "6px 10px",
          }}
        >
          {err}
        </div>
      )}
      <button
        type="button"
        disabled={pulling}
        onClick={onPull}
        style={pullBtn}
      >
        <RefreshCw
          size={12}
          strokeWidth={2.4}
          style={{
            animation: pulling ? "crSpin 1s linear infinite" : "none",
          }}
        />
        {pulling ? "Pulling…" : err ? "Retry pull" : "Pull report"}
      </button>
    </div>
  );
}

// ── Header ──────────────────────────────────────────────────────

function Header({
  pulling,
  pulledAt,
  onPull,
  err,
  loading,
  hasData,
}: {
  pulling: boolean;
  pulledAt: Date | null;
  onPull: () => void;
  err: string | null;
  loading: boolean;
  hasData: boolean;
}) {
  const status: "loading" | "live" | "error" | "empty" = loading
    ? "loading"
    : err
      ? "error"
      : hasData
        ? "live"
        : "empty";
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
          maxWidth: 1200,
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
            Credit Reports
          </span>
          <StatusPill status={status} />
          <span
            style={{
              fontSize: 10.5,
              color: GRAY,
              letterSpacing: "0.04em",
            }}
          >
            {pulledAt
              ? `Last pulled ${pulledAt.toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Not pulled yet"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            style={pillBtn(false)}
          >
            <Download size={12} strokeWidth={2.2} /> Export
          </button>
          <button
            type="button"
            disabled={pulling}
            onClick={onPull}
            style={pullBtn}
          >
            <RefreshCw
              size={12}
              strokeWidth={2.4}
              style={{
                animation: pulling ? "crSpin 1s linear infinite" : "none",
              }}
            />
            {pulling ? "Pulling…" : "Pull report"}
          </button>
        </div>
      </div>
      <style>{`@keyframes crSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StatusPill({
  status,
}: {
  status: "loading" | "live" | "error" | "empty";
}) {
  const cfg = {
    loading: { label: "Loading", bg: "#F0F0F2", fg: GRAY, dot: GRAY },
    live: { label: "Live", bg: "rgba(16,185,129,0.10)", fg: GREEN, dot: GREEN },
    error: { label: "Not connected", bg: "rgba(196,30,58,0.10)", fg: RED, dot: RED },
    empty: { label: "Awaiting pull", bg: "rgba(245,158,11,0.10)", fg: AMBER, dot: AMBER },
  }[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        padding: "3px 10px",
        borderRadius: 9999,
        background: cfg.bg,
        color: cfg.fg,
        border: `1px solid ${cfg.fg}40`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 9999,
          background: cfg.dot,
          boxShadow: `0 0 8px ${cfg.dot}`,
        }}
      />
      {cfg.label}
    </span>
  );
}

// ── Scores ──────────────────────────────────────────────────────

function ScoreRow({ scores }: { scores: Record<Bureau, number | null> }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
      }}
    >
      {BUREAUS.map((b) => {
        const score = scores[b.id] ?? null;
        const band = score != null ? bandFor(score) : null;
        return (
          <div
            key={b.id}
            style={{
              background: "white",
              border: "1px solid #E5E7EB",
              borderRadius: 16,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                background: INK,
                color: "white",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
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
                {b.full}
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
            <div
              style={{
                padding: "20px 16px 16px",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  color: INK,
                }}
              >
                {score ?? "—"}
              </span>
              {band && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: band.color,
                  }}
                >
                  {band.label}
                </span>
              )}
            </div>
            {band && (
              <div
                style={{
                  padding: "0 16px 14px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ScoreBar score={score!} bandColor={band.color} />
              </div>
            )}
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
              <span style={{ color: INK, fontWeight: 700 }}>
                {band?.range ?? "—"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScoreBar({ score, bandColor }: { score: number; bandColor: string }) {
  const min = 300;
  const max = 850;
  const pct = ((score - min) / (max - min)) * 100;
  return (
    <div
      style={{
        flex: 1,
        height: 6,
        borderRadius: 9999,
        background:
          "linear-gradient(90deg, #ef4444 0%, #f59e0b 40%, #10b981 75%, #16a34a 100%)",
        position: "relative",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: `${pct}%`,
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "white",
          boxShadow: `0 0 0 2px ${bandColor}, 0 2px 6px rgba(0,0,0,0.25)`,
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}

// ── Section + tri-bureau rows ───────────────────────────────────

function Section({
  eyebrow,
  title,
  icon,
  accent,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px 0",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: accent ? RED : GRAY,
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
              letterSpacing: "-0.4px",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            {title}
          </h2>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 14,
          height: 6,
          position: "relative",
        }}
      >
        <div
          style={{
            flex: "0 0 60%",
            background: accent ? RED : INK,
            clipPath: "polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)",
          }}
        />
        <div
          style={{
            flex: 1,
            background: "#C9C9CD",
            clipPath: "polygon(14px 0, 100% 0, 100% 100%, 0 100%)",
            marginLeft: -14,
          }}
        />
      </div>
      <div style={{ padding: 0 }}>
        <BureauHeader />
        {children}
      </div>
    </section>
  );
}

function BureauHeader() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px repeat(3, 1fr)",
        background: INK,
        color: "white",
      }}
    >
      <div style={th}>Field</div>
      {BUREAUS.map((b) => (
        <div key={b.id} style={th}>
          {b.full}
        </div>
      ))}
    </div>
  );
}

type Cell = { tone: Status; content: React.ReactNode };
type RowDef = { key: string; meta?: string; cells: Cell[] };

function TriBureauRows({ rows }: { rows: RowDef[] }) {
  return (
    <>
      {rows.map((r) => (
        <div
          key={r.key}
          style={{
            display: "grid",
            gridTemplateColumns: "200px repeat(3, 1fr)",
            borderTop: "1px solid #F0F0F2",
          }}
        >
          <div style={tdLbl}>
            <div>{r.key}</div>
            {r.meta && (
              <div
                style={{
                  fontSize: 10,
                  color: GRAY,
                  fontWeight: 600,
                  marginTop: 2,
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                {r.meta}
              </div>
            )}
          </div>
          {r.cells.map((c, i) => (
            <div key={i} style={cellStyle(c.tone)}>
              {c.content}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function AccountCell({
  d,
}: {
  d: { balance: string; limit: string; util: string; status: string; flag: Status };
}) {
  const tone =
    d.flag === "ok" ? GREEN : d.flag === "warn" ? AMBER : d.flag === "bad" ? RED : GRAY;
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: tone,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 6,
        }}
      >
        {d.flag === "ok" && <CircleCheck size={10} strokeWidth={2.4} />}
        {d.flag === "warn" && <CircleMinus size={10} strokeWidth={2.4} />}
        {d.flag === "bad" && <CircleAlert size={10} strokeWidth={2.4} />}
        {d.status}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 4,
        }}
      >
        <Stat label="Bal" value={d.balance} />
        <Stat label="Lim" value={d.limit} />
        <Stat label="Util" value={d.util} accent={d.flag !== "ok"} />
      </div>
    </div>
  );
}

function NegativeCell({ n }: { n: { type: string; amount: string } }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: RED,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 4,
        }}
      >
        <ShieldAlert size={10} strokeWidth={2.4} /> {n.type}
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: RED }}>
        {n.amount}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: GRAY,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: accent ? RED : INK,
          marginTop: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <span
      style={{
        fontSize: 11,
        color: "#C9C9CD",
        letterSpacing: "0.12em",
        fontWeight: 700,
      }}
    >
      —
    </span>
  );
}

// ── Tri-bureau columns (for inquiries + public records) ─────────

function TriBureauColumns({
  rows,
  renderInquiry,
  renderPublic,
}: {
  rows: InquiryRow[] | PublicRow[];
  renderInquiry?: boolean;
  renderPublic?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px repeat(3, 1fr)",
        borderTop: "1px solid #F0F0F2",
      }}
    >
      <div style={{ ...tdLbl, alignItems: "flex-start" }}>
        {renderInquiry ? "By bureau" : "Status"}
      </div>
      {BUREAUS.map((b) => {
        const items = rows.filter((r) => r.bureau === b.id);
        return (
          <div
            key={b.id}
            style={{
              padding: 12,
              borderLeft: "1px solid #F0F0F2",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              minHeight: 64,
            }}
          >
            {items.length === 0 && <Empty />}
            {renderInquiry &&
              items.map((it, i) => {
                const q = it as InquiryRow;
                return (
                  <div
                    key={`${q.name}-${i}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: q.soft
                          ? "#EEF2FF"
                          : "rgba(245,158,11,0.12)",
                        color: q.soft ? "#6366F1" : AMBER,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Building size={11} strokeWidth={2.2} />
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: INK,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {q.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: GRAY,
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {q.date} · {q.soft ? "Soft" : "Hard"}
                      </div>
                    </div>
                  </div>
                );
              })}
            {renderPublic &&
              items.map((it, i) => {
                const p = it as PublicRow;
                return (
                  <div
                    key={`${p.type}-${i}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: "#F0F0F2",
                        color: GRAY,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <History size={11} strokeWidth={2.2} />
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: INK,
                        }}
                      >
                        {p.type}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: GRAY,
                        }}
                      >
                        {p.note}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}

// ── Cell + button styles ────────────────────────────────────────

const th: React.CSSProperties = {
  padding: "9px 14px",
  fontSize: 10,
  letterSpacing: "0.2em",
  fontWeight: 700,
  textTransform: "uppercase",
};

const tdLbl: React.CSSProperties = {
  padding: 12,
  fontSize: 10,
  letterSpacing: "0.12em",
  fontWeight: 700,
  textTransform: "uppercase",
  color: GRAY,
  background: "#FAFAFA",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

function cellStyle(tone: Status): React.CSSProperties {
  const tint =
    tone === "bad"
      ? "rgba(196,30,58,0.05)"
      : tone === "warn"
        ? "rgba(245,158,11,0.05)"
        : tone === "ok"
          ? "rgba(16,185,129,0.04)"
          : "white";
  const rail =
    tone === "bad"
      ? RED
      : tone === "warn"
        ? AMBER
        : tone === "ok"
          ? GREEN
          : "transparent";
  return {
    padding: 12,
    borderLeft: "1px solid #F0F0F2",
    background: tint,
    boxShadow: rail === "transparent" ? "none" : `inset 3px 0 0 ${rail}`,
    fontSize: 12.5,
    color: INK,
    minHeight: 64,
  };
}

function pillBtn(disabled: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "8px 12px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.04em",
    borderRadius: 9999,
    border: "1px solid #E5E7EB",
    background: "white",
    color: GRAY,
    cursor: disabled ? "default" : "pointer",
  };
}

const pullBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  fontSize: 11.5,
  fontWeight: 800,
  letterSpacing: "0.04em",
  borderRadius: 9999,
  border: 0,
  background: `linear-gradient(135deg, ${RED}, ${RED_2})`,
  color: "white",
  cursor: "pointer",
  boxShadow:
    "0 0 0 1px rgba(196,30,58,0.4), 0 8px 22px -8px rgba(196,30,58,0.55)",
};
