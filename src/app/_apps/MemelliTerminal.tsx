"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Send, Sparkles, Cpu, User } from "lucide-react";

type Persona = "user" | "claude" | "groq" | "bar";

type Msg = {
  id: string;
  persona: Persona;
  text: string;
  ts: number;
};

const PERSONA_META: Record<
  Persona,
  { label: string; color: string; icon: typeof Sparkles }
> = {
  user: { label: "You", color: "#0F1115", icon: User },
  claude: { label: "Claude", color: "#C41E3A", icon: Sparkles },
  groq: { label: "Groq", color: "#A8182F", icon: Cpu },
  bar: { label: "Bar", color: "#dc2626", icon: Mic },
};

const STORAGE_KEY = "memelli_os_terminal_log";
const MAX_PERSIST = 200;

function load(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}
function save(messages: Msg[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(messages.slice(-MAX_PERSIST)),
    );
  } catch {
    /* noop */
  }
}

const SEED: Msg[] = [
  {
    id: "seed-1",
    persona: "claude",
    text: "Memelli OS Terminal online. I'm Claude — handle architecture, deploys, gates. Groq writes code. The bar is the voice channel. Type or hit the mic to talk.",
    ts: Date.now() - 60_000,
  },
  {
    id: "seed-2",
    persona: "groq",
    text: "Groq agents standing by — CRM, SEO, Bar, Dev, Design teams reachable. Pick a target with `@team:<name>` or just describe the task.",
    ts: Date.now() - 50_000,
  },
];

export function MemelliTerminal() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [target, setTarget] = useState<Persona>("claude");
  const [thinking, setThinking] = useState<Persona | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const persisted = load();
    setMessages(persisted.length ? persisted : SEED);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    save(messages);
  }, [messages, hydrated]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  // Listen for bar voice transcripts (dispatched from MelliBar)
  useEffect(() => {
    const onHeard = (e: Event) => {
      const detail = (e as CustomEvent<{ text?: string }>).detail;
      if (!detail?.text) return;
      const m: Msg = {
        id: `${Date.now()}-bar-${Math.random().toString(36).slice(2, 6)}`,
        persona: "bar",
        text: detail.text,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, m]);
    };
    window.addEventListener("memelli:bar-heard", onHeard as EventListener);
    return () =>
      window.removeEventListener(
        "memelli:bar-heard",
        onHeard as EventListener,
      );
  }, []);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const userMsg: Msg = {
      id: `${Date.now()}-user`,
      persona: "user",
      text,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");

    // Local agent simulation. Real wiring to api.memelli.io / Groq
    // service goes here later.
    setThinking(target);
    window.setTimeout(() => {
      const reply = simulateReply(target, text);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${target}`,
          persona: target,
          text: reply,
          ts: Date.now(),
        },
      ]);
      setThinking(null);
    }, 600 + Math.random() * 800);
  };

  const targets: Persona[] = ["claude", "groq", "bar"];

  return (
    <div
      data-dark-scroll
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        background: "#0F1115",
        color: "#E8EAF0",
        fontFamily: "inherit",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background:
            "linear-gradient(180deg, #18181C 0%, #0F1115 100%)",
        }}
      >
        <div
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#C41E3A",
            boxShadow: "0 0 10px #C41E3A",
            animation: "termPulse 1.6s ease-in-out infinite",
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Memelli OS Terminal
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "white",
              letterSpacing: "-0.01em",
            }}
          >
            Claude · Groq · Bar — one channel
          </div>
        </div>
      </div>

      {/* Log */}
      <div
        ref={scrollerRef}
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {hydrated &&
          messages.map((m) => <Bubble key={m.id} msg={m} />)}
        {thinking && <Bubble msg={{ id: "tk", persona: thinking, text: "…", ts: Date.now() }} />}
      </div>

      {/* Input */}
      <div
        style={{
          padding: "10px 12px 12px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background:
            "linear-gradient(0deg, #18181C 0%, #0F1115 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 8,
          }}
        >
          {targets.map((p) => {
            const meta = PERSONA_META[p];
            const Icon = meta.icon;
            const active = target === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setTarget(p)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 10px",
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  borderRadius: 9999,
                  border: `1px solid ${active ? meta.color : "rgba(255,255,255,0.1)"}`,
                  background: active
                    ? `${meta.color}25`
                    : "rgba(255,255,255,0.03)",
                  color: active ? "white" : "rgba(255,255,255,0.55)",
                  cursor: "pointer",
                  transition: "all 120ms",
                }}
              >
                <Icon size={11} strokeWidth={2.2} />
                {meta.label}
              </button>
            );
          })}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "8px 10px",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: PERSONA_META[target].color,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            @{target}
          </span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Talk to ${PERSONA_META[target].label}…`}
            style={{
              flex: 1,
              background: "transparent",
              border: 0,
              outline: "none",
              color: "white",
              fontSize: 13,
              padding: "4px 0",
              fontFamily: "inherit",
            }}
          />
          <button
            type="button"
            title="Mic — engage the Memelli bar"
            onClick={() =>
              window.dispatchEvent(new Event("memelli:engage"))
            }
            style={{
              display: "grid",
              placeItems: "center",
              width: 28,
              height: 28,
              borderRadius: 8,
              border: 0,
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.85)",
              cursor: "pointer",
            }}
          >
            <Mic size={13} strokeWidth={2} />
          </button>
          <button
            type="submit"
            aria-label="Send"
            style={{
              display: "grid",
              placeItems: "center",
              width: 32,
              height: 28,
              borderRadius: 8,
              border: 0,
              background:
                "linear-gradient(135deg, #C41E3A, #A8182F)",
              color: "white",
              cursor: "pointer",
              boxShadow:
                "0 0 0 1px rgba(196,30,58,0.4), 0 4px 12px -4px rgba(196,30,58,0.55)",
            }}
          >
            <Send size={13} strokeWidth={2} />
          </button>
        </form>
      </div>

      <style>{`@keyframes termPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .55; transform: scale(.85); } }`}</style>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const meta = PERSONA_META[msg.persona];
  const Icon = meta.icon;
  const isUser = msg.persona === "user";
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 26,
          height: 26,
          borderRadius: 8,
          background: `${meta.color}28`,
          color: meta.color,
          display: "grid",
          placeItems: "center",
          border: `1px solid ${meta.color}50`,
        }}
      >
        <Icon size={13} strokeWidth={2} />
      </span>
      <div
        style={{
          maxWidth: "78%",
          padding: "8px 12px",
          borderRadius: 12,
          background: isUser
            ? "linear-gradient(135deg, #C41E3A, #A8182F)"
            : "rgba(255,255,255,0.05)",
          border: isUser
            ? "1px solid rgba(255,255,255,0.12)"
            : "1px solid rgba(255,255,255,0.06)",
          color: isUser ? "white" : "rgba(255,255,255,0.92)",
        }}
      >
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: isUser ? "rgba(255,255,255,0.75)" : meta.color,
            marginBottom: 4,
          }}
        >
          {meta.label}
        </div>
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {msg.text}
        </div>
      </div>
    </div>
  );
}

function simulateReply(persona: Persona, text: string): string {
  const t = text.trim();
  if (persona === "claude") {
    if (/deploy|ship/i.test(t))
      return "Routing to deploy lane: build → patch lane lookup → Railway → verify. I'll watch logs and record the patch on success.";
    if (/help|what can/i.test(t))
      return "I orchestrate. I gate, I verify, I record. Groq writes the code. Tell me what you want shipped or what's broken — I'll route the work.";
    return `Got it: "${t}". I'll route this through the right team.`;
  }
  if (persona === "groq") {
    if (/code|file|write/i.test(t))
      return "Pulling team grounding + patch lane similar matches. Will dispatch on the right node and report back via this channel.";
    return `Queued for Groq: "${t}". Pick a team subtype with @team:<name> or I'll auto-route.`;
  }
  return `Bar transcript captured: "${t}". Voice gateway will pick this up next session.`;
}
