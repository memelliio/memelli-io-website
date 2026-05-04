import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Memelli - AI Business Operating System';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #f59e0b 0%, #4f46e5 50%, #3730a3 100%)',
          padding: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-2px',
              marginBottom: '16px',
            }}
          >
            Memelli
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.85)',
            }}
          >
            AI Business Operating System
          </div>
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: 'auto',
          }}
        >
          Powered by Memelli
        </div>
      </div>
    ),
    { ...size }
  );
}
