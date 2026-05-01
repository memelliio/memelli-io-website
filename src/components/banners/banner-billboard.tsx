'use client';

export default function BannerBillboard() {
  const features = ['AI Agents', 'Commerce', 'CRM'];

  return (
    <div
      style={{
        width: 970,
        height: 250,
        background: '#09090b',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        alignItems: 'center',
        padding: '0 48px',
        gap: 40,
        border: '1px solid #27272a',
        cursor: 'pointer',
      }}
    >
      {/* Animated grid background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(225,29,46,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(225,29,46,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'billboardGrid 20s linear infinite',
        }}
      />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: i % 2 === 0 ? '#E11D2E' : '#52525b',
            top: `${10 + (i * 11) % 80}%`,
            left: `${5 + (i * 13) % 90}%`,
            animation: `billboardFloat 6s ease-in-out infinite`,
            animationDelay: `${i * 0.7}s`,
            opacity: 0.5,
          }}
        />
      ))}

      {/* Left section: logo + branding */}
      <div style={{ zIndex: 1, flexShrink: 0 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #E11D2E, #991b1b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: 28,
            marginBottom: 12,
            animation: 'billboardLogo 5s ease-in-out infinite',
          }}
        >
          M
        </div>
        <div style={{ color: '#fafafa', fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>
          Memelli OS
        </div>
        <div style={{ color: '#71717a', fontSize: 12, marginTop: 2 }}>
          The AI Business Platform
        </div>
      </div>

      {/* Center section: tagline + features */}
      <div style={{ zIndex: 1, flex: 1 }}>
        <div style={{ color: '#fafafa', fontSize: 28, fontWeight: 800, lineHeight: 1.2, letterSpacing: -0.5 }}>
          One Platform.
          <br />
          <span style={{ color: '#E11D2E' }}>Infinite Possibility.</span>
        </div>
        <div style={{ color: '#a1a1aa', fontSize: 14, marginTop: 8 }}>
          262 pages built. Deployed in under an hour. Starting at $20.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                color: '#d4d4d8',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                animation: 'billboardPill 3s ease-in-out infinite',
                animationDelay: `${i * 0.3}s`,
              }}
            >
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right section: CTA */}
      <div style={{ zIndex: 1, flexShrink: 0, textAlign: 'center' }}>
        <div
          style={{
            background: '#E11D2E',
            color: '#fff',
            padding: '14px 36px',
            borderRadius: 6,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 0.5,
            animation: 'billboardCta 2.5s ease-in-out infinite',
            marginBottom: 8,
          }}
        >
          Get Started Free
        </div>
        <div style={{ color: '#52525b', fontSize: 11 }}>No credit card required</div>
      </div>

      {/* Top + bottom accent lines */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 3,
          background: 'linear-gradient(90deg, #E11D2E, transparent 30%, transparent 70%, #E11D2E)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, #E11D2E 50%, transparent)',
          animation: 'billboardBottomLine 4s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes billboardGrid {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        @keyframes billboardFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.5); }
        }
        @keyframes billboardLogo {
          0%, 100% { box-shadow: 0 0 0 0 rgba(225,29,46,0.2); }
          50% { box-shadow: 0 0 24px 8px rgba(225,29,46,0.12); }
        }
        @keyframes billboardPill {
          0%, 100% { border-color: #27272a; }
          50% { border-color: #E11D2E; }
        }
        @keyframes billboardCta {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(225,29,46,0); }
          50% { transform: scale(1.03); box-shadow: 0 4px 24px rgba(225,29,46,0.3); }
        }
        @keyframes billboardBottomLine {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
