"use client";

import { useEffect, useState } from "react";

export function Notes({ windowId }: { windowId: string }) {
  const key = `memelli-os:notes:${windowId.split("-")[0]}`;
  const [text, setText] = useState("");
  useEffect(() => {
    try {
      const v = localStorage.getItem(key);
      if (v !== null) setText(v);
    } catch {}
  }, [key]);
  useEffect(() => {
    try {
      localStorage.setItem(key, text);
    } catch {}
  }, [key, text]);
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b text-xs text-ink/60 flex items-center justify-between"
           style={{ borderColor: "hsl(var(--line))" }}>
        <span>Untitled note</span>
        <span>{text.length} chars · autosaved</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write something…"
        className="flex-1 w-full p-5 bg-card text-ink text-[14px] leading-relaxed resize-none focus:outline-none"
        style={{ fontFamily: "inherit" }}
      />
    </div>
  );
}
