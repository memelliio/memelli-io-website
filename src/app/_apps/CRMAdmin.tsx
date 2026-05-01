"use client";

import { useState } from "react";
import {
  PhoneCall,
  Mail,
  MessageSquare,
  Voicemail,
  Calendar,
  Briefcase,
  Users,
  Target,
  Clock,
  AlertTriangle,
  Inbox,
  Send,
  Star,
  ArrowUpRight,
  TrendingUp,
  Plus,
  Filter,
  Search,
  Phone,
  Workflow,
  ListChecks,
  Plug,
} from "lucide-react";
import {
  TerminalShell,
  TerminalHeader,
  TerminalTabs,
  TerminalSection,
  TerminalKpi,
  TerminalChip,
  TerminalIndex,
  TerminalButton,
  TerminalTable,
  TerminalThead,
  TerminalTh,
  TerminalTr,
  TerminalTd,
  TFG,
  TFG_DIM,
  TFG_FAINT,
  TLINE,
  TINK_3,
  TGREEN,
  TAMBER,
  TINFO,
  TMONO,
} from "../_skin/Terminal";
import { RED, RED_2 } from "../_skin/tokens";

const NAV = [
  { id: "ops", label: "Ops", icon: Target },
  { id: "pipeline", label: "Pipeline", icon: Briefcase },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "sequences", label: "Sequences", icon: Workflow },
  { id: "templates", label: "Templates", icon: Send },
  { id: "reports", label: "Reports", icon: TrendingUp },
] as const;

type Tab = (typeof NAV)[number]["id"];

const KPIS = [
  { label: "Pipeline value", value: "$248,100", delta: "+$12,400 7d", tone: "ok" as const },
  { label: "Forecast 30d", value: "$84,200", delta: "75% conf.", tone: "ok" as const },
  { label: "MRR", value: "$92,400", delta: "+3.2%", tone: "ok" as const },
  { label: "Calls today", value: "43", delta: "Goal 60", tone: "warn" as const },
  { label: "Replies waiting", value: "11", delta: "Oldest 4h", tone: "warn" as const },
  { label: "Stuck deals", value: "6", delta: ">7d no activity", tone: "bad" as const },
];

const ACTION_QUEUE = [
  { kind: "callback", count: 9, label: "Callbacks scheduled", tone: "warn" as const, age: "Next 12m" },
  { kind: "follow", count: 14, label: "Follow-ups due", tone: "warn" as const, age: "Today" },
  { kind: "stuck", count: 6, label: "Deals stuck >7d", tone: "bad" as const, age: "Re-engage" },
  { kind: "leads", count: 8, label: "Leads to assign", tone: "info" as const, age: "Hot · 2h" },
  { kind: "reply", count: 11, label: "Replies waiting", tone: "warn" as const, age: "4h oldest" },
  { kind: "expire", count: 3, label: "Proposals expiring", tone: "bad" as const, age: "<48h" },
];

const STAGES = [
  { id: "new", label: "New", count: 23, value: "$0", tone: "muted" as const },
  { id: "qual", label: "Qualified", count: 14, value: "$96k", tone: "info" as const },
  { id: "demo", label: "In Demo", count: 9, value: "$78k", tone: "info" as const },
  { id: "prop", label: "Proposal", count: 6, value: "$112k", tone: "warn" as const },
  { id: "negot", label: "Negotiating", count: 4, value: "$68k", tone: "warn" as const },
  { id: "won", label: "Won 30d", count: 11, value: "$184k", tone: "ok" as const },
  { id: "lost", label: "Lost 30d", count: 7, value: "$94k", tone: "bad" as const },
];

const ACTIVITY = [
  { actor: "Maria S.", action: "Called", subj: "Cole Logistics — 14m talk", tone: "ok" as const, when: "12m" },
  { actor: "Aaron J.", action: "Email reply", subj: "Patel & Co — proposal v2 sent", tone: "info" as const, when: "31m" },
  { actor: "Dana K.", action: "SMS", subj: "Olivia Brooks — appointment confirmed", tone: "ok" as const, when: "47m" },
  { actor: "Maria S.", action: "Voicemail", subj: "Diego Ramirez — callback requested", tone: "warn" as const, when: "1h" },
  { actor: "Aaron J.", action: "Deal moved", subj: "Webb Industrial → Negotiating", tone: "info" as const, when: "2h" },
  { actor: "Dana K.", action: "Lead assigned", subj: "8 new leads → Maria S.", tone: "info" as const, when: "3h" },
];

const STUCK = [
  { name: "Webb Industrial", owner: "Maria S.", value: "$58,100", stage: "Negotiating", days: 12 },
  { name: "Cole Logistics", owner: "Aaron J.", value: "$12,400", stage: "Demo", days: 9 },
  { name: "Brooks Bakery", owner: "Dana K.", value: "$8,600", stage: "Qualified", days: 14 },
  { name: "Reed Wellness", owner: "Maria S.", value: "$15,200", stage: "Demo", days: 11 },
];

const HOT_LEADS = [
  { name: "Lila Park", source: "Inbound · /funding", score: 94, when: "12m" },
  { name: "Marcus Webb", source: "Referral · Maria", score: 88, when: "32m" },
  { name: "Yui Tanaka", source: "Cold call follow-up", score: 81, when: "1h" },
  { name: "Sam O'Brien", source: "/credit-repair signup", score: 77, when: "2h" },
];

const TASKS = [
  { id: "T-422", title: "Call Brian Cole — proposal walkthrough", owner: "Maria S.", due: "1:30p", tone: "warn" as const, type: "call" as const },
  { id: "T-421", title: "Send pricing v3 to Patel & Co", owner: "Aaron J.", due: "2:00p", tone: "info" as const, type: "email" as const },
  { id: "T-420", title: "Follow-up SMS — Olivia Brooks", owner: "Dana K.", due: "Today", tone: "info" as const, type: "sms" as const },
  { id: "T-419", title: "Re-engage Webb Industrial", owner: "Maria S.", due: "Tomorrow", tone: "bad" as const, type: "call" as const },
  { id: "T-418", title: "Demo prep — Reed Wellness", owner: "Aaron J.", due: "Wed", tone: "info" as const, type: "calendar" as const },
];

const SEQUENCES = [
  { name: "Fresh signup · 7d nurture", active: 412, opens: "62%", replies: "11%", tone: "ok" as const },
  { name: "Stuck deal · 14d re-engage", active: 38, opens: "44%", replies: "8%", tone: "warn" as const },
  { name: "Cold list · 12 step", active: 1240, opens: "31%", replies: "3.2%", tone: "info" as const },
  { name: "Win-back · 30d", active: 88, opens: "28%", replies: "2.8%", tone: "muted" as const },
];

const TEAM = [
  { name: "Maria Santos", calls: 18, emails: 22, deals: 6, value: "$84k", load: 82 },
  { name: "Aaron Johnson", calls: 14, emails: 31, deals: 4, value: "$48k", load: 64 },
  { name: "Dana Kim", calls: 11, emails: 18, deals: 3, value: "$32k", load: 48 },
];

const INTEGRATIONS = [
  { name: "Twilio Voice", status: "Connected", tone: "ok" as const, note: "43 calls today · 92m" },
  { name: "Gmail / SMTP", status: "Connected", tone: "ok" as const, note: "62% open · 11% reply" },
  { name: "Calendar", status: "Connected", tone: "ok" as const, note: "9 bookings · today" },
  { name: "Zapier", status: "Degraded", tone: "warn" as const, note: "1 zap stuck" },
];

export function CRMAdmin() {
  const [tab, setTab] = useState<Tab>("ops");

  return (
    <TerminalShell>
      <TerminalHeader
        title="CRM · Admin Console"
        subtitle="memelli-crm-service"
        right={
          <>
            <TerminalButton variant="ghost" size="sm">
              <Search size={11} strokeWidth={2.2} /> Search
            </TerminalButton>
            <TerminalButton variant="ghost" size="sm">
              <Filter size={11} strokeWidth={2.2} /> Filter
            </TerminalButton>
            <TerminalButton variant="primary" size="sm">
              <Plus size={11} strokeWidth={2.4} /> New deal
            </TerminalButton>
          </>
        }
      />

      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "12px 16px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <TerminalTabs<Tab> tabs={NAV as never} active={tab} onChange={setTab} />

        {tab === "ops" && <OpsView />}
        {tab === "pipeline" && (
          <>
            <PipelineStrip />
            <TerminalSection title="stuck-deals" hint="re-engage" accent>
              <StuckTable />
            </TerminalSection>
          </>
        )}
        {tab === "inbox" && <InboxView />}
        {tab === "tasks" && <TasksView />}
        {tab === "contacts" && (
          <TerminalSection title="contacts" hint="GET /api/crm/contacts">
            <Empty desc="Searchable book · LTV · last touch · custom fields · segments." />
          </TerminalSection>
        )}
        {tab === "calls" && <CallsView />}
        {tab === "sequences" && <SequencesView />}
        {tab === "templates" && (
          <TerminalSection title="templates" hint="email + sms">
            <Empty desc="Snippets · merge tags · per-stage defaults · A/B variants." />
          </TerminalSection>
        )}
        {tab === "reports" && <ReportsView />}

        <TerminalSection title="team-load" hint="today's distribution">
          <TeamLoad />
        </TerminalSection>

        <IntegrationsRow />
      </div>
    </TerminalShell>
  );
}

// ── OPS ────────────────────────────────────────────────────────

function OpsView() {
  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${KPIS.length}, 1fr)`,
          gap: 8,
        }}
      >
        {KPIS.map((k, i) => (
          <TerminalKpi
            key={k.label}
            index={i + 1}
            total={KPIS.length}
            label={k.label}
            value={k.value}
            delta={k.delta}
            tone={k.tone}
          />
        ))}
      </div>

      <TerminalSection title="action-queue" hint="today's must-do" accent>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 8,
          }}
        >
          {ACTION_QUEUE.map((a, i) => (
            <ActionTile key={a.kind} index={i + 1} total={ACTION_QUEUE.length} {...a} />
          ))}
        </div>
      </TerminalSection>

      <PipelineStrip />

      <TerminalSection title="activity" hint="live team stream">
        <ActivityStream />
      </TerminalSection>

      <TerminalSection title="stuck-deals" hint="at risk" accent>
        <StuckTable />
      </TerminalSection>
    </>
  );
}

function PipelineStrip() {
  return (
    <TerminalSection title="pipeline" hint="stages this round">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`,
          gap: 6,
        }}
      >
        {STAGES.map((s, i) => (
          <div
            key={s.id}
            style={{
              background: TINK_3,
              border: `1px solid ${TLINE}`,
              borderRadius: 6,
              padding: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <TerminalIndex i={i + 1} total={STAGES.length} />
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 9999,
                  background:
                    s.tone === "ok"
                      ? TGREEN
                      : s.tone === "bad"
                        ? RED
                        : s.tone === "warn"
                          ? TAMBER
                          : s.tone === "info"
                            ? TINFO
                            : TFG_FAINT,
                }}
              />
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: TFG_DIM,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                marginTop: 2,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: TFG,
                  fontFamily: TMONO,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.02em",
                }}
              >
                {s.count}
              </span>
              <span
                style={{ fontSize: 10.5, color: TFG_DIM, fontWeight: 700 }}
              >
                {s.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </TerminalSection>
  );
}

function StuckTable() {
  return (
    <TerminalTable cols="44px 1fr 130px 100px 110px 70px 36px">
      <TerminalThead>
        <TerminalTh>#</TerminalTh>
        <TerminalTh>Deal</TerminalTh>
        <TerminalTh>Owner</TerminalTh>
        <TerminalTh>Value</TerminalTh>
        <TerminalTh>Stage</TerminalTh>
        <TerminalTh>Idle</TerminalTh>
        <TerminalTh></TerminalTh>
      </TerminalThead>
      {STUCK.map((d, i) => (
        <TerminalTr key={d.name} rail={d.days > 10 ? RED : TAMBER}>
          <TerminalTd mono color={TFG_FAINT}>
            {String(i + 1).padStart(2, "0")}
          </TerminalTd>
          <TerminalTd bold>{d.name}</TerminalTd>
          <TerminalTd color={TFG_DIM}>{d.owner}</TerminalTd>
          <TerminalTd mono bold>
            {d.value}
          </TerminalTd>
          <TerminalTd>
            <TerminalChip tone={d.days > 10 ? "bad" : "warn"}>
              {d.stage}
            </TerminalChip>
          </TerminalTd>
          <TerminalTd
            mono
            bold
            color={d.days > 10 ? RED : TAMBER}
          >
            {d.days}d
          </TerminalTd>
          <TerminalTd>
            <ArrowUpRight size={12} strokeWidth={2.2} color={TFG_DIM} />
          </TerminalTd>
        </TerminalTr>
      ))}
    </TerminalTable>
  );
}

function InboxView() {
  return (
    <TerminalSection title="hot-leads" hint="score ≥ 70" accent>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 8,
        }}
      >
        {HOT_LEADS.map((l, i) => (
          <div
            key={l.name}
            style={{
              background: TINK_3,
              border: `1px solid ${TLINE}`,
              borderRadius: 6,
              padding: 12,
              position: "relative",
              boxShadow: l.score >= 90 ? `inset 3px 0 0 ${RED}` : "none",
            }}
          >
            <div style={{ position: "absolute", top: 6, right: 8 }}>
              <TerminalIndex i={i + 1} total={HOT_LEADS.length} />
            </div>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: l.score >= 90 ? RED : TFG_FAINT,
                fontFamily: TMONO,
              }}
            >
              SCORE {l.score}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: TFG,
                marginTop: 2,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {l.name}
              {l.score >= 90 && (
                <Star
                  size={11}
                  strokeWidth={2.4}
                  color={RED}
                  fill={RED}
                />
              )}
            </div>
            <div style={{ fontSize: 10.5, color: TFG_DIM, marginTop: 2 }}>
              {l.source}
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 10,
                paddingTop: 10,
                borderTop: `1px solid ${TLINE}`,
              }}
            >
              <TerminalButton variant="primary" size="sm">
                <PhoneCall size={11} strokeWidth={2.4} /> Call
              </TerminalButton>
              <TerminalButton variant="ghost" size="sm">
                <Mail size={11} strokeWidth={2.2} /> Email
              </TerminalButton>
              <TerminalButton variant="ghost" size="sm">
                <MessageSquare size={11} strokeWidth={2.2} /> SMS
              </TerminalButton>
            </div>
          </div>
        ))}
      </div>
    </TerminalSection>
  );
}

function TasksView() {
  const ICON: Record<typeof TASKS[number]["type"], typeof PhoneCall> = {
    call: PhoneCall,
    email: Mail,
    sms: MessageSquare,
    calendar: Calendar,
  };
  return (
    <TerminalSection title="tasks" hint="today's queue">
      <TerminalTable cols="44px 80px 1fr 130px 90px 110px">
        <TerminalThead>
          <TerminalTh>#</TerminalTh>
          <TerminalTh>ID</TerminalTh>
          <TerminalTh>Task</TerminalTh>
          <TerminalTh>Owner</TerminalTh>
          <TerminalTh>Due</TerminalTh>
          <TerminalTh></TerminalTh>
        </TerminalThead>
        {TASKS.map((t, i) => {
          const Icon = ICON[t.type];
          return (
            <TerminalTr key={t.id}>
              <TerminalTd mono color={TFG_FAINT}>
                {String(i + 1).padStart(2, "0")}
              </TerminalTd>
              <TerminalTd mono bold color={TFG_DIM}>
                {t.id}
              </TerminalTd>
              <TerminalTd bold>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Icon size={12} strokeWidth={2.2} color={TFG_DIM} />
                  {t.title}
                </span>
              </TerminalTd>
              <TerminalTd color={TFG_DIM}>{t.owner}</TerminalTd>
              <TerminalTd>
                <TerminalChip tone={t.tone}>{t.due}</TerminalChip>
              </TerminalTd>
              <TerminalTd>
                <TerminalButton variant="primary" size="sm">
                  Do it
                </TerminalButton>
              </TerminalTd>
            </TerminalTr>
          );
        })}
      </TerminalTable>
    </TerminalSection>
  );
}

function CallsView() {
  const cells = [
    { label: "Outbound", value: 27, tone: "ok" as const },
    { label: "Inbound", value: 16, tone: "info" as const },
    { label: "Connected", value: 31, tone: "ok" as const },
    { label: "Voicemail", value: 8, tone: "warn" as const },
    { label: "Avg talk", value: "6m 12s", tone: "muted" as const },
    { label: "On goal", value: "72%", tone: "warn" as const },
  ];
  return (
    <TerminalSection title="calls" hint="today">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 8,
        }}
      >
        {cells.map((c, i) => (
          <TerminalKpi
            key={c.label}
            index={i + 1}
            total={cells.length}
            label={c.label}
            value={c.value}
            tone={c.tone}
          />
        ))}
      </div>
    </TerminalSection>
  );
}

function SequencesView() {
  return (
    <TerminalSection title="sequences" hint="active cadences">
      <TerminalTable cols="44px 1fr 90px 80px 80px 100px">
        <TerminalThead>
          <TerminalTh>#</TerminalTh>
          <TerminalTh>Sequence</TerminalTh>
          <TerminalTh>Active</TerminalTh>
          <TerminalTh>Opens</TerminalTh>
          <TerminalTh>Replies</TerminalTh>
          <TerminalTh></TerminalTh>
        </TerminalThead>
        {SEQUENCES.map((s, i) => (
          <TerminalTr key={s.name}>
            <TerminalTd mono color={TFG_FAINT}>
              {String(i + 1).padStart(2, "0")}
            </TerminalTd>
            <TerminalTd bold>{s.name}</TerminalTd>
            <TerminalTd mono bold>
              {s.active}
            </TerminalTd>
            <TerminalTd mono color={TGREEN}>
              {s.opens}
            </TerminalTd>
            <TerminalTd mono color={TAMBER}>
              {s.replies}
            </TerminalTd>
            <TerminalTd>
              <TerminalChip tone={s.tone}>Active</TerminalChip>
            </TerminalTd>
          </TerminalTr>
        ))}
      </TerminalTable>
    </TerminalSection>
  );
}

function ReportsView() {
  const cells = [
    { label: "Leads in", value: "1,420", tone: "info" as const },
    { label: "Qualified", value: "412", tone: "ok" as const },
    { label: "Demos", value: "182", tone: "ok" as const },
    { label: "Proposals", value: "68", tone: "warn" as const },
    { label: "Won", value: "11", tone: "ok" as const },
    { label: "Win rate", value: "16%", tone: "warn" as const },
  ];
  return (
    <TerminalSection title="funnel" hint="last 30d">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 8,
        }}
      >
        {cells.map((r, i) => (
          <TerminalKpi
            key={r.label}
            index={i + 1}
            total={cells.length}
            label={r.label}
            value={r.value}
            tone={r.tone}
          />
        ))}
      </div>
    </TerminalSection>
  );
}

function ActivityStream() {
  const ICON: Record<string, typeof PhoneCall> = {
    Called: PhoneCall,
    "Email reply": Mail,
    SMS: MessageSquare,
    Voicemail: Voicemail,
    "Deal moved": Briefcase,
    "Lead assigned": Users,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {ACTIVITY.map((a, i) => {
        const key =
          Object.keys(ICON).find((k) => a.action.startsWith(k)) ?? "Called";
        const Icon = ICON[key];
        return (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "44px 28px 1fr 60px",
              alignItems: "center",
              gap: 10,
              padding: "8px 4px",
              borderTop: i ? `1px solid ${TLINE}` : 0,
            }}
          >
            <TerminalIndex i={i + 1} total={ACTIVITY.length} />
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background:
                  a.tone === "warn"
                    ? "rgba(245,158,11,0.14)"
                    : "rgba(99,102,241,0.14)",
                color: a.tone === "warn" ? TAMBER : TINFO,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon size={11} strokeWidth={2.2} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TFG }}>
                <span style={{ color: RED }}>{a.actor}</span>
                <span style={{ color: TFG_DIM }}> · </span>
                {a.action}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: TFG_DIM,
                  marginTop: 1,
                }}
              >
                {a.subj}
              </div>
            </div>
            <span
              style={{
                fontSize: 10.5,
                color: TFG_FAINT,
                fontFamily: TMONO,
                textAlign: "right",
              }}
            >
              {a.when}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TeamLoad() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 8,
      }}
    >
      {TEAM.map((t, i) => (
        <div
          key={t.name}
          style={{
            background: TINK_3,
            border: `1px solid ${TLINE}`,
            borderRadius: 6,
            padding: 12,
            position: "relative",
          }}
        >
          <div style={{ position: "absolute", top: 6, right: 8 }}>
            <TerminalIndex i={i + 1} total={TEAM.length} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              aria-hidden
              style={{
                width: 28,
                height: 28,
                borderRadius: 9999,
                background: `linear-gradient(135deg, ${RED}, ${RED_2})`,
                color: "white",
                display: "grid",
                placeItems: "center",
                fontSize: 10.5,
                fontWeight: 800,
              }}
            >
              {t.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </span>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: TFG }}>
                {t.name}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: TFG_DIM,
                  letterSpacing: "0.04em",
                  fontFamily: TMONO,
                }}
              >
                {t.deals} deals · {t.value}
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              gap: 12,
              fontSize: 10.5,
              color: TFG_DIM,
              fontFamily: TMONO,
            }}
          >
            <span>📞 {t.calls}</span>
            <span>✉ {t.emails}</span>
          </div>
          <div
            style={{
              marginTop: 6,
              height: 4,
              borderRadius: 9999,
              background: TLINE,
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: `${t.load}%`,
                borderRadius: 9999,
                background:
                  t.load > 80 ? RED : t.load > 60 ? TAMBER : TGREEN,
              }}
            />
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 9.5,
              fontWeight: 700,
              color: t.load > 80 ? RED : TFG_FAINT,
              letterSpacing: "0.12em",
              fontFamily: TMONO,
            }}
          >
            LOAD · {t.load}%
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionTile({
  label,
  count,
  tone,
  age,
  index,
  total,
}: {
  kind: string;
  label: string;
  count: number;
  tone: "ok" | "warn" | "bad" | "info";
  age: string;
  index: number;
  total: number;
}) {
  const fg =
    tone === "bad"
      ? RED
      : tone === "warn"
        ? TAMBER
        : tone === "info"
          ? TINFO
          : TGREEN;
  return (
    <div
      style={{
        background: TINK_3,
        border: `1px solid ${TLINE}`,
        borderRadius: 6,
        padding: 12,
        position: "relative",
        boxShadow: `inset 3px 0 0 ${fg}`,
        cursor: "pointer",
      }}
    >
      <div style={{ position: "absolute", top: 6, right: 8 }}>
        <TerminalIndex i={index} total={total} />
      </div>
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: TFG_FAINT,
        }}
      >
        {age}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginTop: 2,
        }}
      >
        <span
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: fg,
            fontFamily: TMONO,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
          }}
        >
          {count}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: TFG }}>
          {label}
        </span>
      </div>
      <div style={{ marginTop: 8 }}>
        <TerminalChip tone={tone}>Open queue →</TerminalChip>
      </div>
    </div>
  );
}

function IntegrationsRow() {
  return (
    <TerminalSection title="integrations" hint="connected services">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 8,
        }}
      >
        {INTEGRATIONS.map((it, i) => (
          <div
            key={it.name}
            style={{
              background: TINK_3,
              border: `1px solid ${TLINE}`,
              borderRadius: 6,
              padding: 10,
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", top: 6, right: 8 }}>
              <TerminalIndex i={i + 1} total={INTEGRATIONS.length} />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Plug size={12} strokeWidth={2.2} color={TFG_DIM} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: TFG }}>
                {it.name}
              </span>
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: TFG_FAINT,
                marginTop: 4,
                fontFamily: TMONO,
              }}
            >
              {it.note}
            </div>
            <div style={{ marginTop: 6 }}>
              <TerminalChip tone={it.tone}>{it.status}</TerminalChip>
            </div>
          </div>
        ))}
      </div>
    </TerminalSection>
  );
}

function Empty({ desc }: { desc: string }) {
  return (
    <div
      style={{
        padding: "16px 4px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <AlertTriangle size={14} strokeWidth={2.2} color={TAMBER} />
      <span
        style={{
          fontSize: 11.5,
          color: TFG_DIM,
        }}
      >
        {desc}
      </span>
    </div>
  );
}
