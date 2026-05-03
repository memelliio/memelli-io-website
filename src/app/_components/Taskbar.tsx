"use client";

import {
  Home,
  Search,
  User,
  BatteryMedium,
  Wifi,
  Volume2,
  Tv,
  Radio,
} from "lucide-react";
import { useEffect, useState, type DragEvent } from "react";
import { APPS } from "../_apps/registry";
import { useWindowStore } from "../_lib/window-store";

const PIN_MIME = "application/memelli-taskbar-pin";
const APP_MIME = "application/memelli-app-id";

export function Taskbar() {
  const windows = useWindowStore((s) => s.windows);
  const open = useWindowStore((s) => s.open);
  const focus = useWindowStore((s) => s.focus);
  const restore = useWindowStore((s) => s.restore);
  const minimize = useWindowStore((s) => s.minimize);
  const topZ = useWindowStore((s) => s.topZ);
  const pins = useWindowStore((s) => s.pins);
  const pinApp = useWindowStore((s) => s.pinApp);
  const unpinApp = useWindowStore((s) => s.unpinApp);
  const movePin = useWindowStore((s) => s.movePin);

  const [dragOver, setDragOver] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const computeInsertIndex = (
    container: HTMLElement,
    clientX: number,
  ): number => {
    const buttons = Array.from(
      container.querySelectorAll<HTMLElement>("button[data-pin-index]"),
    );
    for (let i = 0; i < buttons.length; i++) {
      const rect = buttons[i].getBoundingClientRect();
      if (clientX < rect.left + rect.width / 2) {
        const idx = parseInt(buttons[i].dataset.pinIndex || "0", 10);
        return Number.isNaN(idx) ? i : idx;
      }
    }
    return pins.length;
  };

  const onCenterDragOver = (e: DragEvent<HTMLDivElement>) => {
    const types = e.dataTransfer.types;
    if (types.includes(PIN_MIME) || types.includes(APP_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (!dragOver) setDragOver(true);
    }
  };

  const onCenterDragLeave = (e: DragEvent<HTMLDivElement>) => {
    const related = e.relatedTarget as Node | null;
    if (related == null || !e.currentTarget.contains(related)) {
      setDragOver(false);
    }
  };

  const onCenterDrop = (e: DragEvent<HTMLDivElement>) => {
    setDragOver(false);
    const reorder = e.dataTransfer.getData(PIN_MIME);
    const newAppId = e.dataTransfer.getData(APP_MIME);
    if (reorder) {
      e.preventDefault();
      try {
        const parsed = JSON.parse(reorder) as { appId: string };
        if (parsed.appId) {
          const insertAt = computeInsertIndex(
            e.currentTarget as HTMLElement,
            e.clientX,
          );
          movePin(parsed.appId, insertAt);
        }
      } catch {
        /* noop */
      }
      return;
    }
    if (newAppId && !pins.includes(newAppId)) {
      e.preventDefault();
      const insertAt = computeInsertIndex(
        e.currentTarget as HTMLElement,
        e.clientX,
      );
      pinApp(newAppId, insertAt);
    }
  };

  const onPinDragStart =
    (appId: string, fromIndex: number) =>
    (e: DragEvent<HTMLButtonElement>) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(
        PIN_MIME,
        JSON.stringify({ appId, fromIndex }),
      );
      e.dataTransfer.setData("text/plain", appId);
      const ghost = document.createElement("div");
      ghost.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;";
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 0, 0);
      setTimeout(() => ghost.remove(), 0);
    };

  const onPinDragEnd =
    (appId: string) => (e: DragEvent<HTMLButtonElement>) => {
      // If the drag ended without a valid drop target accepting it
      // (i.e. user released anywhere outside the taskbar pin row), unpin.
      // dataTransfer.dropEffect === "none" means no drop target prevented
      // default during dragover, so the pin "fell off" the taskbar.
      if (e.dataTransfer.dropEffect === "none") {
        unpinApp(appId);
      }
    };

  return (
    <footer
      className="fixed inset-x-0 bottom-0 z-[99996] flex items-center"
      style={{
        height: 52,
        padding: "0 10px",
        background: "linear-gradient(180deg, #0F1115 0%, #18181C 70%, #0F1115 100%)",
        color: "white",
        borderTop: "1px solid rgba(196,30,58,0.18)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 -8px 24px -8px rgba(196,30,58,0.18)",
      }}
    >
      <div className="flex items-center gap-1 pr-2">
        <button
          type="button"
          aria-label="Home"
          onClick={() => open("welcome")}
          className="grid place-items-center text-white transition"
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background:
              "linear-gradient(135deg, #C41E3A 0%, #A8182F 100%)",
            boxShadow: "0 4px 12px -4px rgba(196,30,58,0.4)",
          }}
        >
          <Home size={16} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          aria-label="Search"
          onClick={() => open("browser")}
          className="grid place-items-center text-ink transition hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--primary))]"
          style={{ width: 38, height: 38, borderRadius: 8 }}
        >
          <Search size={16} strokeWidth={1.8} />
        </button>
      </div>

      <div
        onDragOver={onCenterDragOver}
        onDragEnter={onCenterDragOver}
        onDragLeave={onCenterDragLeave}
        onDrop={onCenterDrop}
        className="flex items-center gap-0.5 flex-1 px-3 overflow-hidden transition"
        style={{
          background: dragOver ? "hsl(var(--accent))" : "transparent",
          borderRadius: 8,
          minHeight: 42,
        }}
      >
        {hydrated && pins.map((id, pinIndex) => {
          const app = APPS.find((a) => a.id === id);
          if (!app) return null;
          const open_ = windows.find((w) => w.appId === id);
          const isTop = open_ && open_.zIndex === topZ && !open_.minimized;
          return (
            <button
              key={id}
              type="button"
              aria-label={app.label}
              title={app.label}
              draggable
              data-pin-index={pinIndex}
              onDragStart={onPinDragStart(id, pinIndex)}
              onDragEnd={onPinDragEnd(id)}
              onClick={() => {
                if (!open_) return open(id);
                if (open_.minimized) {
                  restore(open_.id);
                  return focus(open_.id);
                }
                if (isTop) return minimize(open_.id);
                focus(open_.id);
              }}
              className="relative grid place-items-center transition flex-shrink-0 group cursor-pointer"
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: open_ ? "hsl(var(--background))" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!open_)
                  e.currentTarget.style.background =
                    "hsl(var(--background))";
              }}
              onMouseLeave={(e) => {
                if (!open_) e.currentTarget.style.background = "transparent";
              }}
            >
              <img
                src={app.icon}
                alt=""
                className="object-contain transition group-hover:-translate-y-0.5"
                style={{
                  width: 30,
                  height: 30,
                  filter: "drop-shadow(0 2px 4px rgba(15,17,21,0.18))",
                  pointerEvents: "none",
                }}
                draggable={false}
              />
              {open_ && (
                <span
                  className="absolute"
                  style={{
                    bottom: 2,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: isTop ? 14 : 4,
                    height: 4,
                    borderRadius: 9999,
                    background: "hsl(var(--primary))",
                    transition: "width 150ms ease",
                  }}
                />
              )}
            </button>
          );
        })}
        {dragOver && (
          <span
            style={{
              fontSize: 11,
              color: "hsl(var(--primary))",
              fontWeight: 600,
              padding: "0 12px",
              opacity: 0.7,
              letterSpacing: "0.04em",
            }}
          >
            Drop to pin
          </span>
        )}
      </div>

      <div
        className="flex items-center gap-0.5 pl-2"
        style={{ borderLeft: "1px solid hsl(var(--line))" }}
      >
        <button
          type="button"
          aria-label="Auth"
          className="grid place-items-center text-ink hover:bg-[hsl(var(--background))]"
          style={{ height: 38, padding: "0 8px", borderRadius: 6 }}
        >
          <User size={14} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          aria-label="Battery"
          className="grid place-items-center text-ink hover:bg-[hsl(var(--background))]"
          style={{ height: 38, padding: "0 8px", borderRadius: 6 }}
        >
          <BatteryMedium size={14} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          aria-label="Network"
          className="grid place-items-center text-ink hover:bg-[hsl(var(--background))]"
          style={{ height: 38, padding: "0 8px", borderRadius: 6 }}
        >
          <Wifi size={14} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          aria-label="Volume"
          className="grid place-items-center text-ink hover:bg-[hsl(var(--background))]"
          style={{ height: 38, padding: "0 8px", borderRadius: 6 }}
        >
          <Volume2 size={14} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          aria-label="TV"
          onClick={() => open("tv")}
          className="grid place-items-center text-ink hover:bg-[hsl(var(--background))]"
          style={{ height: 38, padding: "0 8px", borderRadius: 6 }}
        >
          <Tv size={14} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          aria-label="Radio"
          onClick={() => open("radio")}
          className="grid place-items-center text-ink hover:bg-[hsl(var(--background))]"
          style={{ height: 38, padding: "0 8px", borderRadius: 6 }}
        >
          <Radio size={14} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          aria-label="Calendar"
          onClick={() => open("calendar")}
          className="grid items-center text-ink hover:bg-[hsl(var(--background))] tabular-nums text-right"
          style={{
            height: 38,
            padding: "0 10px",
            borderRadius: 6,
            lineHeight: 1.1,
          }}
        >
          {now ? (
            <span className="block">
              <span className="block text-[11px] font-semibold">
                {now.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <span
                className="block text-[10px]"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {now.toLocaleDateString([], {
                  month: "numeric",
                  day: "2-digit",
                  year: "numeric",
                })}
              </span>
            </span>
          ) : (
            <span className="block text-[11px] font-semibold">--:--</span>
          )}
        </button>
        <button
          type="button"
          aria-label="Show desktop"
          className="hover:bg-[hsl(var(--accent))]"
          style={{ width: 6, height: 38 }}
        />
      </div>
    </footer>
  );
}
