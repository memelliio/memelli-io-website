'use client';

import { useState, useEffect } from 'react';

export default function BannerLargeRect() {
  const [pages, setPages] = useState(0);
  const [price, setPrice] = useState(0);
  const [hours, setHours] = useState(0);

  useEffect(() => {
    const targetPages = 262;
    const targetPrice = 20;
    const targetHours = 1;
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setPages(Math.round(eased * targetPages));
      setPrice(Math.round(eased * targetPrice));
      setHours(progress >= 0.5 ? targetHours : 0);
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        width: 336,
        height: 280,
        background: '#09090b',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        border: '1px solid #27272a',
        cursor: 'pointer',
      }}
    >
      {/* Animated background glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(225,29,46,0.08) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          animation: 'lgRectGlow 4s ease-in-out infinite',
        }}
      />

      {/* Heading */}
      <div style={{ color: '#fafafa', fontSize: 16, fontWeight: 700, zIndex: 1, textAlign: 'center', lineHeight: 1.3 }}>
        Your Entire Business
        <br />
        <span style={{ color: '#E11D2E' }}>Built by AI</span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 20, zIndex: 1 }}>
        {[
          { value: pages, label: 'Pages', suffix: '' },
          { value: price, label: 'Cost', suffix: '$', prefix: true },
          { value: hours, label: 'Hour', suffix: '' },
        ].map((stat, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div
              style={{
                color: '#E11D2E',
                fontSize: 28,
                fontWeight: 800,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {stat.prefix ? '$' : ''}{stat.value}
            </div>
            <div style={{ color: '#71717a', fontSize: 11, marginTop: 4, fontWeight: 500 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ width: 60, height: 1, background: '#27272a', zIndex: 1 }} />

      {/* Tagline */}
      <div style={{ color: '#a1a1aa', fontSize: 12, zIndex: 1, textAlign: 'center' }}>
        Website + CRM + Commerce + AI
      </div>

      {/* CTA */}
      <div
        style={{
          background: '#E11D2E',
          color: '#fff',
          padding: '10px 36px',
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 0.5,
          zIndex: 1,
          animation: 'lgRectCta 2.5s ease-in-out infinite',
        }}
      >
        Launch Now
      </div>

      {/* Corner accents */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 3, background: '#E11D2E' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: 24, background: '#E11D2E' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 3, background: '#E11D2E' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 3, height: 24, background: '#E11D2E' }} />

      <style>{`
        @keyframes lgRectGlow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
        }
        @keyframes lgRectCta {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(225,29,46,0); }
          50% { transform: scale(1.04); box-shadow: 0 4px 20px rgba(225,29,46,0.3); }
        }
      `}</style>
    </div>
  );
}
