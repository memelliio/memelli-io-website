'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  onTalkToAI?: () => void;
  onExplore?: () => void;
}

/** Generate deterministic particle configs once */
function makeParticles(count: number) {
  const out: {
    left: string;
    top: string;
    size: number;
    delay: string;
    duration: string;
    twinkle: boolean;
  }[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      left: `${(i * 17 + 3) % 100}%`,
      top: `${(i * 23 + 7) % 100}%`,
      size: 1 + (i % 3),
      delay: `${(i * 1.3) % 12}s`,
      duration: `${18 + (i % 14)}s`,
      twinkle: i % 4 === 0,
    });
  }
  return out;
}

const PARTICLES = makeParticles(50);

/** Network line paths */
const NETWORK_LINES = [
  'M80,200 Q400,120 720,240',
  'M160,500 Q500,380 900,440',
  'M50,350 Q350,300 650,380',
  'M300,100 Q550,200 800,130',
  'M120,600 Q460,520 780,590',
  'M200,50 Q500,160 850,80',
];

export default function HeroSection({ onTalkToAI, onExplore }: HeroSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Mouse parallax handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (reducedMotion) return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
        const cy = (e.clientY - rect.top) / rect.height - 0.5;
        setParallax({ x: cx * 10, y: cy * 10 }); // max ~5px shift
      });
    },
    [reducedMotion],
  );

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[hsl(var(--background))]"
    >
      {/* ── Layer 1: Slow gradient drift ─────────────────── */}
      <div
        className="hero-gradient-drift pointer-events-none absolute inset-0"
        style={{
          transform: reducedMotion
            ? undefined
            : `translate(${parallax.x * 0.5}px, ${parallax.y * 0.5}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      />

      {/* ── Layer 2: Particle field ──────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          transform: reducedMotion
            ? undefined
            : `translate(${parallax.x * 0.8}px, ${parallax.y * 0.8}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className={`absolute rounded-full bg-red-400/20 ${
              !reducedMotion
                ? p.twinkle
                  ? 'hero-particle-twinkle'
                  : 'hero-particle-drift'
                : ''
            }`}
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* ── Layer 3: Network lines ────────────────────────── */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{
          transform: reducedMotion
            ? undefined
            : `translate(${parallax.x * 0.3}px, ${parallax.y * 0.3}px)`,
          transition: 'transform 0.3s ease-out',
        }}
        preserveAspectRatio="none"
        viewBox="0 0 1000 700"
      >
        {NETWORK_LINES.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="rgba(225,29,46,0.10)"
            strokeWidth="1"
            className={!reducedMotion ? 'hero-network-line' : ''}
            style={{
              strokeDasharray: 600,
              strokeDashoffset: reducedMotion ? 0 : 600,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}
      </svg>

      {/* Animated dot grid */}
      <div
        className={`pointer-events-none absolute inset-0 opacity-20 ${
          !reducedMotion ? 'hero-dot-grid' : 'hero-dot-grid-static'
        }`}
        style={{
          transform: reducedMotion
            ? undefined
            : `translate(${parallax.x}px, ${parallax.y}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      />

      {/* Ambient glow - top */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-red-900/15 blur-[200px]" />

      {/* Ambient glow - bottom */}
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-[400px] w-[600px] rounded-full bg-red-950/10 blur-[180px]" />

      {/* ── Announcement bar ─────────────────────────────── */}
      <div
        className={`relative z-10 mb-8 ${!reducedMotion ? 'hero-fade-in' : ''}`}
        style={{ animationDelay: '0s', opacity: reducedMotion ? 1 : undefined }}
      >
        <span
          className={`inline-block rounded-full border border-white/[0.06] bg-[hsl(var(--card))] px-5 py-2 text-[13px] font-medium text-[hsl(var(--muted-foreground))] backdrop-blur-xl ${
            !reducedMotion ? 'hero-shimmer' : ''
          }`}
        >
          We get you funding — and so much more.
        </span>
      </div>

      {/* ── Center content ───────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Headline line 1 */}
        <h1
          className={`text-5xl md:text-7xl font-bold tracking-tight text-white ${
            !reducedMotion ? 'hero-slide-up' : ''
          }`}
          style={{
            animationDelay: '0.3s',
            opacity: reducedMotion ? 1 : undefined,
            textShadow:
              '0 0 60px rgba(225, 29, 46, 0.12), 0 0 120px rgba(225, 29, 46, 0.06)',
          }}
        >
          WE GET YOU FUNDING
        </h1>

        {/* Headline line 2 */}
        <h1
          className={`text-5xl md:text-7xl font-bold tracking-tight mt-2 bg-gradient-to-r from-red-400 via-red-300 to-red-500 bg-clip-text text-transparent ${
            !reducedMotion ? 'hero-slide-up' : ''
          }`}
          style={{
            animationDelay: '0.5s',
            opacity: reducedMotion ? 1 : undefined,
          }}
        >
          AND SO MUCH MORE
        </h1>

        {/* Subheadline */}
        <p
          className={`mt-8 text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto leading-relaxed ${
            !reducedMotion ? 'hero-fade-in' : ''
          }`}
          style={{
            animationDelay: '0.6s',
            opacity: reducedMotion ? 1 : undefined,
          }}
        >
          Memelli OS is your business IO — an AI-powered system that runs your business
          end-to-end. Get compliant, get funded, and operate with the tools your business
          actually needs. Inputs in, outputs out.
        </p>

        {/* CTAs */}
        <div
          className={`mt-10 flex flex-col sm:flex-row items-center gap-4 ${
            !reducedMotion ? 'hero-fade-in' : ''
          }`}
          style={{
            animationDelay: '0.9s',
            opacity: reducedMotion ? 1 : undefined,
          }}
        >
          <button
            data-track="hero-cta-talk"
            onClick={onTalkToAI}
            className={`hero-cta-primary group relative inline-flex items-center justify-center rounded-2xl bg-red-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:bg-red-500 hover:shadow-[0_0_40px_rgba(225,29,46,0.35)] hover:scale-[1.03] active:scale-[0.98] ${
              !reducedMotion ? 'hero-cta-glow' : ''
            }`}
          >
            Talk to the AI
            <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 shadow-[0_0_48px_rgba(225,29,46,0.3)]" />
          </button>

          <button
            data-track="hero-cta-explore"
            onClick={onExplore}
            className="inline-flex items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] px-8 py-4 text-lg font-semibold text-[hsl(var(--muted-foreground))] backdrop-blur-xl transition-all duration-200 hover:border-red-500/30 hover:text-white hover:shadow-[0_0_24px_rgba(225,29,46,0.12)] hover:scale-[1.02] active:scale-[0.98]"
          >
            See what Memelli OS can do
          </button>
        </div>
      </div>

      {/* ── Scroll indicator ─────────────────────────────── */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-10 ${
          !reducedMotion ? 'hero-fade-in' : ''
        }`}
        style={{
          animationDelay: '1.2s',
          opacity: reducedMotion ? 1 : undefined,
        }}
      >
        <div className={`flex flex-col items-center text-[hsl(var(--muted-foreground))] ${!reducedMotion ? 'hero-bounce' : ''}`}>
          <span className="text-[10px] mb-1 tracking-[0.2em] uppercase font-medium">Scroll</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {/* ── CSS animations ───────────────────────────────── */}
      <style jsx>{`
        /* ── Reduced-motion safe: static bg grid ──────── */
        .hero-dot-grid-static {
          background-image: radial-gradient(
            circle,
            rgba(148, 163, 184, 0.12) 1px,
            transparent 1px
          );
          background-size: 32px 32px;
        }

        /* ── Only animate when no preference ─────────── */
        @media (prefers-reduced-motion: no-preference) {
          /* Layer 1: gradient drift */
          .hero-gradient-drift {
            background: radial-gradient(
              ellipse 80% 60% at 50% 40%,
              #150508 0%,
              #080204 50%,
              #09090b 100%
            );
            background-size: 200% 200%;
            animation: hero-gradient-shift 30s ease-in-out infinite;
          }

          @keyframes hero-gradient-shift {
            0%,
            100% {
              background-position: 50% 40%;
            }
            33% {
              background-position: 60% 50%;
            }
            66% {
              background-position: 40% 35%;
            }
          }

          /* Dot grid drift */
          .hero-dot-grid {
            background-image: radial-gradient(
              circle,
              rgba(148, 163, 184, 0.12) 1px,
              transparent 1px
            );
            background-size: 32px 32px;
            animation: hero-drift 20s linear infinite;
          }

          @keyframes hero-drift {
            0% {
              background-position: 0 0;
            }
            100% {
              background-position: 32px 32px;
            }
          }

          /* Layer 2: particles */
          .hero-particle-drift {
            animation: hero-particle-drift-kf 20s ease-in-out infinite;
          }

          @keyframes hero-particle-drift-kf {
            0%,
            100% {
              transform: translate(0, 0);
            }
            25% {
              transform: translate(8px, -6px);
            }
            50% {
              transform: translate(-4px, 10px);
            }
            75% {
              transform: translate(6px, 4px);
            }
          }

          .hero-particle-twinkle {
            animation: hero-particle-twinkle-kf 4s ease-in-out infinite,
              hero-particle-drift-kf 22s ease-in-out infinite;
          }

          @keyframes hero-particle-twinkle-kf {
            0%,
            100% {
              opacity: 0.25;
            }
            50% {
              opacity: 0.9;
            }
          }

          /* Layer 3: network lines */
          .hero-network-line {
            animation: hero-network-draw 6s ease-in-out infinite;
          }

          @keyframes hero-network-draw {
            0% {
              stroke-dashoffset: 600;
              opacity: 0.1;
            }
            50% {
              stroke-dashoffset: 0;
              opacity: 0.3;
            }
            100% {
              stroke-dashoffset: -600;
              opacity: 0.1;
            }
          }

          /* Slide up */
          .hero-slide-up {
            opacity: 0;
            transform: translateY(20px);
            animation: hero-slide-up-kf 0.8s ease-out forwards;
          }

          @keyframes hero-slide-up-kf {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Fade in */
          .hero-fade-in {
            opacity: 0;
            animation: hero-fade-in-kf 0.6s ease-out forwards;
          }

          @keyframes hero-fade-in-kf {
            to {
              opacity: 1;
            }
          }

          /* Shimmer */
          .hero-shimmer {
            background-size: 200% 100%;
            animation: hero-shimmer-kf 3s ease-in-out infinite;
          }

          @keyframes hero-shimmer-kf {
            0%,
            100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }

          /* Bounce */
          .hero-bounce {
            animation: hero-bounce-kf 2s ease-in-out infinite;
          }

          @keyframes hero-bounce-kf {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(6px);
            }
          }

          /* CTA glow pulse */
          .hero-cta-glow {
            animation: hero-cta-glow-kf 8s ease-in-out infinite;
          }

          @keyframes hero-cta-glow-kf {
            0%,
            100% {
              box-shadow: 0 10px 15px -3px rgba(225, 29, 46, 0.2);
            }
            50% {
              box-shadow: 0 0 40px rgba(225, 29, 46, 0.35),
                0 0 80px rgba(183, 30, 46, 0.15);
            }
          }
        }

        /* Fallback: when reduced-motion IS preferred, show static gradient */
        @media (prefers-reduced-motion: reduce) {
          .hero-gradient-drift {
            background: radial-gradient(
              ellipse 80% 60% at 50% 40%,
              #150508 0%,
              #080204 50%,
              #09090b 100%
            );
          }
        }
      `}</style>
    </section>
  );
}
