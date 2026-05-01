'use client';

export default function BannerSkyscraper() {
  const features = [
    'AI Website Builder',
    'CRM & Pipelines',
    'Commerce Engine',
    'Coaching Platform',
    'SEO Automation',
    'Business Phone',
    'Lead Generation',
    'Agent Workforce',
  ];

  return (
    <div
      style={{
        width: 160,
        height: 600,
        background: '#09090b',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '1px solid #27272a',
        cursor: 'pointer',
      }}
    >
      {/* Top accent line */}
      <div style={{ width: '100%', height: 3, background: '#E11D2E', flexShrink: 0 }} />

      {/* Logo area */}
      <div style={{ padding: '20px 0 12px', textAlign: 'center', flexShrink: 0 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #E11D2E, #991b1b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: 18,
            margin: '0 auto 8px',
          }}
        >
          M
        </div>
        <div style={{ color: '#fafafa', fontSize: 14, fontWeight: 700 }}>Memelli</div>
        <div style={{ color: '#a1a1aa', fontSize: 10, marginTop: 2 }}>AI Business OS</div>
      </div>

      {/* Divider */}
      <div style={{ width: 40, height: 1, background: '#27272a', flexShrink: 0 }} />

      {/* Scrolling features */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          width: '100%',
          position: 'relative',
          margin: '12px 0',
        }}
      >
        {/* Fade edges */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 24, background: 'linear-gradient(to bottom, #09090b, transparent)', zIndex: 1 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 24, background: 'linear-gradient(to top, #09090b, transparent)', zIndex: 1 }} />

        <div style={{ animation: 'skyScroll 12s linear infinite' }}>
          {[...features, ...features].map((f, i) => (
            <div
              key={i}
              style={{
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#E11D2E',
                  flexShrink: 0,
                }}
              />
              <span style={{ color: '#d4d4d8', fontSize: 11, fontWeight: 500, lineHeight: 1.2 }}>
                {f}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA area */}
      <div style={{ padding: '12px 16px 20px', textAlign: 'center', flexShrink: 0 }}>
        <div style={{ color: '#a1a1aa', fontSize: 10, marginBottom: 8 }}>
          Everything in one place
        </div>
        <div
          style={{
            background: '#E11D2E',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.5,
            animation: 'skyCta 2s ease-in-out infinite',
          }}
        >
          Try Free
        </div>
      </div>

      <style>{`
        @keyframes skyScroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes skyCta {
          0%, 100% { box-shadow: 0 0 0 0 rgba(225,29,46,0); }
          50% { box-shadow: 0 0 12px 2px rgba(225,29,46,0.3); }
        }
      `}</style>
    </div>
  );
}
