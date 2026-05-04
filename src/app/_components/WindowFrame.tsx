"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DbChrome } from "./DbChrome";
import { NodeFrame } from "./NodeFrame";
import { useRegistryStore } from "../_lib/registry-store";
import type { AppDef } from "../_lib/types";
import { useWindowStore, type Win } from "../_lib/window-store";

export function WindowFrame({ win }: { win: Win }): React.ReactElement {
  const slotId = `wf-body-${win.id}`;

  // Pull the app definition directly from the registry store (no subscription needed)
  const appDef = useRegistryStore.getState().apps.find(
    (a) => a.id === win.appId,
  ) as AppDef | undefined;

  const [slotEl, setSlotEl] = useState<HTMLElement | null>(null);

  // Wait for the slot element created by DbChrome to appear in the DOM
  useEffect(() => {
    let rafId: number | null = null;

    const check = () => {
      const el = document.getElementById(slotId);
      if (el) {
        setSlotEl(el as HTMLElement);
      } else {
        rafId = requestAnimationFrame(check);
      }
    };

    check();

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [slotId]);

  // Determine what to render inside the slot
  let bodyContent: React.ReactNode = null;

  if (appDef?.body.kind === "node") {
    bodyContent = (
      <NodeFrame
        nodeName={appDef.body.nodeName}
        windowId={win.id}
        appId={win.appId}
        appLabel={appDef.label}
      />
    );
  } else if (appDef?.body.kind === "iframe") {
    bodyContent = (
      <iframe
        src={appDef.body.src}
        title={appDef.label}
        className="w-full h-full border-0"
      />
    );
  } else if (appDef?.body.kind === "stub") {
    // Minimal placeholder for stub bodies (no Stub component imported per requirements)
    bodyContent = (
      <div
        style={{
          padding: "1rem",
          textAlign: "center",
          color: "var(--muted-foreground)",
        }}
      >
        <h2>{appDef.body.title}</h2>
        <p>{appDef.body.blurb}</p>
        <a href={appDef.body.ctaHref}>{appDef.body.ctaLabel}</a>
      </div>
    );
  } else if (appDef?.body.Component) {
    const Component = appDef.body.Component;
    bodyContent = <Component windowId={win.id} />;
  }

  const portal = slotEl && bodyContent ? createPortal(bodyContent, slotEl) : null;

  return (
    <>
      <DbChrome
        nodeName="os-chrome-window-frame"
        payload={{
          win,
          slotId,
          appLabel: appDef?.label,
          appId: win.appId,
        }}
      />
      {portal}
    </>
  );
}