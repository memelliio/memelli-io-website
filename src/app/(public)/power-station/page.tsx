'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'

export default function PowerStationPage() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [booting, setBooting] = useState(false)
  const [statusText, setStatusText] = useState('')
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  // Voice activation
  useEffect(() => {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognitionRef.current = recognition

    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join('')
        .toLowerCase()
      if (transcript.includes('hey melli')) {
        recognition.stop()
        handlePowerOn()
      }
    }

    recognition.onerror = () => {}
    recognition.onend = () => {
      if (!booting && recognitionRef.current) {
        try { recognitionRef.current.start() } catch {}
      }
    }

    try { recognition.start() } catch {}

    return () => {
      recognitionRef.current = null
      try { recognition.stop() } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePowerOn = useCallback(() => {
    if (booting) return
    setBooting(true)
    setStatusText('Welcome to Memelli. System initializing.')
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    setTimeout(() => router.push('/dashboard/cockpit'), 2000)
  }, [booting, router])

  return (
    <>
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.12); opacity: 1; }
        }
        @keyframes pulseFast {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.18); opacity: 1; }
        }
        @keyframes glowRing {
          0%, 100% { box-shadow: 0 0 30px 8px rgba(239,68,68,0.35), 0 0 60px 16px rgba(239,68,68,0.15); }
          50% { box-shadow: 0 0 50px 14px rgba(239,68,68,0.55), 0 0 90px 28px rgba(239,68,68,0.25); }
        }
        @keyframes glowRingFast {
          0%, 100% { box-shadow: 0 0 40px 12px rgba(239,68,68,0.5), 0 0 80px 24px rgba(239,68,68,0.25); }
          50% { box-shadow: 0 0 70px 20px rgba(239,68,68,0.75), 0 0 120px 40px rgba(239,68,68,0.35); }
        }
        @keyframes btnGlow {
          0%, 100% { box-shadow: 0 0 20px 4px rgba(239,68,68,0.3), 0 0 40px 8px rgba(239,68,68,0.1); }
          50% { box-shadow: 0 0 30px 8px rgba(239,68,68,0.5), 0 0 60px 16px rgba(239,68,68,0.2); }
        }
        @keyframes btnGlowBoot {
          0%, 100% { box-shadow: 0 0 30px 8px rgba(239,68,68,0.5), 0 0 60px 16px rgba(239,68,68,0.25); }
          50% { box-shadow: 0 0 50px 14px rgba(239,68,68,0.7), 0 0 90px 28px rgba(239,68,68,0.35); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes statusFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          backgroundColor: '#09090b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background radial */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: booting
              ? 'radial-gradient(ellipse at center, rgba(239,68,68,0.08) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at center, rgba(239,68,68,0.04) 0%, transparent 70%)',
            transition: 'background 0.8s ease',
            pointerEvents: 'none',
          }}
        />

        {/* Welcome text */}
        <h1
          style={{
            color: '#fafafa',
            fontSize: 'clamp(1.25rem, 4vw, 2rem)',
            fontWeight: 300,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '3rem',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1.2s ease, transform 1.2s ease',
            textAlign: 'center',
          }}
        >
          Welcome to the Memelli System
        </h1>

        {/* Heartbeat orb */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(140px, 30vw, 200px)',
            height: 'clamp(140px, 30vw, 200px)',
            marginBottom: '2.5rem',
          }}
        >
          {/* Outer glow ring */}
          <div
            style={{
              position: 'absolute',
              inset: '-16px',
              borderRadius: '50%',
              animation: booting ? 'glowRingFast 0.6s ease-in-out infinite' : 'glowRing 2s ease-in-out infinite',
            }}
          />
          {/* Core orb */}
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 38%, #f87171 0%, #dc2626 40%, #991b1b 80%, #450a0a 100%)',
              animation: booting ? 'pulseFast 0.6s ease-in-out infinite' : 'pulse 2s ease-in-out infinite',
            }}
          />
          {/* Inner highlight */}
          <div
            style={{
              position: 'absolute',
              top: '18%',
              left: '22%',
              width: '30%',
              height: '30%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Voice prompt */}
        <p
          style={{
            color: '#a1a1aa',
            fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
            letterSpacing: '0.08em',
            marginBottom: '1.5rem',
            opacity: visible && !booting ? 0.8 : 0,
            transition: 'opacity 0.6s ease',
            textAlign: 'center',
          }}
        >
          Say &ldquo;Hey Melli&rdquo; to power on
        </p>

        {/* Power button */}
        <button
          onClick={handlePowerOn}
          disabled={booting}
          style={{
            position: 'relative',
            padding: 'clamp(0.9rem, 2vw, 1.1rem) clamp(3rem, 8vw, 5rem)',
            fontSize: 'clamp(1rem, 3vw, 1.35rem)',
            fontWeight: 700,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#fafafa',
            background: booting
              ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
              : 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '9999px',
            cursor: booting ? 'default' : 'pointer',
            animation: booting ? 'btnGlowBoot 0.6s ease-in-out infinite' : 'btnGlow 2.5s ease-in-out infinite',
            transition: 'background 0.3s ease, transform 0.15s ease',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            if (!booting) (e.currentTarget.style.transform = 'scale(1.05)')
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {booting ? 'Powering On...' : 'Power'}
        </button>

        {/* Status message */}
        {statusText && (
          <p
            style={{
              color: '#f87171',
              fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
              letterSpacing: '0.06em',
              marginTop: '2rem',
              animation: 'statusFade 0.6s ease forwards',
              textAlign: 'center',
            }}
          >
            {statusText}
          </p>
        )}
      </div>
    </>
  )
}
