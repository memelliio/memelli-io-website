'use client';

// NEUTRALIZED 2026-04-29 — Wavespeed-driven AI models browser dead.
// Replacement: UGC Factory exposes the canonical Alibaba DashScope model set.
// Authority: .agent-sync/TEAM_SPEC_UGC_FACTORY.md
// Anti-pattern law (CLAUDE.md): comment out, do not delete.

export default function AIModelsPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-700 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold text-neutral-900 mb-3">
          AI Models — moved
        </h1>
        <p className="mb-3">
          The Wavespeed-driven AI Models browser has been retired.
        </p>
        <p className="mb-3">
          Memelli media-gen now routes through the UGC Factory team using
          Alibaba DashScope (CosyVoice, Sambert, Wanx, Wanx-I2V, Qwen-VL,
          Paraformer) plus Groq, ffmpeg, and R2. All callers must go through
          the UGC Factory pipeline rather than calling vendors directly.
        </p>
        <p>
          <a href="/app/ugc" className="text-red-700 underline">
            Open UGC Factory
          </a>
        </p>
      </div>
    </div>
  );
}
