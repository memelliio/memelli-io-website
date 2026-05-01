'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

/**
 * PageTransition — wraps children with a smooth fade transition
 * on Next.js route changes. No blank white screens.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionKey, setTransitionKey] = useState(pathname);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // When pathname changes, update the key to trigger animation
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setTransitionKey(pathname);
      setDisplayChildren(children);
    } else {
      // Same path, just update children content
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{
          duration: 0.2,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="min-h-0 flex-1"
      >
        {displayChildren}
      </motion.div>
    </AnimatePresence>
  );
}
