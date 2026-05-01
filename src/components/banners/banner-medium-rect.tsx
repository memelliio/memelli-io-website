'use client';

export default function BannerMediumRect() {
  return (
    <div
      style={{
        width: 300,
        height: 250,
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
      {/* Agent dots background */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: i % 3 === 0 ? '#E11D2E' : '#3f3f46',
            top: `${15 + (i % 4) * 22}%`,
            left: `${8 + (i % 5) * 20}%`,
            animation: `medRectDot 3s ease-in-out infinite`,
            animationDelay: `${i * 0.25}s`,
            opacity: 0.6,
          }}
        />
      ))}

      {/* Logo */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #E11D2E, #991b1b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          fontSize: 26,
          zIndex: 1,
          animation: 'medRectLogo 4s ease-in-out infinite',
        }}
      >
        M
      </div>

      {/* Brand */}
      <div style={{ zIndex: 1, textAlign: 'center' }}>
        <div style={{ color: '#fafafa', fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
          Memelli OS
        </div>
        <div style={{ color: '#a1a1aa', fontSize: 13, marginTop: 4, lineHeight: 1.4 }}>
          AI-powered business platform
          <br />
          for everything you need
        </div>
      </div>

      {/* Agent connection lines */}
      <svg
        width="200"
        height="30"
        viewBox="0 0 200 30"
        style={{ position: 'absolute', bottom: 70, zIndex: 0, opacity: 0.3 }}
      >
        <line x1="20" y1="15" x2="180" y2="15" stroke="#E11D2E" strokeWidth="0.5" strokeDasharray="4 4">
          <animate attributeName="stroke-dashoffset" values="0;-8" dur="1s" repeatCount="indefinite" />
        </line>
        <line x1="40" y1="5" x2="160" y2="25" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="4 4">
          <animate attributeName="stroke-dashoffset" values="0;-8" dur="1.5s" repeatCount="indefinite" />
        </line>
      </svg>

      {/* CTA */}
      <div
        style={{
          background: '#E11D2E',
          color: '#fff',
          padding: '10px 32px',
          borderRadius: 4,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 0.5,
          zIndex: 1,
          animation: 'medRectCta 2s ease-in-out infinite',
        }}
      >
        Start Building
      </div>

      {/* Corner accents */}
      <div style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderTop: '2px solid #E11D2E', borderRight: '2px solid #E11D2E', opacity: 0.4 }} />
      <div style={{ position: 'absolute', bottom: 8, left: 8, width: 16, height: 16, borderBottom: '2px solid #E11D2E', borderLeft: '2px solid #E11D2E', opacity: 0.4 }} />

      <style>{`
        @keyframes medRectDot {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.8); opacity: 0.8; }
        }
        @keyframes medRectLogo {
          0%, 100% { box-shadow: 0 0 0 0 rgba(225,29,46,0.3); }
          50% { box-shadow: 0 0 20px 8px rgba(225,29,46,0.15); }
        }
        @keyframes medRectCta {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); box-shadow: 0 0 16px rgba(225,29,46,0.3); }
        }
      `}</style>
    </div>
  );
}
