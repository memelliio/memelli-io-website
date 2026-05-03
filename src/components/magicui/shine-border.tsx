'use client';

import { cn } from '../../lib/utils';

interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  borderWidth?: number;
  duration?: number;
  shineColor?: string | string[];
}

export function ShineBorder({
  borderWidth = 1,
  duration = 14,
  shineColor = ['#E50914', '#FF1F2D', '#B20710'],
  className,
  style,
  ...props
}: ShineBorderProps) {
  return (
    <div
      style={{
        backgroundImage: `radial-gradient(transparent, transparent, ${
          Array.isArray(shineColor) ? shineColor.join(',') : shineColor
        }, transparent, transparent)`,
        backgroundSize: '300% 300%',
        animation: `shine ${duration}s linear infinite`,
        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        padding: `${borderWidth}px`,
        ...style,
      }}
      className={cn(
        'pointer-events-none absolute inset-0 size-full rounded-[inherit] will-change-[background-position]',
        className
      )}
      {...props}
    />
  );
}
