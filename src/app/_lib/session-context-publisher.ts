"use client";

// MelliBar M6 — session_context publisher.
// Subscribes to useWindowStore + listens for module-level "memelli:context:*"
// events and UPSERTs the user's session_context kernel_object via
// POST /api/melli/context.
//
// Designed as a single hook called once from the OS layout. Modules can
// fire `window.dispatchEvent(new CustomEvent('memelli:context:select-item',
// { detail: { item_id: '...' } }))` to flag selected_item_id without owning
// any publisher state.

import { useEffect, useRef } from "react";
import { useWindowStore } from "./window-store";

interface ContextPatch {
  active_module?: string;
  focused_window_id?: string;
  selected_item_id?: string;
  view_state?: Record<string, unknown>;
}

function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const w = window as unknown as { __memelliUserId?: string };
    if (w.__memelliUserId) return w.__memelliUserId;
    const t = localStorage.getItem("memelli_token");
    if (!t) return null;
    const parts = t.split(".");
    if (parts.length !== 3) return null;
    const json = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return json?.sub ?? json?.id ?? null;
  } catch {
    return null;
  }
}

async function publish(patch: ContextPatch): Promise<void> {
  const uid = getCurrentUserId();
  if (!uid) return;
  try {
    await fetch("/api/melli/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: uid, ...patch }),
    });
  } catch {
    /* */
  }
}

let lastPayloadKey = "";
function publishDeduped(patch: ContextPatch) {
  const key = JSON.stringify(patch);
  if (key === lastPayloadKey) return;
  lastPayloadKey = key;
  void publish(patch);
}

export function useSessionContextPublisher(): void {
  const inited = useRef(false);

  useEffect(() => {
    if (inited.current) return;
    inited.current = true;

    // 1. Subscribe to window-store: focused window → active_module + focused_window_id.
    const unsub = useWindowStore.subscribe((state) => {
      const top = [...state.windows]
        .filter((w) => !w.minimized)
        .sort((a, b) => b.zIndex - a.zIndex)[0];
      if (top) {
        publishDeduped({ active_module: top.appId, focused_window_id: top.id });
      }
    });

    // 2. Per-module context events
    const onSelect = (e: Event) => {
      const detail = (e as CustomEvent<{ item_id?: string; module?: string }>).detail;
      if (detail?.item_id) {
        publishDeduped({
          selected_item_id: detail.item_id,
          ...(detail.module ? { active_module: detail.module } : {}),
        });
      }
    };
    const onView = (e: Event) => {
      const detail = (e as CustomEvent<{ view_state?: Record<string, unknown>; module?: string }>).detail;
      if (detail?.view_state) {
        publishDeduped({
          view_state: detail.view_state,
          ...(detail.module ? { active_module: detail.module } : {}),
        });
      }
    };

    // 3. Bridge module-specific events → context.
    // memelli:crm:focus-contact (dispatched by /api/melli/dispatch and any CRM
    //   row click) → sets selected_item_id + active_module=crm.
    const onFocusContact = (e: Event) => {
      const detail = (e as CustomEvent<{ contactId?: string }>).detail;
      if (detail?.contactId) {
        publishDeduped({ selected_item_id: detail.contactId, active_module: "crm" });
      }
    };

    window.addEventListener("memelli:context:select-item", onSelect as EventListener);
    window.addEventListener("memelli:context:view-state", onView as EventListener);
    window.addEventListener("memelli:crm:focus-contact", onFocusContact as EventListener);

    return () => {
      unsub();
      window.removeEventListener("memelli:context:select-item", onSelect as EventListener);
      window.removeEventListener("memelli:context:view-state", onView as EventListener);
      window.removeEventListener("memelli:crm:focus-contact", onFocusContact as EventListener);
    };
  }, []);
}
