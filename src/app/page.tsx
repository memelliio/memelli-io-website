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
import { MobileShell } from "./_components/mobile/MobileShell";
import { useWindowStore } from "./_lib/window-store";
import { useOsMode } from "./_lib/os-mode-store";
import { useSessionContextPublisher } from "./_lib/session-context-publisher";

export default function OsPage() {
  useSessionContextPublisher();
  const windows = useWindowStore((s) => s.windows);
  const mode = useOsMode((s) => s.mode);
  const showBusiness = mode === "business";
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 599px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (isMobile) {
    return <MobileShell />;
  }

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
    </div>
  );
}
