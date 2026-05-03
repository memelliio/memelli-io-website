'use client';

import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

interface BackgroundBeamsProps {
  className?: string;
  beamCount?: number;
  color?: string;
}

export function BackgroundBeams({
  className,
  beamCount = 6,
  color = '#E50914',
}: BackgroundBeamsProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const beams = Array.from({ length: beamCount }, (_, i) => {
    const startX = (i / beamCount) * 100;
    const controlX = startX + (Math.random() * 40 - 20);
    const endX = startX + (Math.random() * 30 - 15);
    return {
      id: i,
      d: `M${startX} 0 Q${controlX} 50 ${endX} 100`,
      delay: i * 0.4,
      duration: 3 + Math.random() * 2,
      opacity: 0.03 + Math.random() * 0.06,
      width: 1 + Math.random() * 1.5,
    };
  });

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          {beams.map((beam) => (
            <linearGradient
              key={`grad-${beam.id}`}
              id={`beam-gradient-${beam.id}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={color} stopOpacity="0" />
              <stop offset="40%" stopColor={color} stopOpacity={beam.opacity} />
              <stop offset="60%" stopColor={color} stopOpacity={beam.opacity * 1.5} />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {beams.map((beam) => (
          <path
            key={beam.id}
            d={beam.d}
            stroke={`url(#beam-gradient-${beam.id})`}
            strokeWidth={beam.width}
            strokeLinecap="round"
          >
            <animate
              attributeName="stroke-opacity"
              values={`0;${beam.opacity};${beam.opacity * 2};${beam.opacity};0`}
              dur={`${beam.duration}s`}
              begin={`${beam.delay}s`}
              repeatCount="indefinite"
            />
          </path>
        ))}
      </svg>
    </div>
  );
}
