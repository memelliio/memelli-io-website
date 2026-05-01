"use client";

import { useState } from "react";

const KEYS: Array<{ label: string; act: () => void; tone?: "primary" | "op" }> = [];

export function Calculator() {
  const [expr, setExpr] = useState("");
  const [res, setRes] = useState("0");

  const press = (s: string) => setExpr((e) => (e + s).slice(0, 24));
  const clear = () => {
    setExpr("");
    setRes("0");
  };
  const eq = () => {
    try {
      // eslint-disable-next-line no-new-func
      const v = Function(`"use strict"; return (${expr.replace(/×/g, "*").replace(/÷/g, "/")})`)();
      setRes(String(v));
    } catch {
      setRes("Error");
    }
  };

  const rows: Array<Array<{ k: string; tone?: "op" | "primary" | "muted" }>> = [
    [{ k: "C", tone: "muted" }, { k: "(", tone: "muted" }, { k: ")", tone: "muted" }, { k: "÷", tone: "op" }],
    [{ k: "7" }, { k: "8" }, { k: "9" }, { k: "×", tone: "op" }],
    [{ k: "4" }, { k: "5" }, { k: "6" }, { k: "-", tone: "op" }],
    [{ k: "1" }, { k: "2" }, { k: "3" }, { k: "+", tone: "op" }],
    [{ k: "0" }, { k: "." }, { k: "%" }, { k: "=", tone: "primary" }],
  ];
  return (
    <div className="h-full flex flex-col p-3 gap-3 bg-muted/30">
      <div
        className="memelli-card p-4 flex flex-col items-end justify-end h-28"
        style={{ background: "white" }}
      >
        <div className="text-xs text-ink/50 truncate w-full text-right">{expr || " "}</div>
        <div className="text-3xl font-semibold text-ink truncate w-full text-right">
          {res}
        </div>
      </div>
      <div className="flex-1 grid grid-rows-5 gap-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-4 gap-2">
            {row.map((b) => (
              <button
                key={b.k}
                type="button"
                onClick={() =>
                  b.k === "C"
                    ? clear()
                    : b.k === "="
                      ? eq()
                      : press(b.k)
                }
                className={`rounded-lg text-base font-medium transition ${
                  b.tone === "primary"
                    ? "text-white"
                    : b.tone === "op"
                      ? "bg-white text-[hsl(var(--primary))] border"
                      : b.tone === "muted"
                        ? "bg-white/70 text-ink/70"
                        : "bg-white text-ink"
                }`}
                style={{
                  background:
                    b.tone === "primary" ? "hsl(var(--primary))" : undefined,
                  borderColor:
                    b.tone === "op" ? "hsl(var(--line))" : undefined,
                  boxShadow: "0 1px 2px rgba(15,17,21,0.05)",
                }}
              >
                {b.k}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
