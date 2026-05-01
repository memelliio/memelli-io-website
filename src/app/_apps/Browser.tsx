"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, RefreshCw, Lock } from "lucide-react";

export function Browser() {
  const [url, setUrl] = useState("https://www.memelli.io");
  const [src, setSrc] = useState("https://www.memelli.io");
  const [tick, setTick] = useState(0);
  return (
    <div className="h-full flex flex-col">
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 border-b bg-muted/40"
        style={{ borderColor: "hsl(var(--line))" }}
      >
        <button className="w-7 h-7 grid place-items-center rounded hover:bg-white text-ink/70">
          <ArrowLeft size={14} />
        </button>
        <button className="w-7 h-7 grid place-items-center rounded hover:bg-white text-ink/70">
          <ArrowRight size={14} />
        </button>
        <button
          className="w-7 h-7 grid place-items-center rounded hover:bg-white text-ink/70"
          onClick={() => setTick((t) => t + 1)}
        >
          <RefreshCw size={13} />
        </button>
        <form
          className="flex-1 flex items-center gap-2 px-3 h-8 rounded-full bg-white border"
          style={{ borderColor: "hsl(var(--line))" }}
          onSubmit={(e) => {
            e.preventDefault();
            const next = url.startsWith("http") ? url : `https://${url}`;
            setSrc(next);
            setTick((t) => t + 1);
          }}
        >
          <Lock size={12} className="text-ink/50" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-transparent text-sm text-ink focus:outline-none"
          />
        </form>
      </div>
      <iframe
        key={tick}
        src={src}
        title="Browser"
        className="flex-1 w-full border-0 bg-white"
      />
    </div>
  );
}
