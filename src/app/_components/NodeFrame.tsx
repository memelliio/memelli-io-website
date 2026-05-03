"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  nodeName: string;
  windowId?: string;
  appId?: string;
  appLabel?: string;
};

const PUBLIC_APPS = new Set(["welcome", "signup", "signin"]);

async function checkAccess(appId: string): Promise<"allowed" | "unauthenticated" | "plan_required"> {
  if (PUBLIC_APPS.has(appId)) return "allowed";
  try {
    const r = await fetch(`/api/access?app=${encodeURIComponent(appId)}`, { cache: "no-store" });
    if (r.status === 401) return "unauthenticated";
    if (r.status === 402) return "plan_required";
    if (r.ok) return "allowed";
    return "unauthenticated";
  } catch {
    return "unauthenticated";
  }
}

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

export function NodeFrame({ nodeName, windowId, appId, appLabel }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gate, setGate] = useState<"allowed" | "unauthenticated" | "plan_required" | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    setGate(null);

    const id = appId || nodeName.replace(/^os-app-/, "");
    checkAccess(id).then((g) => {
      if (cancelled) return;
      setGate(g);
      if (g !== "allowed") {
        setLoading(false);
        return;
      }
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
    });
    return () => {
      cancelled = true;
    };
  }, [nodeName, windowId, appId]);

  if (gate === "unauthenticated" || gate === "plan_required") {
    return <GateCard mode={gate} appLabel={appLabel || appId || nodeName} />;
  }

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

function GateCard({ mode, appLabel }: { mode: "unauthenticated" | "plan_required"; appLabel: string }) {
  const isUpsell = mode === "plan_required";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "#FAFAFA",
        padding: 32,
      }}
    >
      <div
        style={{
          maxWidth: 360,
          width: "100%",
          background: "white",
          border: "1px solid #E5E7EB",
          borderRadius: 16,
          padding: 32,
          textAlign: "center",
          boxShadow: "0 12px 32px -12px rgba(15,17,21,0.12)",
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: "#C41E3A", marginBottom: 6 }}>
          {isUpsell ? "Upgrade required" : "Members only"}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: "#0F1115", margin: "0 0 8px" }}>
          {appLabel}
        </h2>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 22px", lineHeight: 1.5 }}>
          {isUpsell
            ? "This is a Pro feature. Upgrade to access " + appLabel + " and the rest of Memelli."
            : "Sign up to access " + appLabel + ". It’s free, takes 30 seconds."}
        </p>
        <button
          type="button"
          onClick={() => {
            const w = (window as unknown as { __memelliWindows?: { open: (id: string) => void } }).__memelliWindows;
            if (w && typeof w.open === "function") w.open(isUpsell ? "billing" : "signup");
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 22px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            borderRadius: 9999,
            border: 0,
            background: "linear-gradient(135deg, #C41E3A, #A8182F)",
            color: "white",
            cursor: "pointer",
            boxShadow: "0 8px 22px -8px rgba(196,30,58,0.55)",
          }}
        >
          {isUpsell ? "Upgrade to Pro" : "Sign up free"}
        </button>
      </div>
    </div>
  );
}
