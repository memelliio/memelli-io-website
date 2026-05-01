'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';

export default function FinalCtaSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden py-32"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[hsl(var(--background))]" />

      {/* Radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent" />

      {/* Large blurred red circle */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-red-600/15 blur-[120px]" />

      {/* Animated grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(225,29,46,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(225,29,46,.4) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-4 text-sm font-medium tracking-wide text-red-400"
        >
          Ready to start?
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="text-5xl font-bold text-white"
        >
          Check Your Funding Readiness
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="mx-auto mt-6 max-w-2xl text-xl text-[hsl(var(--muted-foreground))]"
        >
          Start with a free prequalification. See what you qualify for. Then
          unlock the full Memelli Command Center to build, operate, and scale real
          businesses.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/register"
            className="relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-red-500/25 transition-all hover:shadow-xl hover:shadow-red-500/30 hover:brightness-110"
          >
            Check Funding Readiness
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-[hsl(var(--border))] px-8 py-4 text-lg font-semibold text-white transition-all hover:border-[hsl(var(--border))] hover:bg-white/5"
          >
            Explore Memelli OS
          </Link>
        </motion.div>

        {/* Trust text */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
          className="mt-10 text-sm text-[hsl(var(--muted-foreground))]"
        >
          Free forever &bull; No credit card required &bull; AI-powered analysis
          &bull; Results in minutes
        </motion.p>
      </div>
    </section>
  );
}
