'use client';

export default function BannerLeaderboard() {
  return (
    <div
      style={{
        width: 728,
        height: 90,
        background: '#09090b',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        border: '1px solid #27272a',
        cursor: 'pointer',
      }}
    >
      {/* Animated background line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 2,
          background: 'linear-gradient(90deg, transparent 0%, #E11D2E 50%, transparent 100%)',
          animation: 'leaderboardSweep 3s ease-in-out infinite',
        }}
      />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #E11D2E, #991b1b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          M
        </div>
        <span style={{ color: '#fafafa', fontWeight: 700, fontSize: 18, letterSpacing: -0.5 }}>
          Memelli
        </span>
      </div>

      {/* Sliding text */}
      <div style={{ overflow: 'hidden', flex: 1, margin: '0 24px', height: 28 }}>
        <div
          style={{
            animation: 'leaderboardSlide 8s ease-in-out infinite',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span style={{ color: '#fafafa', fontSize: 16, fontWeight: 600, lineHeight: '28px', whiteSpace: 'nowrap' }}>
            Built by AI. Deployed in Minutes.
          </span>
          <span style={{ color: '#a1a1aa', fontSize: 16, fontWeight: 500, lineHeight: '28px', whiteSpace: 'nowrap' }}>
            Your entire business — one platform.
          </span>
          <span style={{ color: '#E11D2E', fontSize: 16, fontWeight: 600, lineHeight: '28px', whiteSpace: 'nowrap' }}>
            262 pages. $20. One hour.
          </span>
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          background: '#E11D2E',
          color: '#fff',
          padding: '8px 20px',
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.8,
          flexShrink: 0,
          animation: 'leaderboardPulse 2s ease-in-out infinite',
        }}
      >
        Get Started
      </div>

      {/* Bottom line */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 2,
          background: 'linear-gradient(90deg, transparent 0%, #E11D2E 50%, transparent 100%)',
          animation: 'leaderboardSweep 3s ease-in-out infinite',
          animationDelay: '1.5s',
        }}
      />

      <style>{`
        @keyframes leaderboardSweep {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        @keyframes leaderboardSlide {
          0%, 25% { transform: translateY(0); }
          33%, 58% { transform: translateY(-28px); }
          66%, 91% { transform: translateY(-56px); }
          100% { transform: translateY(0); }
        }
        @keyframes leaderboardPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; box-shadow: 0 0 12px rgba(225,29,46,0.4); }
        }
      `}</style>
    </div>
  );
}
