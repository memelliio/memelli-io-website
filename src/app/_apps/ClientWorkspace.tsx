"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X, ChevronDown, Save, Trash2 } from "lucide-react";
import {
  useContactStore,
  DEMO_CONTACTS,
  MODULE_CATALOG,
  moduleLabel,
  parentOf,
  type ModuleId,
} from "../_lib/contact-store";
import { useWorkspaceTemplates } from "../_lib/workspace-templates-store";

const RED = "#C41E3A";
const RED_2 = "#A8182F";
const INK = "#0B0B0F";
const PAPER = "#FFFFFF";
const SOFT = "#FAFAFA";
const LINE = "#E5E7EB";
const MUTED = "#6B7280";
const FAINT = "#9CA3AF";

// Default tabs in a fresh CRM Workspace — matches the personal-side trio.
const DEFAULT_TABS: ModuleId[] = [
  "prequal",
  "credit-repair",
  "funding",
];

export function ClientWorkspace() {
  const activeContactId = useContactStore((s) => s.activeContactId);
  const contact =
    DEMO_CONTACTS.find((c) => c.id === activeContactId) ?? null;
  const templates = useWorkspaceTemplates((s) => s.templates);
  const saveTemplate = useWorkspaceTemplates((s) => s.save);
  const removeTemplate = useWorkspaceTemplates((s) => s.remove);
  const [activeTemplateId, setActiveTemplateId] = useState<string>("crm-default");
  const initial = templates.find((t) => t.id === activeTemplateId)?.tabs ?? DEFAULT_TABS;
  const [tabs, setTabs] = useState<ModuleId[]>(initial);
  const [active, setActive] = useState<ModuleId | null>(initial[0] ?? null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingName, setSavingName] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close the picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (pickerRef.current?.contains(t)) return;
      setShowPicker(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [showPicker]);

  const loadTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setActiveTemplateId(id);
    setTabs([...t.tabs]);
    setActive(t.tabs[0] ?? null);
    setShowPicker(false);
  };

  const persistAs = () => {
    const name = savingName.trim();
    if (!name) return;
    const id = saveTemplate(name, tabs);
    setActiveTemplateId(id);
    setSaving(false);
    setSavingName("");
  };

  const activeTemplate = templates.find((t) => t.id === activeTemplateId);

  useEffect(() => {
    // Reset active tab if it disappears from tabs.
    if (active && !tabs.includes(active)) setActive(tabs[0] ?? null);
  }, [tabs, active]);

  const addTab = (id: ModuleId) => {
    setTabs((t) => (t.includes(id) ? t : [...t, id]));
    setActive(id);
    setShowCatalog(false);
  };
  const removeTab = (id: ModuleId) => {
    setTabs((t) => t.filter((x) => x !== id));
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: PAPER,
        color: INK,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Workspace picker strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: SOFT,
          borderBottom: `1px solid ${LINE}`,
          flexShrink: 0,
          position: "relative",
        }}
      >
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: MUTED,
          }}
        >
          Workspace
        </span>
        <div ref={pickerRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              borderRadius: 8,
              border: `1px solid ${LINE}`,
              background: PAPER,
              color: INK,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {activeTemplate?.name ?? "Untitled"}
            <ChevronDown size={11} strokeWidth={2.4} color={MUTED} />
          </button>
          {showPicker && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                zIndex: 10,
                minWidth: 220,
                background: PAPER,
                border: `1px solid ${LINE}`,
                borderRadius: 8,
                boxShadow: "0 8px 22px -8px rgba(15,17,21,0.18)",
                padding: 4,
              }}
            >
              {templates.map((t) => {
                const selected = t.id === activeTemplateId;
                return (
                  <div
                    key={t.id}
                    onClick={() => loadTemplate(t.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      background: selected
                        ? "rgba(196,30,58,0.08)"
                        : "transparent",
                      color: selected ? RED : INK,
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) e.currentTarget.style.background = SOFT;
                    }}
                    onMouseLeave={(e) => {
                      if (!selected)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        fontSize: 12,
                        fontWeight: selected ? 800 : 600,
                      }}
                    >
                      {t.name}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: MUTED,
                        fontFamily: "ui-monospace, monospace",
                      }}
                    >
                      {t.tabs.length}
                    </span>
                    {!t.id.startsWith("crm-") && (
                      <button
                        type="button"
                        aria-label="Delete template"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTemplate(t.id);
                        }}
                        style={{
                          width: 16,
                          height: 16,
                          border: 0,
                          background: "transparent",
                          color: FAINT,
                          cursor: "pointer",
                          padding: 0,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Trash2 size={10} strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {saving ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginLeft: 4,
            }}
          >
            <input
              autoFocus
              value={savingName}
              onChange={(e) => setSavingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") persistAs();
                if (e.key === "Escape") {
                  setSaving(false);
                  setSavingName("");
                }
              }}
              placeholder="Workspace name"
              style={{
                fontSize: 12,
                padding: "5px 10px",
                border: `1px solid ${RED}`,
                borderRadius: 8,
                outline: "none",
                background: PAPER,
                color: INK,
                fontFamily: "inherit",
                width: 180,
              }}
            />
            <button
              type="button"
              onClick={persistAs}
              style={{
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                border: 0,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${RED}, ${RED_2})`,
                color: PAPER,
                cursor: "pointer",
              }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setSaving(false);
                setSavingName("");
              }}
              style={{
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                border: `1px solid ${LINE}`,
                borderRadius: 8,
                background: PAPER,
                color: MUTED,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSaving(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 10px",
              borderRadius: 8,
              border: `1px solid ${LINE}`,
              background: PAPER,
              color: MUTED,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              cursor: "pointer",
              marginLeft: "auto",
            }}
          >
            <Save size={11} strokeWidth={2.2} />
            Save as
          </button>
        )}
      </div>

      {/* Top tab strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "8px 10px",
          background: PAPER,
          borderBottom: `1px solid ${LINE}`,
          overflowX: "auto",
          flexShrink: 0,
        }}
      >
        <ContactBadge />
        {tabs.map((modId) => {
          const isActive = active === modId;
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
                if (!isActive) e.currentTarget.style.background = SOFT;
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              {moduleLabel(modId)}
              <button
                type="button"
                aria-label={`Remove ${moduleLabel(modId)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTab(modId);
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
        <button
          type="button"
          onClick={() => setShowCatalog(!showCatalog)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 10px",
            borderRadius: 8,
            border: `1px dashed ${RED}55`,
            background: showCatalog ? "rgba(196,30,58,0.06)" : "transparent",
            color: RED,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.04em",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Plus size={11} strokeWidth={2.4} />
          Add
        </button>
      </div>

      {/* Module catalog (inline dropdown beneath the strip) */}
      {showCatalog && (
        <div
          style={{
            background: PAPER,
            borderBottom: `1px solid ${LINE}`,
            padding: "10px 14px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 6,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {MODULE_CATALOG.map((m) => {
            const inUse = tabs.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                disabled={inUse}
                onClick={() => addTab(m.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 10px",
                  border: `1px solid ${inUse ? LINE : "transparent"}`,
                  background: inUse ? SOFT : PAPER,
                  color: inUse ? FAINT : INK,
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  textAlign: "left",
                  cursor: inUse ? "default" : "pointer",
                  transition: "background 120ms",
                }}
                onMouseEnter={(e) => {
                  if (!inUse) e.currentTarget.style.background = SOFT;
                }}
                onMouseLeave={(e) => {
                  if (!inUse) e.currentTarget.style.background = PAPER;
                }}
              >
                {m.label}
                {inUse && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 9,
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
      )}

      {/* Active module content */}
      <section
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          background: SOFT,
          padding: 18,
        }}
      >
        {!contact && (
          <div
            style={{
              display: "grid",
              placeItems: "center",
              height: "100%",
              color: MUTED,
              fontSize: 12,
              letterSpacing: "0.04em",
            }}
          >
            Select a contact from the left rail to populate this workspace.
          </div>
        )}
        {contact && active && (
          <ModuleFrame moduleId={active} contactName={`${contact.firstName} ${contact.lastName}`} />
        )}
      </section>
    </div>
  );
}

function ContactBadge() {
  const activeContactId = useContactStore((s) => s.activeContactId);
  const contact =
    DEMO_CONTACTS.find((c) => c.id === activeContactId) ?? null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 10px 0 4px",
        borderRight: `1px solid ${LINE}`,
        marginRight: 6,
        flexShrink: 0,
      }}
    >
      {contact ? (
        <>
          <span
            aria-hidden
            style={{
              width: 24,
              height: 24,
              borderRadius: 9999,
              background: `linear-gradient(135deg, ${RED}, ${RED_2})`,
              color: PAPER,
              display: "grid",
              placeItems: "center",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.04em",
              flexShrink: 0,
            }}
          >
            {(contact.firstName[0] + contact.lastName[0]).toUpperCase()}
          </span>
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
              CRM Workspace
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: INK,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 180,
              }}
            >
              {contact.firstName} {contact.lastName}
            </div>
          </div>
        </>
      ) : (
        <span
          style={{
            fontSize: 10.5,
            color: MUTED,
            fontStyle: "italic",
          }}
        >
          No contact selected
        </span>
      )}
    </div>
  );
}

function ModuleFrame({
  moduleId,
  contactName,
}: {
  moduleId: ModuleId;
  contactName: string;
}) {
  const parent = parentOf(moduleId);
  return (
    <div
      style={{
        background: PAPER,
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        padding: 18,
        minHeight: 220,
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
        {moduleLabel(moduleId)}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: INK,
          letterSpacing: "-0.01em",
          marginTop: 4,
        }}
      >
        {contactName}
      </div>
      <div
        style={{
          fontSize: 12,
          color: MUTED,
          marginTop: 8,
          lineHeight: 1.5,
          maxWidth: 560,
        }}
      >
        Frame ready for <code style={{ fontFamily: "ui-monospace, monospace" }}>{parent}</code>.
        This window is bound to the active contact — switch contacts on the
        left rail and every open workspace rebinds. Wire the real module
        component in <code style={{ fontFamily: "ui-monospace, monospace" }}>_apps/{parent}.tsx</code> when the API is live.
      </div>
    </div>
  );
}
