"use client";

import { useEffect, useRef, useState } from "react";

type Line = { kind: "in" | "out" | "err"; text: string };

const HELP = [
  "Available commands:",
  "  help           show this list",
  "  clear          clear screen",
  "  echo <text>    print text",
  "  date           current date/time",
  "  whoami         current user",
  "  open <app>     open an app (notes, files, settings, browser, …)",
  "  ls             list home directory",
];

const FAKE_FS = ["Documents", "Pictures", "Music", "Videos", "notes.txt"];

export function Terminal() {
  const [lines, setLines] = useState<Line[]>([
    { kind: "out", text: "Memelli OS — Terminal v0.1" },
    { kind: "out", text: 'Type "help" to get started.' },
  ]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [lines]);

  const run = (raw: string) => {
    const cmd = raw.trim();
    const next: Line[] = [...lines, { kind: "in", text: `$ ${cmd}` }];
    if (!cmd) {
      setLines(next);
      return;
    }
    const [head, ...rest] = cmd.split(" ");
    switch (head) {
      case "help":
        next.push(...HELP.map((l) => ({ kind: "out" as const, text: l })));
        break;
      case "clear":
        setLines([]);
        return;
      case "echo":
        next.push({ kind: "out", text: rest.join(" ") });
        break;
      case "date":
        next.push({ kind: "out", text: new Date().toString() });
        break;
      case "whoami":
        next.push({ kind: "out", text: "memelli" });
        break;
      case "ls":
        next.push({ kind: "out", text: FAKE_FS.join("  ") });
        break;
      case "open":
        next.push({
          kind: "out",
          text: `(double-click the ${rest[0] || "..."} icon on the desktop)`,
        });
        break;
      default:
        next.push({ kind: "err", text: `command not found: ${head}` });
    }
    setLines(next);
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: "#0F1115", color: "#E8EAF0" }}
      onClick={() => inputRef.current?.focus()}
    >
      <div
        ref={scrollerRef}
        className="flex-1 overflow-auto p-4 font-mono text-[12.5px] leading-relaxed"
      >
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              color:
                l.kind === "in"
                  ? "var(--brand-color, #C41E3A)"
                  : l.kind === "err"
                    ? "#F87171"
                    : "#E8EAF0",
            }}
          >
            {l.text}
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(input);
            setInput("");
          }}
          className="flex items-center gap-2 mt-1"
        >
          <span style={{ color: "var(--brand-color, #C41E3A)" }}>$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-0 focus:outline-none font-mono"
            autoComplete="off"
            spellCheck={false}
          />
        </form>
      </div>
    </div>
  );
}
