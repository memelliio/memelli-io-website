"use client";

import { useEffect, useRef, useState } from "react";
import { Tv, Radio, Settings as Cog } from "lucide-react";
import { WaveBar } from "./WaveBar";
import { useWindowStore } from "../_lib/window-store";
import { useBarConfig } from "../_lib/bar-config-store";

type Mode = "idle" | "listening" | "thinking" | "speaking";

// MelliBar M4 — wires browser SpeechRecognition (STT) + DashScope CosyVoice (TTS)
// to the deterministic intent matcher (M3) + dispatcher (M5) + Groq fallback (M8).

interface RuntimeContextRef {
  user_id: string | null;
  partner_id: string | null;
  persona: { name?: string; greeting?: string; brand_color?: string } | null;
}

function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const w = window as unknown as { __memelliUserId?: string };
    if (w.__memelliUserId) return w.__memelliUserId;
    const t = localStorage.getItem("memelli_token");
    if (!t) return null;
    // JWTs are header.payload.signature
    const parts = t.split(".");
    if (parts.length !== 3) return null;
    const json = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return json?.sub ?? json?.id ?? null;
  } catch {
    return null;
  }
}

function getPartnerId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const host = window.location.hostname;
    // key2debtfree.memelli.io → partner slug
    const m = host.match(/^([^.]+)\.memelli\.io$/);
    if (m && m[1] && m[1] !== "www" && m[1] !== "memelli") {
      return m[1];
    }
  } catch {
    /* */
  }
  return null;
}

interface SpeechRecognitionLike {
  start: () => void;
  stop: () => void;
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult:
    | ((e: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void)
    | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.continuous = false;
  r.interimResults = false;
  r.lang = "en-US";
  return r;
}

async function speak(text: string): Promise<void> {
  if (!text) return;
  // Try server TTS first; fall back to browser SpeechSynthesis
  try {
    const r = await fetch("/api/melli/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (r.ok) {
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
      return;
    }
  } catch {
    /* fall through */
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  }
}

export function MelliBar() {
  const open = useWindowStore((s) => s.open);
  const enabled = useBarConfig((s) => s.enabled);
  const barHeight = useBarConfig((s) => s.barHeight);
  const barBackground = useBarConfig((s) => s.barBackground);
  const barOpacity = useBarConfig((s) => s.barOpacity);
  const borderGlow = useBarConfig((s) => s.borderGlow);
  const showLogo = useBarConfig((s) => s.showLogo);
  const showText = useBarConfig((s) => s.showText);
  const setBarConfig = useBarConfig((s) => s.set);
  const BAR_H = Math.max(64, Math.min(140, barHeight ?? 96));
  const [hydrated, setHydrated] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [lastHeard, setLastHeard] = useState("");
  const [lastReply, setLastReply] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const runtimeRef = useRef<RuntimeContextRef>({
    user_id: null,
    partner_id: null,
    persona: null,
  });

  useEffect(() => {
    setHydrated(true);
    runtimeRef.current.user_id = getCurrentUserId();
    runtimeRef.current.partner_id = getPartnerId();
    // Load persona
    const partnerParam = runtimeRef.current.partner_id
      ? `?partner_id=${encodeURIComponent(runtimeRef.current.partner_id)}`
      : "";
    fetch(`/api/melli/persona${partnerParam}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.persona) runtimeRef.current.persona = j.persona;
      })
      .catch(() => {});
  }, []);

  // Connect SSE stream — fold incoming session_context into runtime
  useEffect(() => {
    const uid = runtimeRef.current.user_id;
    if (!uid) return;
    const ev = new EventSource(`/api/melli/stream?user_id=${encodeURIComponent(uid)}`);
    ev.addEventListener("session_context", () => {
      // No-op — just keeping the channel open. Server-side reads on each
      // intent call already pull the freshest context from kernel_objects.
    });
    return () => ev.close();
  }, [hydrated]);

  // memelli:bar:guide-me listener — fired by per-module CTAs
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ module?: string }>).detail;
      const moduleId = detail?.module ?? "prequal";
      try {
        (window as unknown as { __memelliActiveModule?: string }).__memelliActiveModule = moduleId;
      } catch {
        /* noop */
      }
      setInCall(true);
    };
    window.addEventListener("memelli:bar:guide-me", handler as EventListener);
    return () => window.removeEventListener("memelli:bar:guide-me", handler as EventListener);
  }, []);

  // Main loop — when inCall toggles on, start listening.
  useEffect(() => {
    if (!inCall) {
      setMode("idle");
      setLastHeard("");
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* */
        }
        recognitionRef.current = null;
      }
      return;
    }
    let cancelled = false;

    const runOnce = async (transcript: string) => {
      if (cancelled) return;
      setLastHeard(transcript);
      setMode("thinking");
      const uid = runtimeRef.current.user_id;
      if (!uid) {
        setLastReply("Sign in first.");
        await speak("Please sign in first.");
        setMode("idle");
        return;
      }

      // Persist user message
      try {
        await fetch("/api/melli/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: uid, role: "user", content: transcript }),
        });
      } catch {
        /* */
      }

      // 1. Intent
      let intent: {
        command?: { name: string; handler_name: string; module_id: string; params: Record<string, string> };
        needs_llm?: boolean;
        reason?: string;
        partial_match?: { name?: string; params?: Record<string, string>; missing?: string[] };
      } = {};
      try {
        const ir = await fetch("/api/melli/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: uid, transcript }),
        });
        intent = await ir.json();
      } catch (e) {
        void e;
        intent = { needs_llm: true, reason: "intent_route_error" };
      }

      let speakText = "";
      let actionDescriptor: {
        type: string;
        appId?: string;
        event?: string;
        detail?: Record<string, unknown>;
        href?: string;
        reason?: string;
      } | null = null;

      if (intent.command) {
        // 2a. Deterministic dispatch
        try {
          const dr = await fetch("/api/melli/dispatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: uid, command: intent.command }),
          });
          const dj = (await dr.json()) as {
            ok: boolean;
            speak?: string;
            action?: typeof actionDescriptor;
            error?: string;
          };
          speakText = dj.speak ?? "";
          actionDescriptor = dj.action ?? null;
        } catch (e) {
          void e;
          speakText = "Couldn't dispatch that.";
        }
      } else if (intent.needs_llm) {
        // 2b. Groq fallback
        try {
          const fr = await fetch("/api/melli/fallback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: uid,
              transcript,
              reason: intent.reason,
              partial_match: intent.partial_match,
            }),
          });
          const fj = (await fr.json()) as {
            ok: boolean;
            speak?: string;
            command?: { name: string; params: Record<string, string> };
            via?: string;
          };
          if (fj.command) {
            // Groq returned a structured command — re-dispatch
            const cmdRows = await fetch("/api/melli/intent", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: uid, transcript: `__cmd:${fj.command.name}` }),
            });
            void cmdRows;
            // Best-effort: invoke dispatch with the command Groq returned, looking up handler from registry.
            // The simplest path is a follow-up POST through /api/melli/dispatch with name + handler stub.
            speakText = "On it.";
            // We open the module by name match as the open_window
            actionDescriptor = {
              type: "open_window",
              appId: (fj.command.params?.module_id ?? fj.command.name.split(".")[0]) as string,
            };
          } else {
            speakText = fj.speak ?? "I'm not sure how to help with that.";
          }
        } catch (e) {
          void e;
          speakText = "Reasoning engine unreachable.";
        }
      } else {
        speakText = "I didn't catch that.";
      }

      // 3. Apply action
      if (actionDescriptor) {
        const a = actionDescriptor;
        if (a.type === "open_window" && a.appId) {
          open(a.appId as Parameters<typeof open>[0]);
        } else if (a.type === "open_window_then_event" && a.appId && a.event) {
          open(a.appId as Parameters<typeof open>[0]);
          window.dispatchEvent(new CustomEvent(a.event, { detail: a.detail ?? {} }));
        } else if (a.type === "navigate" && a.href) {
          window.location.href = a.href;
        }
      }

      // 4. Persist assistant message
      try {
        await fetch("/api/melli/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: uid,
            role: "assistant",
            content: speakText,
            source: intent.command ? "deterministic" : "groq",
          }),
        });
      } catch {
        /* */
      }

      // 5. Speak
      setLastReply(speakText);
      setMode("speaking");
      await speak(speakText);
      if (cancelled) return;
      setMode("idle");
    };

    const startListen = () => {
      if (cancelled) return;
      const r = getSpeechRecognition();
      if (!r) {
        // Browser doesn't support STT — fall back to text via window.__memelliSend
        return;
      }
      recognitionRef.current = r;
      r.onresult = (e) => {
        const last = e.results[e.results.length - 1];
        if (last && last.isFinal) {
          const transcript = String(last[0].transcript || "").trim();
          if (transcript) {
            void runOnce(transcript);
          }
        }
      };
      r.onerror = () => {
        setMode("idle");
      };
      r.onend = () => {
        // Restart listening if still in a call and not currently thinking/speaking
        if (!cancelled && inCall && mode !== "thinking" && mode !== "speaking") {
          setTimeout(() => {
            if (!cancelled && inCall) startListen();
          }, 400);
        }
      };
      try {
        r.start();
        setMode("listening");
      } catch {
        /* */
      }
    };

    startListen();
    return () => {
      cancelled = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* */
        }
        recognitionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inCall]);

  // Expose window.__memelliSend so any module can post a user utterance
  useEffect(() => {
    const win = window as unknown as { __memelliSend?: (text: string) => void };
    win.__memelliSend = (text: string) => {
      setInCall(true);
      // Same path as voice — feed into intent matcher
      const uid = runtimeRef.current.user_id;
      if (!uid) return;
      void (async () => {
        setLastHeard(text);
        setMode("thinking");
        const ir = await fetch("/api/melli/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: uid, transcript: text }),
        });
        const ij = await ir.json();
        if (ij.command) {
          const dr = await fetch("/api/melli/dispatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: uid, command: ij.command }),
          });
          const dj = await dr.json();
          if (dj.action?.appId && dj.action.type === "open_window") open(dj.action.appId);
          if (dj.action?.appId && dj.action.type === "open_window_then_event") {
            open(dj.action.appId);
            window.dispatchEvent(new CustomEvent(dj.action.event, { detail: dj.action.detail ?? {} }));
          }
          setLastReply(dj.speak ?? "");
          setMode("speaking");
          void speak(dj.speak ?? "");
          setTimeout(() => setMode("idle"), 800);
        } else {
          setMode("idle");
        }
      })();
    };
    return () => {
      delete win.__memelliSend;
    };
  }, [open]);

  const engage = () => {
    open("memelli-terminal");
    setInCall((v) => !v);
  };

  const statusLabel =
    mode === "listening"
      ? "Listening…"
      : mode === "thinking"
        ? "Thinking…"
        : mode === "speaking"
          ? "Speaking…"
          : "In Call";
  const statusColor =
    mode === "listening"
      ? "#dc2626"
      : mode === "thinking"
        ? "#eab308"
        : "#16a34a";

  if (!hydrated) return null;
  if (!enabled) {
    return (
      <button
        type="button"
        onClick={() => setBarConfig({ enabled: true })}
        title="Click to restore Memelli bar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          height: 20,
          background: "#111",
          border: 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderBottom: "1px solid rgba(220,38,38,0.15)",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#dc2626",
            opacity: 0.5,
          }}
        />
        <span
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.08em",
          }}
        >
          RESTORE MEMELLI BAR
        </span>
      </button>
    );
  }

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: BAR_H,
        zIndex: 99997,
        pointerEvents: "none",
        opacity: barOpacity,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: barBackground || "linear-gradient(180deg, #0F1115 0%, #18181C 70%, #0F1115 100%)",
          borderBottom: borderGlow
            ? "1px solid rgba(196,30,58,0.18)"
            : "1px solid rgba(255,255,255,0.04)",
          boxShadow: borderGlow
            ? "inset 0 0 0 1px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(196,30,58,0.18), inset 0 1px 0 rgba(255,255,255,0.03)"
            : "inset 0 0 0 1px rgba(0,0,0,0.4)",
        }}
      />

      <WaveBar mode={mode} height={BAR_H} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 18px",
          pointerEvents: "auto",
        }}
      >
        {/* LEFT — logo + status + heard */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flex: 1,
            minWidth: 0,
          }}
        >
          <img
            src="/os/brand/memelli-logo-white.png"
            alt="Memelli"
            style={{
              height: 64,
              width: "auto",
              objectFit: "contain",
              flexShrink: 0,
              filter: "drop-shadow(0 1px 6px rgba(196,30,58,0.25))",
            }}
            draggable={false}
          />
          {inCall && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: statusColor,
                letterSpacing: "0.02em",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: statusColor,
                  boxShadow: `0 0 10px ${statusColor}`,
                  animation: "melliPulseDot 1.2s ease-in-out infinite",
                }}
              />
              {statusLabel}
            </span>
          )}
          {lastHeard && (
            <span
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.55)",
                fontStyle: "italic",
                maxWidth: 320,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                letterSpacing: 0.2,
              }}
            >
              &ldquo;{lastHeard}&rdquo;
            </span>
          )}
          {lastReply && !inCall && (
            <span
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.45)",
                maxWidth: 360,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {lastReply}
            </span>
          )}
        </div>

        {/* CENTER — engage button */}
        <button
          type="button"
          onClick={engage}
          aria-label={inCall ? "End call" : "Engage Memelli"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "9px 22px 9px 14px",
            borderRadius: 9999,
            border: 0,
            background: inCall
              ? "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)"
              : "linear-gradient(135deg, #C41E3A 0%, #A8182F 100%)",
            color: "white",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.04em",
            cursor: "pointer",
            boxShadow: inCall
              ? "0 0 24px rgba(220,38,38,0.55), 0 0 48px rgba(220,38,38,0.25), inset 0 1px 0 rgba(255,255,255,0.18)"
              : "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(196,30,58,0.4), 0 8px 22px -8px rgba(196,30,58,0.55), 0 2px 6px rgba(0,0,0,0.25)",
            animation: inCall
              ? "melliCallPulse 1.5s ease-in-out infinite"
              : "none",
            transition: "transform 150ms ease, box-shadow 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {showLogo && (
            <img
              src="/os/brand/memelli-logo-white.png"
              alt=""
              draggable={false}
              style={{ height: 22, width: "auto" }}
            />
          )}
          {showText && <span>{inCall ? "End Call" : "Let Memelli Guide Me"}</span>}
        </button>

        {/* RIGHT — Mode toggle / TV / Radio / Settings */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 6,
            flex: 1,
          }}
        >
          <BarIconButton label="TV" onClick={() => open("tv")}>
            <Tv size={16} strokeWidth={1.8} />
          </BarIconButton>
          <BarIconButton label="Radio" onClick={() => open("radio")}>
            <Radio size={16} strokeWidth={1.8} />
          </BarIconButton>
          <BarIconButton
            label="Bar Settings"
            onClick={() => open("memelli-bar-settings")}
          >
            <Cog size={16} strokeWidth={1.8} />
          </BarIconButton>
        </div>
      </div>

      <style>{`
        @keyframes melliCallPulse {
          0%, 100% { box-shadow: 0 0 18px rgba(220,38,38,0.45), 0 0 32px rgba(220,38,38,0.18), inset 0 1px 0 rgba(255,255,255,0.18); }
          50%      { box-shadow: 0 0 30px rgba(220,38,38,0.65), 0 0 56px rgba(220,38,38,0.30), inset 0 1px 0 rgba(255,255,255,0.18); }
        }
        @keyframes melliPulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(0.85); }
        }
      `}</style>
    </header>
  );
}

function BarIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 8,
        background: hover ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
        border: 0,
        cursor: "pointer",
        color: hover ? "white" : "rgba(255,255,255,0.85)",
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {children}
    </button>
  );
}
