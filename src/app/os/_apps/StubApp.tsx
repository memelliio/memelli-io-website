"use client";

import { ExternalLink } from "lucide-react";

export function StubApp({ title, blurb, ctaHref, ctaLabel }: { title: string; blurb: string; ctaHref?: string; ctaLabel?: string }) {
  return (
    <div className="h-full grid place-items-center p-8">
      <div className="memelli-card p-8 max-w-md text-center">
        <div className="text-base font-semibold text-ink mb-1">{title}</div>
        <div className="text-sm text-ink/65 mb-5">{blurb}</div>
        {ctaHref && (
          <a
            href={ctaHref}
            target="_blank"
            rel="noreferrer"
            className="memelli-pill memelli-pill-active inline-flex items-center gap-1.5"
          >
            {ctaLabel || "Open"} <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
