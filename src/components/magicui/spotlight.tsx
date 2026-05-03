'use client';

import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

interface SpotlightProps {
  className?: string;
  size?: number;
  color?: string;
  intensity?: number;
}

export function Spotlight({
  className,
  size = 400,
  color = 'rgba(229, 9, 20, 0.08)',
  intensity = 1,
}: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const parent = el.parentElement;
    if (!parent) return;
    parent.style.position = 'relative';
    parent.style.overflow = 'hidden';

    const handleMouseMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.opacity = String(intensity);
    };

    const handleMouseLeave = () => {
      el.style.opacity = '0';
    };

    parent.addEventListener('mousemove', handleMouseMove);
    parent.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      parent.removeEventListener('mousemove', handleMouseMove);
      parent.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [intensity]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-300',
        className
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      }}
    />
  );
}
