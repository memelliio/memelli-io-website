"use client";

import { MemelliTerminal } from "../_apps/MemelliTerminal";

export default function MemelliTerminalPage() {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0F1115" }}>
      <MemelliTerminal />
    </div>
  );
}
