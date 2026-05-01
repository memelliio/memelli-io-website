'use client';

/**
 * MelliSphereOrb — floating visual orb in the dashboard.
 * Voice is handled by GlobalMemelliOrb (app/layout.tsx).
 * This component provides the floating button trigger only.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function MelliSphereOrb() {
  const [open, setOpen] = useState(false);

  const handleTrigger = useCallback(() => {
    // Delegate to the global orb
    const fn = (window as any).__memelliOrb?.open ?? (window as any).__memelliOnboard;
    if (fn) {
      fn();
    } else {
      setOpen(!open);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {!open && (
        <motion.button
          key="trigger"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={handleTrigger}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full shadow-2xl"
          style={{
            width: 56,
            height: 56,
            background: 'radial-gradient(circle at 40% 35%, #ef4444, #7f1d1d)',
            boxShadow: '0 0 24px rgba(220,38,38,0.6), 0 4px 20px rgba(0,0,0,0.6)',
          }}
          title="Talk to Melli"
        >
          <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center">
            <div className="relative w-10 h-10 rounded-full"
              style={{ background: 'radial-gradient(circle at 38% 32%, #fca5a5, #ef4444 40%, #991b1b)' }} />
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
