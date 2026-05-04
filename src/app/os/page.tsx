"use client";

import { useEffect, useState } from "react";
import { MelliBar } from "./_components/MelliBar";
import { Taskbar } from "./_components/Taskbar";
import { Desktop } from "./_components/Desktop";
import { WindowFrame } from "./_components/WindowFrame";
import { WelcomeBanner } from "./_components/WelcomeBanner";
import { WindowList } from "./_components/WindowList";
import { AppOpener } from "./_components/AppOpener";
import { ModeToggle } from "./_components/ModeToggle";
import { JourneyTab } from "./_components/JourneyTab";
import { SignInTab } from "./_components/SignInTab";
import { BusinessCenter } from "./_components/BusinessCenter";
import { useWindowStore } from "./_lib/window-store";
import { useOsMode } from "./_lib/os-mode-store";
import { useSessionContextPublisher } from "./_lib/session-context-publisher";
import { ViewportToggle } from "./_components/ViewportToggle";
import {
  useViewportPreview,
  VIEWPORT_PRESETS,
  useIsMobileSurface,
} from "./_lib/viewport-preview-store";
import { MobileShell } from "./_components/mobile/MobileShell";

export default function OsPage() {
  // Avoid SSR/hydration mismatch flash — SSR doesn't know the viewport, so
  // it would render desktop layout, then hydration flips to mobile. Gate
  // the whole OS until after first client render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // M6 — publish session_context for MelliBar awareness.
  useSessionContextPublisher();
  const windows = useWindowStore((s) => s.windows);
  const mode = useOsMode((s) => s.mode);
  const preset = useViewportPreview((s) => s.preset);
  // Defensive fallback: if persisted preset is from an older preset list
  // (e.g. "mobile" / "phablet" — replaced by named devices), VIEWPORT_PRESETS
  // returns undefined. Coerce to "off" so the OS still renders.
  const dim = VIEWPORT_PRESETS[preset] ?? VIEWPORT_PRESETS.off;
  const constrained =
    preset !== "off" && dim != null && dim.w != null && dim.h != null;
  // Treat any preset narrower than 768 as "phone mode". Otherwise use
  // window matchMedia. Constrained-tablet still uses desktop chrome.
  const isMobile = useIsMobileSurface();

  // When previewing a constrained viewport, scale the device frame down
  // so it always fits inside the actual browser window (no scroll, no clip).
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (!constrained || dim.w == null || dim.h == null) {
      setScale(1);
      return;
    }
    const compute = () => {
      const padX = 64;
      const padY = 96; // leave room for the toggle button at top
      const sx = (window.innerWidth - padX) / dim.w!;
      const sy = (window.innerHeight - padY) / dim.h!;
      setScale(Math.min(1, sx, sy));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [constrained, dim.w, dim.h]);
  // Mode drives surface — same for anon and logged-in. BC populates with
  // DEMO contacts when no real tenant data is loaded.
  const showBusiness = mode === "business";
  if (!mounted) {
    return (
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "hsl(var(--background))",
        }}
      />
    );
  }
  return (
    <>
      <ViewportToggle />
      {/* Backdrop shown when constrained — makes the preview frame obvious */}
      {constrained && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            background:
              "repeating-linear-gradient(45deg, #0B0B0F 0 12px, #1A1A1F 12px 24px)",
            pointerEvents: "none",
          }}
        />
      )}
      <div
        data-os-root
        className="absolute overflow-hidden"
        style={
          constrained
            ? {
                width: dim.w!,
                height: dim.h!,
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) scale(${scale})`,
                transformOrigin: "center center",
                background: "hsl(var(--background))",
                color: "hsl(var(--ink))",
                borderRadius: 36,
                boxShadow:
                  "0 30px 80px -20px rgba(0,0,0,0.55), 0 0 0 6px rgba(0,0,0,0.92), 0 0 0 7px rgba(255,255,255,0.10)",
                zIndex: 9999,
                overflow: "hidden",
              }
            : {
                inset: 0,
                background: "hsl(var(--background))",
                color: "hsl(var(--ink))",
              }
        }
      >
        {isMobile ? (
          <MobileShell>
            {windows.map((w) => (
              <WindowFrame key={w.id} win={w} />
            ))}
            <WelcomeBanner />
          </MobileShell>
        ) : (
          <>
            <AppOpener />
            <MelliBar />
            <ModeToggle />
            {showBusiness ? <BusinessCenter /> : <Desktop />}
            {windows.map((w) => (
              <WindowFrame key={w.id} win={w} />
            ))}
            <WelcomeBanner />
            <WindowList />
            <SignInTab />
            <JourneyTab />
            <Taskbar />
          </>
        )}
      </div>
    </>
  );
}
