'use client';

// NEUTRALIZED 2026-04-29 — Wavespeed-driven panel dead.
// Replacement surface: UGC Factory at /app/ugc.
// Memelli media-gen now routes through the UGC Factory team using Alibaba DashScope
// (CosyVoice, Sambert, Wanx, Wanx-I2V, Qwen-VL, Paraformer) + Groq + ffmpeg + R2.
// Authority: .agent-sync/TEAM_SPEC_UGC_FACTORY.md
// Anti-pattern law (CLAUDE.md): comment out, do not delete.
//
// Note: this module is consumed via both default import and named import (e.g.
// apps/web/src/app/(public)/page.tsx uses `m.SpeedLanesPanel` via next/dynamic),
// so both export shapes are preserved.

export function SpeedLanesPanel() {
  return (
    <div className="p-6 text-sm text-neutral-700 bg-white border border-neutral-200 rounded-lg">
      <div className="text-base font-semibold text-neutral-900 mb-2">SpeedLanes — moved</div>
      <p className="mb-2">
        This surface has been retired. Memelli media generation now routes through the
        UGC Factory team using Alibaba DashScope (CosyVoice, Sambert, Wanx, Wanx-I2V,
        Qwen-VL, Paraformer) plus Groq, ffmpeg, and R2.
      </p>
      <p>
        <a href="/app/ugc" className="text-red-700 underline">
          Open UGC Factory
        </a>
      </p>
    </div>
  );
}

export default SpeedLanesPanel;
