"use client";

import {
  Plus,
  X as XIcon,
  Pencil,
  Check,
  ChevronDown,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useRegistryStore } from "../_lib/registry-store";
import { useWindowStore } from "../_lib/window-store";
import {
  useOsConfig,
  wallpaperBackground,
} from "../_lib/os-config-store";
import { useOsMode } from "../_lib/os-mode-store";
import { useAuth } from "@/contexts/auth";
import { getPitch, type ModulePitch } from "../_lib/module-pitches";
import { ModulePitchModal } from "./ModulePitchModal";

// Apps visible BEFORE login — entry-point customer flow only.
const ANON_ALLOWED = new Set([
  "signup",
  "welcome",
]);

// Sub-steps per app — shown when the operator clicks the expand chevron
// on an icon. Each step is clickable to jump straight to that step.
const APP_STEPS: Record<string, string[]> = {
  "pre-qualification": [
    "Welcome",
    "Email & Phone",
    "Create Password",
    "Soft-Pull Credit",
    "See Your Numbers",
  ],
  funding: [
    "Pre-Qualify",
    "Application",
    "Underwriting",
    "Approval",
    "Funded",
  ],
  "credit-repair": [
    "Pull Reports",
    "Select Items",
    "Generate Letters",
    "Send Disputes",
    "Track Responses",
  ],
  "credit-reports": [
    "Connect SmartCredit",
    "View Live Scores",
    "Side-by-Side Bureaus",
    "Download PDF",
  ],
};

// Tasks-due count per app (mock — replace with live signal later).
// First-time users see PreQual flagged with 1 outstanding task.
const TASKS_DUE: Record<string, number> = {
  "pre-qualification": 1,
};

const APP_MIME = "application/memelli-app-id";

export function Desktop({ embedded = false }: { embedded?: boolean } = {}) {
  const APPS = useRegistryStore((s) => s.apps);
  const open = useWindowStore((s) => s.open);
  const pages = useWindowStore((s) => s.pages);
  const pageLabels = useWindowStore((s) => s.pageLabels);
  const addPage = useWindowStore((s) => s.addPage);
  const removePage = useWindowStore((s) => s.removePage);
  const moveAppToPage = useWindowStore((s) => s.moveAppToPage);
  const setPageLabel = useWindowStore((s) => s.setPageLabel);

  const iconSize = useOsConfig((s) => s.iconSize);
  const labelSize = useOsConfig((s) => s.labelSize);
  const showLabels = useOsConfig((s) => s.showLabels);
  const showBadges = useOsConfig((s) => s.showBadges);
  const wallpaperStyle = useOsConfig((s) => s.wallpaperStyle);
  // scrollSpeedMul intentionally unread — native wheel scroll handles flow now.
  const accentColor = useOsConfig((s) => s.accentColor);
  const cornerRadius = useOsConfig((s) => s.cornerRadius);

  const [hydrated, setHydrated] = useState(false);
  const [draggingAppId, setDraggingAppId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<number | null>(null);
  const [pitch, setPitch] = useState<ModulePitch | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const panelSettings = useWindowStore((s) => s.panelSettings);
  const panelWidths = useWindowStore((s) => s.panelWidths);
  const resizePanels = useWindowStore((s) => s.resizePanels);

  const onPageDrop =
    (pageIdx: number) => (e: React.DragEvent<HTMLElement>) => {
      const appId = e.dataTransfer.getData(APP_MIME);
      if (!appId) return;
      e.preventDefault();
      moveAppToPage(appId, pageIdx);
    };
  const onPageDragOver = (e: React.DragEvent<HTMLElement>) => {
    if (e.dataTransfer.types.includes(APP_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  };

  const mode = useOsMode((s) => s.mode);
  const { user } = useAuth();

  // Visibility:
  //   • Anonymous (no user)        → ALL icons (no mode filter, full surface)
  //   • Logged-in                  → current mode filter (Personal vs Business)
  // Pitch-modal gates which apps actually OPEN for an anon user.
  const allowed = (id: string): boolean => {
    const a = APPS.find((x) => x.id === id);
    if (!a) return false;
    if (a.category === "hidden") return false;
    if (!user) return true; // anon sees everything
    if (!a.modes || a.modes.length === 0) return true;
    return a.modes.includes(mode);
  };

  const inMode = (id: string) => allowed(id);
  const allAssigned = new Set(pages.flat());
  const orphans = APPS.filter(
    (a) => a.category !== "hidden" && allowed(a.id) && !allAssigned.has(a.id),
  ).map((a) => a.id);

  const MIN_PANEL = 280;
  const colsForPanel = (panelW: number, panelCols?: number) =>
    panelCols && panelCols > 0
      ? panelCols
      : Math.max(2, Math.min(8, Math.floor(panelW / (iconSize + 18))));

  // Build CSS grid template from weights — each panel is a fr column with a
  // 6px divider column between adjacent panels.
  const gridTemplate = (() => {
    const widths =
      panelWidths.length === pages.length
        ? panelWidths
        : pages.map(() => 1 / Math.max(1, pages.length));
    const cols: string[] = [];
    widths.forEach((w, i) => {
      cols.push(`${Math.max(0.05, w)}fr`);
      if (i < widths.length - 1) cols.push("6px");
    });
    return cols.join(" ");
  })();

  const rootRef = useRef<HTMLDivElement>(null);

  const startDivider = (idx: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    const root = rootRef.current;
    if (!root) return;
    const totalW = root.clientWidth;
    const startX = e.clientX;
    const captureTarget = e.currentTarget;
    captureTarget.setPointerCapture(e.pointerId);
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      resizePanels(idx, dx / totalW);
    };
    const onUp = () => {
      try {
        captureTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      captureTarget.removeEventListener("pointermove", onMove as EventListener);
      captureTarget.removeEventListener("pointerup", onUp as EventListener);
      captureTarget.removeEventListener(
        "pointercancel",
        onUp as EventListener,
      );
    };
    captureTarget.addEventListener("pointermove", onMove as EventListener);
    captureTarget.addEventListener("pointerup", onUp as EventListener);
    captureTarget.addEventListener("pointercancel", onUp as EventListener);
  };

  return (
    <main
      className="absolute overflow-hidden"
      style={
        embedded
          ? {
              inset: 0,
              background: wallpaperBackground(wallpaperStyle),
            }
          : {
              top: 96 + 40,
              left: 0,
              right: 0,
              bottom: 52,
              background: wallpaperBackground(wallpaperStyle),
            }
      }
    >
      {/* Top action bar removed — Add Panel lives in the ModeToggle bar. */}
      {false && hydrated && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 24,
            zIndex: 4,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            {pages.length} {pages.length === 1 ? "panel" : "panels"}
          </span>
          <button
            type="button"
            onClick={addPage}
            title="Add panel (current panels resize)"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 9999,
              border: `1px solid ${accentColor}`,
              background: "white",
              color: accentColor,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              cursor: "pointer",
              boxShadow: "0 2px 6px -2px rgba(15,17,21,0.12)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = accentColor;
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.color = accentColor;
            }}
          >
            <Plus size={11} strokeWidth={2.4} /> Add panel
          </button>
        </div>
      )}

      {/* Panels row */}
      <div
        ref={rootRef}
        style={{
          width: "100%",
          height: "100%",
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 16,
          paddingRight: 16,
          boxSizing: "border-box",
          display: "grid",
          gridTemplateColumns: gridTemplate,
          gap: 0,
          overflowX: "auto",
          overflowY: "hidden",
        }}
      >
        {hydrated &&
          pages.map((appIds, pageIdx) => {
            const ids = (pageIdx === 0 ? [...appIds, ...orphans] : appIds)
              .filter(inMode);
            const items = ids
              .map((id) => APPS.find((a) => a.id === id))
              .filter((a): a is NonNullable<typeof a> => !!a);
            const panelCfg = panelSettings[pageIdx] ?? {};
            const panelIcon = panelCfg.iconSize ?? iconSize;
            const panelLabelSz = panelCfg.labelSize ?? labelSize;
            const panelShowLabels = panelCfg.showLabels ?? showLabels;
            const isLast = pageIdx === pages.length - 1;
            return (
              <Fragment key={pageIdx}>
                <Panel
                  index={pageIdx}
                  label={pageLabels[pageIdx] ?? `Panel ${pageIdx + 1}`}
                  count={items.length}
                  onLabelChange={(v) => setPageLabel(pageIdx, v)}
                  editing={editingLabel === pageIdx}
                  onEditStart={() => setEditingLabel(pageIdx)}
                  onEditEnd={() => setEditingLabel(null)}
                  onRemove={
                    pages.length > 1 ? () => removePage(pageIdx) : undefined
                  }
                  onDrop={onPageDrop(pageIdx)}
                  onDragOver={onPageDragOver}
                  accentColor={accentColor}
                  cornerRadius={cornerRadius}
                  colsForPanel={(w) => colsForPanel(w, panelCfg.cols)}
                >
                  {items.map((app) => (
                    <AppIconButton
                      key={app.id}
                      app={app}
                      iconSize={panelIcon}
                      labelSize={panelLabelSz}
                      showLabels={panelShowLabels}
                      showBadges={showBadges}
                      accentColor={accentColor}
                      cornerRadius={cornerRadius}
                      dimmed={!!draggingAppId && draggingAppId !== app.id}
                      onOpen={() => {
                        if (!user) {
                          const p = getPitch(app.id, app.label);
                          if (p) {
                            setPitch(p);
                            return;
                          }
                        }
                        open(app.id);
                      }}
                      onDragStart={() => setDraggingAppId(app.id)}
                      onDragEnd={() => setDraggingAppId(null)}
                    />
                  ))}
                </Panel>
                {!isLast && (
                  <div
                    role="separator"
                    aria-label="Resize panels"
                    onPointerDown={startDivider(pageIdx)}
                    style={{
                      width: 6,
                      cursor: "ew-resize",
                      alignSelf: "stretch",
                      position: "relative",
                      touchAction: "none",
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 2,
                        height: 32,
                        borderRadius: 9999,
                        background: "hsl(var(--line))",
                        transition: "background 150ms",
                      }}
                    />
                  </div>
                )}
              </Fragment>
            );
          })}
      </div>
      {pitch && (
        <ModulePitchModal pitch={pitch} onClose={() => setPitch(null)} />
      )}
    </main>
  );
}

// ── Panel ───────────────────────────────────────────────────────────

function Panel({
  index,
  label,
  count,
  onLabelChange,
  editing,
  onEditStart,
  onEditEnd,
  onRemove,
  onDrop,
  onDragOver,
  accentColor,
  cornerRadius,
  colsForPanel,
  children,
}: {
  index: number;
  label: string;
  count: number;
  onLabelChange: (v: string) => void;
  editing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onRemove?: () => void;
  onDrop: (e: React.DragEvent<HTMLElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLElement>) => void;
  accentColor: string;
  cornerRadius: number;
  colsForPanel: (panelW: number) => number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [cols, setCols] = useState(4);
  const [draftLabel, setDraftLabel] = useState(label);

  useEffect(() => setDraftLabel(label), [label, editing]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setCols(colsForPanel(el.clientWidth));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [colsForPanel]);

  return (
    <section
      ref={ref}
      data-panel
      data-panel-index={index}
      onDrop={onDrop}
      onDragOver={onDragOver}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "rgba(255,255,255,0.62)",
        border: "1px solid hsl(var(--line))",
        borderRadius: cornerRadius + 4,
        overflow: "hidden",
        boxShadow:
          "0 1px 2px rgba(15,17,21,0.04), 0 8px 20px -8px rgba(15,17,21,0.08)",
        minWidth: 0,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          borderBottom: "1px solid hsl(var(--line))",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.5))",
          backdropFilter: "blur(6px)",
          minHeight: 38,
        }}
      >
        {editing ? (
          <>
            <input
              autoFocus
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onBlur={() => {
                onLabelChange(draftLabel.trim() || label);
                onEditEnd();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onLabelChange(draftLabel.trim() || label);
                  onEditEnd();
                }
                if (e.key === "Escape") onEditEnd();
              }}
              style={{
                flex: 1,
                background: "white",
                border: `1px solid ${accentColor}`,
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.04em",
                outline: "none",
                color: "hsl(var(--ink))",
              }}
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onLabelChange(draftLabel.trim() || label);
                onEditEnd();
              }}
              style={{
                display: "grid",
                placeItems: "center",
                width: 24,
                height: 24,
                borderRadius: 6,
                border: 0,
                background: accentColor,
                color: "white",
                cursor: "pointer",
              }}
            >
              <Check size={12} strokeWidth={2.4} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onEditStart}
              title="Rename panel"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: 0,
                padding: 0,
                cursor: "text",
                flex: 1,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "hsl(var(--ink))",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
              <Pencil
                size={10}
                strokeWidth={2}
                style={{ color: "hsl(var(--muted-foreground))", flexShrink: 0 }}
              />
            </button>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "hsl(var(--muted-foreground))",
                flexShrink: 0,
              }}
            >
              {count}
            </span>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                title="Remove panel"
                aria-label="Remove panel"
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  border: "1px solid hsl(var(--line))",
                  background: "white",
                  color: "hsl(var(--muted-foreground))",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = accentColor;
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.borderColor = accentColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color =
                    "hsl(var(--muted-foreground))";
                  e.currentTarget.style.borderColor = "hsl(var(--line))";
                }}
              >
                <XIcon size={11} strokeWidth={2.2} />
              </button>
            )}
          </>
        )}
      </header>

      <div
        data-panel-scroll
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          padding: 12,
          overscrollBehavior: "contain",
          // momentum/inertia on touch + macOS trackpad — feels native
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 6,
            paddingBottom: 16,
          }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

// ── App icon button ─────────────────────────────────────────────────

function AppIconButton({
  app,
  iconSize,
  labelSize,
  showLabels,
  showBadges,
  accentColor,
  cornerRadius,
  dimmed,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  app: { id: string; label: string; icon: string; badge?: number };
  iconSize: number;
  labelSize: number;
  showLabels: boolean;
  showBadges: boolean;
  accentColor: string;
  cornerRadius: number;
  dimmed: boolean;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      onDoubleClick={onOpen}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData(APP_MIME, app.id);
        e.dataTransfer.setData("text/plain", app.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className="group relative flex flex-col items-center cursor-pointer text-ink transition"
      style={{
        gap: 10,
        padding: "10px 4px 8px",
        borderRadius: 14,
        background: "transparent",
        opacity: dimmed ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.7)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {showBadges && app.badge != null && (
        <span
          className="absolute inline-flex items-center justify-center text-white font-extrabold"
          style={{
            top: 4,
            right: 8,
            minWidth: 20,
            height: 20,
            padding: "0 6px",
            borderRadius: 9999,
            background: accentColor,
            fontSize: 10,
            border: "2px solid hsl(var(--background))",
            boxShadow: `0 6px 14px -4px ${accentColor}88`,
            zIndex: 2,
          }}
        >
          {app.badge}
        </span>
      )}
      <span
        className="inline-flex items-center justify-center"
        style={{
          width: iconSize,
          height: iconSize,
          background: "transparent",
        }}
      >
        <img
          src={app.icon}
          alt=""
          className="object-contain transition group-hover:-translate-y-0.5"
          draggable={false}
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: cornerRadius,
            filter: `drop-shadow(0 3px 6px rgba(15,17,21,0.12)) drop-shadow(0 10px 20px rgba(15,17,21,0.20)) drop-shadow(0 18px 38px ${accentColor}1f)`,
            pointerEvents: "none",
          }}
        />
      </span>
      {showLabels && (
        <span
          className="text-center text-ink font-semibold"
          style={{
            fontSize: labelSize,
            lineHeight: 1.3,
            letterSpacing: "-0.1px",
          }}
        >
          {app.label}
        </span>
      )}
    </button>
  );
}