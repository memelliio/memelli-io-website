'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatFn?: (n: number) => string;
}

export function AnimatedNumber({
  value,
  duration = 1.5,
  delay = 0,
  className,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatFn,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [displayed, setDisplayed] = useState('0');

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const rounded = useTransform(spring, (latest) => {
    if (formatFn) return formatFn(latest);
    if (decimals > 0) return latest.toFixed(decimals);
    return Math.round(latest).toLocaleString();
  });

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => setDisplayed(v));
    return unsubscribe;
  }, [rounded]);

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => spring.set(value), delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, value, spring, delay]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
    >
      {prefix}{displayed}{suffix}
    </motion.span>
  );
}
