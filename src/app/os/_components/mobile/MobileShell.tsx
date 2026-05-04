"use client";

import { type ReactNode } from "react";
import { MobileHomeScreen } from "./MobileHomeScreen";
import { MobileDock } from "./MobileDock";
import { MobileTopPanel } from "./MobileTopPanel";

const PAPER = "#FFFFFF";
const INK = "#0B0B0F";

export function MobileShell({ children }: { children?: ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(180deg, #FAFAFA 0%, #F2F3F5 100%)",
        color: INK,
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <MobileTopPanel />
      <MobileHomeScreen />
      <MobileDock />
      {children}
    </div>
  );
}

export const MOBILE_BG_PAPER = PAPER;
