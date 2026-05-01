"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * ImpersonationBanner — Persistent top ribbon
 *
 * Shows when an internal user has an active impersonation session.
 * Displays tenant name, domain, role context, countdown timer,
 * and an exit button. Fixed at the very top of the screen.
 */

interface ImpersonationData {
  impersonationId: string;
  adminUserId: string;
  adminRole: string;
  targetTenantId: string;
  targetTenantName: string;
  targetDomain?: string;
  reason: string;
  startedAt: string;
  expiresAt: string;
  remainingMs: number;
  remainingMinutes: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("memelli_token");
}

export default function ImpersonationBanner() {
  const [impersonation, setImpersonation] = useState<ImpersonationData | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [exiting, setExiting] = useState(false);

  // Poll for impersonation status
  const checkImpersonation = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/sessions/impersonation`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setImpersonation(null);
        return;
      }

      const json = await res.json();
      if (json.success && json.data) {
        setImpersonation(json.data);
        setRemainingMs(json.data.remainingMs || 0);
      } else {
        setImpersonation(null);
      }
    } catch {
      // Silently fail — banner just hides
    }
  }, []);

  useEffect(() => {
    checkImpersonation();
    const interval = setInterval(checkImpersonation, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [checkImpersonation]);

  // Countdown timer
  useEffect(() => {
    if (!impersonation || remainingMs <= 0) return;

    const interval = setInterval(() => {
      setRemainingMs((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(interval);
          setImpersonation(null);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [impersonation]);

  const handleExit = async () => {
    setExiting(true);
    const token = getToken();
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/admin/sessions/impersonate`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Best effort
    }

    setImpersonation(null);
    setExiting(false);

    // Redirect to internal shell
    window.location.href = "/admin";
  };

  if (!impersonation) return null;

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isExpiringSoon = remainingMs < 600000; // < 10 minutes

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-between gap-4 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 px-4 py-2 text-sm font-medium text-gray-900 shadow-lg">
      <div className="flex items-center gap-3">
        {/* Warning icon */}
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/20">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>

        <span className="font-bold uppercase tracking-wide">Impersonating Tenant:</span>
        <span className="rounded bg-gray-900/20 px-2 py-0.5 font-semibold">
          {impersonation.targetTenantName}
        </span>

        {impersonation.targetDomain && (
          <>
            <span className="text-gray-800">|</span>
            <span className="text-xs">DOMAIN VIEW:</span>
            <span className="font-mono text-xs">{impersonation.targetDomain}</span>
          </>
        )}

        <span className="text-gray-800">|</span>
        <span className="text-xs">ADMIN ROLE:</span>
        <span className="text-xs font-semibold">{impersonation.adminRole}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Timer */}
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
            isExpiringSoon
              ? "animate-pulse bg-red-700 text-white"
              : "bg-gray-900/20 text-gray-900"
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {timeDisplay}
        </div>

        {/* Exit button */}
        <button
          onClick={handleExit}
          disabled={exiting}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-amber-400 shadow-sm transition-all hover:bg-gray-800 hover:text-amber-300 disabled:opacity-50"
        >
          {exiting ? "Exiting..." : "Exit Impersonation"}
        </button>
      </div>
    </div>
  );
}
