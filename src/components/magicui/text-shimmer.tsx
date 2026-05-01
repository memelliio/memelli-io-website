'use client';

import { cn } from '../../lib/utils';

interface TextShimmerProps {
  children: string;
  className?: string;
  duration?: number;
  spread?: number;
}

export function TextShimmer({
  children,
  className,
  duration = 2.5,
  spread = 2,
}: TextShimmerProps) {
  return (
    <span
      className={cn(
        'inline-block bg-clip-text text-transparent',
        className
      )}
      style={{
        backgroundImage: `linear-gradient(
          110deg,
          rgba(255,255,255,0.4) 0%,
          rgba(255,255,255,0.4) 40%,
          rgba(229,9,20,1) 50%,
          rgba(255,255,255,0.4) 60%,
          rgba(255,255,255,0.4) 100%
        )`,
        backgroundSize: `${spread * 100}% 100%`,
        animation: `text-shimmer ${duration}s ease-in-out infinite`,
      }}
    >
      {children}
    </span>
  );
}
