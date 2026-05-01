"use client";

import { useEffect, useState } from "react";

export function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const date = now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return (
    <div className="h-full grid place-items-center bg-card">
      <div className="text-center">
        <div
          className="text-7xl font-semibold tracking-tight tabular-nums text-ink"
          style={{ fontFamily: "inherit" }}
        >
          {time}
        </div>
        <div className="mt-2 text-sm text-ink/60 uppercase tracking-[0.18em]">
          {date}
        </div>
      </div>
    </div>
  );
}
