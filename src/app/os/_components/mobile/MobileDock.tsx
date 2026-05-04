"use client";

import { useState } from "react";
import { APPS } from "../../_apps/registry";
import { useWindowStore } from "../../_lib/window-store";
import { useAuth } from "@/contexts/auth";
import { getPitch, type ModulePitch } from "../../_lib/module-pitches";
import { ModulePitchModal } from "../ModulePitchModal";

const PAPER = "#FFFFFF";
const INK = "#0B0B0F";

export function MobileDock() {
  const open = useWindowStore((s) => s.open);
  const pins = useWindowStore((s) => s.pins);
  const { user } = useAuth();
  const [pitch, setPitch] = useState<ModulePitch | null>(null);

  const handleClick = (appId: string, label: string) => {
    if (!user) {
      const p = getPitch(appId, label);
      if (p) {
        setPitch(p);
        return;
      }
    }
    open(appId);
  };

  return (
    <>
      <div
        data-mob-dock
        style={{
          flex: "0 0 auto",
          margin: "0 14px 16px",
          padding: "10px 14px",
          background: "rgba(255,255,255,0.78)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.6)",
          borderRadius: 22,
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.4) inset, 0 12px 30px -12px rgba(15,17,21,0.20)",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          gap: 8,
        }}
      >
        {pins.map((id) => {
          const app = APPS.find((a) => a.id === id);
          if (!app) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleClick(app.id, app.label)}
              aria-label={app.label}
              title={app.label}
              style={{
                background: PAPER,
                border: 0,
                width: 52,
                height: 52,
                borderRadius: 13,
                padding: 0,
                cursor: "pointer",
                boxShadow:
                  "0 1px 0 rgba(0,0,0,0.04), 0 8px 18px -10px rgba(15,17,21,0.18)",
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
              }}
            >
              <img
                src={app.icon}
                alt=""
                style={{ width: 38, height: 38, objectFit: "contain" }}
              />
            </button>
          );
        })}
      </div>
      {/* Home indicator bar (iOS analog) */}
      <div
        aria-hidden
        style={{
          flex: "0 0 auto",
          height: 14,
          display: "grid",
          placeItems: "center",
          paddingBottom: 4,
        }}
      >
        <span
          style={{
            width: 134,
            height: 5,
            borderRadius: 9999,
            background: INK,
            opacity: 0.85,
          }}
        />
      </div>
      {pitch && (
        <ModulePitchModal pitch={pitch} onClose={() => setPitch(null)} />
      )}
    </>
  );
}
