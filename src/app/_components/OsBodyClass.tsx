"use client";

import { useEffect } from "react";

export function OsBodyClass() {
  useEffect(() => {
    document.body.classList.add("os-active");
    document.documentElement.classList.add("os-active");
    return () => {
      document.body.classList.remove("os-active");
      document.documentElement.classList.remove("os-active");
    };
  }, []);
  return null;
}
