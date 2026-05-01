'use client';

import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface MeteorsProps {
  number?: number;
  className?: string;
}

export function Meteors({ number = 15, className }: MeteorsProps) {
  const [styles, setStyles] = useState<React.CSSProperties[]>([]);

  useEffect(() => {
    const s = Array.from({ length: number }, () => ({
      top: '-5%',
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${Math.random() * 8 + 3}s`,
    }));
    setStyles(s);
  }, [number]);

  return (
    <>
      {styles.map((style, i) => (
        <span
          key={i}
          style={style}
          className={cn(
            'pointer-events-none absolute h-0.5 w-0.5 rotate-[215deg] animate-meteor rounded-full bg-red-400/60 shadow-[0_0_0_1px_rgba(229,9,20,0.1)]',
            className
          )}
        >
          <div className="pointer-events-none absolute top-1/2 -z-10 h-px w-12 -translate-y-1/2 bg-gradient-to-r from-red-400/40 to-transparent" />
        </span>
      ))}
    </>
  );
}
