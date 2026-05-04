"use client";
import { useEffect, useRef, useState } from "react";
import { ensureBridge } from "../_lib/os-app-bridge";

type Props = {
  nodeName: string;
  viewport?: "desktop" | "mobile" | "all";
  payload?: unknown;
};

export function DbChrome({
  nodeName,
  viewport = "all",
  payload,
}: Props): React.ReactElement | null {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  // Detect viewport size
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobile(mql.matches);

    update();
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", listener);

    return () => {
      mql.removeEventListener("change", listener);
    };
  }, []);

  // Determine whether this component should render based on the viewport prop
  const shouldRender = (() => {
    if (viewport === "mobile") return isMobile === true;
    if (viewport === "desktop") return isMobile === false;
    return true; // "all" or undefined
  })();

  // Load and mount the chrome code when appropriate
  useEffect(() => {
    if (!shouldRender || !containerRef.current) return;

    const bridge: any = ensureBridge();

    const load = async () => {
      try {
        const res = await fetch(`/api/os-node/${nodeName}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data: { ok: boolean; code?: string } = await res.json();
        if (!data.ok || typeof data.code !== "string") return;

        const m: { exports: Record<string, unknown> } = { exports: {} };

        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        new Function(
          "module",
          "exports",
          "require",
          "app",
          "helpers",
          data.code
        )(m, m.exports, () => ({}), bridge, {
          container: containerRef.current,
          payload,
        });

        const register = (m.exports as Record<string, unknown>).register;
        if (typeof register === "function") {
          await (register as (
            app: any,
            ctx: { container: HTMLDivElement; payload?: unknown }
          ) => Promise<void>)(bridge, {
            container: containerRef.current,
            payload,
          });
        }
      } catch {
        // Swallow errors – component should fail silently
      }
    };

    load();

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    nodeName,
    shouldRender,
    // Re-run when payload changes (shallow check via JSON.stringify)
    JSON.stringify(payload),
  ]);

  if (!shouldRender) {
    return null;
  }

  return <div ref={containerRef} />;
}