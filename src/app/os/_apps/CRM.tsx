"use client";

import { useState } from "react";
import {
  Users,
  Building2,
  Briefcase,
  Star,
  PhoneCall,
  Mail,
  Plus,
  Filter,
  Search,
  ArrowUpRight,
} from "lucide-react";
import {
  EditorialShell,
  BrandHeader,
  EditorialHero,
  Section,
  PrimaryPill,
  OutlinePill,
  StatusChip,
  Stat,
  Index,
  Eyebrow,
} from "../_skin/Editorial";
import { RED, INK, MUTED, LINE, LINE_SOFT, PAPER, SOFT } from "../_skin/tokens";

const STAGES = [
  { id: "lead", label: "Leads", count: 14 },
  { id: "qual", label: "Qualified", count: 9 },
  { id: "demo", label: "In Demo", count: 6 },
  { id: "negot", label: "Negotiating", count: 4 },
  { id: "won", label: "Won", count: 3 },
] as const;

type Stage = (typeof STAGES)[number]["id"];

type Deal = {
  contact: string;
  company: string;
  amount: string;
  stage: Stage;
  age: string;
  hot: boolean;
};

const DEALS: Deal[] = [
  { contact: "Maria Santos", company: "Santos Auto Group", amount: "$48,000", stage: "negot", age: "3d", hot: true },
  { contact: "Brian Cole", company: "Cole Logistics", amount: "$12,400", stage: "demo", age: "1d", hot: false },
  { contact: "Aisha Patel", company: "Patel & Co Realty", amount: "$22,000", stage: "qual", age: "5d", hot: true },
  { contact: "Diego Ramirez", company: "Ramirez Construction", amount: "$96,000", stage: "won", age: "12d", hot: false },
  { contact: "Olivia Brooks", company: "Brooks Bakery", amount: "$8,600", stage: "lead", age: "2h", hot: false },
  { contact: "Noah Reed", company: "Reed Wellness", amount: "$15,200", stage: "demo", age: "6d", hot: false },
  { contact: "Yui Tanaka", company: "Tanaka Studio", amount: "$32,800", stage: "negot", age: "9d", hot: true },
  { contact: "Marcus Webb", company: "Webb Industrial", amount: "$58,100", stage: "qual", age: "1w", hot: false },
];

const CONTACTS = [
  { name: "Maria Santos", role: "CFO", company: "Santos Auto Group", email: "maria@santos.co", phone: "+1 512-555-0118", tag: "Hot" as const },
  { name: "Brian Cole", role: "Owner", company: "Cole Logistics", email: "brian@colelog.com", phone: "+1 832-555-0142", tag: "Demo" as const },
  { name: "Aisha Patel", role: "Broker", company: "Patel & Co Realty", email: "aisha@patelco.com", phone: "+1 713-555-0193", tag: "Hot" as const },
  { name: "Diego Ramirez", role: "Owner", company: "Ramirez Construction", email: "diego@ramirez.build", phone: "+1 469-555-0134", tag: "Won" as const },
  { name: "Olivia Brooks", role: "Founder", company: "Brooks Bakery", email: "olivia@brooks.bake", phone: "+1 956-555-0155", tag: "New" as const },
];

const TAG_TONE: Record<(typeof CONTACTS)[number]["tag"], "bad" | "warn" | "info" | "ok" | "muted"> = {
  Hot: "bad",
  Demo: "warn",
  Won: "ok",
  New: "info",
};

export function CRM() {
  const [stage, setStage] = useState<Stage | null>(null);
  const filtered = stage ? DEALS.filter((d) => d.stage === stage) : DEALS;

  return (
    <EditorialShell>
      <BrandHeader
        app="CRM"
        right={
          <>
            <OutlinePill>
              <Filter size={12} strokeWidth={2.2} /> Filter
            </OutlinePill>
            <OutlinePill>
              <Search size={12} strokeWidth={2.2} /> Search
            </OutlinePill>
            <PrimaryPill>
              <Plus size={12} strokeWidth={2.4} /> New deal
            </PrimaryPill>
          </>
        }
      />

      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "20px 24px 48px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <EditorialHero
          eyebrow="CRM"
          title={
            <>
              Pipelines, contacts, deals — <span style={{ color: RED }}>one workspace.</span>
            </>
          }
          redLabel="Pipeline"
          grayLabel="Live"
          inkLeft="Sales"
          inkRight={`${DEALS.length} active`}
          meta={
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto auto",
                gap: "4px 14px",
              }}
            >
              <Stat label="MRR" value="$92,400" />
              <Stat label="Pipe" value="$248,100" accent />
            </div>
          }
        />

        <Section
          eyebrow="Pipeline"
          title="Stages"
          icon={<Briefcase size={11} />}
          right={
            <OutlinePill onClick={() => setStage(null)}>All</OutlinePill>
          }
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`,
              gap: 8,
            }}
          >
            {STAGES.map((s, i) => {
              const active = stage === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStage(s.id === stage ? null : s.id)}
                  style={{
                    background: active ? "rgba(196,30,58,0.04)" : PAPER,
                    border: `1px solid ${active ? RED : LINE}`,
                    borderRadius: 12,
                    padding: 12,
                    textAlign: "left",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Index i={i + 1} total={STAGES.length} active={active} />
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 9999,
                        background:
                          s.id === "won"
                            ? "#10B981"
                            : s.id === "lead"
                              ? MUTED
                              : RED,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: INK,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: active ? RED : INK,
                      marginTop: 2,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {s.count}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section
          eyebrow="Deals"
          title={stage ? STAGES.find((x) => x.id === stage)!.label : "All deals"}
          icon={<Briefcase size={11} />}
        >
          <div
            style={{
              border: `1px solid ${LINE}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr 1fr 110px 90px 80px 36px",
                background: INK,
                color: PAPER,
              }}
            >
              <div style={th}>#</div>
              <div style={th}>Contact</div>
              <div style={th}>Company</div>
              <div style={th}>Stage</div>
              <div style={th}>Amount</div>
              <div style={th}>Age</div>
              <div style={th}></div>
            </div>
            {filtered.map((d, i) => {
              const stageMeta = STAGES.find((s) => s.id === d.stage)!;
              return (
                <div
                  key={`${d.contact}-${i}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr 1fr 110px 90px 80px 36px",
                    alignItems: "center",
                    padding: "10px 12px",
                    borderTop: i ? `1px solid ${LINE_SOFT}` : 0,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = SOFT)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = PAPER)}
                >
                  <Index i={i + 1} />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      minWidth: 0,
                    }}
                  >
                    <Avatar name={d.contact} />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: INK,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {d.contact}
                        {d.hot && (
                          <Star
                            size={10}
                            strokeWidth={2.4}
                            color={RED}
                            fill={RED}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: MUTED,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {d.company}
                  </span>
                  <StatusChip
                    tone={
                      d.stage === "won"
                        ? "ok"
                        : d.stage === "negot"
                          ? "bad"
                          : d.stage === "demo"
                            ? "warn"
                            : "info"
                    }
                  >
                    {stageMeta.label}
                  </StatusChip>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: INK,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {d.amount}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: MUTED,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {d.age}
                  </span>
                  <ArrowUpRight size={13} strokeWidth={2.2} color={MUTED} />
                </div>
              );
            })}
          </div>
        </Section>

        <Section
          eyebrow="Contacts"
          title="Top Contacts"
          icon={<Users size={11} />}
          right={
            <OutlinePill>
              <Plus size={11} strokeWidth={2.4} /> Add contact
            </OutlinePill>
          }
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 10,
            }}
          >
            {CONTACTS.map((c, i) => (
              <div
                key={c.name}
                style={{
                  background: PAPER,
                  border: `1px solid ${LINE}`,
                  borderRadius: 12,
                  padding: 14,
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 12,
                  }}
                >
                  <Index i={i + 1} total={CONTACTS.length} />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Avatar name={c.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: INK,
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10.5,
                        color: MUTED,
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {c.role} · {c.company}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 8,
                    borderTop: `1px solid ${LINE_SOFT}`,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10.5,
                      color: MUTED,
                    }}
                  >
                    <Mail size={11} strokeWidth={2.2} />
                    {c.email}
                  </span>
                  <StatusChip tone={TAG_TONE[c.tag]}>{c.tag}</StatusChip>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                  }}
                >
                  <OutlinePill>
                    <PhoneCall size={11} strokeWidth={2.2} /> Call
                  </OutlinePill>
                  <OutlinePill>
                    <Mail size={11} strokeWidth={2.2} /> Email
                  </OutlinePill>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="Companies"
          title="Recent Companies"
          icon={<Building2 size={11} />}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
            }}
          >
            {DEALS.slice(0, 6).map((d, i) => (
              <div
                key={d.company}
                style={{
                  background: PAPER,
                  border: `1px solid ${LINE}`,
                  borderRadius: 12,
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 10,
                  }}
                >
                  <Index i={i + 1} total={6} />
                </div>
                <Eyebrow>Company</Eyebrow>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: INK,
                  }}
                >
                  {d.company}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: MUTED,
                    letterSpacing: "0.04em",
                  }}
                >
                  Owner · {d.contact}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </EditorialShell>
  );
}

// ── Small helpers ────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const init = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      style={{
        width: 32,
        height: 32,
        borderRadius: 9999,
        background: `linear-gradient(135deg, ${RED}, #A8182F)`,
        color: PAPER,
        display: "grid",
        placeItems: "center",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.04em",
        flexShrink: 0,
      }}
    >
      {init}
    </span>
  );
}

const th: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 9.5,
  letterSpacing: "0.18em",
  fontWeight: 700,
  textTransform: "uppercase",
};
