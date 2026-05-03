'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useAnimationFrame, useMotionTemplate, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils';

interface MovingBorderProps {
  children: ReactNode;
  duration?: number;
  borderRadius?: string;
  borderWidth?: number;
  colors?: string[];
  className?: string;
  containerClassName?: string;
  as?: React.ComponentType<any> | string;
}

export function MovingBorder({
  children,
  duration = 3000,
  borderRadius = '1rem',
  borderWidth = 2,
  colors = ['#E50914', '#FF1F2D', '#B20710', '#FF4444'],
  className,
  containerClassName,
  as: Component = 'div' as React.ComponentType<any> | string,
}: MovingBorderProps) {
  const Wrapper = Component as any;
  return (
    <Wrapper
      className={cn(
        'relative overflow-hidden p-[2px] bg-transparent',
        containerClassName
      )}
      style={{ borderRadius }}
    >
      <div
        className="absolute inset-0"
        style={{ borderRadius }}
      >
        <MovingBorderSVG duration={duration} colors={colors} rx={borderRadius} ry={borderRadius} />
      </div>
      <div
        className={cn(
          'relative z-10 backdrop-blur-xl',
          className
        )}
        style={{ borderRadius: `calc(${borderRadius} - ${borderWidth}px)` }}
      >
        {children}
      </div>
    </Wrapper>
  );
}

function MovingBorderSVG({
  duration = 3000,
  colors,
  rx = '1rem',
  ry = '1rem',
}: {
  duration?: number;
  colors: string[];
  rx?: string;
  ry?: string;
}) {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMs = length / duration;
      progress.set((time * pxPerMs) % length);
    }
  });

  const x = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).x ?? 0);
  const y = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).y ?? 0);

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className="absolute h-full w-full"
      width="100%"
      height="100%"
    >
      <rect
        fill="none"
        width="100%"
        height="100%"
        rx={rx}
        ry={ry}
        ref={pathRef as any}
      />
      <motion.foreignObject
        width={80}
        height={80}
        x={0}
        y={0}
        style={{ transform, overflow: 'visible' }}
      >
        <div
          className="h-20 w-20 rounded-full opacity-[0.8] blur-[12px]"
          style={{
            background: `radial-gradient(${colors[0]} 40%, ${colors[1] || colors[0]} 60%, transparent 80%)`,
          }}
        />
      </motion.foreignObject>
    </svg>
  );
}
