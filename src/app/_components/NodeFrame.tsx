"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  nodeName: string;
  windowId?: string;
};

type Cache = { code: string; ts: number };
const NODE_CACHE: Map<string, Cache> = new Map();
const TTL_MS = 60_000;

async function fetchNodeCode(name: string): Promise<string | null> {
  const c = NODE_CACHE.get(name);
  if (c && Date.now() - c.ts < TTL_MS) return c.code;
  try {
    const r = await fetch(`/api/os-node/${encodeURIComponent(name)}`, { cache: "no-store" });
    if (!r.ok) return null;
    const j = (await r.json()) as { ok: boolean; code?: string };
    if (!j.ok || !j.code) return null;
    NODE_CACHE.set(name, { code: j.code, ts: Date.now() });
    return j.code;
  } catch {
    return null;
  }
}

function asExpr(s: string): string {
  s = s.replace(/^\s+/, "");
  if (/^function\b/.test(s)) return s;
  if (/^\(/.test(s)) return s;
  const m = s.match(/^[\w$]+\s*(\([\s\S]*)$/);
  if (m) return "function " + m[1];
  return s;
}

function executeNode(code: string, container: HTMLElement, windowId: string) {
  const m: { exports: Record<string, unknown> } = { exports: {} };
  const fn = new Function("module", "exports", "require", "app", "helpers", code);
  const fakeApp: { osNodes: Record<string, { html?: string; mount?: (el: HTMLElement) => void }> } = { osNodes: {} };
  fn(m, m.exports, () => ({}), fakeApp, {});
  const reg = m.exports.register as ((app: typeof fakeApp, h: Record<string, unknown>) => void) | undefined;
  if (typeof reg !== "function") throw new Error("node has no register()");
  reg(fakeApp, {});
  const k = Object.keys(fakeApp.osNodes)[0];
  const node = fakeApp.osNodes[k];
  if (!node) throw new Error("node did not register an osNode");
  if (typeof node.html === "string") container.innerHTML = node.html;
  if (typeof node.mount === "function") {
    container.dataset.windowId = windowId;
    const mountSrc = node.mount.toString();
    const expr = asExpr(mountSrc);
    const mountFn = new Function("return (" + expr + ")")() as (el: HTMLElement) => void;
    mountFn(container);
  }
}

export function NodeFrame({ nodeName, windowId }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    fetchNodeCode(nodeName).then((code) => {
      if (cancelled) return;
      const el = ref.current;
      if (!el) return;
      if (!code) {
        setErr(`node ${nodeName} not found in DB`);
        setLoading(false);
        return;
      }
      try {
        executeNode(code, el, windowId || nodeName);
        setLoading(false);
      } catch (e) {
        setErr((e as Error).message);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [nodeName, windowId]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div ref={ref} style={{ position: "absolute", inset: 0 }} />
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "rgba(0,0,0,0.4)",
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            pointerEvents: "none",
          }}
        >
          Loading {nodeName}…
        </div>
      )}
      {err && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: 24,
            color: "#dc2626",
            fontSize: 12,
            fontFamily: "monospace",
          }}
        >
          {err}
        </div>
      )}
    </div>
  );
}
