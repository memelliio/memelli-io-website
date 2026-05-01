"use client";

import { MelliBar } from "./_components/MelliBar";
import { Taskbar } from "./_components/Taskbar";
import { Desktop } from "./_components/Desktop";
import { WindowFrame } from "./_components/WindowFrame";
import { WelcomeBanner } from "./_components/WelcomeBanner";
import { WindowList } from "./_components/WindowList";
import { AppOpener } from "./_components/AppOpener";
import { ModeToggle } from "./_components/ModeToggle";
import { JourneyTab } from "./_components/JourneyTab";
import { AuthTab } from "./_components/AuthTab";
import { BusinessCenter } from "./_components/BusinessCenter";
import { useWindowStore } from "./_lib/window-store";
import { useOsMode } from "./_lib/os-mode-store";

export default function OsPage() {
  const windows = useWindowStore((s) => s.windows);
  const mode = useOsMode((s) => s.mode);
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
      {mode === "business" ? <BusinessCenter /> : <Desktop />}
      {windows.map((w) => (
        <WindowFrame key={w.id} win={w} />
      ))}
      <WelcomeBanner />
      <WindowList />
      <AuthTab />
      <JourneyTab />
      <Taskbar />
    </div>
  );
}
