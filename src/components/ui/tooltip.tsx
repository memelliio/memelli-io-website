'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const positionClasses: Record<NonNullable<TooltipProps['position']>, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowClasses: Record<NonNullable<TooltipProps['position']>, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-zinc-700 border-x-transparent border-b-transparent border-4',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-zinc-700 border-x-transparent border-t-transparent border-4',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-zinc-700 border-y-transparent border-r-transparent border-4',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-zinc-700 border-y-transparent border-l-transparent border-4',
};

const motionVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            role="tooltip"
            className={cn(
              'absolute z-50 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200 shadow-lg',
              positionClasses[position]
            )}
            variants={motionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.12 }}
          >
            {content}
            <span className={cn('absolute border', arrowClasses[position])} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
