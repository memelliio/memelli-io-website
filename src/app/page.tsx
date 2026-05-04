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
import { ChromeNode } from "./_components/ChromeNode";
import { useWindowStore } from "./_lib/window-store";
import { useOsMode } from "./_lib/os-mode-store";

export default function OsPage() {
  const windows = useWindowStore((s) => s.windows);
  const mode = useOsMode((s) => s.mode);
  const showBusiness = mode === "business";

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 900px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener("change", handler);
    return () => {
      mql.removeEventListener("change", handler);
    };
  }, []);

  return (
    <div
      data-os-root
      className="absolute inset-0 overflow-hidden"
      style={{
        background: "hsl(var(--background))",
        color: "hsl(var(--ink))",
      }}
    >
      <AppOpener />
      <MelliBar />
      {!isMobile && <ModeToggle />}
      {showBusiness ? <BusinessCenter /> : <Desktop />}
      {windows.map((w) => (
        <WindowFrame key={w.id} win={w} />
      ))}
      <WelcomeBanner />
      <WindowList />
      <SignInTab />
      <JourneyTab />
      <Taskbar />
      <ChromeNode nodeName="os-shell-mobiletoppanel" viewport="mobile" mountTo="body" />
      <ChromeNode nodeName="os-shell-mobiledock" viewport="mobile" mountTo="body" />
    </div>
  );
}