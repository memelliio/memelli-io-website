"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  ShoppingBag,
  Folder,
  Users,
  CreditCard,
  Wrench,
  PiggyBank,
  Workflow,
  Receipt,
  Tag,
  Mail,
  Phone,
  MessageSquare,
  ListChecks,
  Activity,
  ChevronLeft,
  ChevronRight,
  Search,
  Star,
} from "lucide-react";
import { useOsMode } from "../_lib/os-mode-store";
import { useWindowStore } from "../_lib/window-store";
import {
  FileText,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import {
  useContactStore,
  DEMO_CONTACTS,
  MODULE_CATALOG,
  moduleLabel,
  parentOf,
  type ContactRecord,
  type ModuleId,
} from "../_lib/contact-store";

const RED = "#C41E3A";
const INK = "#0B0B0F";
const PAPER = "#FFFFFF";
const SOFT = "#FAFAFA";
const LINE = "#E5E7EB";
const LINE_SOFT = "#F0F0F2";
const MUTED = "#6B7280";
const FAINT = "#9CA3AF";

// ── Business apps in the primary left rail ──────────────────────

const BUSINESS_APPS = [
  { id: "crm", label: "CRM", icon: Users },
  { id: "commerce", label: "Commerce", icon: ShoppingBag },
  { id: "stores", label: "Stores", icon: Briefcase },
  { id: "revenue-builder", label: "Revenue Builder", icon: Workflow },
  { id: "docuvault", label: "DocuVault", icon: Folder },
  { id: "funding", label: "Funding", icon: PiggyBank },
  { id: "credit-repair", label: "Credit Repair", icon: Wrench },
  { id: "billing", label: "Billing", icon: Receipt },
  { id: "coupons", label: "Coupons", icon: Tag },
  { id: "payments", label: "Payments", icon: CreditCard },
] as const;

type AppId = (typeof BUSINESS_APPS)[number]["id"];

// ── Module catalog (modules a frame can load) ───────────────────

const MODULES: { id: ModuleId; label: string; icon: typeof Users }[] = [
  { id: "profile", label: "Profile", icon: Users },
  { id: "credit-score", label: "Credit Score", icon: Activity },
  { id: "credit-report", label: "Credit Report", icon: Activity },
  { id: "prequal", label: "Pre-Qual", icon: Workflow },
  { id: "decision", label: "Decision", icon: Briefcase },
  { id: "funding", label: "Funding", icon: PiggyBank },
  { id: "credit-repair", label: "Credit Repair", icon: Wrench },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "email", label: "Email", icon: Mail },
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "files", label: "Files", icon: Folder },
  { id: "notes", label: "Notes", icon: ListChecks },
  { id: "deals", label: "Deals", icon: Briefcase },
];

export function BusinessCenter() {
  const focusedEntity = useOsMode((s) => s.focusedEntity);
  const setFocusedEntity = useOsMode((s) => s.setFocusedEntity);
  const setActiveContact = useContactStore((s) => s.setActive);
  const openWindow = useWindowStore((s) => s.open);
  const windows = useWindowStore((s) => s.windows);

  // When a contact is focused, mirror it onto the global activeContactId
  // so any open module-window rebinds. Auto-open a default CRM Workspace
  // if no workspace is open yet.
  useEffect(() => {
    setActiveContact(focusedEntity);
    if (!focusedEntity) return;
    const hasWorkspace = windows.some((w) => w.appId === "client-workspace");
    if (!hasWorkspace) openWindow("client-workspace");
  }, [focusedEntity, setActiveContact, openWindow, windows]);

  return (
    <div
      style={{
        position: "absolute",
        top: 96 + 40,
        left: 0,
        right: 0,
        bottom: 52,
        background: SOFT,
        color: INK,
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* DROPPED: primary business-apps rail. Contacts is the only landing. */}

      {/* Contacts is the only landing — Clients/Businesses toggle inside. */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          overflow: "hidden",
        }}
      >
        <CrmFrame
          focused={focusedEntity}
          onFocus={(id) => setFocusedEntity(id)}
        />
      </main>
    </div>
  );
}

// ── Home (no app picked yet) ────────────────────────────────────

function Home({ onPick }: { onPick: (id: AppId) => void }) {
  return (
    <div
      style={{
        flex: 1,
        padding: 24,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: MUTED,
          marginBottom: 6,
        }}
      >
        Business Center
      </div>
      <h1
        style={{
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: "-0.01em",
          margin: 0,
          color: INK,
        }}
      >
        Pick a module to get started.
      </h1>
      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 8,
          maxWidth: 880,
        }}
      >
        {BUSINESS_APPS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onPick(a.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 14,
                borderRadius: 10,
                border: `1px solid ${LINE}`,
                background: PAPER,
                color: INK,
                cursor: "pointer",
                textAlign: "left",
                fontSize: 13,
                fontWeight: 700,
                transition: "border-color 150ms, transform 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = RED;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = LINE;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "rgba(196,30,58,0.08)",
                  color: RED,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={14} strokeWidth={2.2} />
              </span>
              {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── CRM frame: Client List sub-rail (always loaded) + content ───

function CrmFrame({
  focused,
  onFocus,
}: {
  focused: string | null;
  onFocus: (id: string | null) => void;
}) {
  const [q, setQ] = useState("");
  const [contactType, setContactType] = useState<"client" | "business">("client");
  const filtered = DEMO_CONTACTS.filter((c) => {
    const hay = `${c.firstName} ${c.lastName} ${c.company ?? ""} ${c.email}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (contactType === "business") return !!c.company;
    return true;
  });
  const focusedContact =
    DEMO_CONTACTS.find((c) => c.id === focused) ?? null;

  return (
    <div style={{ flex: 1, display: "flex", minWidth: 0 }}>
      {/* Sub-rail: Client List (default-loaded) */}
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          background: PAPER,
          borderRight: `1px solid ${LINE}`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderBottom: `1px solid ${LINE}`,
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: MUTED,
              marginBottom: 6,
            }}
          >
            Contacts
          </div>
          <div
            style={{
              display: "flex",
              gap: 2,
              background: SOFT,
              border: `1px solid ${LINE}`,
              borderRadius: 9999,
              padding: 2,
            }}
          >
            {(["client", "business"] as const).map((t) => {
              const active = contactType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setContactType(t)}
                  style={{
                    flex: 1,
                    padding: "5px 10px",
                    borderRadius: 9999,
                    border: 0,
                    background: active
                      ? `linear-gradient(135deg, ${RED}, #A8182F)`
                      : "transparent",
                    color: active ? PAPER : MUTED,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {t === "client" ? "Clients" : "Businesses"}
                </button>
              );
            })}
          </div>
        </div>
        <div
          style={{
            padding: "8px 12px",
            borderBottom: `1px solid ${LINE_SOFT}`,
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              border: `1px solid ${LINE}`,
              borderRadius: 8,
              background: SOFT,
              color: MUTED,
            }}
          >
            <Search size={11} strokeWidth={2.2} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search clients…"
              style={{
                flex: 1,
                background: "transparent",
                border: 0,
                outline: "none",
                fontSize: 12,
                color: INK,
                fontFamily: "inherit",
              }}
            />
          </span>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
          }}
        >
          {filtered.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onFocus(c.id)}
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "26px 1fr",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                background: focused === c.id ? "rgba(196,30,58,0.05)" : "transparent",
                border: 0,
                borderLeft:
                  focused === c.id
                    ? `3px solid ${RED}`
                    : "3px solid transparent",
                borderTop: i ? `1px solid ${LINE_SOFT}` : 0,
                cursor: "pointer",
                textAlign: "left",
                color: INK,
                transition: "background 120ms",
              }}
              onMouseEnter={(e) => {
                if (focused !== c.id)
                  e.currentTarget.style.background = SOFT;
              }}
              onMouseLeave={(e) => {
                if (focused !== c.id)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <Avatar c={c} />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 1,
                  }}
                >
                  <span
                    style={{
                      fontSize: 8.5,
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color:
                        c.stage === "won" || c.stage === "funded"
                          ? "#10B981"
                          : c.stage === "lost"
                            ? RED
                            : MUTED,
                      lineHeight: 1,
                    }}
                  >
                    {c.stage.replace("-", " ")}
                  </span>
                  {c.hot && (
                    <Star
                      size={8}
                      strokeWidth={2.4}
                      color={RED}
                      fill={RED}
                    />
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: INK,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    lineHeight: 1.2,
                  }}
                >
                  {c.firstName} {c.lastName}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: MUTED,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.company ?? c.email}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Right side is a transparent canvas. WindowFrames float over it,
          managed by useWindowStore. Default CRM Workspace auto-opens on
          first contact select; user opens more windows from the desktop
          icons or via the workspace's "+ Add" tab catalog. */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          position: "relative",
          background: SOFT,
        }}
      >
        {!focusedContact && <EmptyContact />}
      </div>
    </div>
  );
}

// ── ContactWorkspace: left module rail + content ───────────────

function ContactWorkspace({ contact }: { contact: ContactRecord }) {
  const workspaces = useContactStore((s) => s.workspaces);
  const openContact = useContactStore((s) => s.openContact);
  const addModule = useContactStore((s) => s.addModule);
  const removeModule = useContactStore((s) => s.removeModule);

  // Lazy-init workspace for this contact based on stage defaults.
  if (!workspaces[contact.id]) {
    openContact(contact.id, contact.stage);
  }
  const list = workspaces[contact.id] ?? [];
  const [active, setActive] = useState<ModuleId | null>(list[0] ?? null);
  const [showCatalog, setShowCatalog] = useState(false);

  const currentList = workspaces[contact.id] ?? [];
  const activeModule =
    active ?? (currentList[0] ?? null);

  const available = MODULES.filter(
    (m) => !currentList.includes(m.id),
  );

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        position: "relative",
      }}
    >
      {/* Top loaded-modules tab strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "8px 12px",
          background: PAPER,
          borderBottom: `1px solid ${LINE}`,
          overflowX: "auto",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 10px 0 4px",
            borderRight: `1px solid ${LINE}`,
            marginRight: 4,
            flexShrink: 0,
          }}
        >
          <Avatar c={contact} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: MUTED,
              }}
            >
              Workspace
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: INK,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 200,
              }}
            >
              {contact.firstName} {contact.lastName}
            </div>
          </div>
        </div>
        {currentList.map((modId) => {
          const m = MODULES.find((x) => x.id === modId);
          if (!m) return null;
          const Icon = m.icon;
          const isActive = activeModule === modId;
          return (
            <div
              key={modId}
              onClick={() => setActive(modId)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px 6px 12px",
                borderRadius: 8,
                background: isActive
                  ? "rgba(196,30,58,0.08)"
                  : "transparent",
                border: `1px solid ${isActive ? RED : "transparent"}`,
                cursor: "pointer",
                color: isActive ? RED : INK,
                fontSize: 11.5,
                fontWeight: isActive ? 800 : 600,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  e.currentTarget.style.background = SOFT;
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon size={11} strokeWidth={2.2} />
              {m.label}
              <button
                type="button"
                aria-label={`Remove ${m.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeModule(contact.id, modId);
                  if (activeModule === modId)
                    setActive(currentList[0] ?? null);
                }}
                style={{
                  width: 14,
                  height: 14,
                  border: 0,
                  background: "transparent",
                  color: FAINT,
                  cursor: "pointer",
                  fontSize: 13,
                  lineHeight: 1,
                  padding: 0,
                  marginLeft: 2,
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* Module content area */}
      <section
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: "auto",
        }}
      >
        <ModuleHeader contact={contact} activeModule={activeModule} />
        <div style={{ padding: 18 }}>
          {activeModule ? (
            <ModuleContent moduleId={activeModule} contact={contact} />
          ) : (
            <div
              style={{
                color: MUTED,
                fontSize: 12,
                padding: 12,
              }}
            >
              No module loaded. Open the catalog drawer on the right.
            </div>
          )}
        </div>
      </section>

      {/* Right slide-out: module catalog (My Journey pattern) */}
      <ModuleCatalogDrawer
        open={showCatalog}
        onToggle={() => setShowCatalog(!showCatalog)}
        loaded={currentList}
        onAdd={(id) => {
          addModule(contact.id, id);
          setActive(id);
        }}
      />
    </div>
  );
}

// ── Right slide-out catalog (JourneyBar pattern) ───────────────

function ModuleCatalogDrawer({
  open,
  onToggle,
  loaded,
  onAdd,
}: {
  open: boolean;
  onToggle: () => void;
  loaded: ModuleId[];
  onAdd: (id: ModuleId) => void;
}) {
  const TAB_W = 32;
  const DRAWER_W = 280;
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        right: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        title="Toggle module catalog"
        style={{
          pointerEvents: "auto",
          width: TAB_W,
          height: 168,
          border: 0,
          margin: 0,
          padding: 0,
          cursor: "pointer",
          color: PAPER,
          background:
            "linear-gradient(180deg, " + RED + " 0%, #A8182F 100%)",
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
          boxShadow:
            "-4px 0 16px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(255,255,255,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: open ? `translateX(-${DRAWER_W}px)` : "translateX(0)",
          transition:
            "transform 380ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <span
          style={{
            display: "inline-block",
            transform: "rotate(180deg)",
            writingMode: "vertical-rl",
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: PAPER,
          }}
        >
          Modules
        </span>
      </button>

      <aside
        aria-hidden={!open}
        style={{
          pointerEvents: open ? "auto" : "none",
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: DRAWER_W,
          background: PAPER,
          borderLeft: `1px solid ${LINE}`,
          boxShadow:
            "-12px 0 28px -8px rgba(15,17,21,0.12)",
          transform: open ? "translateX(0)" : `translateX(${DRAWER_W}px)`,
          opacity: open ? 1 : 0,
          transition:
            "transform 380ms cubic-bezier(0.16,1,0.3,1), opacity 240ms",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "14px 18px 10px",
            borderBottom: `1px solid ${LINE}`,
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: RED,
            }}
          >
            Catalog
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: INK,
              letterSpacing: "-0.01em",
              marginTop: 2,
            }}
          >
            Available Modules
          </div>
          <div
            style={{
              fontSize: 11,
              color: MUTED,
              marginTop: 2,
              letterSpacing: "0.02em",
            }}
          >
            Click to add to the workspace.
          </div>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {MODULES.map((m) => {
            const inUse = loaded.includes(m.id);
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                disabled={inUse}
                onClick={() => onAdd(m.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  border: `1px solid ${inUse ? LINE : "transparent"}`,
                  background: inUse ? SOFT : PAPER,
                  color: inUse ? FAINT : INK,
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 8,
                  textAlign: "left",
                  cursor: inUse ? "default" : "pointer",
                  transition: "all 120ms",
                }}
                onMouseEnter={(e) => {
                  if (!inUse) {
                    e.currentTarget.style.background = SOFT;
                    e.currentTarget.style.borderColor = LINE;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!inUse) {
                    e.currentTarget.style.background = PAPER;
                    e.currentTarget.style.borderColor = "transparent";
                  }
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: inUse ? "transparent" : "rgba(196,30,58,0.08)",
                    color: inUse ? FAINT : RED,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={13} strokeWidth={2.2} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>{m.label}</span>
                {inUse && (
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: FAINT,
                    }}
                  >
                    On
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}


function ModuleHeader({
  contact,
  activeModule,
}: {
  contact: ContactRecord;
  activeModule: ModuleId | null;
}) {
  const m = MODULES.find((x) => x.id === activeModule);
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 2,
        background: PAPER,
        borderBottom: `1px solid ${LINE}`,
        padding: "10px 18px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Avatar c={contact} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: RED,
          }}
        >
          {m?.label ?? "—"}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: INK,
            letterSpacing: "-0.01em",
          }}
        >
          {contact.firstName} {contact.lastName}
          {contact.company && (
            <span
              style={{
                color: MUTED,
                fontWeight: 600,
                fontSize: 12,
                marginLeft: 8,
                letterSpacing: "0.02em",
              }}
            >
              · {contact.company}
            </span>
          )}
        </div>
      </div>
      <span
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          padding: "3px 8px",
          borderRadius: 9999,
          background: "rgba(196,30,58,0.08)",
          color: RED,
        }}
      >
        {contact.stage.replace("-", " ")}
      </span>
    </div>
  );
}

// ── Module content frames — minimal, just the FRAME ───────────

function ModuleContent({
  moduleId,
  contact,
}: {
  moduleId: ModuleId;
  contact: ContactRecord;
}) {
  if (moduleId === "profile") {
    return (
      <FrameStack>
        <FrameRow label="Full name" value={`${contact.firstName} ${contact.lastName}`} />
        <FrameRow label="Email" value={contact.email} />
        <FrameRow label="Phone" value={contact.phone} mono />
        {contact.company && <FrameRow label="Company" value={contact.company} />}
        <FrameRow label="Stage" value={contact.stage.replace("-", " ")} />
        <FrameRow label="Score" value={contact.score?.toString() ?? "—"} mono />
      </FrameStack>
    );
  }
  if (moduleId === "credit-score") {
    return (
      <FrameStack>
        <FrameKpi
          label="Latest score"
          value={contact.score?.toString() ?? "—"}
        />
        <FrameRow label="Bureau" value="Equifax · Experian · TransUnion" />
        <FrameRow label="Last pulled" value="—" mono />
      </FrameStack>
    );
  }
  return (
    <FrameStack>
      <FrameRow label="Module" value={moduleId} mono />
      <FrameRow
        label="State"
        value="Frame ready — wire to API endpoint"
      />
    </FrameStack>
  );
}

function FrameStack({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {children}
    </div>
  );
}

function FrameRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        padding: "10px 12px",
        background: PAPER,
        border: `1px solid ${LINE}`,
        borderRadius: 8,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: MUTED,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: INK,
          fontFamily: mono ? "ui-monospace, monospace" : "inherit",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function FrameKpi({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "16px 18px",
        background: PAPER,
        border: `1px solid ${LINE}`,
        borderRadius: 10,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: MUTED,
        }}
      >
        {label}
      </span>
      <div
        style={{
          fontSize: 32,
          fontWeight: 900,
          color: INK,
          letterSpacing: "-0.02em",
          fontFamily: "ui-monospace, monospace",
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Empty + placeholder ─────────────────────────────────────────

function EmptyContact() {
  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        placeItems: "center",
        color: MUTED,
        fontSize: 12,
        letterSpacing: "0.04em",
      }}
    >
      Pick a client from the list to open their workspace.
    </div>
  );
}

function FramePlaceholder({ label }: { label: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        placeItems: "center",
        background: SOFT,
      }}
    >
      <div
        style={{
          padding: 20,
          background: PAPER,
          border: `1px dashed ${LINE}`,
          borderRadius: 10,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: MUTED,
          }}
        >
          Frame ready
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: INK,
            marginTop: 4,
            letterSpacing: "-0.01em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: MUTED,
            marginTop: 4,
            maxWidth: 360,
          }}
        >
          Same shell as CRM — sub-rail of loaded modules + content area.
          Wire defaults + entity list per module.
        </div>
      </div>
    </div>
  );
}

function Avatar({ c }: { c: ContactRecord }) {
  const init = `${c.firstName[0]}${c.lastName[0]}`.toUpperCase();
  return (
    <span
      aria-hidden
      style={{
        width: 26,
        height: 26,
        borderRadius: 9999,
        background: `linear-gradient(135deg, ${RED}, #A8182F)`,
        color: PAPER,
        display: "grid",
        placeItems: "center",
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.04em",
        flexShrink: 0,
      }}
    >
      {init}
    </span>
  );
}
